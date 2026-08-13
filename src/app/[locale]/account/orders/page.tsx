import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AccountNav } from "@/components/account-nav";
import { LocaleLink } from "@/components/locale-link";
import {
  encodeOrderParam,
  getCustomerOrders,
} from "@/lib/customer-account";
import { requireCustomer } from "@/lib/customer-account/require";
import { formatMoney } from "@/lib/format";
import { getDictionary, t } from "@/lib/i18n/get-dictionary";
import { getLocaleConfig, isLocale } from "@/lib/i18n/locales";
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
  const title = dict.account.ordersTitle;
  const description = t(dict.account.metaDescription, {
    brand: shopifyConfig.storeName,
  });
  const alternates = localeAlternates(locale, "/account/orders");
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

export default async function AccountOrdersPage({
  params,
  searchParams,
}: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const auth = await requireCustomer(locale);
  const dict = await getDictionary(locale);
  const moneyLocale = getLocaleConfig(locale).moneyLocale;
  const query = await searchParams;
  const after = typeof query.after === "string" ? query.after : null;

  if (!auth.configured || !auth.customer) {
    return (
      <div className="mx-auto w-full max-w-3xl px-5 py-16 sm:px-8">
        <p className="text-muted">{dict.account.notConfigured}</p>
      </div>
    );
  }

  const { orders, pageInfo } = await getCustomerOrders(10, after);

  return (
    <div className="mx-auto w-full max-w-3xl px-5 pb-20 pt-12 sm:px-8 sm:pb-28 sm:pt-16">
      <h1 className="font-display text-5xl font-medium tracking-tight sm:text-6xl">
        {dict.account.ordersTitle}
      </h1>

      <div className="mt-10 space-y-8">
        <AccountNav
          locale={locale}
          active="orders"
          labels={{
            account: dict.account.navAccount,
            orders: dict.account.navOrders,
            wishlist: dict.account.navWishlist,
            logout: dict.account.logout,
          }}
        />

        {orders.length === 0 ? (
          <div className="space-y-4">
            <p className="text-base font-light text-muted">
              {dict.account.ordersEmpty}
            </p>
            <LocaleLink href="/products" className="btn-primary inline-flex">
              {dict.account.ordersCta}
            </LocaleLink>
          </div>
        ) : (
          <ul className="space-y-4">
            {orders.map((order) => {
              const date = new Intl.DateTimeFormat(moneyLocale, {
                dateStyle: "medium",
              }).format(new Date(order.processedAt));
              return (
                <li
                  key={order.id}
                  className="border-b border-border/60 pb-4"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{order.name}</p>
                      <p className="mt-1 text-sm text-muted">
                        {t(dict.account.orderPlaced, { date })}
                        {order.fulfillmentStatus
                          ? ` · ${order.fulfillmentStatus}`
                          : ""}
                      </p>
                    </div>
                    <p className="tabular-nums text-sm">
                      {formatMoney(order.totalPrice, moneyLocale)}
                    </p>
                  </div>
                  <LocaleLink
                    href={`/account/orders/${encodeOrderParam(order.id)}`}
                    className="mt-3 inline-flex text-[0.72rem] font-medium tracking-[0.12em] uppercase text-accent transition hover:underline"
                  >
                    {dict.account.ordersView}
                  </LocaleLink>
                </li>
              );
            })}
          </ul>
        )}

        {pageInfo.hasNextPage && pageInfo.endCursor ? (
          <LocaleLink
            href={`/account/orders?after=${encodeURIComponent(pageInfo.endCursor)}`}
            className="inline-flex text-[0.72rem] font-medium tracking-[0.12em] uppercase text-muted transition hover:text-foreground"
          >
            {dict.account.ordersLoadMore}
          </LocaleLink>
        ) : null}
      </div>
    </div>
  );
}
