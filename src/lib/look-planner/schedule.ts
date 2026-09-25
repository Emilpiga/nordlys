import "server-only";

import { pickLook, type PoolProduct } from "@/lib/look-planner/autopick";
import {
  LOOK_SLOTS,
  WEEKS_AHEAD,
  lookSlot,
} from "@/lib/look-planner/config";
import {
  getSettings,
  getWeeks,
  saveLook,
  type PlannedLook,
} from "@/lib/look-planner/store";
import { addWeeks, currentWeekStart } from "@/lib/look-planner/weeks";
import { getCollectionByHandle } from "@/lib/shopify";

export type Schedule = Map<string, Record<string, PlannedLook>>;

/** Buyable products per recipe collection, read from the storefront. */
async function loadPools() {
  const handles = [...new Set(LOOK_SLOTS.flatMap((slot) => slot.recipe.flat()))];
  const collections = await Promise.all(
    handles.map((handle) => getCollectionByHandle(handle, "sv")),
  );
  const pools = new Map<string, PoolProduct[]>();
  const buyable = new Set<string>();
  handles.forEach((handle, index) => {
    const products = (collections[index]?.products ?? []).map((product) => ({
      id: product.id,
      buyable:
        Boolean(product.featuredImage) &&
        product.variants.some((variant) => variant.availableForSale),
    }));
    for (const product of products) if (product.buyable) buyable.add(product.id);
    pools.set(handle, products);
  });
  return { pools, buyable };
}

export function plannedWeekStarts(now = new Date()) {
  const current = currentWeekStart(now);
  return Array.from({ length: WEEKS_AHEAD }, (_, i) => addWeeks(current, i));
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Product id -> weeks to the nearest *other* week in the schedule featuring it. */
function featuredDistance(schedule: Schedule, weekStart: string) {
  const target = Date.parse(`${weekStart}T00:00:00Z`);
  const distance = new Map<string, number>();
  for (const [week, looks] of schedule) {
    if (week === weekStart) continue;
    const weeks = Math.abs(Date.parse(`${week}T00:00:00Z`) - target) / WEEK_MS;
    for (const look of Object.values(looks)) {
      for (const id of look.productIds) {
        distance.set(id, Math.min(distance.get(id) ?? Infinity, weeks));
      }
    }
  }
  return distance;
}

function takenInWeek(looks: Record<string, PlannedLook>, exceptSlot: string) {
  return new Set(
    Object.entries(looks)
      .filter(([slot]) => slot !== exceptSlot)
      .flatMap(([, look]) => look.productIds),
  );
}

async function loadSchedule(shop: string, varietyWeeks: number) {
  const weeks = plannedWeekStarts();
  const history = Array.from({ length: varietyWeeks }, (_, i) =>
    addWeeks(weeks[0], -(i + 1)),
  );
  return getWeeks(shop, [...history, ...weeks]);
}

/**
 * Makes sure every slot in the planning window has a look. Auto looks whose
 * products can no longer be bought are re-picked; manual looks are left alone
 * (the planner flags them instead).
 */
export async function ensureSchedule(shop: string): Promise<Schedule> {
  const settings = await getSettings(shop);
  const [schedule, { pools, buyable }] = await Promise.all([
    loadSchedule(shop, settings.varietyWeeks),
    loadPools(),
  ]);

  for (const weekStart of plannedWeekStarts()) {
    const looks = schedule.get(weekStart) ?? {};
    for (const slot of LOOK_SLOTS) {
      const existing = looks[slot.key];
      const stale =
        existing?.mode === "auto" &&
        existing.productIds.some((id) => !buyable.has(id));
      if (existing && !stale) continue;

      const productIds = pickLook({
        recipe: slot.recipe,
        pools,
        featuredDistance: featuredDistance(schedule, weekStart),
        varietyWeeks: settings.varietyWeeks,
        taken: takenInWeek(looks, slot.key),
        seed: `${weekStart}:${slot.key}`,
      });
      if (!productIds) continue;
      looks[slot.key] = await saveLook(shop, weekStart, slot.key, {
        productIds,
        mode: "auto",
      });
    }
    schedule.set(weekStart, looks);
  }

  return schedule;
}

export async function setManualLook(
  shop: string,
  weekStart: string,
  slotKey: string,
  productIds: string[],
) {
  if (!lookSlot(slotKey)) throw new Error(`Unknown slot ${slotKey}`);
  return saveLook(shop, weekStart, slotKey, { productIds, mode: "manual" });
}

/**
 * A fresh automatic pick for one slot. `avoidCurrent` excludes the pieces on
 * screen so "Föreslå ny" always changes something when the catalog allows it.
 */
export async function autoPickLook(
  shop: string,
  weekStart: string,
  slotKey: string,
  { avoidCurrent }: { avoidCurrent: boolean },
) {
  const slot = lookSlot(slotKey);
  if (!slot) throw new Error(`Unknown slot ${slotKey}`);
  const settings = await getSettings(shop);
  const [schedule, { pools }] = await Promise.all([
    loadSchedule(shop, settings.varietyWeeks),
    loadPools(),
  ]);
  const looks = schedule.get(weekStart) ?? {};
  const taken = takenInWeek(looks, slotKey);
  if (avoidCurrent) {
    for (const id of looks[slotKey]?.productIds ?? []) taken.add(id);
  }

  const productIds =
    pickLook({
      recipe: slot.recipe,
      pools,
      featuredDistance: featuredDistance(schedule, weekStart),
      varietyWeeks: settings.varietyWeeks,
      taken,
      seed: `${weekStart}:${slotKey}:${Date.now()}`,
    }) ??
    // Not enough alternatives — fall back to a pick that may repeat pieces.
    pickLook({
      recipe: slot.recipe,
      pools,
      featuredDistance: featuredDistance(schedule, weekStart),
      varietyWeeks: settings.varietyWeeks,
      taken: takenInWeek(looks, slotKey),
      seed: `${weekStart}:${slotKey}:${Date.now()}`,
    });
  if (!productIds) return null;
  return saveLook(shop, weekStart, slotKey, { productIds, mode: "auto" });
}
