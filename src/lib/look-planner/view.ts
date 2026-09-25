import "server-only";

import { LOOK_SLOTS } from "@/lib/look-planner/config";
import type { Schedule } from "@/lib/look-planner/schedule";
import type { PlannerSettings } from "@/lib/look-planner/store";
import {
  currentWeekStart,
  isoWeekNumber,
  weekRangeLabel,
} from "@/lib/look-planner/weeks";
import { getProductsByIds } from "@/lib/shopify";
import { shopifyConfig } from "@/lib/shopify/config";

export type PlannerProduct = {
  id: string;
  title: string;
  handle: string;
  imageUrl: string | null;
  price: number;
  currencyCode: string;
  buyable: boolean;
};

export type PlannerLook = {
  slot: string;
  label: string;
  mode: "auto" | "manual";
  products: (PlannerProduct | null)[];
  total: number;
  discounted: number;
  /** Something in the look can't be bought — the discount can't trigger. */
  warning: boolean;
};

export type PlannerWeek = {
  weekStart: string;
  weekNumber: number;
  range: string;
  isCurrent: boolean;
  looks: PlannerLook[];
};

export type PlannerView = {
  shop: string;
  storefrontUrl: string;
  settings: Omit<PlannerSettings, "discountId"> & { discountActive: boolean };
  weeks: PlannerWeek[];
};

export async function buildPlannerView(
  shop: string,
  schedule: Schedule,
  settings: PlannerSettings,
): Promise<PlannerView> {
  const current = currentWeekStart();
  const weekStarts = [...schedule.keys()].filter((week) => week >= current).sort();
  const ids = [
    ...new Set(
      weekStarts.flatMap((week) =>
        Object.values(schedule.get(week) ?? {}).flatMap((look) => look.productIds),
      ),
    ),
  ];
  const products = await getProductsByIds(ids, "sv");
  const byId = new Map<string, PlannerProduct>(
    products.map((product) => [
      product.id,
      {
        id: product.id,
        title: product.title,
        handle: product.handle,
        imageUrl: product.featuredImage?.url ?? null,
        price: Number(product.priceRange.minVariantPrice.amount),
        currencyCode: product.priceRange.minVariantPrice.currencyCode,
        buyable: product.variants.some((variant) => variant.availableForSale),
      },
    ]),
  );
  const factor = 1 - settings.discountPercent / 100;

  const weeks = weekStarts.map((weekStart) => {
    const planned = schedule.get(weekStart) ?? {};
    const looks = LOOK_SLOTS.flatMap((slot): PlannerLook[] => {
      const look = planned[slot.key];
      if (!look) return [];
      const lookProducts = look.productIds.map((id) => byId.get(id) ?? null);
      const total = lookProducts.reduce((sum, p) => sum + (p?.price ?? 0), 0);
      return [
        {
          slot: slot.key,
          label: slot.label,
          mode: look.mode,
          products: lookProducts,
          total,
          discounted: Math.round(total * factor * 100) / 100,
          warning: lookProducts.some((p) => !p || !p.buyable),
        },
      ];
    });
    return {
      weekStart,
      weekNumber: isoWeekNumber(weekStart),
      range: weekRangeLabel(weekStart),
      isCurrent: weekStart === current,
      looks,
    };
  });

  const { discountId, ...rest } = settings;
  return {
    shop,
    storefrontUrl:
      process.env.NEXT_PUBLIC_SITE_URL?.trim() || `https://${shopifyConfig.storeDomain}`,
    settings: { ...rest, discountActive: Boolean(discountId) && !rest.lastPublishError },
    weeks,
  };
}
