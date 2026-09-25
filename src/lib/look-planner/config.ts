import type { HeroTheme } from "@/lib/hero-images";

export type LookSlot = {
  key: string;
  theme: HeroTheme;
  /** Planner label (Swedish admin). The storefront uses the collection title. */
  label: string;
  /** One piece per slot, each from the first collection that has one to give. */
  recipe: string[][];
};

/** The looks planned each week, in the order the planner lists them. */
export const LOOK_SLOTS: LookSlot[] = [
  {
    key: "dam",
    theme: "clothing",
    label: "Dam",
    recipe: [
      ["dam-ytterklader"],
      ["dam-stickat", "dam-toppar", "dam-klanningar"],
      ["dam-accessoarer"],
    ],
  },
  {
    key: "herr",
    theme: "clothing",
    label: "Herr",
    recipe: [
      ["herr-ytterklader"],
      ["herr-stickat", "herr-toppar"],
      ["herr-accessoarer", "herr-byxor"],
    ],
  },
  {
    key: "vardagsrum",
    theme: "home",
    label: "Vardagsrum",
    recipe: [["vardagsrum"], ["vardagsrum"], ["vardagsrum", "sovrum"]],
  },
  {
    key: "sovrum",
    theme: "home",
    label: "Sovrum",
    recipe: [["sovrum"], ["sovrum"], ["sovrum", "vardagsrum"]],
  },
  {
    key: "kok",
    theme: "home",
    label: "Kök",
    recipe: [["kok"], ["kok"], ["kok"]],
  },
];

export const PIECES_PER_LOOK = 3;

/** Weeks the planner keeps filled ahead of today (this week included). */
export const WEEKS_AHEAD = 8;

export const DEFAULT_DISCOUNT_PERCENT = 10;
export const DEFAULT_VARIETY_WEEKS = 6;

export function lookSlot(key: string) {
  return LOOK_SLOTS.find((slot) => slot.key === key) ?? null;
}
