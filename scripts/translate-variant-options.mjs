#!/usr/bin/env node
/**
 * Rename Shopify option labels into Swedish (and sensible axes) without
 * recreating variants. CJ links on variant id + SKU, so this only calls
 * productOptionUpdate. Norwegian, Danish, and Finnish are registered as
 * translations of the new Swedish source.
 *
 * Usage: node scripts/translate-variant-options.mjs [--apply]
 */

import {
  assertNoUserErrors,
  createShopifyAdmin,
  getAdminAccessToken,
  loadEnvFiles,
  shopDomain,
} from "./lib/shopify-admin.mjs";

function loc(sv, nb, da, fi) {
  return { sv, nb, da, fi };
}

const OPTION_NAMES = {
  color: loc("Färg", "Farge", "Farve", "Väri"),
  size: loc("Storlek", "Størrelse", "Størrelse", "Koko"),
  style: loc("Utförande", "Utførelse", "Udførelse", "Toteutus"),
};

/** Axis that is not really a size or a color. */
const OPTION_NAME_OVERRIDES = {
  "resin-statue-led-light-ornaments": {
    size: loc("Utförande", "Utførelse", "Udførelse", "Toteutus"),
  },
  "fleece-shark-leggings": {
    size: loc("Vikt", "Vekt", "Vægt", "Paino"),
  },
};

const VALUES = {
  apricot: loc("Aprikos", "Aprikos", "Abrikos", "Aprikoosi"),
  "army green": loc("Armégrön", "Armygrønn", "Armygrøn", "Armeijanvihreä"),
  beige: loc("Beige", "Beige", "Beige", "Beige"),
  black: loc("Svart", "Svart", "Sort", "Musta"),
  "black 2": loc("Svart 2", "Svart 2", "Sort 2", "Musta 2"),
  "black gray": loc("Svartgrå", "Svartgrå", "Sortgrå", "Mustaharmaa"),
  "black grey": loc("Svartgrå", "Svartgrå", "Sortgrå", "Mustaharmaa"),
  blue: loc("Blå", "Blå", "Blå", "Sininen"),
  brown: loc("Brun", "Brun", "Brun", "Ruskea"),
  camel: loc("Kamel", "Kamel", "Kamel", "Kameli"),
  coffee: loc("Kaffe", "Kaffe", "Kaffe", "Kahvi"),
  "dark blue": loc("Mörkblå", "Mørkeblå", "Mørkeblå", "Tummansininen"),
  "dark gray": loc("Mörkgrå", "Mørkegrå", "Mørkegrå", "Tummanharmaa"),
  "dark grey": loc("Mörkgrå", "Mørkegrå", "Mørkegrå", "Tummanharmaa"),
  "dark red": loc("Mörkröd", "Mørkerød", "Mørkerød", "Tummanpunainen"),
  "deep coffee": loc("Mörk kaffe", "Mørk kaffe", "Mørk kaffe", "Tumma kahvi"),
  gray: loc("Grå", "Grå", "Grå", "Harmaa"),
  green: loc("Grön", "Grønn", "Grøn", "Vihreä"),
  grey: loc("Grå", "Grå", "Grå", "Harmaa"),
  khaki: loc("Khaki", "Khaki", "Khaki", "Khaki"),
  "light blue": loc("Ljusblå", "Lyseblå", "Lyseblå", "Vaaleansininen"),
  "light gray": loc("Ljusgrå", "Lysegrå", "Lysegrå", "Vaaleanharmaa"),
  "light grey": loc("Ljusgrå", "Lysegrå", "Lysegrå", "Vaaleanharmaa"),
  "light green": loc("Ljusgrön", "Lysegrønn", "Lysegrøn", "Vaaleanvihreä"),
  "navy blue": loc("Marinblå", "Marineblå", "Marineblå", "Laivastonsininen"),
  orange: loc("Orange", "Oransje", "Orange", "Oranssi"),
  pink: loc("Rosa", "Rosa", "Rosa", "Vaaleanpunainen"),
  red: loc("Röd", "Rød", "Rød", "Punainen"),
  "skin colour": loc("Hudfärg", "Hudfarge", "Hudfarve", "Ihonsävy"),
  "skin color": loc("Hudfärg", "Hudfarge", "Hudfarve", "Ihonsävy"),
  white: loc("Vit", "Hvit", "Hvid", "Valkoinen"),
  "wine red": loc("Vinröd", "Vinrød", "Vinrød", "Viininpunainen"),
  yellow: loc("Gul", "Gul", "Gul", "Keltainen"),
  one: loc("En storlek", "Én størrelse", "Én størrelse", "Yksi koko"),
  xs: loc("XS", "XS", "XS", "XS"),
  "2xl": loc("XXL", "XXL", "XXL", "XXL"),
  "3xl": loc("XXXL", "XXXL", "XXXL", "XXXL"),
  "500g": loc("500 g", "500 g", "500 g", "500 g"),
  "650g": loc("650 g", "650 g", "650 g", "650 g"),
  cat: loc("Katt", "Katt", "Kat", "Kissa"),
  raccoon: loc("Tvättbjörn", "Vaskebjørn", "Vaskebjørn", "Pesukarhu"),
  "button style": loc("Knappbatteri", "Knappbatteri", "Knapbatteri", "Nappiparisto"),
  "button battery": loc("Knappbatteri", "Knappbatteri", "Knapbatteri", "Nappiparisto"),
  "usb independent switch type": loc(
    "USB, separat strömbrytare",
    "USB, egen strømbryter",
    "USB, separat kontakt",
    "USB, erillinen kytkin",
  ),
  owl: loc("Uggla", "Ugle", "Ugle", "Pöllö"),
  turtle: loc("Sköldpadda", "Skilpadde", "Skildpadde", "Kilpikonna"),
  poodle: loc("Pudel", "Puddel", "Puddel", "Villakoira"),
  "the labrador retriever": loc("Labrador", "Labrador", "Labrador", "Labrador"),
};

const PRODUCTS_QUERY = /* GraphQL */ `
  query OptionProducts($cursor: String) {
    products(first: 50, after: $cursor) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        handle
        title
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

const TRANSLATABLE_QUERY = /* GraphQL */ `
  query Translatable($resourceId: ID!) {
    translatableResource(resourceId: $resourceId) {
      translatableContent {
        key
        digest
        locale
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

function valueCopy(name) {
  return VALUES[name.trim().toLowerCase()] || null;
}

function optionNameCopy(handle, name) {
  const key = name.trim().toLowerCase();
  return OPTION_NAME_OVERRIDES[handle]?.[key] || OPTION_NAMES[key] || null;
}

function planOption(product, option) {
  const nameCopy = optionNameCopy(product.handle, option.name);
  const nextName = nameCopy?.sv && nameCopy.sv !== option.name ? nameCopy.sv : null;
  const values = [];
  for (const value of option.optionValues) {
    const mapped = valueCopy(value.name);
    if (!mapped || mapped.sv === value.name) continue;
    if (
      option.optionValues.some(
        (other) => other.id !== value.id && other.name === mapped.sv,
      )
    ) {
      throw new Error(
        `${product.handle}: "${value.name}" → "${mapped.sv}" collides with an existing value`,
      );
    }
    values.push({ id: value.id, from: value.name, to: mapped, rename: true });
  }
  // Two different English values must not collapse onto one Swedish label.
  const targets = values.filter((value) => value.rename).map((value) => value.to.sv);
  if (new Set(targets).size !== targets.length) {
    throw new Error(
      `${product.handle} / ${option.name}: two values would share a Swedish name (${targets.join(", ")})`,
    );
  }
  if (!nextName && values.length === 0) return null;
  return { option, nameCopy, nextName, values };
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

async function digestMap(admin, resourceId) {
  const data = await admin.graphql(TRANSLATABLE_QUERY, { resourceId });
  const map = new Map();
  for (const field of data.translatableResource?.translatableContent ?? []) {
    map.set(field.key, field);
  }
  return map;
}

async function registerTranslations(admin, resourceId, translations) {
  if (!translations.length) return;
  const data = await admin.graphql(TRANSLATIONS_REGISTER, {
    resourceId,
    translations,
  });
  assertNoUserErrors(
    data.translationsRegister.userErrors,
    `translations ${resourceId}`,
  );
}

async function translateResource(admin, resourceId, copy, shopLocales) {
  if (!copy) return;
  const digest = await digestMap(admin, resourceId);
  const field = digest.get("name");
  if (!field?.digest) return;
  const rows = [];
  for (const locale of shopLocales) {
    if (locale.primary || locale.locale === field.locale) continue;
    const code = locale.locale === "no" ? "nb" : locale.locale;
    const value = copy[code];
    if (!value || value === copy.sv) continue;
    rows.push({
      key: "name",
      locale: locale.locale,
      value,
      translatableContentDigest: field.digest,
    });
  }
  await registerTranslations(admin, resourceId, rows);
}

async function main() {
  loadEnvFiles();
  const apply = process.argv.includes("--apply");
  const domain = shopDomain();
  const tokenResult = await getAdminAccessToken(domain);
  const token = typeof tokenResult === "string" ? tokenResult : tokenResult.token;
  const admin = createShopifyAdmin({ domain, token });

  const products = await fetchProducts(admin);
  const plans = [];
  for (const product of products) {
    const options = product.options.map((option) => planOption(product, option)).filter(Boolean);
    if (options.length) plans.push({ product, options });
  }

  console.log(
    `${plans.length} product(s) with option labels to rename` +
      (apply ? "" : " (dry run, pass --apply to write)"),
  );
  for (const { product, options } of plans) {
    console.log(`\n${product.handle}`);
    for (const planned of options) {
      if (planned.nextName) {
        console.log(`  ${planned.option.name} → ${planned.nextName}`);
      }
      for (const value of planned.values) {
        console.log(
          value.rename
            ? `  ${planned.option.name}: ${value.from} → ${value.to.sv}`
            : `  ${planned.option.name}: ${value.from} (localize ${value.to.nb}/${value.to.da}/${value.to.fi})`,
        );
      }
    }
  }

  if (!apply) return;

  const shopLocales = (await admin.graphql(`query { shopLocales { locale primary published } }`))
    .shopLocales.filter((locale) => locale.published);

  for (const { product, options } of plans) {
    for (const planned of options) {
      const data = await admin.graphql(OPTION_UPDATE, {
        productId: product.id,
        option: {
          id: planned.option.id,
          ...(planned.nextName ? { name: planned.nextName } : {}),
        },
        optionValuesToUpdate: planned.values
          .filter((value) => value.rename)
          .map((value) => ({
            id: value.id,
            name: value.to.sv,
          })),
      });
      assertNoUserErrors(
        data.productOptionUpdate.userErrors,
        `${product.handle} ${planned.option.name}`,
      );
      await translateResource(
        admin,
        planned.option.id,
        planned.nameCopy,
        shopLocales,
      );
      for (const value of planned.values) {
        await translateResource(admin, value.id, value.to, shopLocales);
      }
    }
    console.log(`updated ${product.handle}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
