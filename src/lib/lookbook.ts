import "server-only";

import type { HeroTheme } from "@/lib/hero-images";
import { LOOK_SLOTS, PIECES_PER_LOOK, type LookSlot } from "@/lib/look-planner/config";
import { getSettings, getWeek, type PlannedLook } from "@/lib/look-planner/store";
import { currentWeekStart } from "@/lib/look-planner/weeks";
import {
  getCollectionByHandle,
  getProductByHandle,
  getProductsByIds,
} from "@/lib/shopify";
import { shopifyConfig } from "@/lib/shopify/config";
import type { Collection, Product } from "@/lib/shopify/types";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export type Look = {
  key: string;
  theme: HeroTheme;
  label: string;
  href: string;
  pieces: Product[];
  /** Planned in the admin planner, so the look discount applies to it. */
  planned: boolean;
};

export type WeeklyLooks = {
  looks: Look[];
  /** Whole-look discount in percent, or null while the discount isn't live. */
  discountPercent: number | null;
};

function isShowable(product: Product) {
  return (
    Boolean(product.featuredImage) &&
    product.variants.some((variant) => variant.availableForSale)
  );
}

/** This week's plan and discount from the planner; empty if Redis is unavailable. */
async function readPlan() {
  const shop = shopifyConfig.storeDomain;
  try {
    const [planned, settings] = await Promise.all([
      getWeek(shop, currentWeekStart()),
      getSettings(shop),
    ]);
    const live = Boolean(settings.discountId) && !settings.lastPublishError;
    return {
      planned,
      discountPercent:
        live && settings.discountPercent > 0 ? settings.discountPercent : null,
    };
  } catch (error) {
    console.error("Lookbook: could not read the planner:", error);
    return { planned: {} as Record<string, PlannedLook>, discountPercent: null };
  }
}

/** Full products (all variants, for the size/colour pickers) in plan order. */
async function plannedPieces(look: PlannedLook | undefined, locale: string) {
  if (!look || look.productIds.length !== PIECES_PER_LOOK) return null;
  const cards = await getProductsByIds(look.productIds, locale, {
    cache: "force-cache",
  });
  const byId = new Map(cards.map((card) => [card.id, card]));
  const pieces = await Promise.all(
    look.productIds.map(async (id) => {
      const card = byId.get(id);
      return card ? getProductByHandle(card.handle, locale) : null;
    }),
  );
  return pieces.every((piece): piece is Product => Boolean(piece && isShowable(piece)))
    ? pieces
    : null;
}

/** Fallback when a slot isn't planned: the old deterministic weekly rotation. */
function rotationPieces(
  slot: LookSlot,
  collections: Map<string, Collection>,
) {
  const week = Math.floor(Date.now() / WEEK_MS);
  const pieces: Product[] = [];
  slot.recipe.forEach((handles, slotIndex) => {
    for (const handle of handles) {
      const pool = (collections.get(handle)?.products ?? []).filter(
        (product) =>
          isShowable(product) && !pieces.some((piece) => piece.id === product.id),
      );
      if (pool.length === 0) continue;
      // Offset each slot so the pieces don't all advance in lockstep.
      pieces.push(pool[(week + slotIndex * 3) % pool.length]);
      return;
    }
  });
  return pieces.length === PIECES_PER_LOOK ? pieces : null;
}

/**
 * "Veckans look": the looks planned for this week in Shopify admin
 * (/shopify-admin), per gender and per room. Any slot without a usable plan
 * falls back to a weekly rotation so the section is never empty.
 */
export async function getWeeklyLooks(locale: string): Promise<WeeklyLooks> {
  const { planned, discountPercent } = await readPlan();
  const handles = [
    ...new Set(LOOK_SLOTS.flatMap((slot) => [slot.key, ...slot.recipe.flat()])),
  ];
  const collections = new Map(
    (await Promise.all(handles.map((handle) => getCollectionByHandle(handle, locale))))
      .filter((collection) => collection !== null)
      .map((collection) => [collection.handle, collection]),
  );

  const looks = await Promise.all(
    LOOK_SLOTS.map(async (slot): Promise<Look | null> => {
      const parent = collections.get(slot.key);
      if (!parent) return null;
      const fromPlan = await plannedPieces(planned[slot.key], locale);
      const pieces = fromPlan ?? rotationPieces(slot, collections);
      if (!pieces) return null;
      return {
        key: slot.key,
        theme: slot.theme,
        label: parent.title,
        href: `/collections/${slot.key}`,
        pieces,
        planned: Boolean(fromPlan),
      };
    }),
  );

  return {
    looks: looks.filter((look): look is Look => look !== null),
    discountPercent,
  };
}
