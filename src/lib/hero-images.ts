import type { Product, ProductImage } from "@/lib/shopify/types";

/** A short stack of catalog stills for the hero crossfade. */
export const HERO_STILL_COUNT = 6;

/** Clothing stills reserved inside the hero stack. The rest stay home goods. */
const CLOTHING_STILL_COUNT = 2;

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

function stillsFrom(products: Product[]): HeroImage[] {
  const seenProducts = new Set<string>();
  const seenImages = new Set<string>();
  const unique: HeroImage[] = [];

  for (const product of shuffle(products)) {
    if (seenProducts.has(product.id)) continue;
    const still =
      stillFromImage(product, product.featuredImage) ??
      product.images
        .map((image) => stillFromImage(product, image))
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
 * One featured still per product. Any orientation — the hero crops with object-cover.
 * When clothing products are passed, two of the six stills are clothes, interleaved
 * so the first frame stays a home product when one exists.
 */
export function heroImagesFromCatalog(
  products: Product[],
  options?: {
    limit?: number;
    clothingProducts?: Product[];
  },
): HeroImage[] {
  const limit = options?.limit ?? HERO_STILL_COUNT;
  const clothingIds = new Set(
    (options?.clothingProducts ?? []).map((product) => product.id),
  );
  const homeProducts =
    clothingIds.size > 0
      ? products.filter((product) => !clothingIds.has(product.id))
      : products;

  const clothingStills = stillsFrom(options?.clothingProducts ?? []);
  const homeStills = stillsFrom(homeProducts);

  const clothingTarget = Math.min(
    CLOTHING_STILL_COUNT,
    clothingStills.length,
    limit,
  );
  let homeTarget = Math.min(limit - clothingTarget, homeStills.length);
  const clothingExtra = Math.min(
    clothingStills.length - clothingTarget,
    limit - homeTarget - clothingTarget,
  );
  const clothing = clothingStills.slice(0, clothingTarget + clothingExtra);
  if (homeTarget + clothing.length < limit) {
    homeTarget = Math.min(homeStills.length, limit - clothing.length);
  }
  const home = homeStills.slice(0, homeTarget);

  const picked: HeroImage[] = [];
  let homeIndex = 0;
  let clothingIndex = 0;
  for (let index = 0; index < limit; index++) {
    const preferClothing = clothing.length > 0 && index % 3 === 1;
    if (preferClothing && clothingIndex < clothing.length) {
      picked.push(clothing[clothingIndex]);
      clothingIndex += 1;
      continue;
    }
    if (homeIndex < home.length) {
      picked.push(home[homeIndex]);
      homeIndex += 1;
      continue;
    }
    if (clothingIndex < clothing.length) {
      picked.push(clothing[clothingIndex]);
      clothingIndex += 1;
    }
  }

  return picked;
}
