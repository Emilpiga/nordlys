import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import {
  deleteOfflineToken,
  getOfflineToken,
  saveOfflineToken,
  type OfflineToken,
} from "@/lib/look-planner/store";

/**
 * Auth for the embedded planner (the "Vardagsstil" Shopify app). App Bridge
 * gives the page a short-lived session token; we verify it with the app
 * secret and trade it once for an offline Admin API token, which the daily
 * cron reuses when nobody has the planner open.
 */

export const REQUIRED_SCOPES = ["read_products", "read_discounts", "write_discounts"];

const CLOCK_SKEW_SECONDS = 10;

/** The Vardagsstil app's client id (public — also in shopify-app/shopify.app.toml). */
const DEFAULT_APP_CLIENT_ID = "c041910b1bc5ce1c8e9a465ac940ec05";

export function appClientId() {
  return process.env.SHOPIFY_APP_CLIENT_ID?.trim() || DEFAULT_APP_CLIENT_ID;
}

function appClientSecret() {
  const secret = process.env.SHOPIFY_APP_CLIENT_SECRET?.trim();
  if (!secret) throw new Error("SHOPIFY_APP_CLIENT_SECRET is not set");
  return secret;
}

export class PlannerAuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

function base64UrlDecode(part: string) {
  return Buffer.from(part.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

type SessionTokenPayload = {
  iss: string;
  dest: string;
  aud: string;
  sub?: string;
  exp: number;
  nbf: number;
};

/** Verifies an App Bridge session token and returns the shop it is for. */
export function verifySessionToken(token: string) {
  const [header, payload, signature] = token.split(".");
  if (!header || !payload || !signature) {
    throw new PlannerAuthError("Malformed session token");
  }

  const expected = createHmac("sha256", appClientSecret())
    .update(`${header}.${payload}`)
    .digest();
  const actual = base64UrlDecode(signature);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    throw new PlannerAuthError("Invalid session token signature");
  }

  const claims = JSON.parse(
    base64UrlDecode(payload).toString("utf8"),
  ) as SessionTokenPayload;
  const now = Math.floor(Date.now() / 1000);
  if (claims.exp + CLOCK_SKEW_SECONDS < now) {
    throw new PlannerAuthError("Session token expired");
  }
  if (claims.nbf - CLOCK_SKEW_SECONDS > now) {
    throw new PlannerAuthError("Session token not yet valid");
  }
  if (claims.aud !== appClientId()) {
    throw new PlannerAuthError("Session token is for another app");
  }

  const shop = new URL(claims.dest).hostname;
  if (!shop.endsWith(".myshopify.com") || !claims.iss.startsWith(claims.dest)) {
    throw new PlannerAuthError("Session token has an unexpected issuer");
  }
  return { shop, userId: claims.sub ?? null };
}

type AccessTokenResponse = {
  access_token?: string;
  scope?: string;
  expires_in?: number;
  refresh_token?: string;
  error?: string;
  error_description?: string;
};

async function requestToken(shop: string, body: Record<string, string>) {
  const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: appClientId(),
      client_secret: appClientSecret(),
      ...body,
    }),
  });
  const json = (await response.json().catch(() => ({}))) as AccessTokenResponse;
  if (!response.ok || !json.access_token) {
    throw new PlannerAuthError(
      `Token request failed (${response.status}): ${json.error_description ?? json.error ?? "no token"}`,
      response.status === 400 ? 401 : 502,
    );
  }
  const token: OfflineToken = {
    accessToken: json.access_token,
    scope: json.scope ?? "",
    expiresAt: json.expires_in ? Date.now() + json.expires_in * 1000 : null,
    refreshToken: json.refresh_token ?? null,
  };
  await saveOfflineToken(shop, token);
  return token;
}

function hasRequiredScopes(token: OfflineToken) {
  const granted = new Set(token.scope.split(",").map((scope) => scope.trim()));
  // write_* implies read_* for the same resource.
  return REQUIRED_SCOPES.every(
    (scope) =>
      granted.has(scope) || granted.has(scope.replace(/^read_/, "write_")),
  );
}

function isFresh(token: OfflineToken) {
  return !token.expiresAt || token.expiresAt - 60_000 > Date.now();
}

/** Offline token for the planner, from a verified session token when needed. */
export async function offlineTokenFromSession(
  shop: string,
  sessionToken: string,
) {
  const stored = await getOfflineToken(shop);
  if (stored && isFresh(stored) && hasRequiredScopes(stored)) {
    return stored.accessToken;
  }
  const exchanged = await requestToken(shop, {
    grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
    subject_token: sessionToken,
    subject_token_type: "urn:ietf:params:oauth:token-type:id_token",
    requested_token_type:
      "urn:shopify:params:oauth:token-type:offline-access-token",
  });
  return exchanged.accessToken;
}

/** Offline token for background work (cron, storefront-triggered publish). */
export async function storedOfflineToken(shop: string) {
  const stored = await getOfflineToken(shop);
  if (!stored) return null;
  if (isFresh(stored)) return stored.accessToken;
  if (!stored.refreshToken) {
    await deleteOfflineToken(shop);
    return null;
  }
  const refreshed = await requestToken(shop, {
    grant_type: "refresh_token",
    refresh_token: stored.refreshToken,
  });
  return refreshed.accessToken;
}

/** Route-handler guard: verifies the bearer session token. */
export async function authenticatePlannerRequest(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const sessionToken = header.replace(/^Bearer\s+/i, "").trim();
  if (!sessionToken) throw new PlannerAuthError("Missing session token");
  const { shop } = verifySessionToken(sessionToken);
  const accessToken = await offlineTokenFromSession(shop, sessionToken);
  return { shop, accessToken };
}
