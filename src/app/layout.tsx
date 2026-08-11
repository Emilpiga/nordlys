import type { Metadata } from "next";
import { Cormorant_Garamond, Outfit } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { getCartAction } from "@/app/actions/cart";
import { AdPixels } from "@/components/ad-pixels";
import { AuroraBackdrop } from "@/components/aurora-backdrop";
import { ConsentModeBootstrap } from "@/components/consent-mode-bootstrap";
import { JsonLd } from "@/components/json-ld";
import { SetupBanner } from "@/components/setup-banner";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import {
  buildOrganizationJsonLd,
  buildWebSiteJsonLd,
} from "@/lib/json-ld";
import { getProductCategories } from "@/lib/shopify";
import { shopifyConfig } from "@/lib/shopify/config";
import { getMarketingPixelConfig } from "@/lib/consent";
import { siteDescription, siteTitle, socialMetadata } from "@/lib/seo";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

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

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: siteTitle,
    template: `%s · ${shopifyConfig.storeName}`,
  },
  description: siteDescription,
  applicationName: shopifyConfig.storeName,
  alternates: {
    canonical: getSiteUrl(),
  },
  icons: {
    icon: [{ url: "/logo-ikon.png", type: "image/png" }],
    apple: [{ url: "/logo-ikon.png", type: "image/png" }],
  },
  // AdSense site verification (always in HTML). Runtime ads use Consent Mode + Google CMP.
  ...(adsenseClientId
    ? { other: { "google-adsense-account": adsenseClientId } }
    : {}),
  ...socialMetadata({
    title: siteTitle,
    description: siteDescription,
    url: getSiteUrl(),
  }),
};

export default async function RootLayout({
  children,
}: LayoutProps<"/">) {
  const [cart, categories] = await Promise.all([
    getCartAction(),
    getProductCategories(),
  ]);

  return (
    <html
      lang="sv"
      className={`${cormorant.variable} ${outfit.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ConsentModeBootstrap />
        <JsonLd data={[buildOrganizationJsonLd(), buildWebSiteJsonLd()]} />
        <AuroraBackdrop />
        <SetupBanner />
        <Analytics />
        <AdPixels />
        <SiteHeader
          cartCount={cart?.totalQuantity ?? 0}
          categories={categories}
        />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
