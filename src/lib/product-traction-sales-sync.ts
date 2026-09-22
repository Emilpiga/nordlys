import "server-only";

import {
  isShopifyAdminConfigured,
  shopifyAdminGraphql,
} from "@/lib/shopify/admin";
import {
  isTractionRedisConfigured,
  replaceSalesTotals,
} from "@/lib/product-traction";

const SYNCED_AT_KEY = "traction:sales:synced_at:v2";
const SYNC_LOCK_KEY = "traction:sales:sync_lock";
/** Re-pull absolute sales from Shopify at most this often. */
const SYNC_MAX_AGE_MS = 6 * 60 * 60 * 1000;
const SYNC_LOCK_TTL_SEC = 180;

export type HistoricalSales = {
  totals: Map<string, number>;
  lastSaleAt: Map<string, number>;
};

type ShopifyQlColumn = { name?: string | null };
type ShopifyQlResponse = {
  shopifyqlQuery: {
    tableData?: {
      columns?: ShopifyQlColumn[] | null;
      rows?: unknown;
    } | null;
    parseErrors?: string[] | null;
  } | null;
};

type OrdersPage = {
  orders: {
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
    edges: {
      node: {
        processedAt?: string | null;
        createdAt?: string | null;
        lineItems: {
          edges: {
            node: {
              quantity: number;
              product: { id: string } | null;
            };
          }[];
        };
      };
    }[];
  };
};

function toProductGid(raw: unknown): string | null {
  if (raw == null) return null;
  const value = String(raw).trim();
  if (!value) return null;
  if (value.startsWith("gid://shopify/Product/")) return value;
  if (/^\d+$/.test(value)) return `gid://shopify/Product/${value}`;
  const match = value.match(/Product\/(\d+)/i);
  if (match) return `gid://shopify/Product/${match[1]}`;
  return null;
}

function toQuantity(raw: unknown) {
  const n = Number(String(raw ?? "").replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function toTimestamp(raw: string | null | undefined) {
  if (!raw) return 0;
  const n = Date.parse(raw);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function formatParseErrors(parseErrors: unknown): string {
  if (!Array.isArray(parseErrors) || parseErrors.length === 0) return "";
  return parseErrors
    .map((entry) =>
      typeof entry === "string"
        ? entry
        : entry && typeof entry === "object" && "message" in entry
          ? String((entry as { message: unknown }).message)
          : "",
    )
    .filter(Boolean)
    .join("; ");
}

function pickColumnName(columns: ShopifyQlColumn[], pattern: RegExp) {
  return columns.find((col) => pattern.test(col.name ?? ""))?.name ?? null;
}

function rowsToTotals(columns: ShopifyQlColumn[], rows: unknown) {
  const totals = new Map<string, number>();
  if (!Array.isArray(rows)) {
    throw new Error("ShopifyQL rows was not an array");
  }

  const productCol = pickColumnName(columns, /product_id/i);
  const soldCol = pickColumnName(
    columns,
    /net_items_sold|items_sold|total_units|quantity_ordered/i,
  );
  const productIdx = columns.findIndex((col) =>
    /product_id/i.test(col.name ?? ""),
  );
  const soldIdx = columns.findIndex((col) =>
    /net_items_sold|items_sold|total_units|quantity_ordered/i.test(
      col.name ?? "",
    ),
  );

  for (const row of rows) {
    let productId: string | null = null;
    let qty = 0;

    if (Array.isArray(row)) {
      if (productIdx < 0 || soldIdx < 0) {
        throw new Error(
          `Unexpected ShopifyQL columns: ${columns.map((c) => c.name).join(", ")}`,
        );
      }
      productId = toProductGid(row[productIdx]);
      qty = toQuantity(row[soldIdx]);
    } else if (row && typeof row === "object") {
      const record = row as Record<string, unknown>;
      const productRaw =
        (productCol ? record[productCol] : null) ??
        record.product_id ??
        record.productId;
      const soldRaw =
        (soldCol ? record[soldCol] : null) ??
        record.net_items_sold ??
        record.items_sold ??
        record.total_units;
      productId = toProductGid(productRaw);
      qty = toQuantity(soldRaw);
    }

    if (!productId || qty <= 0) continue;
    totals.set(productId, (totals.get(productId) ?? 0) + qty);
  }

  return totals;
}

/**
 * Prefer paid orders (includes last-sale timestamps for badge ties).
 * Fall back to ShopifyQL aggregates when orders scope is missing.
 */
export async function fetchHistoricalSales(): Promise<HistoricalSales> {
  try {
    return await fetchSalesViaPaidOrders();
  } catch (error) {
    console.warn(
      "Paid-orders sales sync failed, falling back to ShopifyQL:",
      error,
    );
  }

  const totals = await fetchSalesViaShopifyQl();
  return { totals, lastSaleAt: new Map() };
}

async function fetchSalesViaShopifyQl() {
  const data = await shopifyAdminGraphql<ShopifyQlResponse>(
    `query TractionSales($q: String!) {
      shopifyqlQuery(query: $q) {
        parseErrors
        tableData {
          columns { name dataType displayName }
          rows
        }
      }
    }`,
    {
      q: "FROM sales SHOW net_items_sold GROUP BY product_id SINCE startOfTime ORDER BY net_items_sold DESC",
    },
  );

  const parseErrorText = formatParseErrors(data.shopifyqlQuery?.parseErrors);
  if (parseErrorText) {
    throw new Error(parseErrorText);
  }

  const table = data.shopifyqlQuery?.tableData;
  if (!table) {
    throw new Error("ShopifyQL returned no tableData");
  }

  return rowsToTotals(table.columns ?? [], table.rows);
}

async function fetchSalesViaPaidOrders(): Promise<HistoricalSales> {
  const totals = new Map<string, number>();
  const lastSaleAt = new Map<string, number>();
  let cursor: string | null = null;
  let hasNext = true;

  while (hasNext) {
    const data: OrdersPage = await shopifyAdminGraphql<OrdersPage>(
      `query TractionOrders($cursor: String) {
        orders(
          first: 50
          after: $cursor
          query: "financial_status:paid"
          sortKey: PROCESSED_AT
          reverse: true
        ) {
          pageInfo { hasNextPage endCursor }
          edges {
            node {
              processedAt
              createdAt
              lineItems(first: 100) {
                edges {
                  node {
                    quantity
                    product { id }
                  }
                }
              }
            }
          }
        }
      }`,
      { cursor },
    );

    for (const edge of data.orders.edges) {
      const soldAt =
        toTimestamp(edge.node.processedAt) || toTimestamp(edge.node.createdAt);
      for (const line of edge.node.lineItems.edges) {
        const productId = toProductGid(line.node.product?.id);
        const qty = toQuantity(line.node.quantity);
        if (!productId || qty <= 0) continue;
        totals.set(productId, (totals.get(productId) ?? 0) + qty);
        if (soldAt > (lastSaleAt.get(productId) ?? 0)) {
          lastSaleAt.set(productId, soldAt);
        }
      }
    }

    hasNext = data.orders.pageInfo.hasNextPage;
    cursor = data.orders.pageInfo.endCursor;
    if (!hasNext) break;
  }

  return { totals, lastSaleAt };
}

export type SalesSyncResult = {
  ok: boolean;
  reason?: string;
  products?: number;
  skipped?: boolean;
};

/**
 * Pull absolute historical sold units from Shopify Admin into Redis.
 * Safe to re-run: sales scores are replaced, combined rank adjusted by delta.
 */
export async function syncHistoricalSalesFromShopify(): Promise<SalesSyncResult> {
  if (!isTractionRedisConfigured()) {
    return { ok: false, reason: "redis_not_configured" };
  }
  if (!isShopifyAdminConfigured()) {
    return { ok: false, reason: "admin_not_configured" };
  }

  const { totals, lastSaleAt } = await fetchHistoricalSales();
  const products = await replaceSalesTotals(totals, lastSaleAt);

  const { Redis } = await import("@upstash/redis");
  const redis = Redis.fromEnv();
  await redis.set(SYNCED_AT_KEY, String(Date.now()));

  return { ok: true, products };
}

/**
 * Ensure Redis sales reflect Shopify history. No-ops when fresh or locked.
 * Awaited on the homepage so the first load after deploy can backfill.
 */
export async function ensureHistoricalSalesSynced(): Promise<SalesSyncResult> {
  if (!isTractionRedisConfigured()) {
    return { ok: false, reason: "redis_not_configured", skipped: true };
  }
  if (!isShopifyAdminConfigured()) {
    return { ok: false, reason: "admin_not_configured", skipped: true };
  }

  const { Redis } = await import("@upstash/redis");
  const redis = Redis.fromEnv();

  const syncedRaw = await redis.get<string>(SYNCED_AT_KEY);
  const syncedAt = Number(syncedRaw ?? 0);
  if (Number.isFinite(syncedAt) && Date.now() - syncedAt < SYNC_MAX_AGE_MS) {
    return { ok: true, skipped: true };
  }

  const locked = await redis.set(SYNC_LOCK_KEY, "1", {
    nx: true,
    ex: SYNC_LOCK_TTL_SEC,
  });
  if (locked !== "OK") {
    return { ok: true, skipped: true, reason: "lock_held" };
  }

  try {
    return await syncHistoricalSalesFromShopify();
  } catch (error) {
    console.error("historical sales sync failed:", error);
    return { ok: false, reason: "error" };
  } finally {
    await redis.del(SYNC_LOCK_KEY).catch(() => undefined);
  }
}
