import { createStorefrontClient } from "@shopify/hydrogen-react";
import {
  getStorefrontCredentialHint,
  isShopifyConfigured,
  shopifyConfig,
} from "./config";

export class ShopifyNotConfiguredError extends Error {
  constructor() {
    super(
      "Shopify is not configured. Set SHOPIFY_STORE_DOMAIN and a Storefront API token " +
        "(SHOPIFY_STOREFRONT_ACCESS_TOKEN and/or SHOPIFY_STOREFRONT_PRIVATE_ACCESS_TOKEN).",
    );
    this.name = "ShopifyNotConfiguredError";
  }
}

export class ShopifyAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ShopifyAuthError";
  }
}

type StorefrontError = {
  message: string;
};

function assertValidStorefrontTokens() {
  const candidates = [
    shopifyConfig.publicStorefrontToken,
    shopifyConfig.privateStorefrontToken,
  ].filter(Boolean);

  for (const token of candidates) {
    const hint = getStorefrontCredentialHint(token);
    if (hint) throw new ShopifyAuthError(hint);
  }
}

function getClient() {
  if (!isShopifyConfigured()) {
    throw new ShopifyNotConfiguredError();
  }

  assertValidStorefrontTokens();

  return createStorefrontClient({
    storeDomain: shopifyConfig.storeDomain,
    publicStorefrontToken: shopifyConfig.publicStorefrontToken || undefined,
    privateStorefrontToken: shopifyConfig.privateStorefrontToken || undefined,
    storefrontApiVersion: shopifyConfig.apiVersion,
  });
}

export async function shopifyFetch<T>({
  query,
  variables,
  cache = "force-cache",
  tags,
}: {
  query: string;
  variables?: Record<string, unknown>;
  cache?: RequestCache;
  tags?: string[];
}): Promise<T> {
  const client = getClient();
  const usePrivate = Boolean(shopifyConfig.privateStorefrontToken);

  // Translate & Adapt content is only returned when @inContext(language) is set.
  // Admin "default language" alone does not change headless Storefront API responses.
  const contextualVariables = {
    country: shopifyConfig.country,
    language: shopifyConfig.language,
    ...variables,
  };

  const response = await fetch(client.getStorefrontApiUrl(), {
    method: "POST",
    headers: usePrivate
      ? client.getPrivateTokenHeaders({ contentType: "json" })
      : client.getPublicTokenHeaders({ contentType: "json" }),
    body: JSON.stringify({ query, variables: contextualVariables }),
    cache,
    next: tags ? { tags } : undefined,
  });

  if (response.status === 401 || response.status === 403) {
    throw new ShopifyAuthError(
      `Shopify Storefront API ${response.status} UNAUTHORIZED. ` +
        `Domain: ${shopifyConfig.storeDomain}. ` +
        `Install Sales channels → Headless → Create storefront, then set ` +
        `SHOPIFY_STOREFRONT_ACCESS_TOKEN (public) and/or ` +
        `SHOPIFY_STOREFRONT_PRIVATE_ACCESS_TOKEN (private). ` +
        `Do not use Dev Dashboard client secrets (shpss_) or Admin tokens (shpat_).`,
    );
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Shopify Storefront API ${response.status}: ${body}`);
  }

  const json = (await response.json()) as {
    data?: T;
    errors?: StorefrontError[];
  };

  if (json.errors?.length) {
    throw new Error(json.errors.map((error) => error.message).join("\n"));
  }

  if (!json.data) {
    throw new Error("Shopify Storefront API returned no data.");
  }

  return json.data;
}
