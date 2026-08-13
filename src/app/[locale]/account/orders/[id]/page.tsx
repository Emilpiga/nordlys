import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { AccountSection, AccountShell } from "@/components/account-shell";
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

function navLabels(dict: Awaited<ReturnType<typeof getDictionary>>) {
  return {
    account: dict.account.navAccount,
    orders: dict.account.navOrders,
    wishlist: dict.account.navWishlist,
    logout: dict.account.logout,
  };
}

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

  const orderId = decodeOrderParam(id);
  if (!orderId) notFound();

  const order = await getCustomerOrder(orderId);
  if (!order) {
    return (
      <AccountShell
        locale={locale}
        eyebrow={dict.account.eyebrow}
        title={dict.account.ordersTitle}
        active="orders"
        labels={navLabels(dict)}
      >
        <div className="space-y-5">
          <p className="text-base font-light leading-relaxed text-muted">
            {dict.account.orderNotFound}
          </p>
          <LocaleLink
            href="/account/orders"
            className="inline-flex text-[0.72rem] font-medium tracking-[0.12em] uppercase text-accent transition hover:underline"
          >
            {dict.account.orderBack}
          </LocaleLink>
        </div>
      </AccountShell>
    );
  }

  const date = new Intl.DateTimeFormat(moneyLocale, {
    dateStyle: "long",
  }).format(new Date(order.processedAt));

  return (
    <AccountShell
      locale={locale}
      eyebrow={dict.account.eyebrow}
      title={t(dict.account.orderTitle, { name: order.name })}
      description={t(dict.account.orderPlaced, { date })}
      active="orders"
      labels={navLabels(dict)}
    >
      <div className="space-y-10">
        <LocaleLink
          href="/account/orders"
          className="inline-flex text-[0.72rem] font-medium tracking-[0.12em] uppercase text-muted transition hover:text-foreground"
        >
          ← {dict.account.orderBack}
        </LocaleLink>

        <div className="grid gap-3 border-b border-border/60 pb-8 text-sm sm:grid-cols-2">
          <p>
            <span className="text-muted">{dict.account.orderFinancial}: </span>
            {order.financialStatus || "—"}
          </p>
          <p>
            <span className="text-muted">{dict.account.orderFulfillment}: </span>
            {order.fulfillmentStatus || "—"}
          </p>
        </div>

        <AccountSection title={dict.account.orderTracking}>
          {order.fulfillments.length === 0 ||
          order.fulfillments.every((f) => f.tracking.length === 0) ? (
            <p className="text-base font-light leading-relaxed text-muted">
              {dict.account.orderTrackingEmpty}
            </p>
          ) : (
            <ul>
              {order.fulfillments.map((fulfillment) =>
                fulfillment.tracking.map((track, index) => (
                  <li
                    key={`${fulfillment.id}-${track.number || index}`}
                    className="border-b border-border/60 py-4 first:pt-0"
                  >
                    {track.company ? (
                      <p className="font-medium">{track.company}</p>
                    ) : null}
                    {track.number ? (
                      <p className="mt-1 text-sm font-light text-muted">
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
              className="inline-flex text-[0.72rem] font-medium tracking-[0.12em] uppercase text-muted transition hover:text-foreground"
            >
              {dict.account.orderStatusPage}
            </a>
          ) : null}
        </AccountSection>

        <AccountSection title={dict.account.orderItems}>
          <ul>
            {order.lineItems.map((item, index) => (
              <li
                key={`${item.name}-${index}`}
                className="flex gap-4 border-b border-border/60 py-4 first:pt-0"
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
                    <p className="mt-0.5 text-sm font-light text-muted">
                      {item.variantTitle}
                    </p>
                  ) : null}
                  <p className="mt-1 text-sm font-light text-muted">
                    ×{item.quantity}
                  </p>
                </div>
                {item.price ? (
                  <p className="shrink-0 tabular-nums text-sm">
                    {formatMoney(item.price, moneyLocale)}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </AccountSection>

        {order.shippingAddress?.length ? (
          <AccountSection title={dict.account.orderShipping}>
            <div className="space-y-1 text-base font-light leading-relaxed text-muted">
              {order.shippingAddress.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </AccountSection>
        ) : null}

        <AccountSection title={dict.account.orderTotals}>
          <dl className="space-y-2 text-sm">
            {order.subtotal ? (
              <div className="flex justify-between gap-4">
                <dt className="font-light text-muted">
                  {dict.account.orderSubtotal}
                </dt>
                <dd className="tabular-nums">
                  {formatMoney(order.subtotal, moneyLocale)}
                </dd>
              </div>
            ) : null}
            {order.totalShipping ? (
              <div className="flex justify-between gap-4">
                <dt className="font-light text-muted">
                  {dict.account.orderShippingCost}
                </dt>
                <dd className="tabular-nums">
                  {formatMoney(order.totalShipping, moneyLocale)}
                </dd>
              </div>
            ) : null}
            {order.totalTax ? (
              <div className="flex justify-between gap-4">
                <dt className="font-light text-muted">{dict.account.orderTax}</dt>
                <dd className="tabular-nums">
                  {formatMoney(order.totalTax, moneyLocale)}
                </dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-4 border-t border-border/60 pt-3 font-medium">
              <dt>{dict.account.orderTotal}</dt>
              <dd className="tabular-nums">
                {formatMoney(order.totalPrice, moneyLocale)}
              </dd>
            </div>
          </dl>
        </AccountSection>
      </div>
    </AccountShell>
  );
}
