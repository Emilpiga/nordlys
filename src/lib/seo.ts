import type { Metadata } from "next";
import { getMarketingPixelConfig } from "@/lib/consent";
import { locales, localePath, getLocaleConfig } from "@/lib/i18n/locales";
import { shopifyConfig } from "@/lib/shopify/config";
import { getSiteUrl } from "@/lib/site-url";

export function siteTitleFor(brand = shopifyConfig.storeName) {
  return `${brand} · Nordisk belysning`;
}

export function siteDescriptionFor(brand = shopifyConfig.storeName) {
  return `${brand} — Nordisk belysning för lugna rum. Lampor med varmt sken och stilla design.`;
}

/** @deprecated Prefer dictionary meta via getDictionary */
export const siteDescription = siteDescriptionFor();
/** @deprecated Prefer dictionary meta via getDictionary */
export const siteTitle = siteTitleFor();

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
  locale = "sv_SE",
}: {
  title: string;
  description: string;
  url?: string;
  images?: OgImageInput[];
  type?: "website" | "article";
  locale?: string;
}): Pick<Metadata, "openGraph" | "twitter" | "facebook"> {
  const ogImages = images?.map((image) => ({
    url: image.url,
    width: image.width,
    height: image.height,
    alt: image.alt ?? title,
  }));

  const { facebookAppId } = getMarketingPixelConfig();

  return {
    openGraph: {
      type,
      locale,
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
    ...(facebookAppId ? { facebook: { appId: facebookAppId } } : {}),
  };
}

export function localeAlternates(locale: string, path = "/") {
  const base = getSiteUrl();
  const languages = Object.fromEntries(
    locales.map((code) => [code, `${base}${localePath(code, path)}`]),
  );
  return {
    canonical: `${base}${localePath(locale, path)}`,
    languages: {
      ...languages,
      "x-default": `${base}${localePath("sv", path)}`,
    },
  };
}

export function ogLocaleFor(locale: string) {
  return getLocaleConfig(locale).ogLocale;
}
