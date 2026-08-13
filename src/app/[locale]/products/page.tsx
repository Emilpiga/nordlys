import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryChips } from "@/components/category-chips";
import { EmptyCatalog } from "@/components/setup-banner";
import { ProductCard } from "@/components/product-card";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { isLocale } from "@/lib/i18n/locales";
import { getCollections, getProducts } from "@/lib/shopify";
import { shopifyConfig } from "@/lib/shopify/config";
import {
  localeAlternates,
  ogLocaleFor,
  socialMetadata,
} from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const dict = await getDictionary(locale);
  const title = dict.products.shopTitle;
  const description = dict.products.shopDescription;
  const alternates = localeAlternates(locale, "/products");

  return {
    title,
    description,
    alternates,
    ...socialMetadata({
      title: `${title} · ${shopifyConfig.storeName}`,
      description,
      url: alternates.canonical,
      locale: ogLocaleFor(locale),
    }),
  };
}

export default async function ProductsPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale);
  const [products, collections] = await Promise.all([
    getProducts(100, locale),
    getCollections(24, locale),
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-14 pt-12 sm:px-8 sm:pb-20 sm:pt-16">
      <div className="mb-8 max-w-xl">
        <h1 className="font-display text-5xl font-medium tracking-tight sm:text-6xl">
          {dict.products.shopTitle}
        </h1>
        <p className="mt-4 text-base font-light leading-relaxed text-muted">
          {dict.products.shopDescription}
        </p>
      </div>

      <div className="mb-12">
        <CategoryChips collections={collections} allCount={products.length} />
      </div>

      {products.length === 0 ? (
        <EmptyCatalog />
      ) : (
        <div className="grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-7">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
