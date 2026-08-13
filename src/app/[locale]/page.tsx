import { notFound } from "next/navigation";
import { HomeHero, type HeroMosaicImage } from "@/components/home-hero";
import { HomeCategoryGuide } from "@/components/home-category-guide";
import { HomeTrustStrip } from "@/components/home-trust-strip";
import { EmptyCatalog } from "@/components/setup-banner";
import {
  HERO_MOSAIC_TILE_COUNT,
  isPortraitOrSquare,
} from "@/lib/home-mosaic";
import { isLocale } from "@/lib/i18n/locales";
import { getCollections, getProducts } from "@/lib/shopify";
import { isShopifyConfigured, shopifyConfig } from "@/lib/shopify/config";
import type { Product, ProductImage } from "@/lib/shopify/types";

type Props = { params: Promise<{ locale: string }> };

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

/** One upright image per product so each tile maps to add / quick view. */
function mosaicImagesFromCatalog(
  products: Product[],
  count: number,
): HeroMosaicImage[] {
  const seen = new Set<string>();
  const unique: HeroMosaicImage[] = [];

  for (const product of shuffle(products)) {
    const tile =
      tileFromImage(product, product.featuredImage) ??
      product.images
        .map((image) => tileFromImage(product, image))
        .find(Boolean) ??
      null;
    if (!tile) continue;
    const key = imageKey(tile.url);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(tile);
  }

  if (unique.length === 0) return [];

  const tiles: HeroMosaicImage[] = [];
  while (tiles.length < count) {
    tiles.push(...unique);
  }
  return tiles.slice(0, count);
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const brand = shopifyConfig.storeName;
  const [catalog, collections] = await Promise.all([
    getProducts(100, locale),
    getCollections(24, locale),
  ]);
  const mosaicImages = mosaicImagesFromCatalog(
    catalog,
    HERO_MOSAIC_TILE_COUNT,
  );

  return (
    <div>
      <HomeHero storeName={brand} mosaicImages={mosaicImages} />

      <HomeTrustStrip />

      {!isShopifyConfigured() || collections.length === 0 ? (
        <div className="mx-auto w-full max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
          <EmptyCatalog />
        </div>
      ) : (
        <HomeCategoryGuide collections={collections} />
      )}
    </div>
  );
}
