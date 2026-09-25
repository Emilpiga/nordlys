import "server-only";

import { Redis } from "@upstash/redis";
import {
  DEFAULT_DISCOUNT_PERCENT,
  DEFAULT_VARIETY_WEEKS,
} from "@/lib/look-planner/config";

/**
 * Planner state in Upstash Redis, next to presence and traction:
 *   looks:v1:<shop>:week:<monday>  hash  slot -> PlannedLook JSON
 *   looks:v1:<shop>:settings       JSON  PlannerSettings
 *   looks:v1:<shop>:token          JSON  OfflineToken (Admin API access)
 */

export type PlannedLook = {
  productIds: string[];
  mode: "auto" | "manual";
  updatedAt: string;
};

export type PlannerSettings = {
  discountPercent: number;
  varietyWeeks: number;
  /** The automatic app discount this planner manages, once created. */
  discountId: string | null;
  lastPublishedAt: string | null;
  lastPublishError: string | null;
};

export type OfflineToken = {
  accessToken: string;
  scope: string;
  /** Epoch ms; null for tokens that don't expire. */
  expiresAt: number | null;
  refreshToken: string | null;
};

/** Past weeks are kept a year so the variety rule has history to look at. */
const WEEK_TTL_SECONDS = 400 * 24 * 60 * 60;

let redis: Redis | null = null;

function client() {
  if (!redis) redis = Redis.fromEnv();
  return redis;
}

function key(shop: string, ...parts: string[]) {
  return ["looks", "v1", shop, ...parts].join(":");
}

export async function getWeek(
  shop: string,
  weekStart: string,
): Promise<Record<string, PlannedLook>> {
  const raw = await client().hgetall<Record<string, PlannedLook>>(
    key(shop, "week", weekStart),
  );
  return raw ?? {};
}

export async function getWeeks(shop: string, weekStarts: string[]) {
  const pipeline = client().pipeline();
  for (const weekStart of weekStarts) {
    pipeline.hgetall(key(shop, "week", weekStart));
  }
  const results = (await pipeline.exec()) as (Record<
    string,
    PlannedLook
  > | null)[];
  return new Map(
    weekStarts.map((weekStart, index) => [weekStart, results[index] ?? {}]),
  );
}

export async function saveLook(
  shop: string,
  weekStart: string,
  slot: string,
  look: Omit<PlannedLook, "updatedAt">,
) {
  const weekKey = key(shop, "week", weekStart);
  const value: PlannedLook = { ...look, updatedAt: new Date().toISOString() };
  await client().hset(weekKey, { [slot]: value });
  await client().expire(weekKey, WEEK_TTL_SECONDS);
  return value;
}

export async function getSettings(shop: string): Promise<PlannerSettings> {
  const stored = await client().get<Partial<PlannerSettings>>(
    key(shop, "settings"),
  );
  return {
    discountPercent: stored?.discountPercent ?? DEFAULT_DISCOUNT_PERCENT,
    varietyWeeks: stored?.varietyWeeks ?? DEFAULT_VARIETY_WEEKS,
    discountId: stored?.discountId ?? null,
    lastPublishedAt: stored?.lastPublishedAt ?? null,
    lastPublishError: stored?.lastPublishError ?? null,
  };
}

export async function updateSettings(
  shop: string,
  patch: Partial<PlannerSettings>,
) {
  const next = { ...(await getSettings(shop)), ...patch };
  await client().set(key(shop, "settings"), next);
  return next;
}

export async function getOfflineToken(shop: string) {
  return client().get<OfflineToken>(key(shop, "token"));
}

export async function saveOfflineToken(shop: string, token: OfflineToken) {
  await client().set(key(shop, "token"), token);
}

export async function deleteOfflineToken(shop: string) {
  await client().del(key(shop, "token"));
}
