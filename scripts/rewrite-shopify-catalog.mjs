#!/usr/bin/env node
/**
 * Rewrite Shopify product copy for conversion, then localize it.
 *
 * This is not a literal translator. Supplier dumps ("Product information",
 * packing lists, stacked images) are rewritten into scannable Nordic PDP copy,
 * written as the Swedish source, then localized to every other published
 * shop language (NB / DA / FI).
 *
 * Copy is authored in scripts/catalog-copy-data.mjs (from a local catalog snapshot).
 * This script only enables locales and pushes that copy to Shopify Admin.
 *
 *   npm run translate:products -- --dry-run
 *   npm run translate:products
 *   npm run translate:products -- --only=led-tablet-reading-light-rechargeable
 *
 * Push requires SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_ACCESS_TOKEN.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { catalogCopyByHandle } from "./catalog-copy-data.mjs";

const DESIRED_LOCALES = ["sv", "nb", "da", "fi"];
const SKIP_PRODUCT_KEYS = new Set(["handle"]);
const DEFAULT_DELAY_MS = 400;
const ALLOWED_HTML_TAGS = new Set([
  "p",
  "ul",
  "ol",
  "li",
  "strong",
  "em",
  "br",
  "h3",
]);

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
    const title = text.includes("<title>")
      ? text.split("<title>")[1].split("</title>")[0]
      : text.slice(0, 240);
    throw new Error(
      `Admin token exchange failed (${response.status}): ${title}`,
    );
  }
  const json = JSON.parse(text);
  if (!json.access_token) {
    throw new Error("Admin token exchange returned no access_token.");
  }
  console.log(`Admin token scopes: ${json.scope || "(none)"}`);
  return json.access_token;
}

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
    dryRun: false,
    force: false,
    skipLocales: false,
    skipOptions: false,
    only: null,
    delayMs: DEFAULT_DELAY_MS,
    limit: Infinity,
  };
  for (const raw of argv) {
    if (raw === "--dry-run") args.dryRun = true;
    else if (raw === "--force") args.force = true;
    else if (raw === "--skip-locales") args.skipLocales = true;
    else if (raw === "--skip-options") args.skipOptions = true;
    else if (raw.startsWith("--only=")) args.only = raw.slice(7).split(",").filter(Boolean);
    else if (raw.startsWith("--delay-ms=")) args.delayMs = Number(raw.slice(11)) || DEFAULT_DELAY_MS;
    else if (raw.startsWith("--limit=")) args.limit = Number(raw.slice(8)) || Infinity;
  }
  return args;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function stripHtml(html) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizeCopyHtml(html) {
  if (!html) return "";
  let cleaned = String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<img\b[^>]*>/gi, "")
    .replace(/<picture\b[^>]*>[\s\S]*?<\/picture>/gi, "")
    .replace(/\s(?:class|id|style|data-[\w-]+)="[^"]*"/gi, "")
    .replace(/<\/?span\b[^>]*>/gi, "")
    .replace(/<\/?div\b[^>]*>/gi, "")
    .replace(/<\/?b>/gi, (tag) => (tag === "<b>" ? "<strong>" : "</strong>"));

  cleaned = cleaned.replace(/<\/?([a-z0-9]+)([^>]*)>/gi, (full, tag) => {
    const name = tag.toLowerCase();
    if (name === "br") return "<br />";
    if (!ALLOWED_HTML_TAGS.has(name)) return "";
    return full;
  });

  cleaned = cleaned
    .replace(/<(p|li|h3|ul|ol)([^>]*)>(\s|&nbsp;|<br\s*\/?>)*<\/\1>/gi, "")
    .replace(/(<br\s*\/?>\s*){3,}/gi, "<br /><br />")
    .trim();

  const text = stripHtml(cleaned);
  if (text.length < 40) {
    throw new Error("Rewritten description is too short after sanitizing HTML.");
  }
  if (!/<p[\s>]/i.test(cleaned) || !/<ul[\s>]/i.test(cleaned)) {
    throw new Error("Rewritten description must include an opening <p> and a <ul> of benefits.");
  }
  return cleaned;
}

function getLocalCopy(product) {
  const source = catalogCopyByHandle.get(product.handle);
  if (!source) {
    throw new Error(
      `No local copy for ${product.handle}. Add it to scripts/catalog-copy-data.mjs`,
    );
  }
  const copy = { handle: source.handle };
  for (const locale of ["sv", "nb", "da", "fi"]) {
    if (!source[locale]?.title || !source[locale]?.body_html) {
      throw new Error(`Incomplete copy for ${locale} (${product.handle}).`);
    }
    copy[locale] = {
      ...source[locale],
      body_html: sanitizeCopyHtml(source[locale].body_html),
    };
  }
  return copy;
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

    const cost = json.extensions?.cost?.throttleStatus;
    if (cost && cost.currentlyAvailable < 80) {
      const waitMs = Math.ceil(
        ((80 - cost.currentlyAvailable) / Math.max(cost.restoreRate, 1)) * 1000,
      );
      await sleep(Math.min(Math.max(waitMs, 400), 8000));
    }

    return json.data;
  }
}

const SHOP_LOCALES_QUERY = /* GraphQL */ `
  query ShopLocales {
    shopLocales {
      locale
      name
      primary
      published
    }
  }
`;

const PRODUCTS_QUERY = /* GraphQL */ `
  query CatalogProducts($cursor: String) {
    products(first: 25, after: $cursor) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        handle
        title
        descriptionHtml
        status
        seo {
          title
          description
        }
        options {
          id
          name
          optionValues {
            id
            name
          }
        }
      }
    }
  }
`;

const TRANSLATABLE_QUERY = /* GraphQL */ `
  query Translatable($resourceId: ID!) {
    translatableResource(resourceId: $resourceId) {
      resourceId
      translatableContent {
        key
        value
        digest
        locale
      }
    }
  }
`;

const PRODUCT_UPDATE = /* GraphQL */ `
  mutation UpdateProduct($product: ProductUpdateInput!) {
    productUpdate(product: $product) {
      product {
        id
        title
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const OPTION_UPDATE = /* GraphQL */ `
  mutation UpdateOption(
    $productId: ID!
    $option: OptionUpdateInput!
    $optionValuesToUpdate: [OptionValueUpdateInput!]
  ) {
    productOptionUpdate(
      productId: $productId
      option: $option
      optionValuesToUpdate: $optionValuesToUpdate
    ) {
      userErrors {
        field
        message
      }
    }
  }
`;

const TRANSLATIONS_REGISTER = /* GraphQL */ `
  mutation RegisterTranslations(
    $resourceId: ID!
    $translations: [TranslationInput!]!
  ) {
    translationsRegister(resourceId: $resourceId, translations: $translations) {
      userErrors {
        field
        message
      }
    }
  }
`;

const LOCALE_ENABLE = /* GraphQL */ `
  mutation EnableLocale($locale: String!) {
    shopLocaleEnable(locale: $locale) {
      userErrors {
        field
        message
      }
      shopLocale {
        locale
        published
        primary
      }
    }
  }
`;

const LOCALE_PUBLISH = /* GraphQL */ `
  mutation PublishLocale($locale: String!) {
    shopLocaleUpdate(locale: $locale, shopLocale: { published: true }) {
      userErrors {
        field
        message
      }
      shopLocale {
        locale
        published
        primary
      }
    }
  }
`;

function assertNoUserErrors(userErrors, label) {
  if (userErrors?.length) {
    throw new Error(
      `${label}: ${userErrors.map((error) => error.message).join("; ")}`,
    );
  }
}

async function ensureLocales(admin, { dryRun }) {
  const data = await admin.graphql(SHOP_LOCALES_QUERY);
  const existing = new Map(
    data.shopLocales.map((locale) => [locale.locale, locale]),
  );
  const primary = data.shopLocales.find((locale) => locale.primary);
  console.log(
    `Shop locales: ${data.shopLocales
      .map(
        (locale) =>
          `${locale.locale}${locale.primary ? "*" : ""}${locale.published ? "" : " (unpublished)"}`,
      )
      .join(", ") || "(none)"}`,
  );

  for (const locale of DESIRED_LOCALES) {
    if (locale === primary?.locale) continue;
    const current = existing.get(locale);
    if (current?.published) continue;

    if (dryRun) {
      console.log(`  would enable+publish ${locale}`);
      continue;
    }

    if (!current) {
      const enabled = await admin.graphql(LOCALE_ENABLE, { locale });
      assertNoUserErrors(enabled.shopLocaleEnable.userErrors, `enable ${locale}`);
    }
    const published = await admin.graphql(LOCALE_PUBLISH, { locale });
    assertNoUserErrors(published.shopLocaleUpdate.userErrors, `publish ${locale}`);
    console.log(`  published ${locale}`);
  }

  const refreshed = await admin.graphql(SHOP_LOCALES_QUERY);
  return refreshed.shopLocales;
}

async function fetchProducts(admin) {
  const products = [];
  let cursor = null;
  do {
    const data = await admin.graphql(PRODUCTS_QUERY, { cursor });
    products.push(...data.products.nodes);
    cursor = data.products.pageInfo.hasNextPage
      ? data.products.pageInfo.endCursor
      : null;
  } while (cursor);
  return products;
}

function optionCopy(copyEntry, sourceName) {
  return copyEntry.options.find(
    (option) => option.sourceName?.toLowerCase() === sourceName.toLowerCase(),
  );
}

function optionValueCopy(optionEntry, sourceName) {
  if (!optionEntry?.values) return sourceName;
  return (
    optionEntry.values[sourceName] ||
    optionEntry.values[sourceName.trim()] ||
    sourceName
  );
}

async function registerTranslations(admin, resourceId, translations) {
  if (!translations.length) return;
  for (let i = 0; i < translations.length; i += 40) {
    const chunk = translations.slice(i, i + 40);
    const data = await admin.graphql(TRANSLATIONS_REGISTER, {
      resourceId,
      translations: chunk,
    });
    assertNoUserErrors(
      data.translationsRegister.userErrors,
      `translations ${resourceId}`,
    );
  }
}

async function digestMap(admin, resourceId) {
  const data = await admin.graphql(TRANSLATABLE_QUERY, { resourceId });
  const map = new Map();
  for (const field of data.translatableResource?.translatableContent ?? []) {
    map.set(field.key, field);
  }
  return map;
}

function fieldTranslation(digest, locale, key, value) {
  const field = digest.get(key);
  if (!field?.digest || !value) return null;
  if (field.locale === locale) return null;
  return {
    key,
    locale,
    value,
    translatableContentDigest: field.digest,
  };
}

async function applyProduct(admin, product, copy, shopLocales, args) {
  const primary = shopLocales.find((locale) => locale.primary)?.locale || "sv";
  const primaryCopy = copy[primary] || copy.sv;
  if (!primaryCopy) throw new Error(`No copy for primary locale ${primary}`);

  const targetLocales = shopLocales
    .filter((locale) => locale.published && locale.locale !== primary)
    .map((locale) => locale.locale)
    .filter((locale) => copy[locale] || (locale === "no" && copy.nb));

  console.log(`\n${product.handle}`);
  console.log(`  ${product.title} → ${primaryCopy.title}`);

  if (args.dryRun) {
    console.log(`  ${stripHtml(primaryCopy.body_html).slice(0, 180)}…`);
    return;
  }

  const updated = await admin.graphql(PRODUCT_UPDATE, {
    product: {
      id: product.id,
      title: primaryCopy.title,
      descriptionHtml: primaryCopy.body_html,
      seo: {
        title: primaryCopy.meta_title,
        description: primaryCopy.meta_description,
      },
    },
  });
  assertNoUserErrors(updated.productUpdate.userErrors, "productUpdate");

  if (!args.skipOptions) {
    for (const option of product.options) {
      const mapped = optionCopy(primaryCopy, option.name);
      if (!mapped) continue;
      const values = option.optionValues
        .map((value) => {
          const name = optionValueCopy(mapped, value.name);
          if (name === value.name) return null;
          return { id: value.id, name };
        })
        .filter(Boolean);

      const renameOption = mapped.name && mapped.name !== option.name;
      if (!renameOption && values.length === 0) continue;

      const data = await admin.graphql(OPTION_UPDATE, {
        productId: product.id,
        option: {
          id: option.id,
          ...(renameOption ? { name: mapped.name } : {}),
        },
        optionValuesToUpdate: values,
      });
      assertNoUserErrors(
        data.productOptionUpdate.userErrors,
        `option ${option.name}`,
      );
    }
  }

  const productDigest = await digestMap(admin, product.id);
  const productTranslations = [];
  for (const locale of targetLocales) {
    const localized = copy[locale] || (locale === "no" ? copy.nb : null);
    if (!localized) continue;
    for (const [key, value] of [
      ["title", localized.title],
      ["body_html", localized.body_html],
      ["meta_title", localized.meta_title],
      ["meta_description", localized.meta_description],
    ]) {
      if (SKIP_PRODUCT_KEYS.has(key)) continue;
      const row = fieldTranslation(productDigest, locale, key, value);
      if (row) productTranslations.push(row);
    }
  }
  await registerTranslations(admin, product.id, productTranslations);

  if (args.skipOptions) return;

  for (const option of product.options) {
    const optionDigest = await digestMap(admin, option.id);
    const optionTranslations = [];
    for (const locale of targetLocales) {
      const localized = copy[locale] || (locale === "no" ? copy.nb : null);
      const mapped = localized ? optionCopy(localized, option.name) : null;
      if (!mapped?.name) continue;
      const row = fieldTranslation(optionDigest, locale, "name", mapped.name);
      if (row) optionTranslations.push(row);
    }
    await registerTranslations(admin, option.id, optionTranslations);

    for (const value of option.optionValues) {
      const valueDigest = await digestMap(admin, value.id);
      const valueTranslations = [];
      for (const locale of targetLocales) {
        const localized = copy[locale] || (locale === "no" ? copy.nb : null);
        const mapped = localized ? optionCopy(localized, option.name) : null;
        const name = mapped ? optionValueCopy(mapped, value.name) : null;
        if (!name) continue;
        const row = fieldTranslation(valueDigest, locale, "name", name);
        if (row) valueTranslations.push(row);
      }
      await registerTranslations(admin, value.id, valueTranslations);
    }
  }
}

async function main() {
  loadEnvFiles();
  const args = parseArgs(process.argv.slice(2));

  const domain = process.env.SHOPIFY_STORE_DOMAIN?.replace(/^https?:\/\//, "").split("/")[0];
  const version = process.env.SHOPIFY_ADMIN_API_VERSION || "2026-04";

  if (!domain) {
    throw new Error("Set SHOPIFY_STORE_DOMAIN in .env.local");
  }

  const token = await getAdminAccessToken(domain);

  if (!token) {
    if (!args.dryRun) {
      throw new Error(
        "Copy is ready locally in scripts/catalog-copy-data.mjs. To push it, set SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET (Dev Dashboard app installed on the shop) or SHOPIFY_ADMIN_ACCESS_TOKEN.",
      );
    }
    const snapshotPath = resolve(process.cwd(), "scripts/catalog-snapshot.json");
    if (!existsSync(snapshotPath)) {
      throw new Error("No Admin token and no scripts/catalog-snapshot.json for dry-run.");
    }
    const snapshot = JSON.parse(readFileSync(snapshotPath, "utf8"));
    let products = snapshot.data?.products?.nodes ?? snapshot;
    if (args.only) {
      const wanted = new Set(args.only);
      products = products.filter(
        (product) => wanted.has(product.handle) || wanted.has(product.id),
      );
    }
    products = products.slice(0, args.limit);
    console.log(`Dry run from local snapshot (${products.length} products)\n`);
    for (const product of products) {
      const copy = getLocalCopy(product);
      console.log(`${product.handle}`);
      console.log(`  was: ${product.title}`);
      for (const locale of ["sv", "nb", "da", "fi"]) {
        console.log(`  ${locale}: ${copy[locale].title}`);
      }
      console.log(`  ${stripHtml(copy.sv.body_html).slice(0, 220)}\n`);
    }
    console.log("Add SHOPIFY_ADMIN_ACCESS_TOKEN to push this copy to Shopify.");
    return;
  }

  if (!token.startsWith("shpat_") && !token.startsWith("shpua_")) {
    console.warn(
      "SHOPIFY_ADMIN_ACCESS_TOKEN does not look like an Admin token (shpat_…). Storefront tokens cannot write translations.",
    );
  }

  const admin = new ShopifyAdmin({ domain, token, version });
  const shopLocales = args.skipLocales
    ? (await admin.graphql(SHOP_LOCALES_QUERY)).shopLocales
    : await ensureLocales(admin, args);

  let products = await fetchProducts(admin);
  if (args.only) {
    const wanted = new Set(args.only);
    products = products.filter(
      (product) => wanted.has(product.handle) || wanted.has(product.id),
    );
  }
  products = products.slice(0, args.limit);

  console.log(
    `Pushing local copy for ${products.length} product(s)` +
      (args.dryRun ? " (dry run)" : ""),
  );

  let failed = 0;
  for (const [index, product] of products.entries()) {
    try {
      const copy = getLocalCopy(product);
      await applyProduct(admin, product, copy, shopLocales, args);
    } catch (error) {
      failed += 1;
      console.error(`  FAILED ${product.handle}: ${error.message}`);
    }
    if (index < products.length - 1) {
      await sleep(args.delayMs);
    }
  }

  if (failed) {
    console.error(`\nDone with ${failed} failure(s).`);
    process.exitCode = 1;
    return;
  }
  console.log("\nDone.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
