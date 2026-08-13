import type { Product, ProductImage } from "@/lib/shopify/types";

/** Uniform mosaic — every cell the same size. Matches the 3×4 / 4×3 hero grid. */
export const HERO_MOSAIC_VISIBLE_COUNT = 12;

/** Extra unique products kept for periodic in/out swaps. */
export const HERO_MOSAIC_POOL_COUNT = 36;

export type HeroMosaicImage = {
  url: string;
  alt: string;
  product: Product;
};

/** Allowed in the mosaic: square or taller — not landscape. */
export function isPortraitOrSquare(width: number, height: number) {
  if (!width || !height) return true;
  return height >= width;
}

function shuffle<T>(items: T[]) {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function imageKey(url: string) {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return url.split("?")[0] ?? url;
  }
}

function tileFromImage(
  product: Product,
  image: ProductImage | null | undefined,
): HeroMosaicImage | null {
  if (!image?.url) return null;
  const width = image.width || 0;
  const height = image.height || 0;
  if (width > 0 && height > 0 && !isPortraitOrSquare(width, height)) return null;
  return {
    url: image.url,
    alt: image.altText || product.title,
    product,
  };
}

/**
 * One upright image per product. Never repeats a product or image URL.
 */
export function mosaicImagesFromCatalog(
  products: Product[],
  limit = HERO_MOSAIC_POOL_COUNT,
): HeroMosaicImage[] {
  const seenProducts = new Set<string>();
  const seenImages = new Set<string>();
  const unique: HeroMosaicImage[] = [];

  for (const product of shuffle(products)) {
    if (seenProducts.has(product.id)) continue;
    const tile =
      tileFromImage(product, product.featuredImage) ??
      product.images
        .map((image) => tileFromImage(product, image))
        .find(Boolean) ??
      null;
    if (!tile) continue;
    const key = imageKey(tile.url);
    if (seenImages.has(key)) continue;
    seenProducts.add(product.id);
    seenImages.add(key);
    unique.push(tile);
    if (unique.length >= limit) break;
  }

  return unique;
}

/** Visible mosaic cells: unique products only, never padded with repeats. */
export function fillMosaicSlots<T>(items: T[], count: number): T[] {
  return items.slice(0, count);
}
