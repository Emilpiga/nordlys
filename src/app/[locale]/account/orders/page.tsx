import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AccountEmptyState, AccountShell } from "@/components/account-shell";
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
      <AccountShell
        locale={locale}
        eyebrow={dict.account.eyebrow}
        title={dict.account.ordersTitle}
      >
        <p className="text-base font-light leading-relaxed text-muted">
          {dict.account.notConfigured}
        </p>
      </AccountShell>
    );
  }

  const { orders, pageInfo } = await getCustomerOrders(10, after);

  return (
    <AccountShell
      locale={locale}
      eyebrow={dict.account.eyebrow}
      title={dict.account.ordersTitle}
      description={dict.account.ordersIntro}
      active="orders"
      labels={navLabels(dict)}
    >
      {orders.length === 0 ? (
        <AccountEmptyState
          body={dict.account.ordersEmpty}
          cta={dict.account.ordersCta}
          href="/products"
        />
      ) : (
        <div className="space-y-8">
          <ul>
            {orders.map((order) => {
              const date = new Intl.DateTimeFormat(moneyLocale, {
                dateStyle: "medium",
              }).format(new Date(order.processedAt));
              return (
                <li
                  key={order.id}
                  className="border-b border-border/60 py-5 first:pt-0"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{order.name}</p>
                      <p className="mt-1 text-sm font-light text-muted">
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

          {pageInfo.hasNextPage && pageInfo.endCursor ? (
            <LocaleLink
              href={`/account/orders?after=${encodeURIComponent(pageInfo.endCursor)}`}
              className="inline-flex text-[0.72rem] font-medium tracking-[0.12em] uppercase text-muted transition hover:text-foreground"
            >
              {dict.account.ordersLoadMore}
            </LocaleLink>
          ) : null}
        </div>
      )}
    </AccountShell>
  );
}
