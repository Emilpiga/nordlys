#!/usr/bin/env node
// Create wishlist metafield definition for Customer Account API writes.
// Requires SHOPIFY_STORE_DOMAIN + SHOPIFY_ADMIN_ACCESS_TOKEN
// (or SHOPIFY_CLIENT_ID + SHOPIFY_CLIENT_SECRET for client_credentials).
//
// Usage: npm run metafield:wishlist

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
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = value;
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
  if (!json.access_token) {
    throw new Error("Admin token exchange returned no access_token.");
  }
  console.log(`Admin token scopes: ${json.scope || "(none)"}`);
  return json.access_token;
}

loadEnvFiles();

const domain = process.env.SHOPIFY_STORE_DOMAIN?.replace(/^https?:\/\//, "").split("/")[0];
const version = process.env.SHOPIFY_ADMIN_API_VERSION || "2026-04";

if (!domain) {
  console.error("Set SHOPIFY_STORE_DOMAIN");
  process.exit(1);
}

const token = await getAdminAccessToken(domain);
if (!token) {
  console.error(
    "Set SHOPIFY_ADMIN_ACCESS_TOKEN or SHOPIFY_CLIENT_ID + SHOPIFY_CLIENT_SECRET",
  );
  process.exit(1);
}

const mutation = `#graphql
  mutation CreateWishlistMetafieldDefinition($definition: MetafieldDefinitionInput!) {
    metafieldDefinitionCreate(definition: $definition) {
      createdDefinition {
        id
        namespace
        key
        access {
          customerAccount
          admin
        }
      }
      userErrors { field message code }
    }
  }
`;

const updateMutation = `#graphql
  mutation UpdateWishlistMetafieldDefinition($definition: MetafieldDefinitionUpdateInput!) {
    metafieldDefinitionUpdate(definition: $definition) {
      updatedDefinition {
        id
        namespace
        key
        access {
          customerAccount
          admin
        }
      }
      userErrors { field message code }
    }
  }
`;

const findQuery = `#graphql
  query FindWishlistDefinition {
    metafieldDefinitions(first: 20, ownerType: CUSTOMER, namespace: "harbor") {
      nodes {
        id
        key
        namespace
        access {
          customerAccount
          admin
        }
      }
    }
  }
`;

async function adminGraphql(query, variables) {
  const response = await fetch(
    `https://${domain}/admin/api/${version}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token,
      },
      body: JSON.stringify({ query, variables }),
    },
  );
  const json = await response.json();
  if (!response.ok || json.errors?.length) {
    throw new Error(JSON.stringify(json, null, 2));
  }
  return json.data;
}

const access = {
  customerAccount: "READ_WRITE",
  admin: "MERCHANT_READ_WRITE",
};

const existing = await adminGraphql(findQuery);
const current = existing.metafieldDefinitions.nodes.find(
  (node) => node.key === "wishlist",
);

if (current) {
  console.log("Found existing definition:", current.id, current.access);
  if (current.access?.customerAccount === "READ_WRITE") {
    console.log("Wishlist metafield already has Customer Account READ_WRITE.");
    process.exit(0);
  }

  const updated = await adminGraphql(updateMutation, {
    definition: {
      namespace: "harbor",
      key: "wishlist",
      ownerType: "CUSTOMER",
      access,
    },
  });
  const payload = updated.metafieldDefinitionUpdate;
  if (payload?.userErrors?.length) {
    console.error(payload.userErrors);
    process.exit(1);
  }
  console.log("Updated access:", payload?.updatedDefinition);
  process.exit(0);
}

const created = await adminGraphql(mutation, {
  definition: {
    name: "Wishlist",
    namespace: "harbor",
    key: "wishlist",
    description:
      "Product GIDs saved by the customer on the headless storefront",
    type: "json",
    ownerType: "CUSTOMER",
    access,
  },
});

const payload = created.metafieldDefinitionCreate;
if (payload?.userErrors?.length) {
  const already = payload.userErrors.some((error) =>
    String(error.message || error.code || "")
      .toLowerCase()
      .includes("taken"),
  );
  if (already) {
    console.log("Wishlist metafield definition already exists.");
    process.exit(0);
  }
  console.error(payload.userErrors);
  process.exit(1);
}

console.log("Created", payload?.createdDefinition);
