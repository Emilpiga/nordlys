import popularData from "@/data/popular-products.json";
import { assignFeaturedBadges } from "@/lib/product-traction-badges";
import type {
  TractionBadge,
  TractionMetrics,
} from "@/lib/product-traction-types";
import type { Product } from "@/lib/shopify/types";

const POPULAR_COUNT = 8;
const CLOTHING_RATIO = 0.5;

export type PopularProduct = Product & {
  tractionBadge?: TractionBadge;
};

/**
 * Prefer Redis traction leaders (views / carts / sales), keeping two clothing
 * and two home slots. Fall back to curated handles + Shopify BEST_SELLING
 * when traction data is cold or incomplete.
 *
 * Badges are assigned relatively across the final featured set. Sales ties
 * for Bästsäljare go to the 2 products with the most recent paid orders.
 */
export function pickPopularProducts(
  catalog: Product[],
  options?: {
    limit?: number;
    clothingProducts?: Product[];
    clothingIds?: ReadonlySet<string>;
    traction?: ReadonlyArray<TractionMetrics>;
    tractionProducts?: Product[];
  },
): PopularProduct[] {
  const limit = options?.limit ?? POPULAR_COUNT;
  const clothingIds = options?.clothingIds ?? new Set<string>();
  const clothingPool = options?.clothingProducts ?? [];
  const clothingTarget =
    clothingPool.length > 0 || clothingIds.size > 0
      ? Math.min(Math.floor(limit * CLOTHING_RATIO), limit)
      : 0;

  const byId = new Map<string, Product>();
  for (const product of [
    ...(options?.tractionProducts ?? []),
    ...catalog,
    ...clothingPool,
  ]) {
    byId.set(product.id, product);
  }

  const byHandle = new Map(
    [...byId.values()].map((product) => [product.handle, product]),
  );
  const seen = new Set<string>();
  const metricsById = new Map(
    (options?.traction ?? []).map((entry) => [entry.productId, entry]),
  );

  const take = (product: Product | undefined, into: Product[]) => {
    if (!product || seen.has(product.id) || !product.featuredImage) return;
    seen.add(product.id);
    into.push(product);
  };

  const clothing: Product[] = [];
  const home: Product[] = [];

  for (const entry of options?.traction ?? []) {
    if (
      clothing.length >= clothingTarget &&
      home.length >= limit - clothingTarget
    ) {
      break;
    }
    const product = byId.get(entry.productId);
    if (!product) continue;
    const isClothing = clothingIds.has(product.id);
    if (isClothing) {
      if (clothing.length >= clothingTarget) continue;
      take(product, clothing);
    } else {
      if (home.length >= limit - clothingTarget) continue;
      take(product, home);
    }
  }

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

  if (clothing.length < clothingTarget) {
    for (const product of clothingPool) {
      if (clothing.length >= clothingTarget) break;
      take(product, clothing);
    }
  }

  const picked: Product[] = [];
  const rows = Math.max(home.length, clothing.length);
  for (let index = 0; index < rows; index++) {
    if (home[index]) picked.push(home[index]);
    if (clothing[index]) picked.push(clothing[index]);
  }
  const featured = picked.slice(0, limit);

  const featuredMetrics = featured.map((product) => {
    const metrics = metricsById.get(product.id);
    return {
      productId: product.id,
      views: metrics?.views ?? 0,
      carts: metrics?.carts ?? 0,
      sales: metrics?.sales ?? 0,
      score: metrics?.score ?? 0,
      lastSaleAt: metrics?.lastSaleAt ?? 0,
    };
  });

  const badges = assignFeaturedBadges(featuredMetrics);

  return featured.map((product) => {
    const badge = badges.get(product.id);
    return badge ? { ...product, tractionBadge: badge } : product;
  });
}
