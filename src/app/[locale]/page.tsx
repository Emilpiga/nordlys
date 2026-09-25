import { notFound } from "next/navigation";
import { HomeHero } from "@/components/home-hero";
import { HomeCategoryGuide } from "@/components/home-category-guide";
import { HomeLookbook } from "@/components/home-lookbook";
import { HomeThemeProvider } from "@/components/home-theme-provider";
import { HomePopular } from "@/components/home-popular";
import { HomeTestimonials } from "@/components/home-testimonials";
import { HomeTrustStrip } from "@/components/home-trust-strip";
import { EmptyCatalog } from "@/components/setup-banner";
import { heroImagesFromCatalog } from "@/lib/hero-images";
import { getDictionary, t } from "@/lib/i18n/get-dictionary";
import { isLocale } from "@/lib/i18n/locales";
import { getWeeklyLooks } from "@/lib/lookbook";
import { pickPopularProducts } from "@/lib/popular-products";
import { getTopTraction } from "@/lib/product-traction";
import { ensureHistoricalSalesSynced } from "@/lib/product-traction-sales-sync";
import { getCollections, getProducts, getProductsByIds } from "@/lib/shopify";
import {
  clothingGenders,
  clothingSampleIds,
  topLevelCollections,
} from "@/lib/shopify/collections";
import { isShopifyConfigured, shopifyConfig } from "@/lib/shopify/config";
import type { Product } from "@/lib/shopify/types";

type Props = { params: Promise<{ locale: string }> };

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const brand = shopifyConfig.storeName;
  // Absolute Shopify sales must land in Redis before we read traction ranks.
  await ensureHistoricalSalesSynced();
  const [catalog, collections, dict, traction, weeklyLooks] = await Promise.all([
    getProducts(100, locale),
    getCollections(50, locale),
    getDictionary(locale),
    getTopTraction(24),
    getWeeklyLooks(locale),
  ]);

  const clothingIds = new Set(clothingSampleIds(collections, 40));
  const catalogById = new Map(catalog.map((product) => [product.id, product]));

  const missingTractionIds = traction
    .map((entry) => entry.productId)
    .filter((id) => !catalogById.has(id));
  const missingClothingIds = [...clothingIds].filter(
    (id) => !catalogById.has(id),
  );
  const idsToFetch = [...new Set([...missingTractionIds, ...missingClothingIds])];

  const fetchedExtras = await getProductsByIds(idsToFetch, locale, {
    cache: "force-cache",
  });
  const fetchedById = new Map(
    fetchedExtras.map((product) => [product.id, product]),
  );

  const clothingProducts = [...clothingIds]
    .map((id) => catalogById.get(id) ?? fetchedById.get(id))
    .filter((product): product is Product => Boolean(product));

  const tractionProducts = traction
    .map((entry) => catalogById.get(entry.productId) ?? fetchedById.get(entry.productId))
    .filter((product): product is Product => Boolean(product));

  const heroImages = heroImagesFromCatalog(catalog, { clothingProducts });
  const popularProducts = pickPopularProducts(catalog, {
    clothingProducts,
    clothingIds,
    traction,
    tractionProducts,
  });
  const clothingCollections = clothingGenders(collections).filter(
    (collection) => collection.productCount > 0,
  );
  const homepageCollections = topLevelCollections(collections).filter(
    (collection) => collection.productCount > 0,
  );
  return (
    <HomeThemeProvider>
      <HomeHero
        images={heroImages}
        eyebrow={dict.home.wordmarkTagline}
        alt={t(dict.home.heroAlt, { brand })}
        tabsLabel={dict.home.heroTabsLabel}
        themes={{
          clothing: {
            label: dict.home.heroTabClothing,
            headline: dict.home.heroHeadline,
            sub: dict.home.heroSub,
            cta: dict.home.heroCtaClothing,
            ctaHref: "/collections/klader",
          },
          home: {
            label: dict.home.heroTabHome,
            headline: dict.home.heroHomeHeadline,
            sub: dict.home.heroHomeSub,
            cta: dict.home.heroCtaHome,
            ctaHref: "#categories",
          },
        }}
        fallback={
          clothingCollections.length > 0
            ? {
                headline: dict.home.heroHeadline,
                sub: dict.home.heroSub,
                cta: dict.home.heroCtaClothing,
                ctaHref: "/collections/klader",
              }
            : {
                headline: dict.home.heroHomeHeadline,
                sub: dict.home.heroHomeSub,
                cta: dict.home.heroCta,
                ctaHref: "/products",
              }
        }
        secondaryCta={dict.home.heroCtaAll}
        secondaryCtaHref="/products"
      />

      <HomePopular dict={dict} products={popularProducts} />

      <HomeTrustStrip />

      <HomeLookbook
        looks={weeklyLooks.looks}
        discountPercent={weeklyLooks.discountPercent}
      />

      {!isShopifyConfigured() || homepageCollections.length === 0 ? (
        <div className="mx-auto w-full max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
          <EmptyCatalog />
        </div>
      ) : (
        <HomeCategoryGuide collections={homepageCollections} />
      )}

      <HomeTestimonials locale={locale} dict={dict} products={catalog} />
    </HomeThemeProvider>
  );
}
