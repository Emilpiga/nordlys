import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AccountNav } from "@/components/account-nav";
import { LocaleLink } from "@/components/locale-link";
import {
  getCustomerProfile,
  isCustomerAccountConfigured,
  isCustomerLoggedIn,
} from "@/lib/customer-account";
import { getDictionary, t } from "@/lib/i18n/get-dictionary";
import { isLocale, localePath } from "@/lib/i18n/locales";
import { shopifyConfig } from "@/lib/shopify/config";
import { localeAlternates, ogLocaleFor, socialMetadata } from "@/lib/seo";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  const title = dict.account.metaTitle;
  const description = t(dict.account.metaDescription, {
    brand: shopifyConfig.storeName,
  });
  const alternates = localeAlternates(locale, "/account");
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

export default async function AccountPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale);
  const query = await searchParams;
  const loginError = query.error === "login";
  const configured = isCustomerAccountConfigured();
  const loggedIn = configured ? await isCustomerLoggedIn() : false;
  const customer = loggedIn ? await getCustomerProfile() : null;

  const displayName =
    [customer?.firstName, customer?.lastName].filter(Boolean).join(" ") ||
    customer?.email ||
    null;

  return (
    <div className="mx-auto w-full max-w-3xl px-5 pb-20 pt-12 sm:px-8 sm:pb-28 sm:pt-16">
      <h1 className="font-display text-5xl font-medium tracking-tight sm:text-6xl">
        {displayName
          ? t(dict.account.welcome, { name: displayName })
          : dict.account.welcomeGuest}
      </h1>

      {!configured ? (
        <p className="mt-6 text-base font-light leading-relaxed text-muted">
          {dict.account.notConfigured}
        </p>
      ) : !customer ? (
        <div className="mt-8 max-w-lg space-y-5">
          <p className="text-base font-light leading-relaxed text-muted">
            {dict.account.loginBody}
          </p>
          {loginError ? (
            <p className="text-sm text-accent">{dict.account.loginError}</p>
          ) : null}
          <a
            href={`/api/auth/login?locale=${encodeURIComponent(locale)}&return_to=${encodeURIComponent(localePath(locale, "/account"))}`}
            className="btn-primary inline-flex"
          >
            {dict.account.loginCta}
          </a>
        </div>
      ) : (
        <div className="mt-10 space-y-10">
          <AccountNav
            locale={locale}
            active="account"
            labels={{
              account: dict.account.navAccount,
              orders: dict.account.navOrders,
              wishlist: dict.account.navWishlist,
              logout: dict.account.logout,
            }}
          />

          {customer.email ? (
            <p className="text-base font-light text-muted">{customer.email}</p>
          ) : null}

          <ul className="space-y-3">
            <li>
              <LocaleLink
                href="/account/orders"
                className="flex items-center justify-between border-b border-border/60 py-4 text-base transition hover:text-accent"
              >
                <span>{dict.account.shortcutOrders}</span>
                <span aria-hidden>→</span>
              </LocaleLink>
            </li>
            <li>
              <LocaleLink
                href="/account/wishlist"
                className="flex items-center justify-between border-b border-border/60 py-4 text-base transition hover:text-accent"
              >
                <span>{dict.account.shortcutWishlist}</span>
                <span aria-hidden>→</span>
              </LocaleLink>
            </li>
            <li>
              <LocaleLink
                href="/products"
                className="flex items-center justify-between border-b border-border/60 py-4 text-base transition hover:text-accent"
              >
                <span>{dict.account.shortcutShop}</span>
                <span aria-hidden>→</span>
              </LocaleLink>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
