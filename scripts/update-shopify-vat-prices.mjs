#!/usr/bin/env node
/**
 * Increase Shopify base prices so enabling tax-inclusive pricing does not
 * reduce the store's pre-VAT revenue.
 *
 * Dry-run by default:
 *   npm run prices:include-vat
 *
 * Apply once:
 *   npm run prices:include-vat -- --apply
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const DEFAULT_VAT_RATE = 0.25;
const SOURCE_VARIANT_COUNT = 637;
const SOURCE_PRICE_TOTAL = 258058;
const VAT_UPLIFTED_PRICE_TOTAL = 322572.5;

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

function parseArgs(argv) {
  const args = {
    apply: false,
    rate: DEFAULT_VAT_RATE,
    only: null,
    allowPriceLists: false,
    roundOnly: false,
  };
  for (const raw of argv) {
    if (raw === "--apply") args.apply = true;
    else if (raw === "--allow-price-lists") args.allowPriceLists = true;
    else if (raw === "--round-only") args.roundOnly = true;
    else if (raw.startsWith("--rate=")) args.rate = Number(raw.slice(7));
    else if (raw.startsWith("--only=")) {
      args.only = new Set(raw.slice(7).split(",").filter(Boolean));
    } else {
      throw new Error(`Unknown argument: ${raw}`);
    }
  }
  if (!Number.isFinite(args.rate) || args.rate < 0 || args.rate > 1) {
    throw new Error("--rate must be a decimal between 0 and 1.");
  }
  return args;
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
  const json = await response.json();
  if (!response.ok) {
    throw new Error(
      `Admin token exchange failed (${response.status}): ${JSON.stringify(json)}`,
    );
  }
  return json.access_token || "";
}

class ShopifyAdmin {
  constructor({ domain, token, version }) {
    this.url = `https://${domain}/admin/api/${version}/graphql.json`;
    this.token = token;
  }

  async graphql(query, variables = {}) {
    const response = await fetch(this.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": this.token,
      },
      body: JSON.stringify({ query, variables }),
    });
    const json = await response.json();
    if (!response.ok) {
      throw new Error(
        `Shopify Admin HTTP ${response.status}: ${JSON.stringify(json)}`,
      );
    }
    if (json.errors?.length) {
      throw new Error(json.errors.map((error) => error.message).join("\n"));
    }
    return json.data;
  }
}

const CATALOG_QUERY = /* GraphQL */ `
  query VatPricingCatalog($cursor: String) {
    products(first: 50, after: $cursor) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        handle
        title
        variants(first: 100) {
          nodes {
            id
            title
            sku
            price
            compareAtPrice
            inventoryItem {
              unitCost {
                amount
                currencyCode
              }
            }
          }
        }
      }
    }
    priceLists(first: 50) {
      nodes {
        id
        name
        currency
      }
    }
  }
`;

const UPDATE_VARIANTS = /* GraphQL */ `
  mutation UpdateVatInclusivePrices(
    $productId: ID!
    $variants: [ProductVariantsBulkInput!]!
  ) {
    productVariantsBulkUpdate(
      productId: $productId
      variants: $variants
      allowPartialUpdates: false
    ) {
      productVariants {
        id
        price
        compareAtPrice
      }
      userErrors {
        field
        message
      }
    }
  }
`;

function roundedVatInclusivePrice(value, rate) {
  // Whole-krona ceiling keeps the old pre-VAT revenue instead of losing a few
  // öre to conventional rounding. Example: 79 × 1.25 = 98.75 → 99 SEK.
  return Math.ceil(Number(value) * (1 + rate) - Number.EPSILON);
}

function formatMoney(value) {
  return `${Number(value).toFixed(2)} SEK`;
}

async function fetchCatalog(admin) {
  const products = [];
  let cursor = null;
  let priceLists = [];
  do {
    const data = await admin.graphql(CATALOG_QUERY, { cursor });
    products.push(...data.products.nodes);
    priceLists = data.priceLists.nodes;
    cursor = data.products.pageInfo.hasNextPage
      ? data.products.pageInfo.endCursor
      : null;
  } while (cursor);
  return { products, priceLists };
}

function assertNoUserErrors(errors, label) {
  if (errors?.length) {
    throw new Error(
      `${label}: ${errors.map((error) => error.message).join("; ")}`,
    );
  }
}

async function main() {
  loadEnvFiles();
  const args = parseArgs(process.argv.slice(2));
  const domain = process.env.SHOPIFY_STORE_DOMAIN
    ?.replace(/^https?:\/\//, "")
    .split("/")[0];
  const version = process.env.SHOPIFY_ADMIN_API_VERSION || "2026-04";
  if (!domain) throw new Error("Set SHOPIFY_STORE_DOMAIN in .env.local.");

  const token = await getAdminAccessToken(domain);
  if (!token) throw new Error("No Shopify Admin credentials are configured.");

  const admin = new ShopifyAdmin({ domain, token, version });
  const { products: allProducts, priceLists } = await fetchCatalog(admin);
  if (priceLists.length && !args.allowPriceLists) {
    throw new Error(
      `Found ${priceLists.length} Shopify price list(s). Refusing to risk a double adjustment; inspect them first or pass --allow-price-lists.`,
    );
  }

  const products = args.only
    ? allProducts.filter(
        (product) =>
          args.only.has(product.id) || args.only.has(product.handle),
      )
    : allProducts;
  const changes = products.flatMap((product) =>
    product.variants.nodes.map((variant) => {
      const price = args.roundOnly
        ? Math.ceil(Number(variant.price) - Number.EPSILON)
        : roundedVatInclusivePrice(variant.price, args.rate);
      const compareAtPrice = variant.compareAtPrice
        ? args.roundOnly
          ? Math.ceil(Number(variant.compareAtPrice) - Number.EPSILON)
          : roundedVatInclusivePrice(variant.compareAtPrice, args.rate)
        : null;
      return {
        productId: product.id,
        productTitle: product.title,
        handle: product.handle,
        variantId: variant.id,
        variantTitle: variant.title,
        sku: variant.sku,
        oldPrice: Number(variant.price),
        price,
        oldCompareAtPrice: variant.compareAtPrice
          ? Number(variant.compareAtPrice)
          : null,
        compareAtPrice,
        cost: variant.inventoryItem?.unitCost
          ? Number(variant.inventoryItem.unitCost.amount)
          : null,
      };
    }),
  );

  if (!changes.length) throw new Error("No matching variants found.");

  const currentPriceTotal = changes.reduce(
    (sum, row) => sum + row.oldPrice,
    0,
  );
  if (!args.only && !args.roundOnly) {
    if (
      changes.length !== SOURCE_VARIANT_COUNT ||
      Math.abs(currentPriceTotal - SOURCE_PRICE_TOTAL) > 0.001
    ) {
      const alreadyApplied =
        changes.length === SOURCE_VARIANT_COUNT &&
        currentPriceTotal >= VAT_UPLIFTED_PRICE_TOTAL;
      throw new Error(
        alreadyApplied
          ? "The VAT uplift has already been applied. Refusing to apply it twice."
          : "The catalog no longer matches the audited source prices. Refusing to apply an unsafe bulk uplift.",
      );
    }
  }
  if (
    !args.only &&
    args.roundOnly &&
    Math.abs(currentPriceTotal - VAT_UPLIFTED_PRICE_TOTAL) > 0.001
  ) {
    throw new Error(
      "The catalog does not match the VAT-uplifted prices awaiting whole-krona rounding.",
    );
  }

  const revenueBefore = changes.reduce(
    (sum, row) =>
      sum + (args.roundOnly ? row.oldPrice / (1 + args.rate) : row.oldPrice),
    0,
  );
  const revenueAfterVat = changes.reduce(
    (sum, row) => sum + row.price / (1 + args.rate),
    0,
  );
  const belowCost = changes.filter(
    (row) => row.cost !== null && row.price / (1 + args.rate) < row.cost,
  );

  console.log(
    `${args.apply ? "Applying" : "Previewing"} ${
      args.roundOnly
        ? "whole-krona rounding"
        : `${(args.rate * 100).toFixed(2)}% VAT uplift`
    } for ${changes.length} variants across ${products.length} products.`,
  );
  console.log(
    `Example: ${changes[0].productTitle} / ${changes[0].variantTitle}: ${formatMoney(changes[0].oldPrice)} → ${formatMoney(changes[0].price)}`,
  );
  console.log(
    `Pre-VAT catalog value is preserved: ${formatMoney(revenueBefore)} → ${formatMoney(revenueAfterVat)} after VAT extraction.`,
  );
  if (belowCost.length) {
    console.warn(
      `WARNING: ${belowCost.length} variant(s) remain below recorded product cost before shipping:`,
    );
    for (const row of belowCost) {
      console.warn(
        `  ${row.productTitle} / ${row.variantTitle}: net ${formatMoney(row.price / (1 + args.rate))}, cost ${formatMoney(row.cost)}`,
      );
    }
  }

  if (!args.apply) {
    console.log("\nDry run only. Re-run with --apply to update Shopify.");
    return;
  }

  let updated = 0;
  for (const product of products) {
    const productChanges = changes.filter(
      (row) => row.productId === product.id,
    );
    const variants = productChanges.map((row) => ({
      id: row.variantId,
      price: row.price,
      ...(row.compareAtPrice !== null
        ? { compareAtPrice: row.compareAtPrice }
        : {}),
    }));
    const data = await admin.graphql(UPDATE_VARIANTS, {
      productId: product.id,
      variants,
    });
    assertNoUserErrors(
      data.productVariantsBulkUpdate.userErrors,
      `Updating ${product.handle}`,
    );
    updated += data.productVariantsBulkUpdate.productVariants.length;
    console.log(`Updated ${product.handle} (${variants.length} variants)`);
  }

  console.log(`\nUpdated ${updated} Shopify variants.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
