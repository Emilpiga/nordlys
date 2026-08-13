import { shopifyConfig } from "@/lib/shopify/config";
import { getSiteUrl } from "@/lib/site-url";

function cleanEnv(value: string | undefined) {
  return value?.trim().replace(/^["']|["']$/g, "") ?? "";
}

export const customerAccountConfig = {
  clientId: cleanEnv(process.env.SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID),
  clientSecret: cleanEnv(process.env.SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_SECRET),
  callbackUrl:
    cleanEnv(process.env.SHOPIFY_CUSTOMER_ACCOUNT_CALLBACK_URL) ||
    `${getSiteUrl()}/api/auth/callback`,
  sessionSecret:
    cleanEnv(process.env.CUSTOMER_SESSION_SECRET) ||
    cleanEnv(process.env.SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_SECRET) ||
    "dev-customer-session-secret",
  storeDomain: shopifyConfig.storeDomain,
  scopes: "openid email customer-account-api:full",
};

export function isCustomerAccountConfigured() {
  // Public clients only have a client id; confidential also have a secret.
  return Boolean(
    customerAccountConfig.storeDomain && customerAccountConfig.clientId,
  );
}

export const AUTH_COOKIES = {
  accessToken: "ca_access_token",
  refreshToken: "ca_refresh_token",
  expiresAt: "ca_expires_at",
  idToken: "ca_id_token",
  state: "ca_oauth_state",
  nonce: "ca_oauth_nonce",
  verifier: "ca_code_verifier",
  returnTo: "ca_return_to",
} as const;
