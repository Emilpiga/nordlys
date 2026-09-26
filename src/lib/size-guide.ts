/** Letter sizes for clothing: recognising size options and ordering them. */

export const LETTER_SIZES = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "4XL", "5XL"] as const;
export type LetterSize = (typeof LETTER_SIZES)[number];

const ALIASES: Record<string, LetterSize> = {
  "2XS": "XXS",
  "2XL": "XXL",
  "3XL": "XXXL",
  XXXXL: "4XL",
  XXXXXL: "5XL",
};

/** Product types that are clothing (sizes run small); gloves etc. are not. */
const APPAREL_TYPES = new Set([
  "ytterkläder",
  "stickat",
  "toppar",
  "byxor",
  "klänningar",
  "set",
  "accessoarer",
  "kläder",
]);

export function isApparel(productType: string) {
  return APPAREL_TYPES.has(productType.trim().toLowerCase());
}

function normalizeSize(value: string): LetterSize | null {
  const upper = value.trim().toUpperCase();
  const size = ALIASES[upper] ?? upper;
  return (LETTER_SIZES as readonly string[]).includes(size)
    ? (size as LetterSize)
    : null;
}

const SIZE_OPTION = /^(storlek|størrelse|koko|size)$/i;

/** A size option with letter sizes (S, M, L …) — i.e. clothing, not "15 × 25 cm". */
export function isLetterSizeOption(name: string, values: string[]) {
  return (
    SIZE_OPTION.test(name.trim()) &&
    values.length > 0 &&
    values.every((value) => normalizeSize(value) !== null)
  );
}

/** Sizes in wearing order (S, M, L …) rather than the supplier's import order. */
export function sortSizeValues(values: string[]) {
  const rank = (value: string) => {
    const size = normalizeSize(value);
    return size ? LETTER_SIZES.indexOf(size) : Number.MAX_SAFE_INTEGER;
  };
  return [...values].sort((a, b) => rank(a) - rank(b));
}
