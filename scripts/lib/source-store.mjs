#!/usr/bin/env node
/**
 * Read products from a competitor's Shopify storefront (public JSON endpoints)
 * and pair their variants with a CJ product's variants.
 */

import { splitVariantKey } from "./cj-client.mjs";
import { VALUES } from "../translate-variant-options.mjs";

// Ask for the Swedish market so multi-currency stores answer in SEK.
const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
  "Accept-Language": "sv-SE,sv;q=0.9",
  Cookie: "localization=SE; cart_currency=SEK",
};

export const COLOR_OPTION = /^(färg|farge|farve|väri|colou?r|kulör)$/i;
export const SIZE_OPTION = /^(storlek|størrelse|koko|size|strl\.?)$/i;

async function get(url) {
  const response = await fetch(url, { headers: HEADERS, redirect: "follow" });
  if (!response.ok) throw new Error(`${url} → HTTP ${response.status}`);
  return response.text();
}

async function getJson(url) {
  const text = await get(url);
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${url} did not answer JSON — not a Shopify storefront?`);
  }
}

export function parseSourceUrl(input) {
  const url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
  return {
    origin: url.origin,
    host: url.hostname.replace(/^www\./, ""),
    productHandle: url.pathname.match(/\/products\/([^/?#]+)/)?.[1] ?? null,
    collectionPath:
      url.pathname.match(/\/collections\/[^/?#]+/)?.[0] ?? "/collections/all",
  };
}

/** Currency the store charges a Swedish visitor, or null when it won't say. */
export async function storeCurrency(origin) {
  try {
    return (await getJson(`${origin}/cart.js`)).currency || null;
  } catch {
    return null;
  }
}

/** Product handles in the store's own best-selling order. */
export async function bestSellerHandles(origin, collectionPath, limit) {
  const html = await get(`${origin}${collectionPath}?sort_by=best-selling`);
  const handles = [];
  for (const match of html.matchAll(
    /href=["'][^"']*?\/products\/([\w\-%]+)(?![\w\-%.])/g,
  )) {
    const handle = decodeURIComponent(match[1]);
    if (!handles.includes(handle)) handles.push(handle);
    if (handles.length >= limit) break;
  }
  return handles;
}

function absoluteUrl(src) {
  if (!src) return null;
  return src.startsWith("//") ? `https:${src}` : src;
}

export function htmlToText(html) {
  return String(html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * The competitor's description as written, minus what can't move stores:
 * their media, links back to their site, and theme-specific markup.
 */
export function cleanSourceDescription(html) {
  let cleaned = String(html || "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(
      /<(script|style|iframe|video|svg|picture|figure|noscript|button|form)\b[\s\S]*?<\/\1>/gi,
      "",
    )
    .replace(/<img\b[^>]*>/gi, "")
    .replace(/<\/?(a|span|div|font|section|article)\b[^>]*>/gi, "")
    .replace(
      /\s(?:class|id|style|dir|lang|role|data-[\w-]+|aria-[\w-]+)=("[^"]*"|'[^']*')/gi,
      "",
    );
  for (let pass = 0; pass < 2; pass += 1) {
    cleaned = cleaned.replace(
      /<(p|li|ul|ol|h[1-6]|strong|em|b)>(\s|&nbsp;|<br\s*\/?>)*<\/\1>/gi,
      "",
    );
  }
  return cleaned.replace(/\n{3,}/g, "\n\n").trim();
}

export async function fetchSourceProduct(origin, handle) {
  const raw = await getJson(`${origin}/products/${encodeURIComponent(handle)}.js`);
  const images = (raw.images || []).map(absoluteUrl).filter(Boolean);
  return {
    url: `${origin}/products/${raw.handle}`,
    handle: raw.handle,
    title: raw.title,
    vendor: raw.vendor || "",
    type: raw.type || "",
    descriptionHtml: cleanSourceDescription(raw.description),
    options: (raw.options || []).map((option) =>
      typeof option === "string" ? option : option.name,
    ),
    variants: (raw.variants || []).map((variant) => ({
      title: variant.title,
      options: variant.options || [],
      priceSek: Number(variant.price) / 100,
      available: variant.available !== false,
      image: absoluteUrl(variant.featured_image?.src),
    })),
    images,
  };
}

const CLOTHING_TYPES = [
  [/dress|klänning/, "Klänningar", "clothing:klanningar"],
  [/\bset\b|two piece|2 piece|tvådelad/, "Set", "clothing:set"],
  [
    /scarf|shawl|beanie|glove|sjal|halsduk|mössa|vantar|handskar/,
    "Accessoarer",
    "clothing:accessoarer",
  ],
  [
    /jacket|coat|parka|padded|trench|blazer|\bvest\b|jacka|kappa|\brock\b|väst/,
    "Ytterkläder",
    "clothing:ytterklader",
  ],
  [
    /cardigan|sweater|knit|pullover|turtleneck|hoodie|fleece|sweatshirt|tröja|kofta|stickad|stickat/,
    "Stickat",
    "clothing:stickat",
  ],
  [
    /legging|tights|pants|trouser|jogger|jeans|skirt|shorts|byxor|byxa|kjol/,
    "Byxor",
    "clothing:byxor",
  ],
  [
    /blouse|\btop\b|shirt|\btee\b|blus|\btopp\b|skjorta|linne/,
    "Toppar",
    "clothing:toppar",
  ],
];

/** Product type + collection tag from an English (CJ) or Swedish title. */
export function classifyClothing(text) {
  const blob = String(text || "").toLowerCase();
  for (const [pattern, productType, tag] of CLOTHING_TYPES) {
    if (pattern.test(blob)) return { productType, tag };
  }
  return null;
}

export function genderTag(text) {
  return /\bmen'?s?\b|\bman\b|\bherr/i.test(String(text || ""))
    ? "gender:men"
    : "gender:women";
}

function normalizeSize(value) {
  const upper = String(value || "").toUpperCase().replace(/\s+/g, "");
  if (/^(ONE|ONESIZE|OS|ENSTORLEK|FREESIZE|F)$/.test(upper)) return "ONE";
  return { "2XS": "XXS", "2XL": "XXL", "3XL": "XXXL", XXXXL: "4XL" }[upper] ?? upper;
}

function sameColor(sourceColor, cjColor, overrides) {
  const source = sourceColor.trim().toLowerCase();
  const cj = cjColor.trim().toLowerCase();
  if (overrides.has(source)) return overrides.get(source) === cj;
  return source === cj || VALUES[cj]?.sv.toLowerCase() === source;
}

/**
 * Pair each competitor variant with the CJ variant it resells. Sizes match on
 * the letter, colours on the Swedish name of CJ's English one; anything else
 * needs `colorOverrides` (lower-cased source colour → lower-cased CJ colour)
 * or `pairs` (lower-cased source variant title → lower-cased CJ variant key).
 */
export function matchVariants(
  source,
  cjVariants,
  { colorOverrides = new Map(), pairs = new Map() } = {},
) {
  const cj = cjVariants.map((variant) => ({
    variant,
    ...splitVariantKey(variant.variantKey),
  }));
  const cjColors = [...new Set(cj.map((row) => row.color))];
  const cjSizes = [...new Set(cj.map((row) => row.size))];

  const sizeIndex = source.options.findIndex((name) => SIZE_OPTION.test(name.trim()));
  let colorIndex = source.options.findIndex((name) => COLOR_OPTION.test(name.trim()));
  // An axis that isn't a size ("Mönster", "Modell") plays the colour's part.
  if (colorIndex === -1) {
    colorIndex = source.options.findIndex(
      (name, index) => index !== sizeIndex && name !== "Title",
    );
  }

  const used = new Set();
  const mapped = [];
  const unmapped = [];
  for (const variant of source.variants) {
    const color = colorIndex === -1 ? null : variant.options[colorIndex];
    const size = sizeIndex === -1 ? null : variant.options[sizeIndex];
    const paired = pairs.get(variant.title.trim().toLowerCase());
    const candidates = cj.filter((row) => {
      if (used.has(row.variant.vid)) return false;
      if (paired) {
        return String(row.variant.variantKey).trim().toLowerCase() === paired;
      }
      const colorFits =
        color == null
          ? cjColors.length === 1
          : sameColor(color, row.color, colorOverrides);
      const sizeFits =
        size == null
          ? cjSizes.length === 1
          : normalizeSize(size) === normalizeSize(row.size);
      return colorFits && sizeFits;
    });
    if (candidates.length === 1) {
      used.add(candidates[0].variant.vid);
      mapped.push({ source: variant, cj: candidates[0] });
    } else {
      unmapped.push(variant);
    }
  }
  return {
    mapped,
    unmapped,
    colorIndex,
    sizeIndex,
    cjUnused: cj.filter((row) => !used.has(row.variant.vid)),
  };
}
