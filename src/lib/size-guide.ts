/**
 * Our clothing runs small: a size here fits roughly like one size down in
 * standard EU sizing. The guide turns "what I usually wear" into "what to
 * pick here" (one size up).
 */

export const LETTER_SIZES = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "4XL", "5XL"] as const;
export type LetterSize = (typeof LETTER_SIZES)[number];

/** Our size -> roughly equivalent EU size (letter + number). */
export const EU_EQUIVALENT: Partial<Record<LetterSize, { letter: string; number: number }>> = {
  XS: { letter: "XXS", number: 32 },
  S: { letter: "XS", number: 34 },
  M: { letter: "S", number: 36 },
  L: { letter: "M", number: 38 },
  XL: { letter: "L", number: 40 },
  XXL: { letter: "XL", number: 42 },
  XXXL: { letter: "XXL", number: 44 },
  "4XL": { letter: "XXXL", number: 46 },
  "5XL": { letter: "4XL", number: 48 },
};

/** EU sizes a shopper can say they usually wear. */
export const USUAL_SIZES: LetterSize[] = ["XS", "S", "M", "L", "XL", "XXL"];

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

export function normalizeSize(value: string): LetterSize | null {
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

/** Usual EU size -> the size to pick here (one up). */
export function recommendedSize(usual: LetterSize): LetterSize | null {
  const index = LETTER_SIZES.indexOf(usual);
  return LETTER_SIZES[index + 1] ?? null;
}

/** The product's own value (e.g. "3XL") matching a size, if it has one. */
export function productValueFor(values: string[], size: LetterSize) {
  return values.find((value) => normalizeSize(value) === size) ?? null;
}

const STORAGE_KEY = "vardagsstil:usual-size";

export function readUsualSize(): LetterSize | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? normalizeSize(stored) : null;
  } catch {
    return null;
  }
}

function writeUsualSize(size: LetterSize) {
  try {
    window.localStorage.setItem(STORAGE_KEY, size);
  } catch {
    // Private mode / blocked storage: the guide still works for this page.
  }
}

const CHANGE_EVENT = "vardagsstil:usual-size";

/** For useSyncExternalStore: fires on this tab's writes and other tabs' storage. */
export function subscribeUsualSize(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function rememberUsualSize(size: LetterSize) {
  writeUsualSize(size);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** Sizes in wearing order (S, M, L …) rather than the supplier's import order. */
export function sortSizeValues(values: string[]) {
  const rank = (value: string) => {
    const size = normalizeSize(value);
    return size ? LETTER_SIZES.indexOf(size) : Number.MAX_SAFE_INTEGER;
  };
  return [...values].sort((a, b) => rank(a) - rank(b));
}

/** The product's size closest to `size` (used when the ideal one isn't made). */
export function nearestValue(values: string[], size: LetterSize) {
  const target = LETTER_SIZES.indexOf(size);
  let best: string | null = null;
  let bestDistance = Infinity;
  for (const value of values) {
    const normalized = normalizeSize(value);
    if (!normalized) continue;
    const distance = Math.abs(LETTER_SIZES.indexOf(normalized) - target);
    if (distance < bestDistance) {
      best = value;
      bestDistance = distance;
    }
  }
  return best;
}
