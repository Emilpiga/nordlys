import type { MetadataRoute } from "next";
import { BRAND_INK, BRAND_PAPER } from "@/lib/brand";
import { siteDescriptionFor } from "@/lib/seo";
import { shopifyConfig } from "@/lib/shopify/config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: shopifyConfig.storeName,
    short_name: "Vardagsstil",
    description: siteDescriptionFor(),
    start_url: "/sv",
    display: "standalone",
    background_color: BRAND_PAPER,
    theme_color: BRAND_INK,
    icons: [
      {
        src: "/brand-mark.svg",
        type: "image/svg+xml",
        sizes: "any",
        purpose: "any",
      },
      {
        src: "/icon",
        type: "image/png",
        sizes: "64x64",
      },
      {
        src: "/apple-icon",
        type: "image/png",
        sizes: "180x180",
      },
    ],
  };
}
