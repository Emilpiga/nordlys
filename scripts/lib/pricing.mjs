#!/usr/bin/env node
/**
 * Retail pricing in SEK. Storefront prices are all-in: CJ product + freight to
 * Sweden + our profit + VAT, with no shipping added at checkout.
 */

import { pickCheapestFreight } from "./cj-client.mjs";

export const USD_TO_SEK = 10.5;
export const VAT_RATE = 0.25;
export const PROFIT_BEFORE_VAT_SEK = 70;
/** Largest share of the ex-VAT price that may be profit when following a competitor's price. */
export const MAX_MARGIN = 0.6;

export function roundUpToNine(amount) {
  const base = Math.ceil(amount);
  const mod = base % 10;
  const delta = mod === 9 ? 0 : (9 - mod + 10) % 10;
  return base + delta;
}

function roundDownToNine(amount) {
  const up = roundUpToNine(amount);
  return up > amount ? up - 10 : up;
}

/** Lowest price that still earns PROFIT_BEFORE_VAT_SEK. */
export function minRetailSek(landedSek) {
  return roundUpToNine((landedSek + PROFIT_BEFORE_VAT_SEK) * (1 + VAT_RATE));
}

/** Highest price we follow a competitor to: profit capped at maxMargin of the ex-VAT price. */
export function maxRetailSek(landedSek, maxMargin = MAX_MARGIN) {
  if (!(maxMargin > 0 && maxMargin < 1)) {
    throw new Error(`maxMargin must be between 0 and 1, got ${maxMargin}`);
  }
  const capped = roundDownToNine((landedSek / (1 - maxMargin)) * (1 + VAT_RATE));
  return Math.max(capped, minRetailSek(landedSek));
}

/**
 * The competitor's price when it sits inside our band, otherwise the nearest
 * edge of the band. Their price already includes VAT and shipping, like ours.
 */
export function followPrice(sourceSek, landedSek, maxMargin = MAX_MARGIN) {
  const minSek = minRetailSek(landedSek);
  const maxSek = maxRetailSek(landedSek, maxMargin);
  const source = Number(sourceSek);
  let priceSek = minSek;
  let verdict = "no-source";
  if (sourceSek != null && Number.isFinite(source) && source > 0) {
    if (source < minSek) verdict = "raised-to-min";
    else if (source > maxSek) {
      priceSek = maxSek;
      verdict = "capped-at-max";
    } else {
      priceSek = Math.round(source);
      verdict = "source";
    }
  }
  return {
    priceSek,
    minSek,
    maxSek,
    verdict,
    profitSek: Math.round(priceSek / (1 + VAT_RATE) - landedSek),
  };
}

/** CJ cost of the dearest variant plus the cheapest freight to Sweden, in SEK. */
export async function landedCostFromCj(cj, variants) {
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
  return {
    logistics: ship.logisticName,
    freightUsd: Number(ship.logisticPrice),
    maxUsd,
    landedSek: (maxUsd + Number(ship.logisticPrice)) * USD_TO_SEK,
  };
}
