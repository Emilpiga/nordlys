import type { Metadata } from "next";
import { Cormorant_Garamond, Outfit } from "next/font/google";
import { getCartAction } from "@/app/actions/cart";
import { AuroraBackdrop } from "@/components/aurora-backdrop";
import { SetupBanner } from "@/components/setup-banner";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { shopifyConfig } from "@/lib/shopify/config";
import "./globals.css";

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
  title: {
    default: shopifyConfig.storeName,
    template: `%s · ${shopifyConfig.storeName}`,
  },
  description: `${shopifyConfig.storeName} — Nordic skincare for clear, calm skin.`,
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default async function RootLayout({
  children,
}: LayoutProps<"/">) {
  const cart = await getCartAction();

  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${outfit.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <AuroraBackdrop />
        <SetupBanner />
        <SiteHeader cartCount={cart?.totalQuantity ?? 0} />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
