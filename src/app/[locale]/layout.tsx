import type { Metadata } from "next";
import { Cormorant_Garamond, Outfit } from "next/font/google";
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
import { SetupBanner } from "@/components/setup-banner";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
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
import { getProductCategories } from "@/lib/shopify";
import { shopifyConfig } from "@/lib/shopify/config";
import { getMarketingPixelConfig } from "@/lib/consent";
import { socialMetadata } from "@/lib/seo";
import { getSiteUrl } from "@/lib/site-url";

const { adsenseClientId } = getMarketingPixelConfig();

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
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
    alternates: {
      canonical: url,
      languages: {
        ...languages,
        "x-default": `${getSiteUrl()}${localePath("sv")}`,
      },
    },
    icons: {
      icon: [{ url: "/logo-ikon.png", type: "image/png" }],
      apple: [{ url: "/logo-ikon.png", type: "image/png" }],
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

  const [cart, categories, dict] = await Promise.all([
    getCartAction(),
    getProductCategories(100, locale),
    getDictionary(locale),
  ]);

  const siteDescription = t(dict.meta.siteDescription, {
    brand: shopifyConfig.storeName,
  });

  return (
    <html
      lang={config.htmlLang}
      className={`${cormorant.variable} ${outfit.variable} h-full antialiased`}
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
        <SetupBanner />
        <Analytics />
        <AdPixels />
        <DictionaryProvider locale={locale} dict={dict}>
          <CartProvider cart={cart}>
            <SiteHeader categories={categories} />
            <main className="flex-1">{children}</main>
            <SiteFooter />
            <CartDrawer />
          </CartProvider>
        </DictionaryProvider>
      </body>
    </html>
  );
}
