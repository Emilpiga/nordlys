#!/usr/bin/env node
/**
 * Storefront API helper for catalog scripts. The storefront is what shoppers
 * actually see, so availability questions have to be asked here — the Admin API
 * reports stock the Swedish market may not be able to buy.
 */

export function storefrontApiVersion() {
  return process.env.SHOPIFY_STOREFRONT_API_VERSION || "2026-04";
}

export function createShopifyStorefront({
  domain,
  version = storefrontApiVersion(),
} = {}) {
  const privateToken =
    process.env.SHOPIFY_STOREFRONT_PRIVATE_ACCESS_TOKEN?.trim();
  const token = privateToken || process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN?.trim();
  if (!token) {
    throw new Error(
      "Set SHOPIFY_STOREFRONT_PRIVATE_ACCESS_TOKEN or SHOPIFY_STOREFRONT_ACCESS_TOKEN in .env.local",
    );
  }

  const url = `https://${domain}/api/${version}/graphql.json`;
  const headers = {
    "Content-Type": "application/json",
    ...(privateToken
      ? {
          "Shopify-Storefront-Private-Token": token,
          "Shopify-Storefront-Buyer-IP": "127.0.0.1",
        }
      : { "X-Shopify-Storefront-Access-Token": token }),
  };

  async function graphql(query, variables = {}) {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ query, variables }),
    });
    const json = await response.json();
    if (!response.ok || json.errors?.length) {
      throw new Error(
        `Shopify Storefront ${response.status}: ${JSON.stringify(json.errors || json).slice(0, 1000)}`,
      );
    }
    return json.data;
  }

  return { domain, version, graphql };
}

export function marketContext() {
  return {
    country: process.env.SHOPIFY_STOREFRONT_COUNTRY || "SE",
    language: process.env.SHOPIFY_STOREFRONT_LANGUAGE || "SV",
  };
}

const AVAILABILITY_QUERY = /* GraphQL */ `
  query Availability(
    $after: String
    $language: LanguageCode!
    $country: CountryCode!
  ) @inContext(language: $language, country: $country) {
    products(first: 100, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        handle
        title
        variants(first: 250) {
          nodes {
            availableForSale
          }
        }
      }
    }
  }
`;

/**
 * Per-handle variant counts as the shopper's market sees them. `sellable: 0`
 * on a product the Admin API says is stocked means the market cannot reach the
 * inventory — usually a shipping profile that doesn't ship from its location.
 */
export async function marketAvailability(storefront, context = marketContext()) {
  const byHandle = new Map();
  let after = null;
  for (;;) {
    const data = await storefront.graphql(AVAILABILITY_QUERY, {
      after,
      ...context,
    });
    for (const node of data.products.nodes) {
      const variants = node.variants.nodes;
      byHandle.set(node.handle, {
        title: node.title,
        variants: variants.length,
        sellable: variants.filter((variant) => variant.availableForSale).length,
      });
    }
    if (!data.products.pageInfo.hasNextPage) break;
    after = data.products.pageInfo.endCursor;
  }
  return byHandle;
}
