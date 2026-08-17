#!/usr/bin/env node
/**
 * Inspect Shopify products for barcode / category / CJ-ish SKUs / metafields.
 * Read-only. Requires SHOPIFY_STORE_DOMAIN + Admin credentials.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFiles() {
  for (const name of [".env.local", ".env"]) {
    const path = resolve(process.cwd(), name);
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

async function getAdminAccessToken(domain) {
  const staticToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN?.trim();
  if (staticToken) return staticToken;
  const clientId =
    process.env.SHOPIFY_CLIENT_ID?.trim() ||
    process.env.SHOPIFY_STOREFRONT_CLIENT_ID?.trim();
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return "";
  const response = await fetch(`https://${domain}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Admin token exchange failed (${response.status}): ${text.slice(0, 240)}`);
  }
  const json = JSON.parse(text);
  return json.access_token;
}

const PRODUCTS_QUERY = /* GraphQL */ `
  query InspectProducts($cursor: String) {
    products(first: 25, after: $cursor) {
      pageInfo { hasNextPage endCursor }
      nodes {
        id
        handle
        title
        vendor
        productType
        status
        tags
        category { id name fullName }
        metafields(first: 50) {
          nodes { namespace key type value }
        }
        variants(first: 100) {
          nodes {
            id
            sku
            barcode
            title
          }
        }
      }
    }
  }
`;

loadEnvFiles();
const domain = process.env.SHOPIFY_STORE_DOMAIN?.replace(/^https?:\/\//, "").split("/")[0];
const version = process.env.SHOPIFY_ADMIN_API_VERSION || "2026-04";
if (!domain) throw new Error("Set SHOPIFY_STORE_DOMAIN");
const token = await getAdminAccessToken(domain);
if (!token) throw new Error("No Admin token");

const url = `https://${domain}/admin/api/${version}/graphql.json`;
const products = [];
let cursor = null;
do {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token,
    },
    body: JSON.stringify({ query: PRODUCTS_QUERY, variables: { cursor } }),
  });
  const json = await response.json();
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join("\n"));
  }
  products.push(...json.data.products.nodes);
  cursor = json.data.products.pageInfo.hasNextPage
    ? json.data.products.pageInfo.endCursor
    : null;
} while (cursor);

console.log("=== categories ===");
for (const product of products) {
  const gpc = product.metafields.nodes.find(
    (f) => f.key === "google_product_category",
  );
  console.log(
    JSON.stringify({
      handle: product.handle,
      categoryId: product.category?.id || null,
      category: product.category?.fullName || product.category?.name || null,
      productType: product.productType || null,
      gpc: gpc ? { namespace: gpc.namespace, value: gpc.value } : null,
      metafields: product.metafields.nodes.map((f) => `${f.namespace}.${f.key}`),
    }),
  );
}
