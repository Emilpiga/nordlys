import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HomeCategoryGuide } from "@/components/home-category-guide";
import { AmbientSection, SectionRule } from "@/components/section";
import { EmptyCatalog } from "@/components/setup-banner";
import { HomeHero } from "@/components/home-hero";
import { ProductCard } from "@/components/product-card";
import { getDictionary, t } from "@/lib/i18n/get-dictionary";
import { isLocale, localePath } from "@/lib/i18n/locales";
import { getProducts } from "@/lib/shopify";
import { categoriesFromProducts } from "@/lib/shopify/taxonomy";
import { isShopifyConfigured, shopifyConfig } from "@/lib/shopify/config";
import type { Product } from "@/lib/shopify/types";

type Props = { params: Promise<{ locale: string }> };

function categoriesWithImages(products: Product[]) {
  return categoriesFromProducts(products).map((category) => {
    const sample = products.find(
      (product) => product.category?.id === category.id && product.featuredImage,
    );
    return {
      ...category,
      image: sample?.featuredImage ?? null,
    };
  });
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale);
  const brand = shopifyConfig.storeName;
  const catalog = await getProducts(100, locale);
  const featured = catalog.slice(0, 4);
  const categories = categoriesWithImages(catalog);

  return (
    <div>
      <HomeHero storeName={brand} />

      <AmbientSection className="mx-auto w-full max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
        <div className="mb-12 flex flex-col gap-6 sm:mb-14 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <p className="text-[0.68rem] font-medium tracking-[0.2em] uppercase text-glow">
              {dict.home.featuredEyebrow}
            </p>
            <h2 className="mt-3 font-display text-4xl font-medium tracking-tight sm:text-5xl">
              {dict.home.featuredTitle}
            </h2>
            <p className="mt-3 text-base font-light leading-relaxed text-muted">
              {dict.home.featuredSub}
            </p>
          </div>
          <Link
            href={localePath(locale, "/products")}
            className="text-[0.68rem] font-medium tracking-[0.16em] uppercase text-muted transition hover:text-foreground"
          >
            {dict.home.featuredAll}
          </Link>
        </div>

        {!isShopifyConfigured() || featured.length === 0 ? (
          <EmptyCatalog />
        ) : (
          <div className="grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-4 lg:gap-x-7">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </AmbientSection>

      <SectionRule />

      <AmbientSection className="mx-auto grid w-full max-w-6xl gap-12 px-5 py-24 sm:px-8 sm:py-32 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-16">
        <div>
          <p className="text-[0.68rem] font-medium tracking-[0.2em] uppercase text-glow">
            {dict.home.atmosphereEyebrow}
          </p>
          <h2 className="mt-4 font-display text-4xl font-medium tracking-tight sm:text-5xl">
            {dict.home.atmosphereTitle}
          </h2>
          <p className="mt-5 max-w-md text-base font-light leading-relaxed text-muted">
            {t(dict.home.atmosphereBody, { brand })}
          </p>
        </div>
        <div className="relative min-h-[300px] overflow-hidden rounded-2xl sm:min-h-[420px]">
          <Image
            src="/winter-lighting.png"
            alt={dict.home.atmosphereAlt}
            fill
            className="object-cover object-center"
            sizes="(max-width: 1024px) 100vw, 55vw"
          />
        </div>
      </AmbientSection>

      {categories.length > 0 ? (
        <>
          <SectionRule />
          <HomeCategoryGuide categories={categories} />
        </>
      ) : null}
    </div>
  );
}
