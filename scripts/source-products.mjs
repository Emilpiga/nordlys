#!/usr/bin/env node
/**
 * Source products from competitors that already sell them well, then hand them
 * to the CJ import with the competitor's title, description, variants, prices
 * and images.
 *
 *   1. A store's best sellers (SEK stores only):
 *        npm run source -- example.se
 *        npm run source -- https://example.se/collections/dam --limit=40
 *
 *   2. CJ candidates for one of them (search terms in English):
 *        npm run source -- https://example.se/products/stickad-kofta --q="women knit cardigan"
 *
 *   3. Pair it with the CJ product and write the batch entry:
 *        npm run source -- https://example.se/products/stickad-kofta --pid=2408230930241620600
 *        … --colors="Sand=Apricot,Mörkgrön=Army Green"   # colours the names don't pair
 *        … --pair="Navy / S/M=Blue-M"                    # one variant, by hand (repeatable)
 *        … --type=Stickat --gender=men --max-margin=60 --out=scripts/sourced-batch.json
 *
 *   4. Import everything in the batch (creates, links CJ, publishes, fixes
 *      the shipping profile, registers translations):
 *        npm run import:cj -- --from=scripts/sourced-batch.json --dry-run
 *        npm run import:cj -- --from=scripts/sourced-batch.json
 *
 * Only Shopify storefronts are read automatically. For anything else, write
 * the batch entry by hand (shape in import-cj-products.mjs).
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadEnvFiles, sleep } from "./lib/shopify-admin.mjs";
import { createCjClient, variantStockTotal } from "./lib/cj-client.mjs";
import {
  MAX_MARGIN,
  USD_TO_SEK,
  followPrice,
  landedCostFromCj,
} from "./lib/pricing.mjs";
import {
  COLOR_OPTION,
  SIZE_OPTION,
  bestSellerHandles,
  classifyClothing,
  fetchSourceProduct,
  genderTag,
  htmlToText,
  matchVariants,
  parseSourceUrl,
  storeCurrency,
} from "./lib/source-store.mjs";

const DEFAULT_OUT = "scripts/sourced-batch.json";
const TYPE_TAGS = {
  Ytterkläder: "clothing:ytterklader",
  Toppar: "clothing:toppar",
  Stickat: "clothing:stickat",
  Klänningar: "clothing:klanningar",
  Byxor: "clothing:byxor",
  Set: "clothing:set",
  Accessoarer: "clothing:accessoarer",
};

function parseArgs(argv) {
  const args = {
    url: null,
    queries: [],
    pid: null,
    colors: new Map(),
    pairs: new Map(),
    type: null,
    gender: null,
    limit: 20,
    maxMargin: MAX_MARGIN,
    out: DEFAULT_OUT,
  };
  for (const raw of argv) {
    if (raw.startsWith("--q=")) args.queries.push(raw.slice(4));
    else if (raw.startsWith("--pid=")) args.pid = raw.slice(6);
    else if (raw.startsWith("--type=")) args.type = raw.slice(7);
    else if (raw.startsWith("--gender=")) args.gender = raw.slice(9);
    else if (raw.startsWith("--limit=")) args.limit = Number(raw.slice(8)) || 20;
    else if (raw.startsWith("--max-margin=")) {
      args.maxMargin = Number(raw.slice(13)) / 100;
    } else if (raw.startsWith("--out=")) args.out = raw.slice(6);
    else if (raw.startsWith("--colors=")) {
      for (const pair of raw.slice(9).split(",")) {
        const [source, cj] = pair.split("=").map((part) => part?.trim().toLowerCase());
        if (!source || !cj) throw new Error(`Bad --colors pair: ${pair}`);
        args.colors.set(source, cj);
      }
    } else if (raw.startsWith("--pair=")) {
      const cut = raw.lastIndexOf("=");
      const source = raw.slice(7, cut).trim().toLowerCase();
      const cj = raw.slice(cut + 1).trim().toLowerCase();
      if (cut <= 7 || !source || !cj) throw new Error(`Bad --pair: ${raw}`);
      args.pairs.set(source, cj);
    } else if (raw.startsWith("--")) throw new Error(`Unknown argument: ${raw}`);
    else args.url = raw;
  }
  if (!args.url) {
    throw new Error("Give a store, collection or product URL (see the header of this script)");
  }
  if (args.type && !TYPE_TAGS[args.type]) {
    throw new Error(`--type must be one of: ${Object.keys(TYPE_TAGS).join(", ")}`);
  }
  if (args.gender && !["women", "men"].includes(args.gender)) {
    throw new Error("--gender must be women or men");
  }
  return args;
}

async function assertSekStore(origin) {
  const currency = await storeCurrency(origin);
  if (currency && currency !== "SEK") {
    throw new Error(`${origin} charges ${currency}; only SEK stores are sourced.`);
  }
  if (!currency) {
    console.warn(`! Could not read ${origin}'s currency — check that prices are SEK.`);
  }
}

function priceRange(variants) {
  const prices = variants.map((variant) => variant.priceSek);
  const low = Math.min(...prices);
  const high = Math.max(...prices);
  return low === high ? `${low}` : `${low}–${high}`;
}

async function scanStore(source, args) {
  const handles = await bestSellerHandles(
    source.origin,
    source.collectionPath,
    args.limit,
  );
  if (!handles.length) {
    throw new Error(`No products found on ${source.origin}${source.collectionPath}`);
  }
  console.log(
    `${source.host}${source.collectionPath} — best sellers first (${handles.length})\n`,
  );
  for (const [index, handle] of handles.entries()) {
    try {
      const product = await fetchSourceProduct(source.origin, handle);
      const type = classifyClothing(`${product.title} ${product.type}`);
      console.log(
        `${String(index + 1).padStart(2)}. ${product.title}\n` +
          `    ${priceRange(product.variants)} SEK · ${product.variants.length} variants (${product.options.join(" / ")}) · ` +
          `${product.images.length} images · ${htmlToText(product.descriptionHtml).length} chars of copy · ` +
          `${type ? type.productType : "not clothing?"}\n` +
          `    ${product.url}`,
      );
    } catch (error) {
      console.log(`${String(index + 1).padStart(2)}. ${handle} — ${error.message}`);
    }
    await sleep(300);
  }
}

function printSource(product) {
  console.log(
    `Source: ${product.title}\n` +
      `  ${product.url}\n` +
      `  ${priceRange(product.variants)} SEK · ${product.options.join(" / ")} · ${product.variants.length} variants\n` +
      `  images:\n${product.images.slice(0, 4).map((url) => `    ${url}`).join("\n")}`,
  );
}

function cjRows(data) {
  if (Array.isArray(data?.content)) {
    return data.content.flatMap((block) => block.productList || []);
  }
  return data?.list || [];
}

async function searchCj(product, args) {
  printSource(product);
  const cj = await createCjClient();
  const seen = new Set();
  for (const query of args.queries) {
    console.log(`\nCJ "${query}"`);
    const data = await cj.get(
      `/product/listV2?page=1&size=12&keyWord=${encodeURIComponent(query)}&orderBy=1&sort=desc`,
    );
    for (const row of cjRows(data)) {
      const pid = String(row.id || row.pid || "");
      if (!pid || seen.has(pid)) continue;
      seen.add(pid);
      const usd = Number(String(row.sellPrice ?? row.nowPrice ?? "").split("--")[0]) || 0;
      console.log(
        `  ${pid}  $${usd.toFixed(2)} (~${Math.round(usd * USD_TO_SEK)} SEK before freight) · ` +
          `${Number(row.listedNum || 0)} listings\n` +
          `    ${row.nameEn || row.productNameEn || ""}\n` +
          `    ${row.bigImage || row.productImage || ""}`,
      );
    }
  }
  console.log(
    "\nCompare the images, then pair the match:\n" +
      `  npm run source -- ${product.url} --pid=<CJ pid>`,
  );
}

function brandWarnings(product, host) {
  const text = `${product.title} ${htmlToText(product.descriptionHtml)}`.toLowerCase();
  const names = [product.vendor, host.split(".")[0]]
    .map((name) => name.trim().toLowerCase())
    .filter((name) => name.length > 2);
  return [...new Set(names)]
    .filter((name) => text.includes(name))
    .map((name) => `copy mentions "${name}" — edit the batch entry`);
}

function writeBatchEntry(outPath, entry) {
  const path = resolve(process.cwd(), outPath);
  const batch = existsSync(path)
    ? JSON.parse(readFileSync(path, "utf8"))
    : { products: [] };
  const index = batch.products.findIndex((row) => row.handle === entry.handle);
  if (index === -1) batch.products.push(entry);
  else {
    // Keep hand-written translations when a product is paired again.
    batch.products[index] = {
      ...entry,
      ...(batch.products[index].translations
        ? { translations: batch.products[index].translations }
        : {}),
    };
  }
  writeFileSync(path, `${JSON.stringify(batch, null, 2)}\n`);
}

async function pairWithCj(product, source, args) {
  printSource(product);
  const cj = await createCjClient();
  const cjProduct = await cj.get(
    `/product/query?pid=${encodeURIComponent(args.pid)}&features=enable_inventory`,
  );
  const cjVariants = cjProduct.variants || cjProduct.variantList || [];
  if (!cjVariants.length) throw new Error("CJ product has no variants");
  const cjName = cjProduct.productNameEn || "";

  const match = matchVariants(product, cjVariants, {
    colorOverrides: args.colors,
    pairs: args.pairs,
  });
  if (!match.mapped.length) {
    console.log(
      `\nNo variant pairs. CJ has: ${cjVariants.map((v) => v.variantKey).join(", ")}\n` +
        `Source has: ${product.variants.map((v) => v.title).join(", ")}\n` +
        'Pair colours with --colors="Source colour=CJ colour,…" or single variants with --pair="Source variant=CJ variant"',
    );
    process.exitCode = 1;
    return;
  }

  const cost = await landedCostFromCj(
    cj,
    match.mapped.map((pair) => pair.cj.variant),
  );
  const band = followPrice(null, cost.landedSek, args.maxMargin);
  console.log(
    `\nCJ: ${cjName} (pid ${args.pid})\n` +
      `  landed ~${Math.round(cost.landedSek)} SEK ($${cost.maxUsd} + $${cost.freightUsd} ${cost.logistics})\n` +
      `  price band ${band.minSek}–${band.maxSek} SEK incl. VAT + shipping`,
  );

  console.log(`\nVariants paired ${match.mapped.length}/${product.variants.length}`);
  const warnings = brandWarnings(product, source.host);
  const variants = match.mapped.map(({ source: sourceVariant, cj: cjRow }) => {
    const price = followPrice(sourceVariant.priceSek, cost.landedSek, args.maxMargin);
    const stock = variantStockTotal(cjRow.variant.inventories);
    console.log(
      `  ${sourceVariant.title.padEnd(28)} ← ${String(cjRow.variant.variantKey).padEnd(22)} ` +
        `${sourceVariant.priceSek} → ${price.priceSek} SEK (${price.verdict}, profit ${price.profitSek})` +
        (stock > 0 ? "" : "  [no CJ stock]"),
    );
    return {
      vid: String(cjRow.variant.vid),
      cj: cjRow.variant.variantKey,
      options: sourceVariant.options,
      priceSek: sourceVariant.priceSek,
      image: sourceVariant.image,
    };
  });

  if (match.unmapped.length) {
    console.log(
      `\nNot paired (left out of the import): ${match.unmapped.map((v) => v.title).join(", ")}\n` +
        `CJ variants still free: ${match.cjUnused.map((row) => row.variant.variantKey).join(", ") || "none"}\n` +
        'Pair them with --colors="Source colour=CJ colour,…" or --pair="Source variant=CJ variant" and run again.',
    );
  }

  if (match.colorIndex !== -1) {
    console.log("\nCheck each colour is the same garment (source ↔ CJ):");
    const shown = new Set();
    for (const { source: sourceVariant, cj: cjRow } of match.mapped) {
      const color = sourceVariant.options[match.colorIndex];
      if (shown.has(color)) continue;
      shown.add(color);
      console.log(
        `  ${color} ↔ ${cjRow.color}\n    ${sourceVariant.image || product.images[0]}\n    ${cjRow.variant.variantImage || ""}`,
      );
    }
  }

  const guess =
    classifyClothing(`${product.title} ${product.type}`) || classifyClothing(cjName);
  const productType = args.type || guess?.productType || "Kläder";
  const typeTag = TYPE_TAGS[productType];
  if (!typeTag) warnings.push("could not tell the clothing type — pass --type=…");
  const gender = args.gender
    ? `gender:${args.gender}`
    : genderTag(`${cjName} ${product.title}`);
  const descriptionText = htmlToText(product.descriptionHtml);
  if (descriptionText.length < 80) warnings.push("description is very short");

  writeBatchEntry(args.out, {
    pid: String(args.pid),
    handle: product.handle,
    title: product.title,
    productType,
    tags: ["clothing", ...(typeTag ? [typeTag] : []), gender],
    metaTitle: product.title,
    metaDescription: descriptionText.slice(0, 155),
    descriptionHtml: product.descriptionHtml,
    source: product.url,
    // The storefront keys its size guide and colour swatches on these names.
    options: product.options.map((name) =>
      COLOR_OPTION.test(name.trim())
        ? "Färg"
        : SIZE_OPTION.test(name.trim())
          ? "Storlek"
          : name,
    ),
    images: product.images,
    variants,
  });

  for (const warning of warnings) console.log(`\n! ${warning}`);
  console.log(
    `\nWrote ${product.handle} (${productType}, ${gender}) to ${args.out}\n` +
      `Next: npm run import:cj -- --from=${args.out} --dry-run`,
  );
}

async function main() {
  loadEnvFiles();
  const args = parseArgs(process.argv.slice(2));
  const source = parseSourceUrl(args.url);
  await assertSekStore(source.origin);

  if (!source.productHandle) return scanStore(source, args);

  const product = await fetchSourceProduct(source.origin, source.productHandle);
  if (args.pid) return pairWithCj(product, source, args);
  if (!args.queries.length) {
    printSource(product);
    console.log('\nAdd --q="english search terms" to look for it on CJ, or --pid=<CJ pid> to pair it.');
    return;
  }
  return searchCj(product, args);
}

main().catch((error) => {
  console.error(error.message);
  // Not process.exit: it aborts on Windows while fetch sockets are closing.
  process.exitCode = 1;
});
