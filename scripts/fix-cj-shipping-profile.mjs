#!/usr/bin/env node
/**
 * Moves CJ products into the shipping profile that can ship from the
 * `cjdropshipping` fulfillment location to the storefront's market.
 *
 *   node scripts/fix-cj-shipping-profile.mjs --dry-run
 *   node scripts/fix-cj-shipping-profile.mjs
 *   node scripts/fix-cj-shipping-profile.mjs slim-knit-cardigan another-handle
 *   node scripts/fix-cj-shipping-profile.mjs --profile="Postnord"
 *
 * Shopify puts every newly created product in the General profile. That
 * profile has no way to ship from CJ's location to Sverige, so the Storefront
 * API answers `availableForSale: false` for every variant under
 * `@inContext(country: SE)` — the product page then strikes through the whole
 * variant picker and the cart refuses the line with MERCHANDISE_OUT_OF_STOCK,
 * even though Admin shows thousands of units at CJ.
 *
 * Needs `write_shipping` on the Admin app (Admin → Settings → Apps → Develop
 * apps → your app → Configuration → Admin API scopes). Without it Shopify
 * answers "Access denied for deliveryProfiles field".
 */

import {
  loadEnvFiles,
  shopDomain,
  getAdminAccessToken,
  createShopifyAdmin,
  assertNoUserErrors,
  sleep,
} from "./lib/shopify-admin.mjs";
import { marketContext } from "./lib/shopify-storefront.mjs";
import { marketReport } from "./check-market-availability.mjs";

loadEnvFiles(process.cwd());

const CJ_LOCATION_NAME = "cjdropshipping";
const VARIANTS_PER_CALL = 100;

function parseArgs(argv) {
  const args = { dryRun: false, profile: null, handles: new Set() };
  for (const arg of argv) {
    if (arg === "--dry-run") args.dryRun = true;
    else if (arg.startsWith("--profile=")) args.profile = arg.slice(10);
    else if (!arg.startsWith("--")) args.handles.add(arg);
  }
  return args;
}

async function loadDeliveryProfiles(admin) {
  try {
    const data = await admin.graphql(`query {
      deliveryProfiles(first: 20) {
        nodes {
          id
          name
          default
          profileLocationGroups {
            locationGroup { id locations(first: 20) { nodes { id name } } }
            locationGroupZones(first: 20) {
              nodes {
                zone { name countries { code { countryCode restOfWorld } } }
                methodDefinitions(first: 10) { nodes { name active } }
              }
            }
          }
        }
      }
    }`);
    return data.deliveryProfiles.nodes;
  } catch (error) {
    if (/Access denied/i.test(error.message)) {
      throw new Error(
        "Admin app is missing the `write_shipping` scope — add it, then re-run.\n" +
          "Manual alternative: Admin → Settings → Shipping and delivery → the\n" +
          `profile that ships from \`${CJ_LOCATION_NAME}\` to Sverige → Add products.`,
      );
    }
    throw error;
  }
}

/** The profile the products that *do* sell in this market already use. */
async function profileOfSellableProducts(admin, sellableHandles) {
  const tally = new Map();
  for (const handle of sellableHandles.slice(0, 5)) {
    const data = await admin.graphql(
      `query($q: String!) {
        products(first: 1, query: $q) {
          nodes { variants(first: 1) { nodes { deliveryProfile { id name } } } }
        }
      }`,
      { q: `handle:${handle}` },
    );
    const profile =
      data.products.nodes[0]?.variants.nodes[0]?.deliveryProfile ?? null;
    if (!profile) continue;
    const seen = tally.get(profile.id) ?? { profile, count: 0 };
    seen.count += 1;
    tally.set(profile.id, seen);
  }
  return [...tally.values()].sort((a, b) => b.count - a.count)[0]?.profile ?? null;
}

/**
 * Profile that can ship CJ stock into the storefront's market. CJ's location
 * is a fulfillment service, so it never shows up in a profile's location
 * groups — the reliable signal is which profile the already-sellable products
 * use. Zone coverage is only the fallback.
 */
function pickByZone(profiles, country) {
  const candidates = profiles.filter((profile) =>
    profile.profileLocationGroups.some((group) =>
      group.locationGroupZones.nodes.some(
        (node) =>
          node.zone.countries.some(
            (entry) =>
              entry.code.restOfWorld || entry.code.countryCode === country,
          ) && node.methodDefinitions.nodes.some((method) => method.active),
      ),
    ),
  );
  return candidates.find((profile) => !profile.default) ?? candidates[0] ?? null;
}

async function variantIdsFor(admin, handles) {
  const ids = [];
  for (const handle of handles) {
    let after = null;
    for (;;) {
      const data = await admin.graphql(
        `query($q: String!, $after: String) {
          products(first: 1, query: $q) {
            nodes {
              variants(first: 250, after: $after) {
                pageInfo { hasNextPage endCursor }
                nodes { id }
              }
            }
          }
        }`,
        { q: `handle:${handle}`, after },
      );
      const product = data.products.nodes[0];
      if (!product) break;
      ids.push(...product.variants.nodes.map((variant) => variant.id));
      if (!product.variants.pageInfo.hasNextPage) break;
      after = product.variants.pageInfo.endCursor;
    }
  }
  return ids;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { country } = marketContext();
  const domain = shopDomain();
  const tokenResult = await getAdminAccessToken(domain);
  const admin = createShopifyAdmin({
    domain,
    token: typeof tokenResult === "string" ? tokenResult : tokenResult.token,
  });

  const profiles = await loadDeliveryProfiles(admin);
  const { broken, sellable } = await marketReport(admin, args.handles);

  let profile = null;
  if (args.profile) {
    profile = profiles.find((entry) => entry.name === args.profile);
    if (!profile) {
      throw new Error(
        `No shipping profile named "${args.profile}". Found: ${profiles
          .map((entry) => entry.name)
          .join(", ")}`,
      );
    }
  } else {
    const reference = await profileOfSellableProducts(admin, sellable);
    profile = reference
      ? profiles.find((entry) => entry.id === reference.id) ?? reference
      : pickByZone(profiles, country);
  }
  if (!profile) {
    throw new Error(
      `No shipping profile reaches ${country} from \`${CJ_LOCATION_NAME}\`.\n` +
        "Add rates for that market first. Profiles seen: " +
        profiles.map((entry) => entry.name).join(", "),
    );
  }
  console.log(`Shipping profile: ${profile.name} (${profile.id})`);

  const handles =
    args.handles.size > 0 ? [...args.handles] : broken.map((p) => p.handle);
  if (handles.length === 0) {
    console.log(
      `Nothing to fix — every stocked product is sellable in ${country}.`,
    );
    return;
  }
  console.log(`Products to move (${handles.length}):\n  ${handles.join("\n  ")}`);

  const variantIds = await variantIdsFor(admin, handles);
  console.log(`Variants: ${variantIds.length}`);
  if (args.dryRun) {
    console.log("[dry-run] no changes made");
    return;
  }

  for (let i = 0; i < variantIds.length; i += VARIANTS_PER_CALL) {
    const chunk = variantIds.slice(i, i + VARIANTS_PER_CALL);
    const data = await admin.graphql(
      `mutation($id: ID!, $profile: DeliveryProfileInput!) {
        deliveryProfileUpdate(id: $id, profile: $profile) {
          profile { id name }
          userErrors { field message }
        }
      }`,
      { id: profile.id, profile: { variantsToAssociate: chunk } },
    );
    assertNoUserErrors(
      data.deliveryProfileUpdate.userErrors,
      "deliveryProfileUpdate",
    );
    console.log(`  associated ${i + chunk.length}/${variantIds.length}`);
  }

  await sleep(10000);
  const after = await marketReport(admin, new Set(handles));
  if (after.broken.length === 0) {
    console.log(`\nAll ${handles.length} product(s) now sellable in ${country}.`);
    return;
  }
  console.log(
    `\nStill sold out in ${country} (Shopify can lag a minute — re-check with` +
      ` npm run check:availability):\n  ${after.broken.map((p) => p.handle).join("\n  ")}`,
  );
  process.exitCode = 1;
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
