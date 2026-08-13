import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { AccountNav } from "@/components/account-nav";
import { LocaleLink } from "@/components/locale-link";
import {
  decodeOrderParam,
  getCustomerOrder,
} from "@/lib/customer-account";
import { requireCustomer } from "@/lib/customer-account/require";
import { formatMoney } from "@/lib/format";
import { getDictionary, t } from "@/lib/i18n/get-dictionary";
import { getLocaleConfig, isLocale } from "@/lib/i18n/locales";
import { shopifyConfig } from "@/lib/shopify/config";
import { localeAlternates, ogLocaleFor, socialMetadata } from "@/lib/seo";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  const orderId = decodeOrderParam(id);
  const title = orderId
    ? t(dict.account.orderTitle, { name: "#" })
    : dict.account.ordersTitle;
  const description = t(dict.account.metaDescription, {
    brand: shopifyConfig.storeName,
  });
  const alternates = localeAlternates(locale, `/account/orders/${id}`);
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

export default async function AccountOrderDetailPage({ params }: Props) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();

  const auth = await requireCustomer(locale);
  const dict = await getDictionary(locale);
  const moneyLocale = getLocaleConfig(locale).moneyLocale;

  if (!auth.configured || !auth.customer) {
    return (
      <div className="mx-auto w-full max-w-3xl px-5 py-16 sm:px-8">
        <p className="text-muted">{dict.account.notConfigured}</p>
      </div>
    );
  }

  const orderId = decodeOrderParam(id);
  if (!orderId) notFound();

  const order = await getCustomerOrder(orderId);
  if (!order) {
    return (
      <div className="mx-auto w-full max-w-3xl px-5 pb-20 pt-12 sm:px-8">
        <p className="text-muted">{dict.account.orderNotFound}</p>
        <LocaleLink
          href="/account/orders"
          className="mt-6 inline-flex text-accent underline-offset-4 hover:underline"
        >
          {dict.account.orderBack}
        </LocaleLink>
      </div>
    );
  }

  const date = new Intl.DateTimeFormat(moneyLocale, {
    dateStyle: "long",
  }).format(new Date(order.processedAt));

  return (
    <div className="mx-auto w-full max-w-3xl px-5 pb-20 pt-12 sm:px-8 sm:pb-28 sm:pt-16">
      <LocaleLink
        href="/account/orders"
        className="text-[0.72rem] font-medium tracking-[0.12em] uppercase text-muted transition hover:text-foreground"
      >
        {dict.account.orderBack}
      </LocaleLink>

      <h1 className="mt-4 font-display text-5xl font-medium tracking-tight sm:text-6xl">
        {t(dict.account.orderTitle, { name: order.name })}
      </h1>
      <p className="mt-3 text-base font-light text-muted">
        {t(dict.account.orderPlaced, { date })}
      </p>

      <div className="mt-10 space-y-10">
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

        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <p>
            <span className="text-muted">{dict.account.orderFinancial}: </span>
            {order.financialStatus || "—"}
          </p>
          <p>
            <span className="text-muted">{dict.account.orderFulfillment}: </span>
            {order.fulfillmentStatus || "—"}
          </p>
        </div>

        <section>
          <h2 className="font-display text-2xl font-medium tracking-tight">
            {dict.account.orderTracking}
          </h2>
          {order.fulfillments.length === 0 ||
          order.fulfillments.every((f) => f.tracking.length === 0) ? (
            <p className="mt-3 text-base font-light text-muted">
              {dict.account.orderTrackingEmpty}
            </p>
          ) : (
            <ul className="mt-4 space-y-4">
              {order.fulfillments.map((fulfillment) =>
                fulfillment.tracking.map((track, index) => (
                  <li
                    key={`${fulfillment.id}-${track.number || index}`}
                    className="border-b border-border/60 pb-4"
                  >
                    {track.company ? (
                      <p className="font-medium">{track.company}</p>
                    ) : null}
                    {track.number ? (
                      <p className="mt-1 text-sm text-muted">
                        {t(dict.account.orderTrackingNumber, {
                          number: track.number,
                        })}
                      </p>
                    ) : null}
                    {track.url ? (
                      <a
                        href={track.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex text-[0.72rem] font-medium tracking-[0.12em] uppercase text-accent hover:underline"
                      >
                        {dict.account.orderTrackingLink}
                      </a>
                    ) : null}
                  </li>
                )),
              )}
            </ul>
          )}
          {order.statusPageUrl ? (
            <a
              href={order.statusPageUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex text-[0.72rem] font-medium tracking-[0.12em] uppercase text-muted hover:text-foreground"
            >
              {dict.account.orderStatusPage}
            </a>
          ) : null}
        </section>

        <section>
          <h2 className="font-display text-2xl font-medium tracking-tight">
            {dict.account.orderItems}
          </h2>
          <ul className="mt-4 space-y-4">
            {order.lineItems.map((item, index) => (
              <li
                key={`${item.name}-${index}`}
                className="flex gap-4 border-b border-border/60 pb-4"
              >
                {item.imageUrl ? (
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden bg-mist">
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                ) : null}
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{item.title}</p>
                  {item.variantTitle ? (
                    <p className="mt-0.5 text-sm text-muted">
                      {item.variantTitle}
                    </p>
                  ) : null}
                  <p className="mt-1 text-sm text-muted">×{item.quantity}</p>
                </div>
                {item.price ? (
                  <p className="shrink-0 tabular-nums text-sm">
                    {formatMoney(item.price, moneyLocale)}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>

        {order.shippingAddress?.length ? (
          <section>
            <h2 className="font-display text-2xl font-medium tracking-tight">
              {dict.account.orderShipping}
            </h2>
            <div className="mt-3 space-y-1 text-base font-light text-muted">
              {order.shippingAddress.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </section>
        ) : null}

        <section>
          <h2 className="font-display text-2xl font-medium tracking-tight">
            {dict.account.orderTotals}
          </h2>
          <dl className="mt-3 space-y-2 text-sm">
            {order.subtotal ? (
              <div className="flex justify-between gap-4">
                <dt className="text-muted">{dict.account.orderSubtotal}</dt>
                <dd className="tabular-nums">
                  {formatMoney(order.subtotal, moneyLocale)}
                </dd>
              </div>
            ) : null}
            {order.totalShipping ? (
              <div className="flex justify-between gap-4">
                <dt className="text-muted">{dict.account.orderShippingCost}</dt>
                <dd className="tabular-nums">
                  {formatMoney(order.totalShipping, moneyLocale)}
                </dd>
              </div>
            ) : null}
            {order.totalTax ? (
              <div className="flex justify-between gap-4">
                <dt className="text-muted">{dict.account.orderTax}</dt>
                <dd className="tabular-nums">
                  {formatMoney(order.totalTax, moneyLocale)}
                </dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-4 border-t border-border/60 pt-2 font-medium">
              <dt>{dict.account.orderTotal}</dt>
              <dd className="tabular-nums">
                {formatMoney(order.totalPrice, moneyLocale)}
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}
