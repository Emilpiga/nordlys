import type { HeroTheme } from "@/lib/hero-images";
import { getCollectionByHandle } from "@/lib/shopify";
import type { Product } from "@/lib/shopify/types";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Look recipe: one piece from each slot, falling back along the list. Clothing
 * looks are outfits; home looks are three things for one room.
 */
const LOOK_RECIPES: {
  key: string;
  theme: HeroTheme;
  slots: string[][];
}[] = [
  {
    key: "dam",
    theme: "clothing",
    slots: [
      ["dam-ytterklader"],
      ["dam-stickat", "dam-toppar", "dam-klanningar"],
      ["dam-accessoarer"],
    ],
  },
  {
    key: "herr",
    theme: "clothing",
    slots: [
      ["herr-ytterklader"],
      ["herr-stickat", "herr-toppar"],
      ["herr-accessoarer", "herr-byxor"],
    ],
  },
  {
    key: "vardagsrum",
    theme: "home",
    slots: [["vardagsrum"], ["vardagsrum"], ["vardagsrum", "sovrum"]],
  },
  {
    key: "sovrum",
    theme: "home",
    slots: [["sovrum"], ["sovrum"], ["sovrum", "vardagsrum"]],
  },
  {
    key: "kok",
    theme: "home",
    slots: [["kok"], ["kok"], ["kok"]],
  },
];

export type Look = {
  key: string;
  theme: HeroTheme;
  label: string;
  href: string;
  pieces: Product[];
};

function isShowable(product: Product) {
  return (
    Boolean(product.featuredImage) &&
    product.variants.some((variant) => variant.availableForSale)
  );
}

/**
 * "Veckans look": outfits per gender and sets per room that change every
 * week. The pick is deterministic for the week so every visitor and every
 * render agree.
 */
export async function getWeeklyLooks(locale: string): Promise<Look[]> {
  const week = Math.floor(Date.now() / WEEK_MS);
  const handles = [
    ...new Set(
      LOOK_RECIPES.flatMap((recipe) => [recipe.key, ...recipe.slots.flat()]),
    ),
  ];
  const collections = new Map(
    (
      await Promise.all(
        handles.map((handle) => getCollectionByHandle(handle, locale)),
      )
    )
      .filter((collection) => collection !== null)
      .map((collection) => [collection.handle, collection]),
  );

  const looks: Look[] = [];
  for (const recipe of LOOK_RECIPES) {
    const pieces: Product[] = [];
    recipe.slots.forEach((slot, slotIndex) => {
      for (const handle of slot) {
        const pool = (collections.get(handle)?.products ?? []).filter(
          (product) =>
            isShowable(product) &&
            !pieces.some((piece) => piece.id === product.id),
        );
        if (pool.length === 0) continue;
        // Offset each slot so the pieces don't all advance in lockstep.
        pieces.push(pool[(week + slotIndex * 3) % pool.length]);
        return;
      }
    });
    const parent = collections.get(recipe.key);
    if (pieces.length === 3 && parent) {
      looks.push({
        key: recipe.key,
        theme: recipe.theme,
        label: parent.title,
        href: `/collections/${recipe.key}`,
        pieces,
      });
    }
  }
  return looks;
}
