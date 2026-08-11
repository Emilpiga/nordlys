import { shopifyConfig } from "@/lib/shopify/config";
import type { Product } from "@/lib/shopify/types";
import { getSiteUrl } from "@/lib/site-url";
import { siteDescription } from "@/lib/seo";

type JsonLd = Record<string, unknown>;

export function buildOrganizationJsonLd(): JsonLd {
  const url = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: shopifyConfig.storeName,
    url,
    logo: `${url}/logo-ikon.png`,
    description: siteDescription,
    ...(shopifyConfig.supportEmail
      ? { email: shopifyConfig.supportEmail }
      : {}),
  };
}

export function buildWebSiteJsonLd(): JsonLd {
  const url = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: shopifyConfig.storeName,
    url,
    description: siteDescription,
    inLanguage: "sv-SE",
    publisher: {
      "@type": "Organization",
      name: shopifyConfig.storeName,
      url,
    },
  };
}

export function buildProductJsonLd(product: Product): JsonLd {
  const url = `${getSiteUrl()}/products/${product.handle}`;
  const image =
    product.featuredImage?.url ??
    product.images[0]?.url ??
    undefined;
  const description =
    product.description.replace(/\s+/g, " ").trim() ||
    `${product.title} från ${shopifyConfig.storeName}.`;

  const availableVariant =
    product.variants.find((variant) => variant.availableForSale) ??
    product.variants[0];
  const price =
    availableVariant?.price ?? product.priceRange.minVariantPrice;
  const inStock = product.variants.some((variant) => variant.availableForSale);

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
    ...(product.category
      ? { category: product.category.name }
      : {}),
    ...(image ? { image: [image] } : {}),
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: price.currencyCode,
      price: price.amount,
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: shopifyConfig.storeName,
      },
    },
  };
}
