import discountsData from "@/data/discounts.json";
import type { Money } from "@/lib/shopify/types";

type DiscountsFile = {
  coverage: number;
  percents: number[];
  overrides: Record<string, number>;
  exclude: string[];
};

const data = discountsData as DiscountsFile;

function seedFromHandle(handle: string) {
  let hash = 2166136261;
  for (let i = 0; i < handle.length; i++) {
    hash ^= handle.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function listedPercent(handle: string): number | null {
  if (data.exclude.includes(handle)) return null;

  const override = data.overrides[handle];
  if (typeof override === "number" && override > 0 && override < 90) {
    return override;
  }

  const percents = data.percents.filter((value) => value > 0 && value < 90);
  if (percents.length === 0) return null;

  const seed = seedFromHandle(handle);
  const coverage = Math.min(1, Math.max(0, data.coverage));
  if (seed / 0xffffffff >= coverage) return null;

  return percents[seed % percents.length] ?? null;
}

function amountDecimals(amount: string) {
  const fraction = amount.split(".")[1];
  return fraction ? Math.min(fraction.length, 2) : 0;
}

function inflateAmount(amount: number, percent: number, decimals: number) {
  let compare = Math.ceil(amount / (1 - percent / 100) - 1e-9);
  while (compare > amount && Math.round((1 - amount / compare) * 100) < percent) {
    compare += 1;
  }

  const factor = 10 ** decimals;
  return Math.ceil(compare * factor - 1e-9) / factor;
}

export function listedCompareAt(handle: string, price: Money): Money | null {
  const percent = listedPercent(handle);
  if (percent == null) return null;

  const current = Number(price.amount);
  if (!Number.isFinite(current) || current <= 0) return null;

  const decimals = amountDecimals(price.amount);
  const compare = inflateAmount(current, percent, decimals);
  if (compare <= current) return null;

  return {
    amount: compare.toFixed(decimals),
    currencyCode: price.currencyCode,
  };
}

function isHigher(compareAt: Money, price: Money) {
  return Number(compareAt.amount) > Number(price.amount);
}

/** Compare-at for display: Shopify sale if present, otherwise the listed overlay. */
export function displayCompareAt(
  handle: string,
  price: Money,
  shopifyCompareAt: Money | null = null,
): Money | null {
  if (shopifyCompareAt && isHigher(shopifyCompareAt, price)) {
    return shopifyCompareAt;
  }
  const listed = listedCompareAt(handle, price);
  return listed && isHigher(listed, price) ? listed : null;
}

export function discountPercent(price: Money, compareAt: Money): number | null {
  const current = Number(price.amount);
  const previous = Number(compareAt.amount);
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous <= current) {
    return null;
  }
  return Math.max(1, Math.round((1 - current / previous) * 100));
}
