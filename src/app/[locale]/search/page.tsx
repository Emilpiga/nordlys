import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LocaleLink } from "@/components/locale-link";
import { ProductCard } from "@/components/product-card";
import { getDictionary, t } from "@/lib/i18n/get-dictionary";
import { isLocale } from "@/lib/i18n/locales";
import { searchProducts } from "@/lib/shopify";
import { shopifyConfig } from "@/lib/shopify/config";
import { localeAlternates, ogLocaleFor, socialMetadata } from "@/lib/seo";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string | string[] }>;
};

function queryFrom(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0]?.trim() ?? "";
  return value?.trim() ?? "";
}

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const dict = await getDictionary(locale);
  const query = queryFrom((await searchParams).q);
  const title = query
    ? t(dict.search.pageHeading, { query })
    : dict.search.pageTitle;
  const description = dict.search.noQueryBody;
  const alternates = localeAlternates(locale, "/search");

  return {
    title,
    description,
    robots: { index: false, follow: true },
    alternates,
    ...socialMetadata({
      title: `${title} · ${shopifyConfig.storeName}`,
      description,
      url: alternates.canonical,
      locale: ogLocaleFor(locale),
    }),
  };
}

export default async function SearchPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale);
  const query = queryFrom((await searchParams).q);
  const products = query ? await searchProducts(query, 48, locale) : [];

  const countLabel =
    products.length === 1
      ? dict.search.countOne
      : t(dict.search.countMany, { count: products.length });

  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-14 pt-12 sm:px-8 sm:pb-20 sm:pt-16">
      <div className="mb-10 max-w-xl">
        <p className="text-[0.68rem] font-medium tracking-[0.2em] uppercase text-glow">
          {dict.search.pageTitle}
        </p>
        {query ? (
          <>
            <h1 className="mt-3 font-display text-5xl font-medium tracking-tight sm:text-6xl">
              {t(dict.search.pageHeading, { query })}
            </h1>
            {products.length > 0 ? (
              <p className="mt-4 text-base font-light text-muted">{countLabel}</p>
            ) : null}
          </>
        ) : (
          <>
            <h1 className="mt-3 font-display text-5xl font-medium tracking-tight sm:text-6xl">
              {dict.search.noQueryTitle}
            </h1>
            <p className="mt-4 text-base font-light leading-relaxed text-muted">
              {dict.search.noQueryBody}
            </p>
          </>
        )}
      </div>

      {query && products.length === 0 ? (
        <div className="max-w-md">
          <p className="font-display text-3xl font-medium tracking-tight">
            {dict.search.pageEmptyTitle}
          </p>
          <p className="mt-3 text-base font-light leading-relaxed text-muted">
            {t(dict.search.pageEmptyBody, { query })}
          </p>
          <LocaleLink href="/products" className="btn-primary mt-8">
            {dict.search.pageEmptyCta}
          </LocaleLink>
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-7">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
