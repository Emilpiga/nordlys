import popularData from "@/data/popular-products.json";
import type { Product } from "@/lib/shopify/types";

const POPULAR_COUNT = 4;
const CLOTHING_SLOTS = 2;

/**
 * Curated handles first (src/data/popular-products.json), then Shopify
 * best-sellers from the catalog. When clothing products are passed in, two
 * of the four slots are clothes. Edit the JSON to change what the home
 * banner pushes.
 */
export function pickPopularProducts(
  catalog: Product[],
  options?: {
    limit?: number;
    clothingProducts?: Product[];
    clothingIds?: ReadonlySet<string>;
  },
): Product[] {
  const limit = options?.limit ?? POPULAR_COUNT;
  const clothingIds = options?.clothingIds ?? new Set<string>();
  const clothingPool = options?.clothingProducts ?? [];
  const clothingTarget =
    clothingPool.length > 0 ? Math.min(CLOTHING_SLOTS, limit) : 0;

  const byHandle = new Map(
    [...catalog, ...clothingPool].map((product) => [product.handle, product]),
  );
  const seen = new Set<string>();

  const take = (product: Product | undefined, into: Product[]) => {
    if (!product || seen.has(product.id) || !product.featuredImage) return;
    seen.add(product.id);
    into.push(product);
  };

  const clothing: Product[] = [];
  for (const handle of popularData.clothingHandles) {
    if (clothing.length >= clothingTarget) break;
    const product = byHandle.get(handle);
    if (product && clothingIds.size > 0 && !clothingIds.has(product.id)) {
      continue;
    }
    take(product, clothing);
  }
  for (const product of clothingPool) {
    if (clothing.length >= clothingTarget) break;
    take(product, clothing);
  }

  const homeTarget = limit - clothing.length;
  const home: Product[] = [];
  for (const handle of popularData.handles) {
    if (home.length >= homeTarget) break;
    const product = byHandle.get(handle);
    if (product && clothingIds.has(product.id)) continue;
    take(product, home);
  }
  for (const product of catalog) {
    if (home.length >= homeTarget) break;
    if (clothingIds.has(product.id)) continue;
    take(product, home);
  }

  const picked: Product[] = [];
  const rows = Math.max(home.length, clothing.length);
  for (let index = 0; index < rows; index++) {
    if (home[index]) picked.push(home[index]);
    if (clothing[index]) picked.push(clothing[index]);
  }
  return picked;
}
