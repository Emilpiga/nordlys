import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LocaleLink } from "@/components/locale-link";
import { OrderConfirmedEffects } from "@/components/order-confirmed-effects";
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

function first(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0]?.trim() ?? "";
  return value?.trim() ?? "";
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  const title = dict.orderConfirmed.metaTitle;
  const description = dict.orderConfirmed.body;
  const alternates = localeAlternates(locale, "/order/confirmed");
  return {
    title,
    description,
    robots: { index: false, follow: false },
    alternates,
    ...socialMetadata({
      title: `${title} · ${shopifyConfig.storeName}`,
      description,
      url: alternates.canonical,
      locale: ogLocaleFor(locale),
    }),
  };
}

export default async function OrderConfirmedPage({
  params,
  searchParams,
}: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale);
  const query = await searchParams;
  const order = first(query.order) || first(query.confirmation);
  const loggedIn =
    isCustomerAccountConfigured() && (await isCustomerLoggedIn());
  const customer = loggedIn ? await getCustomerProfile() : null;

  return (
    <div className="mx-auto w-full max-w-3xl px-5 pb-20 pt-12 sm:px-8 sm:pb-28 sm:pt-16">
      <OrderConfirmedEffects />

      <p className="text-[0.68rem] font-medium tracking-[0.2em] uppercase text-glow">
        {shopifyConfig.storeName}
      </p>
      <h1 className="mt-4 font-display text-5xl font-medium tracking-tight sm:text-6xl">
        {dict.orderConfirmed.title}
      </h1>
      <p className="mt-5 max-w-xl text-base font-light leading-relaxed text-muted">
        {dict.orderConfirmed.body}
      </p>

      {order ? (
        <p className="mt-6 text-sm font-medium tracking-[0.08em] uppercase text-foreground">
          {t(dict.orderConfirmed.orderLabel, { order })}
        </p>
      ) : null}

      <div className="mt-10 flex flex-wrap gap-3">
        {customer ? (
          <LocaleLink href="/account/orders" className="btn-primary">
            {dict.orderConfirmed.viewOrders}
          </LocaleLink>
        ) : isCustomerAccountConfigured() ? (
          <a
            href={`/api/auth/login?locale=${encodeURIComponent(locale)}&return_to=${encodeURIComponent(localePath(locale, "/account/orders"))}`}
            className="btn-primary"
          >
            {dict.orderConfirmed.viewOrders}
          </a>
        ) : null}
        <LocaleLink href="/products" className="btn-secondary">
          {dict.orderConfirmed.continueShopping}
        </LocaleLink>
      </div>

      {!customer && isCustomerAccountConfigured() ? (
        <p className="mt-6 text-sm font-light text-muted">
          {dict.orderConfirmed.loginHint}
        </p>
      ) : null}
    </div>
  );
}
