import { cache } from "react";
import { customerAccountConfig } from "./config";

export type OpenIdConfiguration = {
  authorization_endpoint: string;
  token_endpoint: string;
  end_session_endpoint: string;
  jwks_uri?: string;
  issuer?: string;
};

export type CustomerAccountApiConfiguration = {
  graphql_api: string;
  mcp_api?: string;
};

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "HarborStorefront" },
    next: { revalidate: 3600 },
  });
  if (!response.ok) {
    throw new Error(`Discovery failed (${response.status}): ${url}`);
  }
  return (await response.json()) as T;
}

export const getOpenIdConfiguration = cache(async () => {
  const domain = customerAccountConfig.storeDomain;
  if (!domain) throw new Error("SHOPIFY_STORE_DOMAIN is required.");
  return fetchJson<OpenIdConfiguration>(
    `https://${domain}/.well-known/openid-configuration`,
  );
});

export const getCustomerAccountApiConfiguration = cache(async () => {
  const domain = customerAccountConfig.storeDomain;
  if (!domain) throw new Error("SHOPIFY_STORE_DOMAIN is required.");
  return fetchJson<CustomerAccountApiConfiguration>(
    `https://${domain}/.well-known/customer-account-api`,
  );
});
