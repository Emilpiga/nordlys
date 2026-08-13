import type { CollectionSummary, Product } from "@/lib/shopify/types";
import type { ProductSortKey } from "@/lib/shopify";

export const SORT_KEYS = [
  "featured",
  "price-asc",
  "price-desc",
  "name",
] as const;

export type SortKey = (typeof SORT_KEYS)[number];

export const PAGE_SIZE = 12;

export type CatalogQuery = Record<string, string | string[] | undefined>;

export type CatalogFilters = {
  collection: string | null;
  min: number | null;
  max: number | null;
  sale: boolean;
  stock: boolean;
  sort: SortKey;
};

export type PriceBounds = {
  min: number;
  max: number;
};

export type CatalogPageInfo = {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
};

export function emptyFilters(): CatalogFilters {
  return {
    collection: null,
    min: null,
    max: null,
    sale: false,
    stock: false,
    sort: "featured",
  };
}

function first(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0]?.trim() ?? "";
  return value?.trim() ?? "";
}

function parseNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isSortKey(value: string): value is SortKey {
  return (SORT_KEYS as readonly string[]).includes(value);
}

export function parseFilters(query: CatalogQuery): CatalogFilters {
  const sortValue = first(query.sort);

  return {
    collection: first(query.collection) || null,
    min: parseNumber(first(query.min)),
    max: parseNumber(first(query.max)),
    sale: first(query.sale) === "1",
    stock: first(query.stock) === "1",
    sort: isSortKey(sortValue) ? sortValue : "featured",
  };
}

export function parseCursors(query: CatalogQuery) {
  return {
    after: first(query.after) || null,
    before: first(query.before) || null,
  };
}

export function serializeFilters(
  filters: CatalogFilters,
  bounds: PriceBounds,
  cursors?: { after?: string | null; before?: string | null },
): string {
  const params = new URLSearchParams();
  const next = sanitizeFilters(filters, bounds);

  if (next.collection) params.set("collection", next.collection);
  if (next.min != null) params.set("min", String(next.min));
  if (next.max != null) params.set("max", String(next.max));
  if (next.sale) params.set("sale", "1");
  if (next.stock) params.set("stock", "1");
  if (next.sort !== "featured") params.set("sort", next.sort);
  if (cursors?.after) params.set("after", cursors.after);
  if (cursors?.before) params.set("before", cursors.before);

  return params.toString();
}

export function sanitizeFilters(
  filters: CatalogFilters,
  bounds: PriceBounds,
): CatalogFilters {
  const min =
    filters.min != null && filters.min > bounds.min && filters.min <= bounds.max
      ? filters.min
      : null;
  const max =
    filters.max != null && filters.max < bounds.max && filters.max >= bounds.min
      ? filters.max
      : null;

  return { ...filters, min, max };
}

export function catalogPriceStep(bounds: PriceBounds) {
  const span = Math.max(0, bounds.max - bounds.min);
  if (span > 2000) return 50;
  if (span > 500) return 10;
  return 1;
}

export function catalogPriceBounds(products: Product[]): PriceBounds {
  let min = Infinity;
  let max = -Infinity;

  for (const product of products) {
    const low = Number(product.priceRange.minVariantPrice.amount);
    const high = Number(product.priceRange.maxVariantPrice.amount);
    if (Number.isFinite(low)) min = Math.min(min, low);
    if (Number.isFinite(high)) max = Math.max(max, high);
    else if (Number.isFinite(low)) max = Math.max(max, low);
  }

  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return { min: 0, max: 5000 };
  }

  return {
    min: Math.min(0, Math.floor(min)),
    max: Math.max(Math.ceil(max), Math.floor(min) + 1, 100),
  };
}

export function resolvedPriceRange(
  filters: CatalogFilters,
  bounds: PriceBounds,
) {
  const min = filters.min ?? bounds.min;
  const max = filters.max ?? bounds.max;
  return {
    min: Math.min(Math.max(min, bounds.min), bounds.max),
    max: Math.max(Math.min(max, bounds.max), bounds.min),
  };
}

export function activeFilterCount(
  filters: CatalogFilters,
  bounds: PriceBounds,
) {
  const next = sanitizeFilters(filters, bounds);
  const price = resolvedPriceRange(next, bounds);
  let count = 0;
  if (next.collection) count += 1;
  if (price.min > bounds.min || price.max < bounds.max) count += 1;
  if (next.sale) count += 1;
  if (next.stock) count += 1;
  return count;
}

export function shopifySortFromFilters(filters: CatalogFilters): {
  sortKey: ProductSortKey;
  reverse: boolean;
  collectionSortKey: "BEST_SELLING" | "PRICE" | "TITLE" | "CREATED" | "MANUAL";
} {
  switch (filters.sort) {
    case "price-asc":
      return {
        sortKey: "PRICE",
        reverse: false,
        collectionSortKey: "PRICE",
      };
    case "price-desc":
      return {
        sortKey: "PRICE",
        reverse: true,
        collectionSortKey: "PRICE",
      };
    case "name":
      return {
        sortKey: "TITLE",
        reverse: false,
        collectionSortKey: "TITLE",
      };
    default:
      return {
        sortKey: "BEST_SELLING",
        reverse: false,
        collectionSortKey: "BEST_SELLING",
      };
  }
}

/** Build Storefront product search query for global catalog listing. */
export function buildShopifyProductQuery(
  filters: CatalogFilters,
  bounds: PriceBounds,
) {
  const next = sanitizeFilters(filters, bounds);
  const price = resolvedPriceRange(next, bounds);
  const parts: string[] = [];

  if (next.stock) parts.push("available_for_sale:true");
  if (next.sale) parts.push("variants.compare_at_price:>0");
  if (price.min > bounds.min) {
    parts.push(`variants.price:>=${price.min}`);
  }
  if (price.max < bounds.max) {
    parts.push(`variants.price:<=${price.max}`);
  }

  return parts.length ? parts.join(" AND ") : null;
}

/** Collection product filters for Storefront ProductFilter input. */
export function buildCollectionProductFilters(
  filters: CatalogFilters,
  bounds: PriceBounds,
) {
  const next = sanitizeFilters(filters, bounds);
  const price = resolvedPriceRange(next, bounds);
  const result: Record<string, unknown>[] = [];

  if (next.stock) result.push({ available: true });
  if (price.min > bounds.min || price.max < bounds.max) {
    result.push({
      price: {
        ...(price.min > bounds.min ? { min: price.min } : {}),
        ...(price.max < bounds.max ? { max: price.max } : {}),
      },
    });
  }

  return result;
}

export function paginationItems(current: number, pages: number) {
  if (pages <= 7) {
    return Array.from({ length: pages }, (_, index) => index + 1);
  }

  const items: (number | "gap")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(pages - 1, current + 1);

  if (start > 2) items.push("gap");
  for (let page = start; page <= end; page += 1) items.push(page);
  if (end < pages - 1) items.push("gap");
  items.push(pages);

  return items;
}

/** Kept for any remaining client-side helpers. */
export function applyCatalogFilters(
  products: Product[],
  collections: CollectionSummary[],
  filters: CatalogFilters,
  bounds: PriceBounds,
): Product[] {
  const next = sanitizeFilters(filters, bounds);
  const price = resolvedPriceRange(next, bounds);
  const collection = next.collection
    ? collections.find((item) => item.handle === next.collection)
    : null;
  const memberIds = collection ? new Set(collection.productIds) : null;

  return products.filter((product) => {
    if (memberIds && !memberIds.has(product.id)) return false;
    const amount = Number(product.priceRange.minVariantPrice.amount);
    if (Number.isFinite(amount) && (amount < price.min || amount > price.max)) {
      return false;
    }
    if (next.stock && !product.variants.some((v) => v.availableForSale)) {
      return false;
    }
    return true;
  });
}
