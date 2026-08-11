import type { Metadata } from "next";
import { shopifyConfig } from "@/lib/shopify/config";

export const siteDescription = `${shopifyConfig.storeName} — Nordisk hudvård för klar, lugn hy. Mjuka formler för nordiskt ljus.`;

export const siteTitle = `${shopifyConfig.storeName} · Nordisk hudvård`;

type OgImageInput = {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
};

/** Shared Open Graph + Twitter fields for consistent share/ad previews. */
export function socialMetadata({
  title,
  description,
  url,
  images,
  type = "website",
}: {
  title: string;
  description: string;
  url?: string;
  images?: OgImageInput[];
  type?: "website" | "article";
}): Pick<Metadata, "openGraph" | "twitter"> {
  const ogImages = images?.map((image) => ({
    url: image.url,
    width: image.width,
    height: image.height,
    alt: image.alt ?? title,
  }));

  return {
    openGraph: {
      type,
      locale: "sv_SE",
      siteName: shopifyConfig.storeName,
      title,
      description,
      ...(url ? { url } : {}),
      ...(ogImages?.length ? { images: ogImages } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(ogImages?.length
        ? { images: ogImages.map((image) => image.url) }
        : {}),
    },
  };
}
