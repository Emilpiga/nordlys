import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CategoryChips } from "@/components/category-chips";
import { EmptyCatalog } from "@/components/setup-banner";
import { ProductCard } from "@/components/product-card";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { isLocale, localePath } from "@/lib/i18n/locales";
import {
  getCollectionByHandle,
  getCollections,
  getProducts,
} from "@/lib/shopify";
import { shopifyConfig } from "@/lib/shopify/config";
import {
  localeAlternates,
  ogLocaleFor,
  socialMetadata,
} from "@/lib/seo";

type Props = { params: Promise<{ locale: string; handle: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, handle } = await params;
  if (!isLocale(locale)) return {};

  const collection = await getCollectionByHandle(handle, locale);
  if (!collection) return { title: "Rum" };

  const description =
    collection.description ||
    `${collection.title} · ${shopifyConfig.storeName}`;
  const image = collection.image;
  const path = `/collections/${encodeURIComponent(collection.handle)}`;
  const alternates = localeAlternates(locale, path);

  return {
    title: collection.title,
    description,
    alternates,
    ...socialMetadata({
      title: `${collection.title} · ${shopifyConfig.storeName}`,
      description,
      url: alternates.canonical,
      locale: ogLocaleFor(locale),
      images: image
        ? [
            {
              url: image.url,
              width: image.width,
              height: image.height,
              alt: collection.title,
            },
          ]
        : undefined,
    }),
  };
}

export default async function CollectionPage({ params }: Props) {
  const { locale, handle } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale);
  const [collection, collections, products] = await Promise.all([
    getCollectionByHandle(handle, locale),
    getCollections(24, locale),
    getProducts(100, locale),
  ]);

  if (!collection) notFound();

  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-14 pt-12 sm:px-8 sm:pb-20 sm:pt-16">
      <Link
        href={localePath(locale, "/products")}
        className="text-[0.68rem] font-medium tracking-[0.16em] uppercase text-muted transition hover:text-foreground"
      >
        {dict.products.backToShop}
      </Link>

      <div className="mt-8 mb-8 max-w-xl">
        <p className="text-[0.68rem] font-medium tracking-[0.2em] uppercase text-glow">
          {dict.nav.categories}
        </p>
        <h1 className="mt-3 font-display text-5xl font-medium tracking-tight sm:text-6xl">
          {collection.title}
        </h1>
        {collection.description ? (
          <p className="mt-4 text-base font-light leading-relaxed text-muted">
            {collection.description}
          </p>
        ) : null}
      </div>

      <div className="mb-12">
        <CategoryChips
          collections={collections}
          activeHandle={collection.handle}
          allCount={products.length}
        />
      </div>

      {collection.products.length === 0 ? (
        <EmptyCatalog />
      ) : (
        <div className="grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-7">
          {collection.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
