import copyData from "@/data/collection-seo.json";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n/locales";
import type { SeoContent } from "@/lib/shopify/types";

/**
 * Hand-written, per-locale collection copy. Shopify only carries Swedish
 * titles and no SEO fields, so this is what NO/DA/FI shoppers and search
 * engines see on collection pages.
 */
export type CollectionCopy = {
  title: string;
  metaTitle: string;
  metaDescription: string;
  intro: string;
  /** Longer guide text rendered under the product grid. */
  body?: string[];
};

const data = copyData as Record<string, Partial<Record<Locale, CollectionCopy>>>;

export function getCollectionCopy(
  handle: string,
  locale?: string,
): CollectionCopy | null {
  const key = locale && isLocale(locale) ? locale : defaultLocale;
  return data[handle]?.[key] ?? null;
}

/** Overlay local copy onto a Shopify collection; untouched when none exists. */
export function localizeCollection<
  T extends { handle: string; title: string; description: string; seo: SeoContent },
>(collection: T, locale?: string): T {
  const copy = getCollectionCopy(collection.handle, locale);
  if (!copy) return collection;
  return {
    ...collection,
    title: copy.title,
    description: copy.intro,
    seo: { title: copy.metaTitle, description: copy.metaDescription },
  };
}
