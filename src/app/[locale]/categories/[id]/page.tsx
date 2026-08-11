import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CategoryChips } from "@/components/category-chips";
import { EmptyCatalog } from "@/components/setup-banner";
import { ProductCard } from "@/components/product-card";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { isLocale, localePath } from "@/lib/i18n/locales";
import {
  getProductCategories,
  getProductsByCategory,
} from "@/lib/shopify";
import { shopifyConfig } from "@/lib/shopify/config";
import {
  localeAlternates,
  ogLocaleFor,
  socialMetadata,
} from "@/lib/seo";
import { categoryParamFromId } from "@/lib/shopify/taxonomy";

type Props = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  if (!isLocale(locale)) return {};

  const { category, products } = await getProductsByCategory(id, 100, locale);
  if (!category) return { title: "Kategori" };

  const description = `${category.name} · ${shopifyConfig.storeName} — ${category.productCount}`;
  const image = products.find((product) => product.featuredImage)?.featuredImage;
  const path = `/categories/${encodeURIComponent(categoryParamFromId(category.id))}`;
  const alternates = localeAlternates(locale, path);

  return {
    title: category.name,
    description,
    alternates,
    ...socialMetadata({
      title: `${category.name} · ${shopifyConfig.storeName}`,
      description,
      url: alternates.canonical,
      locale: ogLocaleFor(locale),
      images: image
        ? [
            {
              url: image.url,
              width: image.width,
              height: image.height,
              alt: category.name,
            },
          ]
        : undefined,
    }),
  };
}

export default async function CategoryPage({ params }: Props) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale);
  const [{ category, products }, categories] = await Promise.all([
    getProductsByCategory(id, 100, locale),
    getProductCategories(100, locale),
  ]);

  if (!category) notFound();

  const allCount = categories.reduce((sum, item) => sum + item.productCount, 0);

  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-14 pt-28 sm:px-8 sm:pb-20 sm:pt-32">
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
          {category.name}
        </h1>
      </div>

      <div className="mb-12">
        <CategoryChips
          categories={categories}
          activeId={category.id}
          allCount={allCount}
        />
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
