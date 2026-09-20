#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import {
  createCjClient,
  pickCheapestFreight,
  splitVariantKey,
  stockRowsTotal,
} from "./lib/cj-client.mjs";

const existing = JSON.parse(readFileSync("scripts/.cj-top30.json", "utf8"));
const have = new Set(existing.products.map((p) => p.pid));
const snapshot = JSON.parse(
  readFileSync("scripts/.shopify-catalog-snapshot.json", "utf8"),
);
const knownSkus = new Set(snapshot.skus);

const USD_TO_SEK = 10.5;
function roundUpToNine(amount) {
  const base = Math.ceil(amount);
  const mod = base % 10;
  return base + (mod === 9 ? 0 : (9 - mod + 10) % 10);
}
function retailSek(landed) {
  return roundUpToNine((landed + 70) * 1.25);
}
function flattenList(data) {
  if (Array.isArray(data?.content)) {
    return data.content.flatMap((b) => b.productList || []);
  }
  return data?.list || [];
}
function parseUsd(v) {
  const n = Number(String(v ?? "").split("--")[0].trim());
  return Number.isFinite(n) ? n : 0;
}
function classify(name, category = "") {
  const t = `${name} ${category}`.toLowerCase();
  if (/pajama|lounge|merch|sexy /.test(t)) return null;
  if (/dress/.test(t)) return { type: "Klänningar", tag: "clothing:klanningar" };
  if (/\bset\b|two piece|2 piece/.test(t)) return { type: "Set", tag: "clothing:set" };
  if (
    /legging|tights|pants|trouser|wide.?leg|jogger/.test(t) &&
    !/jacket|coat|dress|set|hoodie suit/.test(t)
  ) {
    return { type: "Byxor", tag: "clothing:byxor" };
  }
  if (/scarf|shawl|wrap|beanie/.test(t)) {
    return { type: "Accessoarer", tag: "clothing:accessoarer" };
  }
  if (
    /cardigan|sweater|knit|pullover|turtleneck|hoodie|fleece|sweatshirt/.test(t) &&
    !/jacket|coat|padded|down|blazer|cloak/.test(t)
  ) {
    return { type: "Stickat", tag: "clothing:stickat" };
  }
  if (
    /blouse|top|shirt|tee|crop/.test(t) &&
    !/jacket|coat|sweater|hoodie|dress/.test(t)
  ) {
    return { type: "Toppar", tag: "clothing:toppar" };
  }
  if (
    /jacket|coat|parkas|padded|down|trench|blazer|raincoat|denim|corduroy|cloak|woolen/.test(
      t,
    )
  ) {
    return { type: "Ytterkläder", tag: "clothing:ytterklader" };
  }
  return null;
}

const searches = [
  "women fleece lined leggings",
  "women high waist leggings winter",
  "women wide leg trousers",
  "women corduroy pants",
  "women knit wide pants",
  "women blouse elegant",
  "women lace top long sleeve",
  "women crew neck sweater",
  "women oversized cardigan",
  "women quilted vest",
];

const cj = await createCjClient({ minIntervalMs: 1100 });
const candidates = [];
for (const q of searches) {
  console.log("search", q);
  const data = await cj.get(
    `/product/listV2?page=1&size=15&keyWord=${encodeURIComponent(q)}&orderBy=1&sort=desc&features=enable_category`,
  );
  for (const row of flattenList(data)) {
    const pid = String(row.id || row.pid || "");
    const sku = row.sku || row.productSku || "";
    const name = row.nameEn || row.productNameEn || "";
    if (!pid || have.has(pid)) continue;
    if (sku && knownSkus.has(sku)) continue;
    const listed = Number(row.listedNum || 0);
    const usd = parseUsd(row.sellPrice || row.nowPrice);
    if (listed < 250 || usd <= 0 || usd > 30) continue;
    const cls = classify(name, row.threeCategoryName || row.categoryName || "");
    if (!cls) continue;
    candidates.push({
      pid,
      sku,
      name,
      listed,
      usd,
      category: row.threeCategoryName || row.categoryName,
      ...cls,
      image: row.bigImage || row.productImage,
    });
  }
}

const byPid = new Map();
for (const c of candidates) {
  const prev = byPid.get(c.pid);
  if (!prev || c.listed > prev.listed) byPid.set(c.pid, c);
}
const pool = [...byPid.values()].sort((a, b) => b.listed - a.listed);

const need = { Byxor: 4, Stickat: 2, Toppar: 2, Klänningar: 1, Ytterkläder: 1 };
const picks = [];
for (const type of Object.keys(need)) {
  for (const c of pool) {
    if (c.type !== type) continue;
    if (picks.find((p) => p.pid === c.pid)) continue;
    picks.push(c);
    need[type] -= 1;
    if (need[type] <= 0) break;
  }
}
while (picks.length < 14) {
  const c = pool.find((x) => !picks.find((p) => p.pid === x.pid));
  if (!c) break;
  picks.push(c);
}

const added = [];
for (const item of picks) {
  console.log(`detail ${item.sku || item.pid} (${item.type})`);
  const product = await cj.get(`/product/query?pid=${encodeURIComponent(item.pid)}`);
  const variants = product.variants || product.variantList || [];
  if (variants.length < 2 || variants.length > 60) continue;
  const colors = new Set();
  const sizes = new Set();
  for (const v of variants) {
    const { color, size } = splitVariantKey(v.variantKey);
    colors.add(color);
    sizes.add(size);
  }
  const heaviest = [...variants].sort(
    (a, b) => Number(b.variantWeight || 0) - Number(a.variantWeight || 0),
  )[0];
  const freight = await cj.post("/logistic/freightCalculate", {
    startCountryCode: "CN",
    endCountryCode: "SE",
    products: [{ vid: heaviest.vid, quantity: 1 }],
  });
  const ship = pickCheapestFreight(freight);
  if (!ship) continue;
  let stockOk = 0;
  let stockSum = 0;
  for (const v of variants.slice(0, 3)) {
    const rows = await cj.get(
      `/product/stock/queryByVid?vid=${encodeURIComponent(v.vid)}`,
    );
    const total = stockRowsTotal(rows);
    stockSum += total;
    if (total > 0) stockOk += 1;
  }
  if (!stockOk) continue;
  const maxUsd = Math.max(...variants.map((v) => Number(v.variantSellPrice) || 0));
  const landed = (maxUsd + Number(ship.logisticPrice)) * USD_TO_SEK;
  const price = retailSek(landed);
  if (price < 149 || price > 549) continue;
  const listedScore = Math.log10(item.listed + 10) * 30;
  const gapBoost =
    (
      {
        Stickat: 4,
        Toppar: 4,
        Klänningar: 5,
        Byxor: 5,
        Set: 4,
        Accessoarer: 4,
        Ytterkläder: 2,
      }[item.type] || 1
    ) * 8;
  const score =
    listedScore +
    gapBoost +
    (price >= 199 && price <= 399 ? 15 : 8) +
    (variants.length <= 30 ? 6 : 0) +
    stockOk * 2;
  added.push({
    pid: item.pid,
    sku: product.productSku || item.sku,
    name: product.productNameEn || item.name,
    category: product.categoryName || item.category,
    type: item.type,
    tag: item.tag,
    tags: ["clothing", item.tag, "gender:women"],
    listed: item.listed,
    variants: variants.length,
    colors: [...colors],
    sizes: [...sizes],
    maxUsd,
    freightUsd: Number(ship.logisticPrice),
    logistics: ship.logisticName,
    landedSek: Math.round(landed),
    estPriceSek: price,
    stockSampleOk: stockOk,
    stockSampleSum: stockSum,
    image: product.bigImage || product.productImageSet?.[0] || item.image,
    score: +score.toFixed(1),
    why: [
      `${item.listed.toLocaleString("en")} CJ store listings`,
      `fills ${item.type} gap`,
      `est ${price} SEK (landed ~${Math.round(landed)} + margin/VAT)`,
      `${variants.length} variants / ${colors.size} colors`,
      `${stockOk}/3 sampled sizes in stock`,
    ],
  });
}

const merged = [...existing.products, ...added].sort((a, b) => b.score - a.score);
const caps = {
  Stickat: 7,
  Ytterkläder: 6,
  Toppar: 4,
  Klänningar: 3,
  Byxor: 4,
  Set: 3,
  Accessoarer: 3,
};
const final = [];
const counts = {};
for (const row of merged) {
  if (final.find((f) => f.pid === row.pid)) continue;
  const n = counts[row.type] || 0;
  if (n >= (caps[row.type] || 2)) continue;
  counts[row.type] = n + 1;
  final.push(row);
  if (final.length >= 30) break;
}
for (const row of merged) {
  if (final.length >= 30) break;
  if (final.find((f) => f.pid === row.pid)) continue;
  final.push(row);
  counts[row.type] = (counts[row.type] || 0) + 1;
}

const products = final.slice(0, 30);
writeFileSync(
  "scripts/.cj-top30.json",
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      method:
        "CJ listedNum × assortment gap × SE freight price band × stock sample",
      storeContext: {
        focus: "Damkläder",
        priceBandSek: "199–399 preferred",
        gaps: "Byxor/Klänningar/Toppar/Set/Stickat under-indexed vs jackets",
      },
      counts,
      products,
    },
    null,
    2,
  ),
);

// also write import-ready batch stub (without Nordic copy polish)
writeFileSync(
  "scripts/cj-import-batch.top30.json",
  JSON.stringify(
    {
      products: products.map((p) => ({
        pid: p.pid,
        handle: String(p.name)
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")
          .slice(0, 60),
        title: p.name.slice(0, 80),
        productType: p.type,
        tags: p.tags,
        priceSek: p.estPriceSek,
        metaTitle: p.name.slice(0, 70),
        metaDescription: `${p.type}. Est ${p.estPriceSek} SEK. Rewrite before publish.`,
        descriptionHtml: `<p>${p.name}</p><p>Asiatisk storlek, faller litet. Välj variant ovan.</p>`,
        _analysis: {
          sku: p.sku,
          listed: p.listed,
          score: p.score,
          landedSek: p.landedSek,
          why: p.why,
          image: p.image,
        },
      })),
    },
    null,
    2,
  ),
);

console.log(
  JSON.stringify(
    {
      added: added.length,
      final: products.length,
      counts,
      rows: products.map((r, i) => ({
        n: i + 1,
        type: r.type,
        listed: r.listed,
        sek: r.estPriceSek,
        v: r.variants,
        sku: r.sku,
        name: r.name.slice(0, 52),
      })),
    },
    null,
    2,
  ),
);
