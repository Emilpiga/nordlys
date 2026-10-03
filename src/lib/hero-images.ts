import type { ClothingGender } from "@/lib/shopify/collections";
import type { Product, ProductImage } from "@/lib/shopify/types";

/** A short stack of catalog stills for the hero crossfade. */
export const HERO_STILL_COUNT = 6;

export type HeroImage = {
  url: string;
  alt: string;
  product: Product;
  gender: ClothingGender;
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
  gender: ClothingGender,
): HeroImage | null {
  if (!image?.url) return null;
  return {
    url: image.url,
    alt: image.altText || product.title,
    product,
    gender,
  };
}

/** One featured still per product. Any orientation — the hero crops with object-cover. */
function stillsFrom(products: Product[], gender: ClothingGender): HeroImage[] {
  const seenProducts = new Set<string>();
  const seenImages = new Set<string>();
  const unique: HeroImage[] = [];

  for (const product of shuffle(products)) {
    if (seenProducts.has(product.id)) continue;
    const still =
      stillFromImage(product, product.featuredImage, gender) ??
      product.images
        .map((image) => stillFromImage(product, image, gender))
        .find(Boolean) ??
      null;
    if (!still) continue;
    const key = imageKey(still.url);
    if (seenImages.has(key)) continue;
    seenProducts.add(product.id);
    seenImages.add(key);
    unique.push(still);
  }

  return unique;
}

/**
 * Stills from Dam and Herr in pairs (dam, dam, herr, herr, …), so the hero tab
 * that follows them changes at a calm pace and the first frame is Dam. When
 * one side runs out, the other fills the rest.
 */
export function heroImagesFromCatalog(
  products: Record<ClothingGender, Product[]>,
  options?: { limit?: number },
): HeroImage[] {
  const limit = options?.limit ?? HERO_STILL_COUNT;
  const stills = {
    dam: stillsFrom(products.dam, "dam"),
    herr: stillsFrom(products.herr, "herr"),
  };
  const picked: HeroImage[] = [];

  for (let index = 0; picked.length < limit; index++) {
    const gender: ClothingGender = index % 4 < 2 ? "dam" : "herr";
    const other: ClothingGender = gender === "dam" ? "herr" : "dam";
    const still = stills[gender].shift() ?? stills[other].shift();
    if (!still) break;
    picked.push(still);
  }

  return picked;
}
