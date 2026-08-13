import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AccountEmptyState, AccountShell } from "@/components/account-shell";
import { ProductCard } from "@/components/product-card";
import { requireCustomer } from "@/lib/customer-account/require";
import { getDictionary, t } from "@/lib/i18n/get-dictionary";
import { isLocale } from "@/lib/i18n/locales";
import { getProductsByIds } from "@/lib/shopify";
import { shopifyConfig } from "@/lib/shopify/config";
import { localeAlternates, ogLocaleFor, socialMetadata } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

function navLabels(dict: Awaited<ReturnType<typeof getDictionary>>) {
  return {
    account: dict.account.navAccount,
    orders: dict.account.navOrders,
    wishlist: dict.account.navWishlist,
    logout: dict.account.logout,
  };
}

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
      <AccountShell
        locale={locale}
        eyebrow={dict.account.eyebrow}
        title={dict.account.wishlistTitle}
      >
        <p className="text-base font-light leading-relaxed text-muted">
          {dict.account.notConfigured}
        </p>
      </AccountShell>
    );
  }

  const products = await getProductsByIds(
    auth.customer.wishlistProductIds,
    locale,
  );

  return (
    <AccountShell
      locale={locale}
      eyebrow={dict.account.eyebrow}
      title={dict.account.wishlistTitle}
      description={dict.account.wishlistIntro}
      active="wishlist"
      labels={navLabels(dict)}
      wide
    >
      {products.length === 0 ? (
        <div className="max-w-3xl">
          <AccountEmptyState
            body={dict.account.wishlistEmpty}
            cta={dict.account.wishlistCta}
            href="/products"
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-4 lg:gap-x-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              wishlistSaved
            />
          ))}
        </div>
      )}
    </AccountShell>
  );
}
