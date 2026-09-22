import "server-only";

import { shopifyConfig } from "@/lib/shopify/config";

const API_VERSION = process.env.SHOPIFY_ADMIN_API_VERSION?.trim() || "2026-04";

export function isShopifyAdminConfigured() {
  return Boolean(
    shopifyConfig.storeDomain &&
      (process.env.SHOPIFY_ADMIN_ACCESS_TOKEN?.trim() ||
        (process.env.SHOPIFY_CLIENT_ID?.trim() &&
          process.env.SHOPIFY_CLIENT_SECRET?.trim())),
  );
}

async function getAdminAccessToken(domain: string) {
  const staticToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN?.trim();
  if (staticToken) return staticToken;

  const clientId = process.env.SHOPIFY_CLIENT_ID?.trim();
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    throw new Error(
      "Set SHOPIFY_ADMIN_ACCESS_TOKEN or SHOPIFY_CLIENT_ID + SHOPIFY_CLIENT_SECRET",
    );
  }

  const response = await fetch(`https://${domain}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  const json = (await response.json()) as { access_token?: string };
  if (!json.access_token) {
    throw new Error(
      `Admin token exchange failed (${response.status}): ${JSON.stringify(json).slice(0, 300)}`,
    );
  }
  return json.access_token;
}

type AdminGraphqlResult<T> = {
  data?: T;
  errors?: unknown[];
};

export async function shopifyAdminGraphql<T>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const domain = shopifyConfig.storeDomain;
  if (!domain) throw new Error("SHOPIFY_STORE_DOMAIN is not configured");

  const token = await getAdminAccessToken(domain);
  const response = await fetch(
    `https://${domain}/admin/api/${API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token,
      },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
    },
  );

  const json = (await response.json()) as AdminGraphqlResult<T>;
  if (!response.ok || (json.errors && json.errors.length > 0) || !json.data) {
    throw new Error(
      `Shopify Admin ${response.status}: ${JSON.stringify(json.errors || json).slice(0, 1000)}`,
    );
  }
  return json.data;
}
