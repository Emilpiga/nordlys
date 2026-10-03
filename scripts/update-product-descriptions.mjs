#!/usr/bin/env node
/**
 * Push the long-form product descriptions to Shopify.
 *
 * Copy lives in scripts/product-descriptions/<locale>.json, keyed by product
 * handle: a headline, three intro paragraphs, a benefits list, an occasion
 * paragraph and a product-information list. Swedish is the shop source; every
 * other locale file present is registered as a translation of the body.
 *
 *   npm run descriptions -- --dry-run
 *   npm run descriptions
 *   npm run descriptions -- --only=denim-jacket-long-sleeves
 *   npm run descriptions -- --locales=nb,da,fi     (translations only)
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  assertNoUserErrors,
  createShopifyAdmin,
  getAdminAccessToken,
  loadEnvFiles,
  shopDomain,
} from "./lib/shopify-admin.mjs";
import { registerTranslations } from "./lib/shopify-translations.mjs";

const SOURCE_LOCALE = "sv";
const INFO_HEADING = {
  sv: "Produktinformation",
  nb: "Produktinformasjon",
  da: "Produktinformation",
  fi: "Tuotetiedot",
};

function parseArgs(argv) {
  const args = { dryRun: false, only: null, locales: null };
  for (const raw of argv) {
    if (raw === "--dry-run") args.dryRun = true;
    else if (raw.startsWith("--only=")) args.only = raw.slice(7).split(",").filter(Boolean);
    else if (raw.startsWith("--locales=")) args.locales = raw.slice(10).split(",").filter(Boolean);
  }
  return args;
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function list(pairs) {
  const items = pairs.map(
    ([label, text]) =>
      `<li><strong>${escapeHtml(label)}:</strong> ${escapeHtml(text)}</li>`,
  );
  return `<ul>${items.join("")}</ul>`;
}

export function renderDescription(copy, locale) {
  return [
    `<h3>${escapeHtml(copy.headline)}</h3>`,
    ...copy.intro.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`),
    `<h3>${escapeHtml(copy.loveHeading)}</h3>`,
    list(copy.benefits),
    `<h3>${escapeHtml(copy.occasionHeading)}</h3>`,
    `<p>${escapeHtml(copy.occasion)}</p>`,
    `<h3>${INFO_HEADING[locale]}</h3>`,
    list(copy.info),
  ].join("");
}

function loadCopy(locale) {
  const path = resolve(process.cwd(), `scripts/product-descriptions/${locale}.json`);
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf8"));
}

async function fetchProducts(admin) {
  const products = [];
  let cursor = null;
  do {
    const data = await admin.graphql(
      `query($cursor: String) {
        products(first: 50, after: $cursor) {
          pageInfo { hasNextPage endCursor }
          nodes { id handle title }
        }
      }`,
      { cursor },
    );
    products.push(...data.products.nodes);
    cursor = data.products.pageInfo.hasNextPage
      ? data.products.pageInfo.endCursor
      : null;
  } while (cursor);
  return products;
}

async function main() {
  loadEnvFiles();
  const args = parseArgs(process.argv.slice(2));
  const locales = args.locales ?? Object.keys(INFO_HEADING);
  const copyByLocale = new Map();
  for (const locale of locales) {
    const copy = loadCopy(locale);
    if (copy) copyByLocale.set(locale, copy);
    else console.warn(`No scripts/product-descriptions/${locale}.json — skipping ${locale}`);
  }
  const source = copyByLocale.get(SOURCE_LOCALE);
  const targets = [...copyByLocale.keys()].filter((locale) => locale !== SOURCE_LOCALE);

  const domain = shopDomain();
  const access = await getAdminAccessToken(domain);
  const admin = createShopifyAdmin({ domain, token: access.token ?? access });

  let products = await fetchProducts(admin);
  if (args.only) {
    const wanted = new Set(args.only);
    products = products.filter((product) => wanted.has(product.handle));
  }

  let failed = 0;
  for (const product of products) {
    try {
      const done = [];
      if (source) {
        const copy = source[product.handle];
        if (!copy) throw new Error(`no ${SOURCE_LOCALE} copy`);
        if (!args.dryRun) {
          const result = await admin.graphql(
            `mutation($product: ProductUpdateInput!) {
              productUpdate(product: $product) { userErrors { field message } }
            }`,
            {
              product: {
                id: product.id,
                descriptionHtml: renderDescription(copy, SOURCE_LOCALE),
              },
            },
          );
          assertNoUserErrors(result.productUpdate.userErrors, "productUpdate");
        }
        done.push(SOURCE_LOCALE);
      }

      const entries = [];
      for (const locale of targets) {
        const copy = copyByLocale.get(locale)[product.handle];
        if (!copy) throw new Error(`no ${locale} copy`);
        entries.push({
          locale,
          key: "body_html",
          value: renderDescription(copy, locale),
        });
        done.push(locale);
      }
      // After the source update, so the translations carry the new digest.
      if (entries.length && !args.dryRun) {
        await registerTranslations(admin, product.id, entries);
      }
      console.log(`${args.dryRun ? "would update" : "updated"} ${product.handle} [${done.join(", ")}]`);
    } catch (error) {
      failed += 1;
      console.error(`FAILED ${product.handle}: ${error.message}`);
    }
  }

  if (failed) {
    console.error(`\nDone with ${failed} failure(s).`);
    process.exitCode = 1;
    return;
  }
  console.log(`\nDone — ${products.length} product(s).`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
