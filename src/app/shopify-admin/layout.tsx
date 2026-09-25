import type { Metadata } from "next";
import type { ReactNode } from "react";
import { appClientId } from "@/lib/look-planner/auth";

export const metadata: Metadata = {
  title: "Veckans look",
  robots: { index: false, follow: false },
};

/**
 * Root layout for the embedded planner inside Shopify admin. App Bridge must
 * be the first script and load synchronously; Polaris renders the UI.
 */
export default function ShopifyAdminLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="sv">
      <head>
        <meta name="shopify-api-key" content={appClientId()} />
        {/* eslint-disable-next-line @next/next/no-sync-scripts -- App Bridge requires a blocking first script */}
        <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js" />
        {/* eslint-disable-next-line @next/next/no-sync-scripts -- Polaris web components */}
        <script src="https://cdn.shopify.com/shopifycloud/polaris.js" />
      </head>
      <body style={{ background: "transparent", margin: 0 }}>{children}</body>
    </html>
  );
}
