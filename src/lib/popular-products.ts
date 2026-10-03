import popularData from "@/data/popular-products.json";
import { assignFeaturedBadges } from "@/lib/product-traction-badges";
import type {
  TractionBadge,
  TractionMetrics,
} from "@/lib/product-traction-types";
import type { Product } from "@/lib/shopify/types";

const POPULAR_COUNT = 8;

export type PopularProduct = Product & {
  tractionBadge?: TractionBadge;
};

/**
 * Prefer Redis traction leaders (views / carts / sales) among the clothing.
 * Fall back to curated handles + Shopify BEST_SELLING when traction data is
 * cold or incomplete.
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

  const featured: Product[] = [];
  const take = (product: Product | undefined) => {
    if (!product || featured.length >= limit) return;
    if (seen.has(product.id) || !product.featuredImage) return;
    // Until the clothing collections load, anything in the catalog may show.
    if (clothingIds.size > 0 && !clothingIds.has(product.id)) return;
    seen.add(product.id);
    featured.push(product);
  };

  for (const entry of options?.traction ?? []) take(byId.get(entry.productId));
  for (const handle of popularData.handles) take(byHandle.get(handle));
  for (const product of clothingPool) take(product);
  for (const product of catalog) take(product);

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
