import { shopifyConfig } from "@/lib/shopify/config";
import type { Product } from "@/lib/shopify/types";
import { getProductReviews, getReviewSummary } from "@/lib/reviews";
import { getSiteUrl } from "@/lib/site-url";
import { localePath } from "@/lib/i18n/locales";
import { siteDescriptionFor } from "@/lib/seo";

type JsonLd = Record<string, unknown>;

export function buildOrganizationJsonLd(
  description = siteDescriptionFor(),
): JsonLd {
  const url = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: shopifyConfig.storeName,
    url,
    logo: `${url}/brand-mark.svg`,
    description,
    ...(shopifyConfig.supportEmail
      ? { email: shopifyConfig.supportEmail }
      : {}),
  };
}

export function buildWebSiteJsonLd(
  description = siteDescriptionFor(),
  htmlLang = "sv",
  locale = "sv",
): JsonLd {
  const url = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: shopifyConfig.storeName,
    url: `${url}${localePath(locale)}`,
    description,
    inLanguage: htmlLang,
    publisher: {
      "@type": "Organization",
      name: shopifyConfig.storeName,
      url,
      logo: `${url}/brand-mark.svg`,
    },
  };
}

export function buildProductJsonLd(
  product: Product,
  locale = "sv",
): JsonLd {
  const url = `${getSiteUrl()}${localePath(locale, `/products/${product.handle}`)}`;
  const image =
    product.featuredImage?.url ?? product.images[0]?.url ?? undefined;
  const description =
    product.description.replace(/\s+/g, " ").trim() ||
    `${product.title} — ${shopifyConfig.storeName}`;

  const availableVariant =
    product.variants.find((variant) => variant.availableForSale) ??
    product.variants[0];
  const price =
    availableVariant?.price ?? product.priceRange.minVariantPrice;
  const inStock = product.variants.some((variant) => variant.availableForSale);
  const summary = getReviewSummary(product.handle);
  const reviews = getProductReviews(product.handle, locale);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description,
    url,
    sku: product.handle,
    productID: product.id,
    brand: {
      "@type": "Brand",
      name: shopifyConfig.storeName,
    },
    ...(product.category ? { category: product.category.name } : {}),
    ...(image ? { image: [image] } : {}),
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: price.currencyCode,
      price: price.amount,
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
    ...(summary
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: summary.average.toFixed(1),
            reviewCount: summary.count,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
    ...(reviews.length
      ? {
          review: reviews.map((review) => ({
            "@type": "Review",
            author: { "@type": "Person", name: review.author },
            datePublished: review.date,
            name: review.title,
            reviewBody: review.body,
            reviewRating: {
              "@type": "Rating",
              ratingValue: review.rating,
              bestRating: 5,
              worstRating: 1,
            },
          })),
        }
      : {}),
  };
}
