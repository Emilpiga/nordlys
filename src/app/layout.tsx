import type { Metadata } from "next";
import type { ReactNode } from "react";
import { brandIcons } from "@/lib/seo";
import { shopifyConfig } from "@/lib/shopify/config";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: shopifyConfig.storeName,
  icons: brandIcons(),
  verification: {
    google: "bSh4H3La9pPmKiYkKZU5-UlDiHSzk3c4mV6WCHExLho",
    other: {
      "facebook-domain-verification": "gcfvcq5q46bhbdxn70zwreu6q1uh0g",
    },
  },
};

/** Pass-through root — `<html>` / `<body>` live in `[locale]/layout`. */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
