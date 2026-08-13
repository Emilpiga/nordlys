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
import { getCollections, getProducts } from "@/lib/shopify";
import { isShopifyConfigured, shopifyConfig } from "@/lib/shopify/config";

type Props = { params: Promise<{ locale: string }> };

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const brand = shopifyConfig.storeName;
  const [catalog, collections, dict] = await Promise.all([
    getProducts(100, locale),
    getCollections(24, locale),
    getDictionary(locale),
  ]);
  const heroImages = heroImagesFromCatalog(catalog);
  const popularProducts = pickPopularProducts(catalog);

  return (
    <div>
      <HomeHero
        images={heroImages}
        eyebrow={dict.home.wordmarkTagline}
        headline={dict.home.heroHeadline}
        sub={dict.home.heroSub}
        cta={dict.home.heroCta}
        alt={t(dict.home.heroAlt, { brand })}
      />

      <HomePopular dict={dict} products={popularProducts} />

      <HomeTrustStrip />

      <HomeTestimonials locale={locale} dict={dict} products={catalog} />

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
