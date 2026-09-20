#!/usr/bin/env node
/**
 * Flags products the storefront shows as sold out even though Shopify holds
 * stock for them.
 *
 *   node scripts/check-market-availability.mjs
 *   node scripts/check-market-availability.mjs slim-knit-cardigan
 *
 * Why this happens: the storefront queries with `@inContext(country: SE)`, so
 * Shopify only counts inventory it can actually ship to the Swedish market.
 * Stock at the `cjdropshipping` fulfillment location is invisible there unless
 * the product sits in a shipping profile that ships from that location to
 * Sweden. New products land in the General profile instead, so every variant
 * reports availableForSale: false and the whole option picker renders as
 * struck-through.
 *
 * Fix anything this reports with:
 *   node scripts/fix-cj-shipping-profile.mjs
 */

import {
  loadEnvFiles,
  shopDomain,
  getAdminAccessToken,
  createShopifyAdmin,
} from "./lib/shopify-admin.mjs";
import {
  createShopifyStorefront,
  marketAvailability,
  marketContext,
} from "./lib/shopify-storefront.mjs";

loadEnvFiles(process.cwd());

const domain = shopDomain();
const context = marketContext();
const storefront = createShopifyStorefront({ domain });

export async function adminInventory(admin) {
  const byHandle = new Map();
  let after = null;
  for (;;) {
    const data = await admin.graphql(
      `query($after: String) {
        products(first: 100, after: $after, sortKey: CREATED_AT) {
          pageInfo { hasNextPage endCursor }
          nodes {
            handle
            status
            createdAt
            totalInventory
          }
        }
      }`,
      { after },
    );
    for (const node of data.products.nodes) byHandle.set(node.handle, node);
    if (!data.products.pageInfo.hasNextPage) break;
    after = data.products.pageInfo.endCursor;
  }
  return byHandle;
}

/** Splits the catalog into what the market can buy and what it can't. */
export async function marketReport(admin, handles = new Set()) {
  const [live, stocked] = await Promise.all([
    marketAvailability(storefront, context),
    adminInventory(admin),
  ]);

  const broken = [];
  const sellable = [];
  for (const [handle, product] of stocked) {
    const seen = live.get(handle);
    if (!seen) continue;
    if (seen.sellable > 0) sellable.push(handle);
    if (handles.size > 0 && !handles.has(handle)) continue;
    if (product.totalInventory > 0 && seen.sellable === 0) {
      broken.push({ handle, ...product, ...seen });
    }
  }
  return {
    broken,
    sellable,
    checked: handles.size > 0 ? handles.size : stocked.size,
  };
}

async function main() {
  const tokenResult = await getAdminAccessToken(domain);
  const admin = createShopifyAdmin({
    domain,
    token: typeof tokenResult === "string" ? tokenResult : tokenResult.token,
  });

  const { broken, checked } = await marketReport(
    admin,
    new Set(process.argv.slice(2)),
  );

  if (broken.length === 0) {
    console.log(`All ${checked} product(s) sellable in ${context.country}.`);
    return;
  }

  console.log(
    `${broken.length}/${checked} product(s) hold stock but are sold out in ${context.country}:\n`,
  );
  for (const product of broken) {
    console.log(
      `  ${product.handle.padEnd(44)} stock=${String(product.totalInventory).padStart(7)} variants=${product.variants} created=${product.createdAt}`,
    );
  }
  console.log("\nFix: node scripts/fix-cj-shipping-profile.mjs");
  process.exitCode = 1;
}

if (import.meta.filename === process.argv[1]) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
