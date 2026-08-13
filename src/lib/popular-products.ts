import popularData from "@/data/popular-products.json";
import type { Product } from "@/lib/shopify/types";

const POPULAR_COUNT = 4;

/**
 * Curated handles first (src/data/popular-products.json), then Shopify
 * best-sellers from the catalog. Edit the JSON to change what the home
 * banner pushes.
 */
export function pickPopularProducts(
  catalog: Product[],
  limit = POPULAR_COUNT,
): Product[] {
  const byHandle = new Map(
    catalog.map((product) => [product.handle, product]),
  );
  const picked: Product[] = [];
  const seen = new Set<string>();

  const take = (product: Product | undefined) => {
    if (!product || seen.has(product.id) || !product.featuredImage) return;
    seen.add(product.id);
    picked.push(product);
  };

  for (const handle of popularData.handles) {
    if (picked.length >= limit) break;
    take(byHandle.get(handle));
  }

  for (const product of catalog) {
    if (picked.length >= limit) break;
    take(product);
  }

  return picked;
}
