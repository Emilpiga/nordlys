import { notFound } from "next/navigation";
import { HomeHero } from "@/components/home-hero";
import { HomeCategoryGuide } from "@/components/home-category-guide";
import { HomePopular } from "@/components/home-popular";
import { HomeTestimonials } from "@/components/home-testimonials";
import { HomeTrustStrip } from "@/components/home-trust-strip";
import { EmptyCatalog } from "@/components/setup-banner";
import { heroImagesFromCatalog } from "@/lib/hero-images";
import { getDictionary, t } from "@/lib/i18n/get-dictionary";
import { isLocale } from "@/lib/i18n/locales";
import { pickPopularProducts } from "@/lib/popular-products";
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
  const [catalog, collections, dict] = await Promise.all([
    getProducts(100, locale),
    getCollections(50, locale),
    getDictionary(locale),
  ]);

  const clothingIds = new Set(clothingSampleIds(collections, 40));
  const catalogById = new Map(catalog.map((product) => [product.id, product]));
  const missingClothingIds = [...clothingIds].filter(
    (id) => !catalogById.has(id),
  );
  const fetchedClothing = await getProductsByIds(missingClothingIds, locale, {
    cache: "force-cache",
  });
  const fetchedById = new Map(
    fetchedClothing.map((product) => [product.id, product]),
  );
  const clothingProducts = [...clothingIds]
    .map((id) => catalogById.get(id) ?? fetchedById.get(id))
    .filter((product): product is Product => Boolean(product));

  const heroImages = heroImagesFromCatalog(catalog, { clothingProducts });
  const popularProducts = pickPopularProducts(catalog, {
    clothingProducts,
    clothingIds,
  });
  const clothingCollections = clothingGenders(collections).filter(
    (collection) => collection.productCount > 0,
  );
  const homepageCollections = topLevelCollections(collections).filter(
    (collection) => collection.productCount > 0,
  );
  return (
    <div>
      <HomeHero
        images={heroImages}
        eyebrow={dict.home.wordmarkTagline}
        headline={dict.home.heroHeadline}
        sub={dict.home.heroSub}
        cta={
          clothingCollections.length > 0
            ? dict.home.heroCtaHome
            : dict.home.heroCta
        }
        ctaHref={clothingCollections.length > 0 ? "#categories" : "/products"}
        secondaryCta={
          clothingCollections.length > 0
            ? dict.home.heroCtaClothing
            : undefined
        }
        secondaryCtaHref={
          clothingCollections.length > 0 ? "/collections/klader" : undefined
        }
        alt={t(dict.home.heroAlt, { brand })}
      />

      <HomePopular dict={dict} products={popularProducts} />

      <HomeTrustStrip />

      {!isShopifyConfigured() || homepageCollections.length === 0 ? (
        <div className="mx-auto w-full max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
          <EmptyCatalog />
        </div>
      ) : (
        <HomeCategoryGuide collections={homepageCollections} />
      )}

      <HomeTestimonials locale={locale} dict={dict} products={catalog} />
    </div>
  );
}
