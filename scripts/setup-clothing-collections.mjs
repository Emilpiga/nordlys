#!/usr/bin/env node
/**
 * Tag apparel products and create Dam / Herr smart collections + subcategories.
 *
 *   node scripts/setup-clothing-collections.mjs --dry-run
 *   node scripts/setup-clothing-collections.mjs
 *
 * Requires Admin access via SHOPIFY_ADMIN_ACCESS_TOKEN or
 * SHOPIFY_CLIENT_ID + SHOPIFY_CLIENT_SECRET (client credentials).
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const API_VERSION = process.env.SHOPIFY_ADMIN_API_VERSION || "2026-04";

const TYPE_TAG_BY_PRODUCT_TYPE = {
  ytterkläder: "clothing:ytterklader",
  ytterklader: "clothing:ytterklader",
  toppar: "clothing:toppar",
  stickat: "clothing:stickat",
  klänningar: "clothing:klanningar",
  klanningar: "clothing:klanningar",
  byxor: "clothing:byxor",
  set: "clothing:set",
  accessoarer: "clothing:accessoarer",
};

const APPAREL_PRODUCT_TYPES = new Set([
  "ytterkläder",
  "ytterklader",
  "toppar",
  "stickat",
  "klänningar",
  "klanningar",
  "byxor",
  "set",
  "accessoarer",
  "kläder",
  "klader",
]);

/** Parent + child smart collections. Rules use tags set on products. */
const COLLECTION_DEFS = [
  {
    handle: "dam",
    title: "Dam",
    description: "Kläder för dig — jackor, toppar, stickat och mer.",
    rules: [{ column: "TAG", relation: "EQUALS", condition: "gender:women" }],
  },
  {
    handle: "herr",
    title: "Herr",
    description: "Kläder för dig — jackor, toppar, stickat och mer.",
    rules: [{ column: "TAG", relation: "EQUALS", condition: "gender:men" }],
  },
  {
    handle: "dam-ytterklader",
    title: "Dam ytterkläder",
    description: "Jackor och kappor för dam.",
    rules: [
      { column: "TAG", relation: "EQUALS", condition: "gender:women" },
      {
        column: "TAG",
        relation: "EQUALS",
        condition: "clothing:ytterklader",
      },
    ],
  },
  {
    handle: "dam-toppar",
    title: "Dam toppar",
    description: "Toppar och blusar för dam.",
    rules: [
      { column: "TAG", relation: "EQUALS", condition: "gender:women" },
      { column: "TAG", relation: "EQUALS", condition: "clothing:toppar" },
    ],
  },
  {
    handle: "dam-stickat",
    title: "Dam stickat",
    description: "Tröjor och koftor för dam.",
    rules: [
      { column: "TAG", relation: "EQUALS", condition: "gender:women" },
      { column: "TAG", relation: "EQUALS", condition: "clothing:stickat" },
    ],
  },
  {
    handle: "dam-klanningar",
    title: "Dam klänningar",
    description: "Klänningar för dam.",
    rules: [
      { column: "TAG", relation: "EQUALS", condition: "gender:women" },
      {
        column: "TAG",
        relation: "EQUALS",
        condition: "clothing:klanningar",
      },
    ],
  },
  {
    handle: "dam-byxor",
    title: "Dam byxor",
    description: "Byxor och leggings för dam.",
    rules: [
      { column: "TAG", relation: "EQUALS", condition: "gender:women" },
      { column: "TAG", relation: "EQUALS", condition: "clothing:byxor" },
    ],
  },
  {
    handle: "dam-set",
    title: "Dam set",
    description: "Matchande set för dam.",
    rules: [
      { column: "TAG", relation: "EQUALS", condition: "gender:women" },
      { column: "TAG", relation: "EQUALS", condition: "clothing:set" },
    ],
  },
  {
    handle: "dam-accessoarer",
    title: "Dam accessoarer",
    description: "Sjal, scarf och andra accessoarer för dam.",
    rules: [
      { column: "TAG", relation: "EQUALS", condition: "gender:women" },
      {
        column: "TAG",
        relation: "EQUALS",
        condition: "clothing:accessoarer",
      },
    ],
  },
  {
    handle: "herr-ytterklader",
    title: "Herr ytterkläder",
    description: "Jackor och kappor för herr.",
    rules: [
      { column: "TAG", relation: "EQUALS", condition: "gender:men" },
      {
        column: "TAG",
        relation: "EQUALS",
        condition: "clothing:ytterklader",
      },
    ],
  },
  {
    handle: "herr-toppar",
    title: "Herr toppar",
    description: "Toppar och skjortor för herr.",
    rules: [
      { column: "TAG", relation: "EQUALS", condition: "gender:men" },
      { column: "TAG", relation: "EQUALS", condition: "clothing:toppar" },
    ],
  },
  {
    handle: "herr-stickat",
    title: "Herr stickat",
    description: "Tröjor och koftor för herr.",
    rules: [
      { column: "TAG", relation: "EQUALS", condition: "gender:men" },
      { column: "TAG", relation: "EQUALS", condition: "clothing:stickat" },
    ],
  },
  {
    handle: "herr-byxor",
    title: "Herr byxor",
    description: "Byxor för herr.",
    rules: [
      { column: "TAG", relation: "EQUALS", condition: "gender:men" },
      { column: "TAG", relation: "EQUALS", condition: "clothing:byxor" },
    ],
  },
  {
    handle: "herr-accessoarer",
    title: "Herr accessoarer",
    description: "Accessoarer för herr.",
    rules: [
      { column: "TAG", relation: "EQUALS", condition: "gender:men" },
      {
        column: "TAG",
        relation: "EQUALS",
        condition: "clothing:accessoarer",
      },
    ],
  },
];

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
  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing SHOPIFY_ADMIN_ACCESS_TOKEN or SHOPIFY_CLIENT_ID/SECRET",
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
  if (!response.ok || !json.access_token) {
    throw new Error(
      `Admin token exchange failed: ${JSON.stringify(json).slice(0, 300)}`,
    );
  }
  console.log(`Admin scopes: ${json.scope || "(none)"}`);
  return json.access_token;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function normalizeType(value) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function inferTypeTag(product) {
  const fromType =
    TYPE_TAG_BY_PRODUCT_TYPE[normalizeType(product.productType || "")];
  if (fromType) return fromType;

  const blob = `${product.title} ${product.handle}`.toLowerCase();
  if (/klänning|dress|off.?shoulder/.test(blob)) return "clothing:klanningar";
  if (/sjal|shawl|scarf|accessoar/.test(blob)) return "clothing:accessoarer";
  if (/set|leggings/.test(blob)) return "clothing:set";
  if (/kofta|cardigan|tröja|sweater|pullover|stickad|knit/.test(blob)) {
    return "clothing:stickat";
  }
  if (/topp|top|blus/.test(blob)) return "clothing:toppar";
  if (/jacka|kappa|coat|jacket|raincoat|ytter/.test(blob)) {
    return "clothing:ytterklader";
  }
  return null;
}

function inferGender(product) {
  const blob = `${product.title} ${product.handle} ${product.tags.join(" ")}`.toLowerCase();
  if (
    /\bmen'?s\b|\bmens\b|\bherr\b|\bman\b|gender:men/.test(blob) &&
    !/women|womens|dam|woman/.test(blob)
  ) {
    return "gender:men";
  }
  // Current apparel catalog is women's; default apparel → women.
  return "gender:women";
}

function isApparel(product) {
  const type = normalizeType(product.productType || "");
  if (APPAREL_PRODUCT_TYPES.has(type)) return true;
  if (product.tags.some((t) => t.startsWith("clothing:") || t.startsWith("gender:"))) {
    return true;
  }
  return false;
}

async function main() {
  loadEnvFiles();
  const dryRun = process.argv.includes("--dry-run");
  const domain = process.env.SHOPIFY_STORE_DOMAIN?.trim();
  if (!domain) throw new Error("SHOPIFY_STORE_DOMAIN is required");

  const token = await getAdminAccessToken(domain);
  async function gql(query, variables) {
    const response = await fetch(
      `https://${domain}/admin/api/${API_VERSION}/graphql.json`,
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
    if (json.errors?.length) {
      throw new Error(JSON.stringify(json.errors, null, 2));
    }
    return json.data;
  }

  const products = [];
  let cursor = null;
  do {
    const data = await gql(
      `query ($c: String) {
        products(first: 100, after: $c) {
          pageInfo { hasNextPage endCursor }
          nodes { id handle title productType tags }
        }
      }`,
      { c: cursor },
    );
    products.push(...data.products.nodes);
    cursor = data.products.pageInfo.hasNextPage
      ? data.products.pageInfo.endCursor
      : null;
  } while (cursor);

  const apparel = products.filter(isApparel);
  console.log(`Found ${apparel.length} apparel products of ${products.length}`);

  for (const product of apparel) {
    const gender = inferGender(product);
    const typeTag = inferTypeTag(product);
    const nextTags = new Set(product.tags);
    nextTags.add("clothing");
    nextTags.add(gender);
    if (typeTag) nextTags.add(typeTag);

    const tags = [...nextTags].sort();
    const changed =
      tags.length !== product.tags.length ||
      tags.some((tag) => !product.tags.includes(tag));

    console.log(
      `${changed ? "TAG" : "ok "} ${product.handle} → ${tags.filter((t) => t.startsWith("gender:") || t.startsWith("clothing")).join(", ")}`,
    );

    if (!changed || dryRun) continue;

    const result = await gql(
      `mutation ($id: ID!, $tags: [String!]!) {
        tagsAdd(id: $id, tags: $tags) {
          userErrors { field message }
        }
      }`,
      {
        id: product.id,
        tags: tags.filter((tag) => !product.tags.includes(tag)),
      },
    );
    const errors = result.tagsAdd.userErrors;
    if (errors?.length) {
      throw new Error(`${product.handle}: ${JSON.stringify(errors)}`);
    }
    await sleep(250);
  }

  const existing = new Map();
  cursor = null;
  do {
    const data = await gql(
      `query ($c: String) {
        collections(first: 50, after: $c) {
          pageInfo { hasNextPage endCursor }
          nodes { id handle title }
        }
      }`,
      { c: cursor },
    );
    for (const node of data.collections.nodes) {
      existing.set(node.handle, node);
    }
    cursor = data.collections.pageInfo.hasNextPage
      ? data.collections.pageInfo.endCursor
      : null;
  } while (cursor);

  for (const def of COLLECTION_DEFS) {
    if (existing.has(def.handle)) {
      console.log(`EXISTS collection ${def.handle}`);
      continue;
    }

    console.log(
      `${dryRun ? "WOULD CREATE" : "CREATE"} ${def.handle} (${def.title})`,
    );
    if (dryRun) continue;

    const result = await gql(
      `mutation ($input: CollectionInput!) {
        collectionCreate(input: $input) {
          collection { id handle title }
          userErrors { field message }
        }
      }`,
      {
        input: {
          title: def.title,
          handle: def.handle,
          descriptionHtml: `<p>${def.description}</p>`,
          ruleSet: {
            appliedDisjunctively: false,
            rules: def.rules,
          },
        },
      },
    );

    const errors = result.collectionCreate.userErrors;
    if (errors?.length) {
      throw new Error(`${def.handle}: ${JSON.stringify(errors)}`);
    }
    console.log(`  → ${result.collectionCreate.collection.id}`);
    await sleep(300);
  }

  // Keep umbrella "klader" useful: ensure it is (or becomes) smart on clothing tag.
  if (existing.has("klader") && !dryRun) {
    const klader = existing.get("klader");
    const result = await gql(
      `mutation ($input: CollectionInput!) {
        collectionUpdate(input: $input) {
          collection { id handle }
          userErrors { field message }
        }
      }`,
      {
        input: {
          id: klader.id,
          ruleSet: {
            appliedDisjunctively: false,
            rules: [
              { column: "TAG", relation: "EQUALS", condition: "clothing" },
            ],
          },
        },
      },
    );
    const errors = result.collectionUpdate.userErrors;
    if (errors?.length) {
      console.warn(`klader update skipped: ${JSON.stringify(errors)}`);
    } else {
      console.log("UPDATED klader → smart rule tag:clothing");
    }
  }

  console.log(dryRun ? "Dry run done." : "Done.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
