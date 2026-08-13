import { Redis } from "@upstash/redis";
import {
  PRESENCE_TTL_MS,
  VIEWER_COOKIE,
} from "@/lib/presence-constants";

export { PRESENCE_HEARTBEAT_MS, PRESENCE_TTL_MS, VIEWER_COOKIE } from "@/lib/presence-constants";

const PRODUCT_ID_RE = /^gid:\/\/shopify\/Product\/\d+$/;
const VIEWER_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

let redis: Redis | null | undefined;

export function isPresenceConfigured() {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL?.trim() &&
      process.env.UPSTASH_REDIS_REST_TOKEN?.trim(),
  );
}

function getRedis() {
  if (redis !== undefined) return redis;
  if (!isPresenceConfigured()) {
    redis = null;
    return redis;
  }
  redis = Redis.fromEnv();
  return redis;
}

export function isValidProductId(productId: string) {
  return PRODUCT_ID_RE.test(productId);
}

export function isValidViewerId(viewerId: string) {
  return VIEWER_ID_RE.test(viewerId);
}

export function createViewerId() {
  return crypto.randomUUID();
}

function presenceKey(productId: string) {
  return `presence:product:${productId}`;
}

/**
 * Record that `viewerId` is actively viewing `productId`.
 * Returns how many *other* distinct viewers are present (excludes self).
 */
export async function heartbeatPresence(
  productId: string,
  viewerId: string,
): Promise<number | null> {
  const client = getRedis();
  if (!client) return null;

  const key = presenceKey(productId);
  const now = Date.now();
  const expiresAt = now + PRESENCE_TTL_MS;

  const pipeline = client.pipeline();
  pipeline.zremrangebyscore(key, 0, now);
  pipeline.zadd(key, { score: expiresAt, member: viewerId });
  pipeline.expire(key, Math.ceil(PRESENCE_TTL_MS / 1000) + 15);
  pipeline.zcard(key);
  const results = await pipeline.exec();

  const total = Number(results[3] ?? 0);
  if (!Number.isFinite(total) || total <= 0) return 0;
  return Math.max(0, total - 1);
}
