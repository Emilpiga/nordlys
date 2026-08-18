import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { JsonLd } from "@/components/json-ld";
import { ProductCatalog } from "@/components/product-catalog";
import {
  buildCollectionProductFilters,
  catalogPageInfo,
  catalogPriceBounds,
  hasFacetQuery,
  PAGE_SIZE,
  parseFilters,
  parsePage,
  sanitizeFilters,
  serializeFilters,
  shopifySortFromFilters,
} from "@/lib/catalog-filters";
import {
  collectionIntro,
  collectionMetaDescription,
  collectionMetaTitle,
  imageAlt,
} from "@/lib/catalog-seo";
import { getDictionary, t } from "@/lib/i18n/get-dictionary";
import { isLocale, localePath } from "@/lib/i18n/locales";
import { buildBreadcrumbJsonLd, buildCollectionJsonLd } from "@/lib/json-ld";
import { getCatalogSlice, getCollectionByHandle, getCollections } from "@/lib/shopify";
import { shopifyConfig } from "@/lib/shopify/config";
import {
  localeAlternates,
  ogLocaleFor,
  socialMetadata,
} from "@/lib/seo";
import { getSiteUrl } from "@/lib/site-url";

type Props = {
  params: Promise<{ locale: string; handle: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const { locale, handle } = await params;
  if (!isLocale(locale)) return {};

  const collection = await getCollectionByHandle(handle, locale);
  if (!collection) return { title: "Rum" };

  const dict = await getDictionary(locale);
  const title = collectionMetaTitle(
    collection,
    t(dict.collections.metaTitle, { title: collection.title }),
  );
  const description = collectionMetaDescription(
    collection,
    t(dict.collections.metaDescription, {
      title: collection.title,
      brand: shopifyConfig.storeName,
      count: collection.productCount,
    }),
  );
  const image = collection.image;
  const path = `/collections/${encodeURIComponent(collection.handle)}`;
  const alternates = localeAlternates(locale, path);
  const query = await searchParams;
  const faceted = hasFacetQuery(query);

  return {
    title,
    description,
    ...(faceted ? { robots: { index: false, follow: true } } : {}),
    alternates,
    ...socialMetadata({
      title: `${title} · ${shopifyConfig.storeName}`,
      description,
      url: alternates.canonical,
      locale: ogLocaleFor(locale),
      images: image
        ? [
            {
              url: image.url,
              width: image.width,
              height: image.height,
              alt: imageAlt(collection.title, image.altText),
            },
          ]
        : undefined,
    }),
  };
}

export default async function CollectionPage({ params, searchParams }: Props) {
  const { locale, handle } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale);
  const query = await searchParams;
  const requestedPage = parsePage(query);
  const [collection, collections] = await Promise.all([
    getCollectionByHandle(handle, locale),
    getCollections(24, locale),
  ]);

  if (!collection) notFound();

  const intro = collectionIntro(
    collection,
    t(dict.collections.intro, {
      title: collection.title,
      brand: shopifyConfig.storeName,
    }),
  );
  const filters = {
    ...parseFilters(query),
    collection: collection.handle,
  };
  const bounds = catalogPriceBounds(collection.products);
  const sort = shopifySortFromFilters(filters);
  const slice = await getCatalogSlice({
    page: requestedPage,
    pageSize: PAGE_SIZE,
    collectionHandle: collection.handle,
    sortKey: sort.sortKey,
    collectionSortKey: sort.collectionSortKey,
    reverse: sort.reverse,
    filters: buildCollectionProductFilters(filters, bounds),
    locale,
  });
  const pageInfo = catalogPageInfo(
    slice.total,
    slice.page,
    slice.products.length,
  );

  if (requestedPage !== pageInfo.page) {
    const qs = serializeFilters(
      { ...sanitizeFilters(filters, bounds), collection: null },
      bounds,
      { page: pageInfo.page },
    );
    const path = `/collections/${encodeURIComponent(collection.handle)}`;
    redirect(localePath(locale, qs ? `${path}?${qs}` : path));
  }

  const site = getSiteUrl();
  const collectionUrl = `${site}${localePath(locale, `/collections/${encodeURIComponent(collection.handle)}`)}`;
  const faceted = hasFacetQuery(query);

  return (
    <>
      {!faceted ? (
        <JsonLd
          data={[
            buildCollectionJsonLd(collection, locale),
            buildBreadcrumbJsonLd([
              {
                name: dict.products.shopTitle,
                url: `${site}${localePath(locale, "/products")}`,
              },
              { name: collection.title, url: collectionUrl },
            ]),
          ]}
        />
      ) : null}
      <ProductCatalog
        title={collection.title}
        description={intro}
        products={slice.products}
        collections={collections}
        initialQuery={{ ...query, collection: collection.handle }}
        pageInfo={pageInfo}
        bounds={bounds}
        collectionHandle={collection.handle}
      />
    </>
  );
}
