import { notFound } from "next/navigation";
import { HomeHero } from "@/components/home-hero";
import { HomeCategoryGuide } from "@/components/home-category-guide";
import { HomeLookbook } from "@/components/home-lookbook";
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
  CLOTHING_ROOT,
  type ClothingGender,
  clothingGenders,
  clothingSampleIds,
  topLevelCollections,
} from "@/lib/shopify/collections";
import { isShopifyConfigured, shopifyConfig } from "@/lib/shopify/config";
import type { Product } from "@/lib/shopify/types";

type Props = { params: Promise<{ locale: string }> };

/**
 * "Veckans look" is switched off for now: many visitors left the home page
 * right as they reached it. Flip back to true to bring it (and its data
 * fetch) back — the planner and discount keep running either way.
 */
const SHOW_WEEKLY_LOOK = false;

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
    SHOW_WEEKLY_LOOK ? getWeeklyLooks(locale) : null,
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

  const genderCollections = clothingGenders(collections);
  const productsIn = (gender: ClothingGender) => {
    const ids = new Set(
      genderCollections.find((collection) => collection.handle === gender)
        ?.productIds,
    );
    return clothingProducts.filter((product) => ids.has(product.id));
  };
  const titleOf = (gender: ClothingGender) =>
    genderCollections.find((collection) => collection.handle === gender)
      ?.title ?? gender;
  const heroImages = heroImagesFromCatalog({
    dam: productsIn("dam"),
    herr: productsIn("herr"),
  });
  const popularProducts = pickPopularProducts(catalog, {
    clothingProducts,
    clothingIds,
    traction,
    tractionProducts,
  });
  // Dam and Herr stand in for the Kläder umbrella, so the guide has a real choice.
  const homepageCollections = [
    ...genderCollections,
    ...topLevelCollections(collections).filter(
      (collection) => collection.handle !== CLOTHING_ROOT,
    ),
  ].filter((collection) => collection.productCount > 0);
  return (
    <>
      <HomeHero
        images={heroImages}
        eyebrow={dict.home.wordmarkTagline}
        alt={t(dict.home.heroAlt, { brand })}
        tabsLabel={dict.home.heroTabsLabel}
        tabs={{
          dam: {
            label: titleOf("dam"),
            cta: dict.home.heroCtaDam,
            ctaHref: "/collections/dam",
          },
          herr: {
            label: titleOf("herr"),
            cta: dict.home.heroCtaHerr,
            ctaHref: "/collections/herr",
          },
        }}
        copy={{
          headline: dict.home.heroHeadline,
          sub: dict.home.heroSub,
          cta: dict.home.heroCtaClothing,
          ctaHref: "/collections/klader",
        }}
        secondaryCta={dict.home.heroCtaAll}
        secondaryCtaHref="/products"
      />

      <HomePopular dict={dict} products={popularProducts} />

      <HomeTrustStrip />

      {weeklyLooks ? (
        <HomeLookbook
          looks={weeklyLooks.looks}
          discountPercent={weeklyLooks.discountPercent}
        />
      ) : null}

      {!isShopifyConfigured() || homepageCollections.length === 0 ? (
        <div className="mx-auto w-full max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
          <EmptyCatalog />
        </div>
      ) : (
        <HomeCategoryGuide collections={homepageCollections} />
      )}

      <HomeTestimonials locale={locale} dict={dict} products={catalog} />
    </>
  );
}
