import { shopifyConfig } from "@/lib/shopify/config";
import { getLegalIdentity } from "@/lib/legal";
import type { Collection, Product } from "@/lib/shopify/types";
import { getProductReviews, getReviewSummary } from "@/lib/reviews";
import { getSiteUrl } from "@/lib/site-url";
import { localePath } from "@/lib/i18n/locales";
import { siteDescriptionFor } from "@/lib/seo";
import {
  meaningfulOptions,
  productMetaDescription,
  productSku,
} from "@/lib/catalog-seo";

type JsonLd = Record<string, unknown>;

export function buildOrganizationJsonLd(
  description = siteDescriptionFor(),
): JsonLd {
  const url = getSiteUrl();
  const identity = getLegalIdentity();

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: shopifyConfig.storeName,
    url,
    logo: `${url}/brand-mark.svg`,
    description,
    ...(identity.legalName ? { legalName: identity.legalName } : {}),
    ...(identity.address
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: identity.postal.street,
            postalCode: identity.postal.postalCode,
            addressLocality: identity.postal.city,
            addressRegion: identity.postal.region,
            addressCountry: identity.postal.countryCode,
          },
        }
      : {}),
    ...(identity.orgNumber ? { identifier: identity.orgNumber } : {}),
    ...(identity.vatNumber ? { vatID: identity.vatNumber } : {}),
    ...(identity.email ? { email: identity.email } : {}),
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
  const images = [product.featuredImage, ...product.images]
    .map((image) => image?.url)
    .filter((url): url is string => Boolean(url));
  const uniqueImages = [...new Set(images)];
  const description =
    productMetaDescription(
      product,
      `${product.title} — ${shopifyConfig.storeName}`,
    ) || `${product.title} — ${shopifyConfig.storeName}`;

  const availableVariant =
    product.variants.find((variant) => variant.availableForSale) ??
    product.variants[0];
  const price =
    availableVariant?.price ?? product.priceRange.minVariantPrice;
  const inStock = product.variants.some((variant) => variant.availableForSale);
  const summary = getReviewSummary(product.handle);
  const reviews = getProductReviews(product.handle, locale);
  const specs = meaningfulOptions(product.options);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description,
    url,
    sku: productSku(product),
    productID: product.id,
    brand: {
      "@type": "Brand",
      name: shopifyConfig.storeName,
    },
    ...(product.category ? { category: product.category.name } : {}),
    ...(uniqueImages.length ? { image: uniqueImages } : {}),
    ...(specs.length
      ? {
          additionalProperty: specs.map((spec) => ({
            "@type": "PropertyValue",
            name: spec.name,
            value: spec.values.join(", "),
          })),
        }
      : {}),
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: price.currencyCode,
      price: price.amount,
      sku: availableVariant?.sku || productSku(product),
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

export function buildBreadcrumbJsonLd(
  items: { name: string; url: string }[],
): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function buildCollectionJsonLd(
  collection: Collection,
  locale = "sv",
): JsonLd {
  const url = `${getSiteUrl()}${localePath(locale, `/collections/${collection.handle}`)}`;
  const description =
    collection.seo.description ||
    collection.description ||
    `${collection.title} — ${shopifyConfig.storeName}`;

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: collection.title,
    description,
    url,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: collection.products.length,
      itemListElement: collection.products.map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${getSiteUrl()}${localePath(locale, `/products/${product.handle}`)}`,
        name: product.title,
      })),
    },
  };
}
