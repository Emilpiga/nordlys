import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EmptyCatalog } from "@/components/setup-banner";
import { ProductCatalog } from "@/components/product-catalog";
import {
  buildCollectionProductFilters,
  buildShopifyProductQuery,
  catalogPriceBounds,
  PAGE_SIZE,
  parseCursors,
  parseFilters,
  shopifySortFromFilters,
} from "@/lib/catalog-filters";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { isLocale } from "@/lib/i18n/locales";
import {
  getCollectionProductsPage,
  getCollections,
  getProductsPage,
} from "@/lib/shopify";
import { isShopifyConfigured, shopifyConfig } from "@/lib/shopify/config";
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
  const query = await searchParams;
  const filters = parseFilters(query);
  const cursors = parseCursors(query);
  const collections = await getCollections(24, locale);

  // Bootstrap price bounds from an unfiltered sample when possible.
  const sample = await getProductsPage({
    first: 50,
    sortKey: "BEST_SELLING",
    locale,
  });
  const bounds = catalogPriceBounds(sample.products);
  const sort = shopifySortFromFilters(filters);

  const page = filters.collection
    ? await getCollectionProductsPage({
        handle: filters.collection,
        first: cursors.before ? undefined : PAGE_SIZE,
        last: cursors.before ? PAGE_SIZE : undefined,
        after: cursors.after,
        before: cursors.before,
        sortKey: sort.collectionSortKey,
        reverse: sort.reverse,
        filters: buildCollectionProductFilters(filters, bounds),
        locale,
      })
    : await getProductsPage({
        first: cursors.before ? undefined : PAGE_SIZE,
        last: cursors.before ? PAGE_SIZE : undefined,
        after: cursors.after,
        before: cursors.before,
        sortKey: sort.sortKey,
        reverse: sort.reverse,
        query: buildShopifyProductQuery(filters, bounds),
        locale,
      });

  if (
    page.products.length === 0 &&
    !filters.collection &&
    !filters.sale &&
    !filters.stock &&
    filters.min == null &&
    filters.max == null &&
    !cursors.after &&
    !cursors.before &&
    (!isShopifyConfigured() || sample.products.length === 0)
  ) {
    return (
      <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <h1 className="font-display text-5xl font-medium tracking-tight sm:text-6xl">
          {dict.products.shopTitle}
        </h1>
        <p className="mt-4 max-w-xl text-base font-light leading-relaxed text-muted">
          {dict.products.shopDescription}
        </p>
        <div className="mt-12">
          <EmptyCatalog />
        </div>
      </div>
    );
  }

  return (
    <ProductCatalog
      title={dict.products.shopTitle}
      description={dict.products.shopDescription}
      products={page.products}
      collections={collections}
      initialQuery={query}
      pageInfo={page.pageInfo}
      bounds={bounds}
    />
  );
}
