import { displayCompareAt } from "@/lib/discounts";
import type { CollectionSummary, Product } from "@/lib/shopify/types";

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
  page: number;
};

export type PriceBounds = {
  min: number;
  max: number;
};

export function emptyFilters(): CatalogFilters {
  return {
    collection: null,
    min: null,
    max: null,
    sale: false,
    stock: false,
    sort: "featured",
    page: 1,
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
  const page = Math.max(1, Math.floor(parseNumber(first(query.page)) ?? 1));

  return {
    collection: first(query.collection) || null,
    min: parseNumber(first(query.min)),
    max: parseNumber(first(query.max)),
    sale: first(query.sale) === "1",
    stock: first(query.stock) === "1",
    sort: isSortKey(sortValue) ? sortValue : "featured",
    page,
  };
}

export function serializeFilters(
  filters: CatalogFilters,
  bounds: PriceBounds,
  pages = 1,
): string {
  const params = new URLSearchParams();
  const next = sanitizeFilters(filters, bounds, pages);

  if (next.collection) params.set("collection", next.collection);
  if (next.min != null) params.set("min", String(next.min));
  if (next.max != null) params.set("max", String(next.max));
  if (next.sale) params.set("sale", "1");
  if (next.stock) params.set("stock", "1");
  if (next.sort !== "featured") params.set("sort", next.sort);
  if (next.page > 1) params.set("page", String(next.page));

  return params.toString();
}

function moneyAmount(value: string) {
  if (!value.trim()) return null;
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
}

export function catalogPriceBounds(products: Product[]): PriceBounds {
  let min = Infinity;
  let max = -Infinity;

  for (const product of products) {
    const low = moneyAmount(product.priceRange.minVariantPrice.amount);
    const high = moneyAmount(product.priceRange.maxVariantPrice.amount);
    if (low != null) min = Math.min(min, low);
    if (high != null) max = Math.max(max, high);
    else if (low != null) max = Math.max(max, low);
  }

  if (!Number.isFinite(min) || !Number.isFinite(max)) return { min: 0, max: 0 };
  return { min: Math.floor(min), max: Math.ceil(max) };
}

export function sanitizeFilters(
  filters: CatalogFilters,
  bounds: PriceBounds,
  pages = 1,
): CatalogFilters {
  const min =
    filters.min != null && filters.min > bounds.min && filters.min <= bounds.max
      ? filters.min
      : null;
  const max =
    filters.max != null && filters.max < bounds.max && filters.max >= bounds.min
      ? filters.max
      : null;
  const page = Math.min(Math.max(1, Math.floor(filters.page) || 1), Math.max(1, pages));

  return { ...filters, min, max, page };
}

export function catalogPriceStep(bounds: PriceBounds) {
  const span = Math.max(0, bounds.max - bounds.min);
  if (span > 2000) return 50;
  if (span > 500) return 10;
  return 1;
}

function productPrice(product: Product) {
  return Number(product.priceRange.minVariantPrice.amount);
}

function productOnSale(product: Product) {
  const price = product.priceRange.minVariantPrice;
  const variant =
    product.variants.find((item) => item.availableForSale) ??
    product.variants[0];
  return Boolean(displayCompareAt(product.handle, price, variant?.compareAtPrice));
}

function productInStock(product: Product) {
  if (product.variants.length === 0) return true;
  return product.variants.some((variant) => variant.availableForSale);
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

  const matched = products.filter((product) => {
    if (memberIds && !memberIds.has(product.id)) return false;

    const amount = productPrice(product);
    if (Number.isFinite(amount) && (amount < price.min || amount > price.max)) {
      return false;
    }

    if (next.sale && !productOnSale(product)) return false;
    if (next.stock && !productInStock(product)) return false;

    return true;
  });

  if (next.sort === "price-asc") {
    return [...matched].sort((a, b) => productPrice(a) - productPrice(b));
  }
  if (next.sort === "price-desc") {
    return [...matched].sort((a, b) => productPrice(b) - productPrice(a));
  }
  if (next.sort === "name") {
    return [...matched].sort((a, b) => a.title.localeCompare(b.title, "sv"));
  }

  return matched;
}

export function paginateCatalog<T>(items: T[], page: number, size = PAGE_SIZE) {
  const pages = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(Math.max(1, page), pages);
  const start = (current - 1) * size;

  return {
    items: items.slice(start, start + size),
    page: current,
    pages,
    total: items.length,
    from: items.length === 0 ? 0 : start + 1,
    to: Math.min(start + size, items.length),
  };
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
