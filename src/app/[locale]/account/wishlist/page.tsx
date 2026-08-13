import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AccountNav } from "@/components/account-nav";
import { LocaleLink } from "@/components/locale-link";
import { ProductCard } from "@/components/product-card";
import { requireCustomer } from "@/lib/customer-account/require";
import { getDictionary, t } from "@/lib/i18n/get-dictionary";
import { isLocale } from "@/lib/i18n/locales";
import { getProductsByIds } from "@/lib/shopify";
import { shopifyConfig } from "@/lib/shopify/config";
import { localeAlternates, ogLocaleFor, socialMetadata } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  const title = dict.account.wishlistTitle;
  const description = t(dict.account.metaDescription, {
    brand: shopifyConfig.storeName,
  });
  const alternates = localeAlternates(locale, "/account/wishlist");
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

export default async function WishlistPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const auth = await requireCustomer(locale);
  const dict = await getDictionary(locale);

  if (!auth.configured || !auth.customer) {
    return (
      <div className="mx-auto w-full max-w-3xl px-5 py-16 sm:px-8">
        <p className="text-muted">{dict.account.notConfigured}</p>
      </div>
    );
  }

  const products = await getProductsByIds(
    auth.customer.wishlistProductIds,
    locale,
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-20 pt-12 sm:px-8 sm:pb-28 sm:pt-16">
      <h1 className="font-display text-5xl font-medium tracking-tight sm:text-6xl">
        {dict.account.wishlistTitle}
      </h1>

      <div className="mt-10 max-w-3xl">
        <AccountNav
          locale={locale}
          active="wishlist"
          labels={{
            account: dict.account.navAccount,
            orders: dict.account.navOrders,
            wishlist: dict.account.navWishlist,
            logout: dict.account.logout,
          }}
        />
      </div>

      {products.length === 0 ? (
        <div className="mt-10 space-y-4">
          <p className="text-base font-light text-muted">
            {dict.account.wishlistEmpty}
          </p>
          <LocaleLink href="/products" className="btn-primary inline-flex">
            {dict.account.wishlistCta}
          </LocaleLink>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              wishlistSaved
            />
          ))}
        </div>
      )}
    </div>
  );
}
