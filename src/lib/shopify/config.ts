export const shopifyConfig = {
  storeDomain: cleanStoreDomain(process.env.SHOPIFY_STORE_DOMAIN),
  /** Public Storefront API token (Header: X-Shopify-Storefront-Access-Token) */
  publicStorefrontToken: cleanEnv(process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN),
  /** Private Storefront API token for server-only calls (Header: Shopify-Storefront-Private-Token) */
  privateStorefrontToken: cleanEnv(
    process.env.SHOPIFY_STOREFRONT_PRIVATE_ACCESS_TOKEN,
  ),
  apiVersion: process.env.SHOPIFY_STOREFRONT_API_VERSION ?? "2026-04",
  storeName: process.env.NEXT_PUBLIC_STORE_NAME ?? "Vardagsstil.se",
  supportEmail: cleanEnv(process.env.NEXT_PUBLIC_SUPPORT_EMAIL),
  /**
   * Storefront API @inContext language (Translate & Adapt).
   * Must be an active shop language ISO code, e.g. SV.
   */
  language: (
    cleanEnv(process.env.SHOPIFY_STOREFRONT_LANGUAGE) || "SV"
  ).toUpperCase(),
  /**
   * Storefront API @inContext country (Markets / currency).
   * Must be an active market country ISO code, e.g. SE.
   */
  country: (
    cleanEnv(process.env.SHOPIFY_STOREFRONT_COUNTRY) || "SE"
  ).toUpperCase(),
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
      "SHOPIFY_STOREFRONT_ACCESS_TOKEN ser ut som en Dev Dashboard-klienthemlighet (shpss_…). " +
      "Det är inte en Storefront API-token. Installera försäljningskanalen Headless i Shopify Admin → " +
      "Skapa storefront → kopiera de publika och/eller privata Storefront API-tokens."
    );
  }

  if (token.startsWith("shpat_")) {
    return (
      "SHOPIFY_STOREFRONT_ACCESS_TOKEN ser ut som en Admin API-token (shpat_…). " +
      "Använd en Storefront API-token från försäljningskanalen Headless i stället."
    );
  }

  if (token.startsWith("shpca_") || token.startsWith("shpcf_")) {
    return (
      "Den tokentypen är inte en Storefront API-åtkomsttoken. " +
      "Använd tokens från Försäljningskanaler → Headless → Hantera API-åtkomst."
    );
  }

  return null;
}
