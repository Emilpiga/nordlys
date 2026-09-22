#!/usr/bin/env node
/**
 * Backfill / refresh product sales traction from Shopify Admin into Upstash.
 *
 * Prefers paid orders (`read_orders`) so last-sale timestamps are available
 * for Bästsäljare tie-breaks. Falls back to ShopifyQL (`read_reports`).
 *
 * Usage: pnpm run traction:sync-sales
 */
import { Redis } from "@upstash/redis";
import {
  createShopifyAdmin,
  getAdminAccessToken,
  loadEnvFiles,
  shopDomain,
} from "./lib/shopify-admin.mjs";

loadEnvFiles();

const SALES_KEY = "traction:sales";
const LAST_SALE_KEY = "traction:last_sale";
const SCORE_KEY = "traction:score";
const SYNCED_AT_KEY = "traction:sales:synced_at:v2";
const SALE_WEIGHT = 40;
const PRODUCT_ID_RE = /^gid:\/\/shopify\/Product\/\d+$/;

const SCOPE_HINT =
  "Add Admin API scopes `read_orders` (preferred) and/or `read_reports` " +
  "(ShopifyQL) on the Dev Dashboard app, then reinstall / re-auth so " +
  "the token picks up the new scopes.";

function toProductGid(raw) {
  if (raw == null) return null;
  const value = String(raw).trim();
  if (!value) return null;
  if (value.startsWith("gid://shopify/Product/")) return value;
  if (/^\d+$/.test(value)) return `gid://shopify/Product/${value}`;
  const match = value.match(/Product\/(\d+)/i);
  if (match) return `gid://shopify/Product/${match[1]}`;
  return null;
}

function toQuantity(raw) {
  const n = Number(String(raw).replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function toTimestamp(raw) {
  if (!raw) return 0;
  const n = Date.parse(raw);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function formatParseErrors(parseErrors) {
  if (!Array.isArray(parseErrors) || parseErrors.length === 0) return "";
  return parseErrors
    .map((entry) => (typeof entry === "string" ? entry : entry?.message))
    .filter(Boolean)
    .join("; ");
}

function pickColumnName(columns, pattern) {
  const match = columns.find((col) => pattern.test(col.name ?? ""));
  return match?.name ?? null;
}

function rowsToTotals(columns, rows) {
  const totals = new Map();
  const productCol = pickColumnName(columns, /product_id/i);
  const soldCol = pickColumnName(
    columns,
    /net_items_sold|items_sold|total_units|quantity_ordered/i,
  );
  const productIdx = columns.findIndex((col) => /product_id/i.test(col.name ?? ""));
  const soldIdx = columns.findIndex((col) =>
    /net_items_sold|items_sold|total_units|quantity_ordered/i.test(col.name ?? ""),
  );

  if (!Array.isArray(rows)) {
    throw new Error("ShopifyQL rows was not an array");
  }

  for (const row of rows) {
    let productId = null;
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
      const productRaw =
        (productCol ? row[productCol] : null) ??
        row.product_id ??
        row.productId;
      const soldRaw =
        (soldCol ? row[soldCol] : null) ??
        row.net_items_sold ??
        row.items_sold ??
        row.total_units;
      productId = toProductGid(productRaw);
      qty = toQuantity(soldRaw);
    }

    if (!productId || !PRODUCT_ID_RE.test(productId) || qty <= 0) continue;
    totals.set(productId, (totals.get(productId) ?? 0) + qty);
  }

  return totals;
}

async function fetchViaShopifyQl(admin) {
  const data = await admin.graphql(
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

  return {
    totals: rowsToTotals(table.columns ?? [], table.rows),
    lastSaleAt: new Map(),
  };
}

async function fetchViaPaidOrders(admin) {
  const totals = new Map();
  const lastSaleAt = new Map();
  let cursor = null;
  let hasNext = true;

  while (hasNext) {
    const data = await admin.graphql(
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
        if (!productId || !PRODUCT_ID_RE.test(productId) || qty <= 0) continue;
        totals.set(productId, (totals.get(productId) ?? 0) + qty);
        if (soldAt > (lastSaleAt.get(productId) ?? 0)) {
          lastSaleAt.set(productId, soldAt);
        }
      }
    }

    hasNext = data.orders.pageInfo.hasNextPage;
    cursor = data.orders.pageInfo.endCursor;
  }

  return { totals, lastSaleAt };
}

async function replaceSales(redis, totals, lastSaleAt) {
  const entries = [...totals.entries()];
  let updated = 0;
  const CHUNK = 40;

  for (let offset = 0; offset < entries.length; offset += CHUNK) {
    const chunk = entries.slice(offset, offset + CHUNK);
    const scorePipe = redis.pipeline();
    for (const [productId] of chunk) scorePipe.zscore(SALES_KEY, productId);
    const previous = await scorePipe.exec();

    const writePipe = redis.pipeline();
    chunk.forEach(([productId, nextSales], index) => {
      const oldSales = Number(previous[index] ?? 0) || 0;
      const next = Math.max(0, Math.floor(nextSales));
      const delta = next - oldSales;
      if (next > 0) writePipe.zadd(SALES_KEY, { score: next, member: productId });
      else if (oldSales > 0) {
        writePipe.zrem(SALES_KEY, productId);
        writePipe.zrem(LAST_SALE_KEY, productId);
      }
      if (delta !== 0) writePipe.zincrby(SCORE_KEY, delta * SALE_WEIGHT, productId);
      const soldAt = Number(lastSaleAt.get(productId) ?? 0) || 0;
      if (soldAt > 0) {
        writePipe.zadd(LAST_SALE_KEY, { score: soldAt, member: productId });
      }
      if (delta !== 0 || next !== oldSales || soldAt > 0) updated += 1;
    });
    await writePipe.exec();
  }

  return updated;
}

async function main() {
  const domain = shopDomain();
  const tokenResult = await getAdminAccessToken(domain);
  const token =
    typeof tokenResult === "string" ? tokenResult : tokenResult.token;
  const scope =
    typeof tokenResult === "string" ? "(static token)" : tokenResult.scope || "(none)";
  console.log(`Admin scopes: ${scope}`);

  const admin = createShopifyAdmin({ domain, token });

  if (
    !process.env.UPSTASH_REDIS_REST_URL?.trim() ||
    !process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  ) {
    throw new Error("Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN");
  }

  const redis = Redis.fromEnv();

  let result;
  try {
    result = await fetchViaPaidOrders(admin);
    console.log(
      `Orders: ${result.totals.size} products with sales, ${result.lastSaleAt.size} with last-sale timestamps`,
    );
  } catch (ordersError) {
    console.warn(
      "Paid orders failed, trying ShopifyQL:",
      ordersError.message || ordersError,
    );
    try {
      result = await fetchViaShopifyQl(admin);
      console.log(
        `ShopifyQL: ${result.totals.size} products (no last-sale timestamps)`,
      );
    } catch (qlError) {
      throw new Error(
        `Could not load historical sales.\n` +
          `  Orders: ${ordersError.message || ordersError}\n` +
          `  ShopifyQL: ${qlError.message || qlError}\n` +
          `  ${SCOPE_HINT}`,
      );
    }
  }

  const updated = await replaceSales(redis, result.totals, result.lastSaleAt);
  await redis.set(SYNCED_AT_KEY, String(Date.now()));

  console.log(`Updated ${updated} sales scores in Redis.`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
