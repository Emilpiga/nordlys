import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EmptyCatalog } from "@/components/setup-banner";
import { ProductCatalog } from "@/components/product-catalog";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { isLocale } from "@/lib/i18n/locales";
import { getCollections, getProducts } from "@/lib/shopify";
import { shopifyConfig } from "@/lib/shopify/config";
import {
  localeAlternates,
  ogLocaleFor,
  socialMetadata,
} from "@/lib/seo";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

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

export default async function ProductsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale);
  const [products, collections, query] = await Promise.all([
    getProducts(250, locale),
    getCollections(24, locale),
    searchParams,
  ]);

  return (
    <div className="w-full pb-16 pt-12 sm:pb-24 sm:pt-16">
      <div className="px-5 sm:px-8">
        <h1 className="font-display text-5xl font-medium tracking-tight sm:text-6xl">
          {dict.products.shopTitle}
        </h1>
        <p className="mt-4 max-w-xl text-base font-light leading-relaxed text-muted">
          {dict.products.shopDescription}
        </p>
      </div>

      <div className="mt-10 border-t border-border/70">
        {products.length === 0 ? (
          <div className="px-5 py-12 sm:px-8">
            <EmptyCatalog />
          </div>
        ) : (
          <ProductCatalog
            products={products}
            collections={collections}
            initialQuery={query}
          />
        )}
      </div>
    </div>
  );
}
