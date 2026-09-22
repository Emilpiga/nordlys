import "server-only";

import { unstable_cache } from "next/cache";
import { Redis } from "@upstash/redis";
import { isValidProductId } from "@/lib/presence";
import type {
  TractionBadge,
  TractionMetrics,
} from "@/lib/product-traction-types";

export type { TractionBadge, TractionMetrics } from "@/lib/product-traction-types";
export { assignFeaturedBadges } from "@/lib/product-traction-badges";

export type ProductTraction = TractionMetrics & {
  badge?: TractionBadge;
};

const VIEWS_KEY = "traction:views";
const CARTS_KEY = "traction:carts";
const SALES_KEY = "traction:sales";
const LAST_SALE_KEY = "traction:last_sale";
const SCORE_KEY = "traction:score";

const VIEW_WEIGHT = 1;
const CART_WEIGHT = 8;
const SALE_WEIGHT = 40;

let redis: Redis | null | undefined;

export function isTractionRedisConfigured() {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL?.trim() &&
      process.env.UPSTASH_REDIS_REST_TOKEN?.trim(),
  );
}

function getRedis() {
  if (redis !== undefined) return redis;
  if (!isTractionRedisConfigured()) {
    redis = null;
    return redis;
  }
  redis = Redis.fromEnv();
  return redis;
}

function toScore(value: unknown) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function toTimestamp(value: unknown) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

async function bump(
  metricKey: string,
  productId: string,
  amount: number,
  weight: number,
) {
  if (amount <= 0 || !isValidProductId(productId)) return;
  const client = getRedis();
  if (!client) return;

  const pipeline = client.pipeline();
  pipeline.zincrby(metricKey, amount, productId);
  pipeline.zincrby(SCORE_KEY, amount * weight, productId);
  await pipeline.exec();
}

async function touchLastSale(productId: string, soldAt: number) {
  if (!isValidProductId(productId) || soldAt <= 0) return;
  const client = getRedis();
  if (!client) return;

  const previous = toTimestamp(await client.zscore(LAST_SALE_KEY, productId));
  if (soldAt <= previous) return;
  await client.zadd(LAST_SALE_KEY, { score: soldAt, member: productId });
}

export async function recordView(productId: string) {
  await bump(VIEWS_KEY, productId, 1, VIEW_WEIGHT);
}

export async function recordCart(productId: string, quantity = 1) {
  await bump(CARTS_KEY, productId, quantity, CART_WEIGHT);
}

export async function recordSale(
  productId: string,
  quantity = 1,
  soldAt: number = Date.now(),
) {
  await bump(SALES_KEY, productId, quantity, SALE_WEIGHT);
  await touchLastSale(productId, soldAt);
}

/**
 * Replace sales counters with absolute Shopify totals and adjust combined
 * scores by delta. Optionally sets last-sale timestamps (most recent purchase).
 */
export async function replaceSalesTotals(
  totals: ReadonlyMap<string, number>,
  lastSaleAt?: ReadonlyMap<string, number>,
): Promise<number> {
  const client = getRedis();
  if (!client) return 0;

  const entries = [...totals.entries()].filter(
    ([productId, qty]) =>
      isValidProductId(productId) && Number.isFinite(qty) && qty >= 0,
  );
  if (entries.length === 0) return 0;

  const CHUNK = 40;
  let updated = 0;

  for (let offset = 0; offset < entries.length; offset += CHUNK) {
    const chunk = entries.slice(offset, offset + CHUNK);

    const scorePipe = client.pipeline();
    for (const [productId] of chunk) {
      scorePipe.zscore(SALES_KEY, productId);
    }
    const previous = await scorePipe.exec();

    const writePipe = client.pipeline();
    chunk.forEach(([productId, nextSales], index) => {
      const oldSales = toScore(previous[index]);
      const next = Math.max(0, Math.floor(nextSales));
      const delta = next - oldSales;
      if (next > 0) {
        writePipe.zadd(SALES_KEY, { score: next, member: productId });
      } else if (oldSales > 0) {
        writePipe.zrem(SALES_KEY, productId);
        writePipe.zrem(LAST_SALE_KEY, productId);
      }
      if (delta !== 0) {
        writePipe.zincrby(SCORE_KEY, delta * SALE_WEIGHT, productId);
      }
      const soldAt = lastSaleAt ? toTimestamp(lastSaleAt.get(productId)) : 0;
      if (soldAt > 0) {
        writePipe.zadd(LAST_SALE_KEY, { score: soldAt, member: productId });
      }
      if (delta !== 0 || next !== oldSales || soldAt > 0) updated += 1;
    });
    await writePipe.exec();
  }

  return updated;
}

async function fetchTopTraction(limit: number): Promise<ProductTraction[]> {
  const client = getRedis();
  if (!client || limit <= 0) return [];

  const ranked = await client.zrange<unknown[]>(SCORE_KEY, 0, limit - 1, {
    rev: true,
    withScores: true,
  });

  const entries: { productId: string; score: number }[] = [];
  if (Array.isArray(ranked)) {
    for (let i = 0; i < ranked.length; i++) {
      const row = ranked[i];
      if (row && typeof row === "object" && "member" in row && "score" in row) {
        const productId = String((row as { member: unknown }).member);
        const score = toScore((row as { score: unknown }).score);
        if (isValidProductId(productId) && score > 0) {
          entries.push({ productId, score });
        }
        continue;
      }
      if (typeof row === "string") {
        const productId = row;
        const score = toScore(ranked[i + 1]);
        i += 1;
        if (isValidProductId(productId) && score > 0) {
          entries.push({ productId, score });
        }
      }
    }
  }

  if (entries.length === 0) return [];

  const pipeline = client.pipeline();
  for (const entry of entries) {
    pipeline.zscore(VIEWS_KEY, entry.productId);
    pipeline.zscore(CARTS_KEY, entry.productId);
    pipeline.zscore(SALES_KEY, entry.productId);
    pipeline.zscore(LAST_SALE_KEY, entry.productId);
  }
  const metrics = await pipeline.exec();

  return entries.map((entry, index) => {
    const base = index * 4;
    return {
      productId: entry.productId,
      views: toScore(metrics[base]),
      carts: toScore(metrics[base + 1]),
      sales: toScore(metrics[base + 2]),
      lastSaleAt: toTimestamp(metrics[base + 3]),
      score: entry.score,
    };
  });
}

export function getTopTraction(limit = 24): Promise<ProductTraction[]> {
  const capped = Math.max(1, Math.min(limit, 48));
  return unstable_cache(
    () => fetchTopTraction(capped),
    ["product-traction-top", "v2-last-sale", String(capped)],
    { revalidate: 60 },
  )();
}
