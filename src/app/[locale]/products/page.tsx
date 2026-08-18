import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { EmptyCatalog } from "@/components/setup-banner";
import { ProductCatalog } from "@/components/product-catalog";
import {
  buildCollectionProductFilters,
  buildShopifyProductQuery,
  catalogPageInfo,
  catalogPriceBounds,
  isCollectionLanding,
  PAGE_SIZE,
  parseFilters,
  parsePage,
  sanitizeFilters,
  serializeFilters,
  shopifySortFromFilters,
} from "@/lib/catalog-filters";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { isLocale, localePath } from "@/lib/i18n/locales";
import { getCatalogSlice, getCollections, getProductsPage } from "@/lib/shopify";
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

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const dict = await getDictionary(locale);
  const query = await searchParams;
  const filters = parseFilters(query);
  const collections = await getCollections(24, locale);
  const collection = filters.collection
    ? collections.find((item) => item.handle === filters.collection)
    : null;

  if (collection) {
    const path = `/collections/${encodeURIComponent(collection.handle)}`;
    const alternates = localeAlternates(locale, path);
    return {
      title: collection.title,
      description:
        collection.seo.description ||
        collection.description ||
        dict.products.shopDescription,
      robots: { index: false, follow: true },
      alternates,
    };
  }

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
  const requestedPage = parsePage(query);
  const [collections, sample] = await Promise.all([
    getCollections(24, locale),
    getProductsPage({
      first: 50,
      sortKey: "BEST_SELLING",
      locale,
    }),
  ]);
  const bounds = catalogPriceBounds(sample.products);

  if (
    filters.collection &&
    collections.some((item) => item.handle === filters.collection) &&
    isCollectionLanding(filters, bounds)
  ) {
    redirect(
      localePath(
        locale,
        `/collections/${encodeURIComponent(filters.collection)}`,
      ),
    );
  }

  const sort = shopifySortFromFilters(filters);

  const slice = await getCatalogSlice({
    page: requestedPage,
    pageSize: PAGE_SIZE,
    collectionHandle: filters.collection,
    sortKey: sort.sortKey,
    collectionSortKey: sort.collectionSortKey,
    reverse: sort.reverse,
    query: buildShopifyProductQuery(filters, bounds),
    filters: buildCollectionProductFilters(filters, bounds),
    locale,
  });
  const pageInfo = catalogPageInfo(
    slice.total,
    slice.page,
    slice.products.length,
  );

  if (requestedPage !== pageInfo.page) {
    const qs = serializeFilters(sanitizeFilters(filters, bounds), bounds, {
      page: pageInfo.page,
    });
    redirect(localePath(locale, qs ? `/products?${qs}` : "/products"));
  }

  if (
    slice.products.length === 0 &&
    !filters.collection &&
    !filters.sale &&
    !filters.stock &&
    filters.min == null &&
    filters.max == null &&
    requestedPage <= 1 &&
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
      products={slice.products}
      collections={collections}
      initialQuery={query}
      pageInfo={pageInfo}
      bounds={bounds}
    />
  );
}
