import type { Metadata, ReactNode } from "react";
import { brandIcons } from "@/lib/seo";
import { shopifyConfig } from "@/lib/shopify/config";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: shopifyConfig.storeName,
  icons: brandIcons(),
};

/** Pass-through root — `<html>` / `<body>` live in `[locale]/layout`. */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
