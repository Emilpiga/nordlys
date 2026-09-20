#!/usr/bin/env node
/**
 * CJ → Shopify import pipeline (batch-friendly).
 *
 * Always publishes to:
 *   - My Store Headless
 *   - Google & YouTube
 *
 * Inventory is owned at the CJ Shopify fulfillment location (`cjdropshipping`).
 * Merchant Admin cannot inventorySetQuantities there — we seed stock via
 * inventoryActivate(available) from CJ warehouse totals (shop syncInventoryRate),
 * disconnect merchant locations, then create the CJ product connection.
 *
 * Required after every import: move the new products into the `Scandinavia`
 * shipping profile. Shopify files new products under the General profile,
 * which only ships from `Pölen 1` — CJ stock is then unreachable for the
 * Swedish market and the storefront reports every variant as sold out.
 *   node scripts/fix-cj-shipping-profile.mjs
 *   node scripts/check-market-availability.mjs
 *
 * Usage:
 *   npm run import:cj -- --from=scripts/cj-import-batch.json
 *   npm run import:cj -- --pid=2408230930241620600 --handle=striped-knit-pullover ...
 *   npm run import:cj -- --publish-only=striped-knit-pullover
 *   npm run import:cj -- --dry-run --from=scripts/cj-import-batch.json
 *
 * After import, push Nordic copy when entries exist in catalog-copy-data.mjs:
 *   npm run translate:products -- --only=handle1,handle2
 *
 * Batch JSON shape:
 * {
 *   "products": [
 *     {
 *       "pid": "CJ product id",
 *       "handle": "my-handle",
 *       "title": "Svensk titel",
 *       "descriptionHtml": "<p>...</p>",
 *       "metaTitle": "...",
 *       "metaDescription": "...",
 *       "productType": "Stickat",
 *       "tags": ["clothing", "clothing:stickat", "gender:women"],
 *       "priceSek": 289
 *     }
 *   ]
 * }
 *
 * priceSek is optional — when omitted, price =
 *   roundUpTo9( (maxVariantUsd + cheapestFreightUsdToSE) * 10.5 + 70 ) * 1.25
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  assertNoUserErrors,
  createShopifyAdmin,
  getAdminAccessToken,
  loadEnvFiles,
  numericId,
  shopDomain,
  sleep,
} from "./lib/shopify-admin.mjs";
import {
  createCjClient,
  pickCheapestFreight,
  splitVariantKey,
  variantStockTotal,
} from "./lib/cj-client.mjs";

const USD_TO_SEK = 10.5;
const VAT_RATE = 0.25;
const PROFIT_BEFORE_VAT_SEK = 70;
const SHOPIFY_SHOP_NAME = "ctn6ds-ua";
const PUBLICATION_NAMES = ["My Store Headless", "Google & YouTube"];
const CJ_LOCATION_NAME = "cjdropshipping";

function parseArgs(argv) {
  const args = {
    dryRun: false,
    from: null,
    pid: null,
    handle: null,
    title: null,
    productType: "Kläder",
    tags: ["clothing"],
    descriptionHtml: null,
    metaTitle: null,
    metaDescription: null,
    priceSek: null,
    publishOnly: null,
    skipConnect: false,
    skipInventory: false,
  };
  for (const raw of argv) {
    if (raw === "--dry-run") args.dryRun = true;
    else if (raw === "--skip-connect") args.skipConnect = true;
    else if (raw === "--skip-inventory") args.skipInventory = true;
    else if (raw.startsWith("--from=")) args.from = raw.slice(7);
    else if (raw.startsWith("--pid=")) args.pid = raw.slice(6);
    else if (raw.startsWith("--handle=")) args.handle = raw.slice(9);
    else if (raw.startsWith("--title=")) args.title = raw.slice(8);
    else if (raw.startsWith("--product-type=")) args.productType = raw.slice(15);
    else if (raw.startsWith("--tags=")) {
      args.tags = raw
        .slice(7)
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
    } else if (raw.startsWith("--description-html=")) {
      args.descriptionHtml = raw.slice(19);
    } else if (raw.startsWith("--meta-title=")) args.metaTitle = raw.slice(13);
    else if (raw.startsWith("--meta-description=")) {
      args.metaDescription = raw.slice(19);
    } else if (raw.startsWith("--price-sek=")) {
      args.priceSek = Number(raw.slice(12));
    } else if (raw.startsWith("--publish-only=")) {
      args.publishOnly = raw.slice(15);
    } else {
      throw new Error(`Unknown argument: ${raw}`);
    }
  }
  return args;
}

function roundUpToNine(amount) {
  const base = Math.ceil(amount);
  const mod = base % 10;
  const delta = mod === 9 ? 0 : (9 - mod + 10) % 10;
  return base + delta;
}

function retailSek(landedSek) {
  return roundUpToNine((landedSek + PROFIT_BEFORE_VAT_SEK) * (1 + VAT_RATE));
}

function loadBatch(args) {
  if (args.from) {
    const path = resolve(process.cwd(), args.from);
    if (!existsSync(path)) throw new Error(`Batch file not found: ${path}`);
    const json = JSON.parse(readFileSync(path, "utf8"));
    const products = json.products || json;
    if (!Array.isArray(products) || !products.length) {
      throw new Error("Batch file must contain a non-empty products array");
    }
    let specs = products.map(normalizeSpec);
    if (args.handle) {
      specs = specs.filter((spec) => spec.handle === args.handle);
      if (!specs.length) {
        throw new Error(`No batch product with handle=${args.handle}`);
      }
    }
    return specs;
  }
  if (args.publishOnly) {
    return [{ publishOnly: args.publishOnly }];
  }
  if (!args.pid || !args.handle || !args.title) {
    throw new Error(
      "Provide --from=batch.json or --pid + --handle + --title (or --publish-only=handle)",
    );
  }
  return [
    normalizeSpec({
      pid: args.pid,
      handle: args.handle,
      title: args.title,
      productType: args.productType,
      tags: args.tags,
      descriptionHtml: args.descriptionHtml,
      metaTitle: args.metaTitle,
      metaDescription: args.metaDescription,
      priceSek: args.priceSek,
    }),
  ];
}

function normalizeSpec(raw) {
  if (raw.publishOnly) return { publishOnly: raw.publishOnly };
  if (!raw.pid) throw new Error("Each product needs pid");
  if (!raw.handle) throw new Error(`Product ${raw.pid} needs handle`);
  if (!raw.title) throw new Error(`Product ${raw.handle} needs title`);
  return {
    pid: String(raw.pid),
    handle: String(raw.handle),
    title: String(raw.title),
    productType: raw.productType || "Kläder",
    tags: Array.isArray(raw.tags) ? raw.tags : ["clothing"],
    descriptionHtml:
      raw.descriptionHtml ||
      `<p>${raw.title}</p><p>Asiatisk storlek, faller litet. Välj variant ovan.</p>`,
    metaTitle: raw.metaTitle || raw.title,
    metaDescription:
      raw.metaDescription ||
      String(raw.descriptionHtml || raw.title)
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 155),
    priceSek:
      raw.priceSek == null || raw.priceSek === ""
        ? null
        : Number(raw.priceSek),
  };
}

async function resolvePublicationIds(admin) {
  const data = await admin.graphql(`query {
    publications(first: 25) { nodes { id name } }
  }`);
  const byName = new Map(
    data.publications.nodes.map((node) => [node.name, node.id]),
  );
  const ids = [];
  for (const name of PUBLICATION_NAMES) {
    const id = byName.get(name);
    if (!id) {
      throw new Error(
        `Publication "${name}" not found. Available: ${[...byName.keys()].join(", ")}`,
      );
    }
    ids.push({ name, id });
  }
  return ids;
}

async function resolveCjLocationId(admin) {
  if (process.env.CJ_SHOPIFY_LOCATION_ID?.trim()) {
    return process.env.CJ_SHOPIFY_LOCATION_ID.trim();
  }
  const data = await admin.graphql(`query {
    locations(first: 20, includeLegacy: true) {
      nodes {
        id
        name
        isFulfillmentService
        fulfillmentService { handle }
      }
    }
  }`);
  const match = data.locations.nodes.find(
    (loc) =>
      loc.name.toLowerCase() === CJ_LOCATION_NAME ||
      loc.fulfillmentService?.handle === CJ_LOCATION_NAME,
  );
  if (match) return match.id;
  throw new Error(
    `Could not find Shopify location "${CJ_LOCATION_NAME}". Import one product via the CJ app first, or set CJ_SHOPIFY_LOCATION_ID.`,
  );
}

async function publishToChannels(admin, productId, publications) {
  const data = await admin.graphql(
    `mutation Publish($id: ID!, $input: [PublicationInput!]!) {
      publishablePublish(id: $id, input: $input) {
        userErrors { field message }
      }
    }`,
    {
      id: productId,
      input: publications.map((publication) => ({
        publicationId: publication.id,
      })),
    },
  );
  assertNoUserErrors(data.publishablePublish.userErrors, "publishablePublish");
}

/**
 * Point each variant at the CJ fulfillment location and seed quantities from
 * CJ warehouse stock.
 *
 * Merchant Admin apps cannot call inventorySetQuantities on a third-party
 * fulfillment location (INVALID_LOCATION). The working path is:
 *   inventoryActivate(available) / deactivate+reactivate
 * which Shopify allows on the CJ location. Activate CJ before disconnecting
 * merchant locations (variants must stay stocked at ≥1 location).
 */
async function assignCjInventoryLocation(admin, { variants, locationId, stockBySku }) {
  for (const variant of variants) {
    const itemId = variant.inventoryItem?.id;
    if (!itemId) continue;
    const targetQty = Math.max(0, Number(stockBySku?.get(variant.sku) || 0));

    const refreshed = await admin.graphql(
      `query($id: ID!) {
        inventoryItem(id: $id) {
          inventoryLevels(first: 10) {
            nodes { id location { id name } }
          }
        }
      }`,
      { id: itemId },
    );
    let levels = refreshed.inventoryItem.inventoryLevels.nodes;
    const cjLevel = levels.find((level) => level.location.id === locationId);

    if (cjLevel?.id) {
      const deactivated = await admin.graphqlIdempotent(
        `mutation($inventoryLevelId: ID!) {
          inventoryDeactivate(inventoryLevelId: $inventoryLevelId) __IDEMPOTENT__ {
            userErrors { field message }
          }
        }`,
        { inventoryLevelId: cjLevel.id },
      );
      assertNoUserErrors(
        deactivated.inventoryDeactivate.userErrors,
        `inventoryDeactivate ${variant.sku} @ ${CJ_LOCATION_NAME}`,
      );
    }

    const activated = await admin.graphqlIdempotent(
      `mutation($inventoryItemId: ID!, $locationId: ID!, $available: Int!) {
        inventoryActivate(
          inventoryItemId: $inventoryItemId
          locationId: $locationId
          available: $available
          stockAtLegacyLocation: true
        ) __IDEMPOTENT__ {
          userErrors { field message }
        }
      }`,
      { inventoryItemId: itemId, locationId, available: targetQty },
    );
    assertNoUserErrors(
      activated.inventoryActivate.userErrors,
      `inventoryActivate ${variant.sku}`,
    );

    const after = await admin.graphql(
      `query($id: ID!) {
        inventoryItem(id: $id) {
          inventoryLevels(first: 10) {
            nodes { id location { id name } }
          }
        }
      }`,
      { id: itemId },
    );
    for (const level of after.inventoryItem.inventoryLevels.nodes) {
      if (level.location.id === locationId) continue;
      const deactivated = await admin.graphqlIdempotent(
        `mutation($inventoryLevelId: ID!) {
          inventoryDeactivate(inventoryLevelId: $inventoryLevelId) __IDEMPOTENT__ {
            userErrors { field message }
          }
        }`,
        { inventoryLevelId: level.id },
      );
      const errors = (deactivated.inventoryDeactivate.userErrors || []).filter(
        (err) => !/minimum of 1 location/i.test(err.message || ""),
      );
      assertNoUserErrors(
        errors,
        `inventoryDeactivate ${variant.sku} @ ${level.location.name}`,
      );
    }
  }
}

async function waitForCjStock(admin, productId, { attempts = 2, delayMs = 2000 } = {}) {
  for (let i = 0; i < attempts; i++) {
    const data = await admin.graphql(
      `query($id: ID!) {
        product(id: $id) {
          variants(first: 100) {
            nodes {
              inventoryQuantity
              inventoryItem {
                inventoryLevels(first: 5) {
                  nodes {
                    location { isFulfillmentService }
                    quantities(names: ["available"]) { quantity }
                  }
                }
              }
            }
          }
        }
      }`,
      { id: productId },
    );
    const nodes = data.product?.variants?.nodes || [];
    const cjQty = nodes.reduce((sum, variant) => {
      const level = (variant.inventoryItem?.inventoryLevels?.nodes || []).find(
        (row) => row.location.isFulfillmentService,
      );
      return sum + Number(level?.quantities?.[0]?.quantity || 0);
    }, 0);
    if (cjQty > 0) {
      return { synced: true, totalAvailable: cjQty, variants: nodes.length };
    }
    if (i < attempts - 1) await sleep(delayMs);
  }
  return { synced: false, totalAvailable: 0 };
}

async function loadShopProductVariants(admin, productId) {
  const data = await admin.graphql(
    `query($id: ID!) {
      product(id: $id) {
        id
        handle
        title
        variants(first: 100) {
          nodes {
            id
            sku
            title
            price
            inventoryItem {
              id
              tracked
              inventoryLevels(first: 5) {
                nodes {
                  id
                  location { id name }
                }
              }
            }
          }
        }
      }
    }`,
    { id: productId },
  );
  return data.product;
}

function stockBySkuFromCjProduct(cjProduct, syncRatePercent = 100) {
  const rate = Math.min(100, Math.max(0, Number(syncRatePercent) || 100)) / 100;
  const map = new Map();
  for (const variant of cjProduct.variants || cjProduct.variantList || []) {
    const raw = variantStockTotal(variant.inventories);
    map.set(variant.variantSku, Math.floor(raw * rate));
  }
  return map;
}

async function connectAndSync(ctx, {
  shopProduct,
  cjProduct,
  variants,
  priced,
  images,
  stockBySku,
}) {
  const { admin, cj, cjLocationId, cjShopId, args } = ctx;
  if (!args.skipInventory && cjLocationId) {
    await assignCjInventoryLocation(admin, {
      variants: shopProduct.variants.nodes,
      locationId: cjLocationId,
      stockBySku,
    });
    const stock = await waitForCjStock(admin, shopProduct.id);
    console.log(
      `  inventory @ ${CJ_LOCATION_NAME}: ${stock.totalAvailable} available`,
    );
  }

  if (!args.skipConnect && cjShopId) {
    const bySku = new Map(
      shopProduct.variants.nodes.map((node) => [node.sku, node]),
    );
    const variantPairs = variants.map((variant) => {
      const node = bySku.get(variant.variantSku);
      if (!node) {
        throw new Error(`Missing Shopify variant for ${variant.variantSku}`);
      }
      return {
        sku: variant.variantSku,
        title: node.title,
        price: priced.priceSek,
        weight: Number(variant.variantWeight) || 400,
        image: variant.variantImage || images[0],
        productTitle: shopProduct.title,
        cjVariantId: variant.vid,
        platformVariantId: numericId(node.id),
      };
    });
    await connectCj(cj, {
      shopId: cjShopId,
      platformProductId: numericId(shopProduct.id),
      cjProductId: cjProduct.pid || cjProduct.id,
      logistics: priced.logistics,
      variantPairs,
    });
    console.log("  CJ connection created");
  }
}

async function connectCj(cj, {
  shopId,
  platformProductId,
  cjProductId,
  logistics,
  variantPairs,
}) {
  const image =
    variantPairs[0]?.image ||
    "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png";

  try {
    await cj.post("/store/product/saveProduct", {
      id: platformProductId,
      shopId,
      title: variantPairs[0]?.productTitle || platformProductId,
      image,
      description: variantPairs[0]?.productTitle || "",
      priceMin: variantPairs[0]?.price,
      priceMax: variantPairs[0]?.price,
      priceCurrency: "SEK",
    });
  } catch (error) {
    if (!/already exists|415/i.test(error.message || "")) throw error;
  }

  await cj.post("/store/product/saveVariantBatch", {
    shopId,
    variants: variantPairs.map((pair) => ({
      id: pair.platformVariantId,
      productId: platformProductId,
      title: pair.title,
      sku: pair.sku,
      image: pair.image || image,
      shopPrice: pair.price,
      shopPriceCurrency: "SEK",
      weight: pair.weight || 400,
      weightUnit: "g",
    })),
  });

  try {
    await cj.post("/product/conn/connection", {
      shopId,
      defaultArea: 1,
      logistics,
      cjProductId: String(cjProductId),
      platformProductId,
      sourceCountryCode: "CN",
      sourceCountry: "China",
      targetCountryCode: "SE",
      targetCountry: "Sweden",
      variantList: variantPairs.map((pair) => ({
        cjVariantId: String(pair.cjVariantId),
        platformVariantId: pair.platformVariantId,
      })),
    });
  } catch (error) {
    // Re-connect / already linked is fine for idempotent backfills.
    if (!/already|exist|duplicate|415|1600200/i.test(error.message || "")) {
      throw error;
    }
  }
}

async function priceFromCj(cj, variants) {
  const heaviest = [...variants].sort(
    (a, b) => Number(b.variantWeight || 0) - Number(a.variantWeight || 0),
  )[0];
  const freight = await cj.post("/logistic/freightCalculate", {
    startCountryCode: "CN",
    endCountryCode: "SE",
    products: [{ vid: heaviest.vid, quantity: 1 }],
  });
  const ship = pickCheapestFreight(freight);
  if (!ship) throw new Error("No CJ freight option to Sweden");
  const maxUsd = Math.max(
    ...variants.map((variant) => Number(variant.variantSellPrice) || 0),
  );
  const landed = (maxUsd + Number(ship.logisticPrice)) * USD_TO_SEK;
  return {
    priceSek: retailSek(landed),
    logistics: ship.logisticName,
    freightUsd: Number(ship.logisticPrice),
    maxUsd,
    landedSek: Math.round(landed),
  };
}

async function importOne(ctx, spec) {
  const { admin, cj, publications, cjLocationId, cjShopId, args } = ctx;

  if (spec.publishOnly) {
    const data = await admin.graphql(
      `query($q: String!) {
        products(first: 1, query: $q) { nodes { id handle title } }
      }`,
      { q: `handle:${spec.publishOnly}` },
    );
    const product = data.products.nodes[0];
    if (!product) throw new Error(`No product handle=${spec.publishOnly}`);
    if (args.dryRun) {
      console.log(`[dry-run] publish ${product.handle} → ${PUBLICATION_NAMES.join(", ")}`);
      return { handle: product.handle, published: true, dryRun: true };
    }
    await publishToChannels(admin, product.id, publications);
    console.log(`Published ${product.handle} → ${PUBLICATION_NAMES.join(", ")}`);
    return { handle: product.handle, published: true };
  }

  console.log(`\n→ ${spec.handle} (pid ${spec.pid})`);

  const product = await cj.get(
    `/product/query?pid=${encodeURIComponent(spec.pid)}&features=enable_inventory`,
  );
  const variants = product.variants || product.variantList || [];
  if (!variants.length) throw new Error("CJ product has no variants");

  const stockBySku = stockBySkuFromCjProduct(
    product,
    ctx.cjSyncInventoryRate ?? 100,
  );

  const byHandle = await admin.graphql(
    `query($q: String!) {
      products(first: 1, query: $q) { nodes { id handle title } }
    }`,
    { q: `handle:${spec.handle}` },
  );
  let existingId = byHandle.products.nodes[0]?.id || null;
  if (!existingId) {
    const skuQuery = variants
      .slice(0, 8)
      .map((variant) => `sku:${String(variant.variantSku).replace(/"/g, "")}`)
      .join(" OR ");
    const existing = await admin.graphql(
      `query($q: String!) {
        products(first: 5, query: $q) { nodes { id handle title } }
      }`,
      { q: skuQuery },
    );
    existingId = existing.products.nodes[0]?.id || null;
  }

  const autoPrice = await priceFromCj(cj, variants);
  const priced = {
    ...autoPrice,
    priceSek:
      spec.priceSek != null && Number.isFinite(spec.priceSek)
        ? Math.round(spec.priceSek)
        : autoPrice.priceSek,
  };

  // CJ stock is applied by assignCjInventoryLocation from product inventories.

  const colors = [];
  const sizes = [];
  for (const variant of variants) {
    const { color, size } = splitVariantKey(variant.variantKey);
    if (!colors.includes(color)) colors.push(color);
    if (!sizes.includes(size)) sizes.push(size);
  }

  const images = [
    ...new Set([
      ...(product.productImageSet || []),
      ...variants.map((variant) => variant.variantImage).filter(Boolean),
    ]),
  ].slice(0, 25);

  console.log(
    `  variants=${variants.length} price=${priced.priceSek} SEK freight=${priced.logistics} cjStock=[${[...stockBySku.values()].slice(0, 4).join(",")}${stockBySku.size > 4 ? ",…" : ""}]`,
  );

  if (args.dryRun) {
    console.log(
      existingId
        ? "  [dry-run] would reconnect CJ inventory + publish"
        : "  [dry-run] skip create / inventory / connect / publish",
    );
    return {
      handle: spec.handle,
      priceSek: priced.priceSek,
      dryRun: true,
      logistics: priced.logistics,
      skippedCreate: Boolean(existingId),
    };
  }

  let shopProduct;
  let skippedCreate = false;
  if (existingId) {
    shopProduct = await loadShopProductVariants(admin, existingId);
    skippedCreate = true;
    console.log(`  already exists as ${shopProduct.handle} — reconnecting CJ`);
  } else {
    const created = await admin.graphql(
      `mutation ProductSet($input: ProductSetInput!) {
        productSet(synchronous: true, input: $input) {
          product {
            id
            handle
            title
            variants(first: 100) {
              nodes {
                id
                sku
                title
                price
                inventoryItem {
                  id
                  tracked
                  inventoryLevels(first: 5) {
                    nodes {
                      id
                      location { id name }
                    }
                  }
                }
              }
            }
          }
          userErrors { field message code }
        }
      }`,
      {
        input: {
          title: spec.title,
          handle: spec.handle,
          descriptionHtml: spec.descriptionHtml,
          vendor: "CJ",
          productType: spec.productType,
          tags: spec.tags,
          status: "ACTIVE",
          seo: {
            title: spec.metaTitle,
            description: spec.metaDescription,
          },
          productOptions: [
            { name: "Color", values: colors.map((name) => ({ name })) },
            { name: "Size", values: sizes.map((name) => ({ name })) },
          ],
          files: images.map((url) => ({
            originalSource: url,
            alt: spec.title,
            contentType: "IMAGE",
          })),
          variants: variants.map((variant) => {
            const { color, size } = splitVariantKey(variant.variantKey);
            const variantImage =
              variant.variantImage && images.includes(variant.variantImage)
                ? variant.variantImage
                : undefined;
            return {
              optionValues: [
                { optionName: "Color", name: color },
                { optionName: "Size", name: size },
              ],
              price: priced.priceSek.toFixed(2),
              sku: variant.variantSku,
              inventoryPolicy: "DENY",
              inventoryItem: {
                sku: variant.variantSku,
                tracked: true,
                requiresShipping: true,
                measurement: {
                  weight: {
                    unit: "GRAMS",
                    value: Number(variant.variantWeight) || 400,
                  },
                },
              },
              file: variantImage
                ? {
                    originalSource: variantImage,
                    alt: `${color} ${size}`,
                    contentType: "IMAGE",
                  }
                : undefined,
            };
          }),
        },
      },
    );
    assertNoUserErrors(created.productSet.userErrors, "productSet");
    shopProduct = created.productSet.product;
    console.log(`  created ${shopProduct.handle} ${shopProduct.id}`);
  }

  await connectAndSync(ctx, {
    shopProduct,
    cjProduct: { pid: product.pid || spec.pid },
    variants,
    priced,
    images,
    stockBySku,
  });

  await publishToChannels(admin, shopProduct.id, publications);
  console.log(`  published → ${PUBLICATION_NAMES.join(", ")}`);

  return {
    handle: shopProduct.handle,
    productId: numericId(shopProduct.id),
    priceSek: priced.priceSek,
    variants: shopProduct.variants.nodes.length,
    logistics: priced.logistics,
    published: true,
    skippedCreate,
  };
}

async function main() {
  loadEnvFiles();
  const args = parseArgs(process.argv.slice(2));
  const specs = loadBatch(args);
  const domain = shopDomain();
  const { token, scope } = await getAdminAccessToken(domain);
  console.log(`Admin scopes: ${scope || "(unknown)"}`);

  const admin = createShopifyAdmin({ domain, token });
  const cj = await createCjClient();

  const publications = await resolvePublicationIds(admin);
  console.log(
    `Publications: ${publications.map((publication) => publication.name).join(", ")}`,
  );

  let cjLocationId = null;
  let cjShopId = null;
  let cjSyncInventoryRate = 100;
  const needsInventory =
    specs.some((spec) => !spec.publishOnly) &&
    !args.skipInventory &&
    !args.dryRun;
  const needsConnect = specs.some((spec) => !spec.publishOnly) && !args.skipConnect;

  if (needsInventory) {
    cjLocationId = await resolveCjLocationId(admin);
    console.log(`CJ inventory location: ${cjLocationId}`);
  }
  if (needsConnect || needsInventory) {
    const shops = await cj.get("/shop/getShops");
    const shopList = Array.isArray(shops) ? shops : shops?.list || [];
    const shop = shopList.find(
      (row) =>
        (row.type || row.shopType) === "shopify" &&
        (row.name || row.shopName) === SHOPIFY_SHOP_NAME,
    );
    if (!shop) throw new Error(`CJ Shopify shop "${SHOPIFY_SHOP_NAME}" not found`);
    cjShopId = String(shop.id || shop.shopId);
    cjSyncInventoryRate = Number(shop.syncInventoryRate ?? 100) || 100;
    console.log(
      `CJ shop id: ${cjShopId} (syncInventory=${shop.syncInventory}, rate=${cjSyncInventoryRate}%)`,
    );
  }

  const ctx = {
    admin,
    cj,
    publications,
    cjLocationId,
    cjShopId,
    cjSyncInventoryRate,
    args,
  };
  const results = [];
  let failed = 0;

  for (const [index, spec] of specs.entries()) {
    try {
      results.push(await importOne(ctx, spec));
    } catch (error) {
      failed += 1;
      const label = spec.handle || spec.publishOnly || spec.pid || "item";
      console.error(`  FAILED ${label}: ${error.message}`);
      results.push({ handle: label, error: error.message });
    }
    if (index < specs.length - 1) await sleep(400);
  }

  console.log("\nSummary");
  console.log(JSON.stringify(results, null, 2));
  if (failed) {
    process.exitCode = 1;
    return;
  }

  const handles = results
    .map((row) => row.handle)
    .filter(Boolean)
    .filter((handle, index, all) => all.indexOf(handle) === index);
  if (handles.length && !args.dryRun && !args.publishOnly) {
    console.log(
      "\nNext:" +
        "\n  npm run fix:shipping        # else every variant reads as sold out" +
        "\n  npm run check:availability" +
        `\n  npm run translate:products -- --only=${handles.join(",")}`,
    );
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
