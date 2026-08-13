import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { notFound } from "next/navigation";
import { getCartAction } from "@/app/actions/cart";
import { AdPixels } from "@/components/ad-pixels";
import { AuroraBackdrop } from "@/components/aurora-backdrop";
import { CartDrawer } from "@/components/cart-drawer";
import { CartProvider } from "@/components/cart-provider";
import { ConsentModeBootstrap } from "@/components/consent-mode-bootstrap";
import { DictionaryProvider } from "@/components/dictionary-provider";
import { JsonLd } from "@/components/json-ld";
import { AnnouncementBanner } from "@/components/announcement-banner";
import { SetupBanner } from "@/components/setup-banner";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { WishlistProvider } from "@/components/wishlist-provider";
import { getCustomerProfile } from "@/lib/customer-account";
import { getDictionary, t } from "@/lib/i18n/get-dictionary";
import {
  getLocaleConfig,
  isLocale,
  localePath,
  locales,
  type Locale,
} from "@/lib/i18n/locales";
import {
  buildOrganizationJsonLd,
  buildWebSiteJsonLd,
} from "@/lib/json-ld";
import { getCollections } from "@/lib/shopify";
import { shopifyConfig } from "@/lib/shopify/config";
import { getMarketingPixelConfig } from "@/lib/consent";
import { socialMetadata, brandIcons } from "@/lib/seo";
import { getSiteUrl } from "@/lib/site-url";

const { adsenseClientId } = getMarketingPixelConfig();

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) return {};
  const locale = localeParam;
  const dict = await getDictionary(locale);
  const config = getLocaleConfig(locale);
  const title = t(dict.meta.siteTitle, { brand: shopifyConfig.storeName });
  const description = t(dict.meta.siteDescription, {
    brand: shopifyConfig.storeName,
  });
  const url = `${getSiteUrl()}${localePath(locale)}`;

  const languages = Object.fromEntries(
    locales.map((code) => [code, `${getSiteUrl()}${localePath(code)}`]),
  );

  return {
    metadataBase: new URL(getSiteUrl()),
    title: {
      default: title,
      template: `%s · ${shopifyConfig.storeName}`,
    },
    description,
    applicationName: shopifyConfig.storeName,
    icons: brandIcons(),
    alternates: {
      canonical: url,
      languages: {
        ...languages,
        "x-default": `${getSiteUrl()}${localePath("sv")}`,
      },
    },
    ...(adsenseClientId
      ? { other: { "google-adsense-account": adsenseClientId } }
      : {}),
    ...socialMetadata({
      title,
      description,
      url,
      locale: config.ogLocale,
    }),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale: Locale = localeParam;
  const config = getLocaleConfig(locale);

  const [cart, collections, dict, customer] = await Promise.all([
    getCartAction(),
    getCollections(24, locale),
    getDictionary(locale),
    getCustomerProfile(),
  ]);

  const siteDescription = t(dict.meta.siteDescription, {
    brand: shopifyConfig.storeName,
  });

  return (
    <html
      lang={config.htmlLang}
      className={`${jakarta.variable} ${jakarta.className} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ConsentModeBootstrap />
        <JsonLd
          data={[
            buildOrganizationJsonLd(siteDescription),
            buildWebSiteJsonLd(siteDescription, config.htmlLang, locale),
          ]}
        />
        <AuroraBackdrop />
        <AnnouncementBanner locale={locale} dict={dict} />
        <SetupBanner />
        <Analytics />
        <AdPixels />
        <DictionaryProvider locale={locale} dict={dict}>
          <CartProvider cart={cart}>
            <WishlistProvider
              customerId={customer?.id ?? null}
              productIds={customer?.wishlistProductIds ?? []}
            >
              <SiteHeader collections={collections} />
              <main className="flex-1">{children}</main>
              <SiteFooter />
              <CartDrawer />
            </WishlistProvider>
          </CartProvider>
        </DictionaryProvider>
      </body>
    </html>
  );
}
