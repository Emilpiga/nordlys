export const shopifyConfig = {
  storeDomain: cleanStoreDomain(process.env.SHOPIFY_STORE_DOMAIN),
  /** Public Storefront API token (Header: X-Shopify-Storefront-Access-Token) */
  publicStorefrontToken: cleanEnv(process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN),
  /** Private Storefront API token for server-only calls (Header: Shopify-Storefront-Private-Token) */
  privateStorefrontToken: cleanEnv(
    process.env.SHOPIFY_STOREFRONT_PRIVATE_ACCESS_TOKEN,
  ),
  apiVersion: process.env.SHOPIFY_STOREFRONT_API_VERSION ?? "2026-04",
  storeName: process.env.NEXT_PUBLIC_STORE_NAME ?? "Nordlys",
};

function cleanEnv(value: string | undefined) {
  return value?.trim().replace(/^["']|["']$/g, "") ?? "";
}

/** Accepts `store.myshopify.com` or full URLs; strips accidental concatenated env junk. */
function cleanStoreDomain(value: string | undefined) {
  let domain = cleanEnv(value)
    .replace(/^https?:\/\//, "")
    .split("/")[0];

  const myshopify = domain.match(
    /^([a-z0-9][a-z0-9-]*\.myshopify\.com)/i,
  );
  if (myshopify) {
    domain = myshopify[1];
  }

  return domain;
}

export function isShopifyConfigured() {
  return Boolean(
    shopifyConfig.storeDomain &&
      (shopifyConfig.publicStorefrontToken ||
        shopifyConfig.privateStorefrontToken),
  );
}

/** Client secrets (shpss_) and Admin tokens (shpat_) are not Storefront tokens. */
export function getStorefrontCredentialHint(token: string): string | null {
  if (token.startsWith("shpss_")) {
    return (
      "SHOPIFY_STOREFRONT_ACCESS_TOKEN looks like a Dev Dashboard client secret (shpss_…). " +
      "That is not a Storefront API token. Install the Headless sales channel in Shopify Admin → " +
      "Create storefront → copy the Public and/or Private Storefront API tokens."
    );
  }

  if (token.startsWith("shpat_")) {
    return (
      "SHOPIFY_STOREFRONT_ACCESS_TOKEN looks like an Admin API token (shpat_…). " +
      "Use a Storefront API token from the Headless sales channel instead."
    );
  }

  if (token.startsWith("shpca_") || token.startsWith("shpcf_")) {
    return (
      "That token type is not a Storefront API access token. " +
      "Use tokens from Sales channels → Headless → Manage API access."
    );
  }

  return null;
}
