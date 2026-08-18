import { shopifyConfig } from "@/lib/shopify/config";
import type { Collection, CollectionSummary, Product } from "@/lib/shopify/types";

const META_MAX = 160;

export type OptionSpec = {
  name: string;
  values: string[];
};

function cleanText(value: string | null | undefined) {
  return value?.replace(/\s+/g, " ").trim() || "";
}

export function clipMeta(value: string, max = META_MAX) {
  const text = cleanText(value);
  if (text.length <= max) return text;
  const sliced = text.slice(0, max - 1);
  const cut = sliced.lastIndexOf(" ");
  return `${(cut > 80 ? sliced.slice(0, cut) : sliced).trim()}…`;
}

/** First sentence / paragraph from Shopify description — good meta copy. */
export function summaryFromDescription(description: string, max = META_MAX) {
  const plain = cleanText(description.replace(/<[^>]+>/g, " "));
  if (!plain) return "";
  const sentence = plain.split(/(?<=[.!?…])\s+/)[0] || plain;
  return clipMeta(sentence.length <= max ? sentence : plain, max);
}

function isDefaultOptionName(name: string) {
  return name.trim().toLowerCase() === "title";
}

function isDefaultOptionValue(value: string) {
  const normalized = value.trim().toLowerCase();
  return !normalized || normalized === "default title";
}

/** Variant options that are real product data (size, colour, set…), not Shopify defaults. */
export function meaningfulOptions(
  options: Product["options"] | undefined,
): OptionSpec[] {
  if (!options?.length) return [];

  return options.flatMap((option) => {
    if (isDefaultOptionName(option.name)) return [];
    const values = option.values.filter((value) => !isDefaultOptionValue(value));
    if (values.length === 0) return [];
    return [{ name: option.name, values }];
  });
}

export function productMetaTitle(product: Product) {
  return cleanText(product.seo.title) || product.title;
}

export function productMetaDescription(
  product: Product,
  fallback: string,
) {
  const fromSeo = cleanText(product.seo.description);
  if (fromSeo) return clipMeta(fromSeo);

  const summary = summaryFromDescription(product.description);
  if (summary) return summary;

  return clipMeta(fallback);
}

export function collectionMetaTitle(
  collection: Pick<CollectionSummary, "title" | "seo">,
  template: string,
) {
  const fromSeo = cleanText(collection.seo.title);
  if (fromSeo) return fromSeo;
  return template;
}

export function collectionMetaDescription(
  collection: Pick<CollectionSummary, "description" | "seo">,
  template: string,
) {
  const fromSeo = cleanText(collection.seo.description);
  if (fromSeo) return clipMeta(fromSeo);
  const fromBody = summaryFromDescription(collection.description);
  if (fromBody) return fromBody;
  return clipMeta(template);
}

export function collectionIntro(
  collection: Pick<Collection, "description">,
  template: string,
) {
  return cleanText(collection.description) || template;
}

export function productSku(product: Product) {
  return (
    product.variants.find((variant) => variant.sku)?.sku ||
    product.handle
  );
}

export function imageAlt(productTitle: string, altText?: string | null) {
  return cleanText(altText) || `${productTitle} — ${shopifyConfig.storeName}`;
}
