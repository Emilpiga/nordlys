import type { Product, ProductImage } from "@/lib/shopify/types";

/** A short stack of catalog stills for the hero crossfade. */
export const HERO_STILL_COUNT = 6;

export type HeroImage = {
  url: string;
  alt: string;
  product: Product;
};

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

function stillFromImage(
  product: Product,
  image: ProductImage | null | undefined,
): HeroImage | null {
  if (!image?.url) return null;
  return {
    url: image.url,
    alt: image.altText || product.title,
    product,
  };
}

/**
 * One featured still per product. Any orientation — the hero crops with object-cover.
 */
export function heroImagesFromCatalog(
  products: Product[],
  limit = HERO_STILL_COUNT,
): HeroImage[] {
  const seenProducts = new Set<string>();
  const seenImages = new Set<string>();
  const unique: HeroImage[] = [];

  for (const product of shuffle(products)) {
    if (seenProducts.has(product.id)) continue;
    const still =
      stillFromImage(product, product.featuredImage) ??
      product.images.map((image) => stillFromImage(product, image)).find(Boolean) ??
      null;
    if (!still) continue;
    const key = imageKey(still.url);
    if (seenImages.has(key)) continue;
    seenProducts.add(product.id);
    seenImages.add(key);
    unique.push(still);
    if (unique.length >= limit) break;
  }

  return unique;
}
