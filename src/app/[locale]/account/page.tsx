import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  AccountLinkRow,
  AccountShell,
} from "@/components/account-shell";
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

  if (!configured) {
    return (
      <AccountShell
        locale={locale}
        eyebrow={dict.account.eyebrow}
        title={dict.account.welcomeGuest}
      >
        <p className="text-base font-light leading-relaxed text-muted">
          {dict.account.notConfigured}
        </p>
      </AccountShell>
    );
  }

  if (!customer) {
    return (
      <AccountShell
        locale={locale}
        eyebrow={dict.account.eyebrow}
        title={dict.account.welcomeGuest}
        description={dict.account.loginBody}
      >
        <div className="space-y-5">
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
      </AccountShell>
    );
  }

  return (
    <AccountShell
      locale={locale}
      eyebrow={dict.account.eyebrow}
      title={
        displayName
          ? t(dict.account.welcome, { name: displayName })
          : dict.account.welcomeGuest
      }
      description={
        customer.email
          ? `${dict.account.overviewEmail} ${customer.email}`
          : null
      }
      active="account"
      labels={navLabels(dict)}
    >
      <ul>
        <li>
          <AccountLinkRow
            href="/account/orders"
            label={dict.account.shortcutOrders}
          />
        </li>
        <li>
          <AccountLinkRow
            href="/account/wishlist"
            label={dict.account.shortcutWishlist}
          />
        </li>
        <li>
          <AccountLinkRow
            href="/products"
            label={dict.account.shortcutShop}
          />
        </li>
      </ul>
    </AccountShell>
  );
}
