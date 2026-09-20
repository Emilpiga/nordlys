#!/usr/bin/env node
/**
 * Shared Shopify Admin helpers for catalog scripts.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";

export function loadEnvFiles(cwd = process.cwd()) {
  for (const name of [".env.local", ".env"]) {
    const path = resolve(cwd, name);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = value;
    }
  }
}

export function sleep(ms) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}

export function numericId(gid) {
  return String(gid).split("/").pop();
}

export function shopDomain() {
  const domain = process.env.SHOPIFY_STORE_DOMAIN?.replace(/^https?:\/\//, "").split(
    "/",
  )[0];
  if (!domain) throw new Error("Set SHOPIFY_STORE_DOMAIN in .env.local");
  return domain;
}

export function adminApiVersion() {
  return process.env.SHOPIFY_ADMIN_API_VERSION || "2026-04";
}

export async function getAdminAccessToken(domain = shopDomain()) {
  const staticToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN?.trim();
  if (staticToken) return staticToken;

  const clientId = process.env.SHOPIFY_CLIENT_ID?.trim();
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    throw new Error(
      "Set SHOPIFY_CLIENT_ID + SHOPIFY_CLIENT_SECRET (or SHOPIFY_ADMIN_ACCESS_TOKEN).",
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
  const json = await response.json();
  if (!json.access_token) {
    throw new Error(
      `Admin token exchange failed (${response.status}): ${JSON.stringify(json).slice(0, 300)}`,
    );
  }
  return { token: json.access_token, scope: json.scope || "" };
}

export function createShopifyAdmin({ domain, token, version = adminApiVersion() }) {
  const url = `https://${domain}/admin/api/${version}/graphql.json`;

  async function graphql(query, variables = {}) {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token,
      },
      body: JSON.stringify({ query, variables }),
    });
    const json = await response.json();
    if (!response.ok || json.errors?.length) {
      throw new Error(
        `Shopify Admin ${response.status}: ${JSON.stringify(json.errors || json).slice(0, 1000)}`,
      );
    }
    const cost = json.extensions?.cost?.throttleStatus;
    if (cost && cost.currentlyAvailable < 80) {
      const waitMs = Math.ceil(
        ((80 - cost.currentlyAvailable) / Math.max(cost.restoreRate, 1)) * 1000,
      );
      await sleep(Math.min(Math.max(waitMs, 400), 8000));
    }
    return json.data;
  }

  /**
   * Run a mutation field that requires @idempotent (inventory APIs in 2026-04).
   * `document` must be a full mutation string containing `__IDEMPOTENT__`
   * immediately after the field arguments, e.g.:
   *   mutation($input: InventorySetQuantitiesInput!) {
   *     inventorySetQuantities(input: $input) __IDEMPOTENT__ { userErrors { message } }
   *   }
   */
  async function graphqlIdempotent(document, variables = {}) {
    const key = randomUUID();
    const query = document.replace(
      "__IDEMPOTENT__",
      `@idempotent(key: "${key}")`,
    );
    if (query === document) {
      throw new Error("graphqlIdempotent document must contain __IDEMPOTENT__");
    }
    return graphql(query, variables);
  }

  return { domain, token, version, graphql, graphqlIdempotent };
}

export function assertNoUserErrors(errors, label) {
  if (!errors?.length) return;
  throw new Error(`${label}: ${JSON.stringify(errors)}`);
}
