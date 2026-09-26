import type { ProductVariant } from "./types";

/** Last numeric segment of a GID, or the raw Shopify admin/storefront id. */
export function shopifyNumericId(gidOrId: string) {
  const match = gidOrId.trim().match(/(\d+)\s*$/);
  return match?.[1] ?? "";
}

/**
 * Shopify Online Store / Google Shopping links use `?variant=123456789`.
 * Storefront variants are GIDs (`gid://shopify/ProductVariant/123456789`).
 */
export function findVariantByParam(
  variants: ProductVariant[],
  variantParam: string | null | undefined,
): ProductVariant | undefined {
  const wanted = variantParam ? shopifyNumericId(variantParam) : "";
  if (!wanted) return undefined;
  return variants.find((variant) => shopifyNumericId(variant.id) === wanted);
}

export function findVariant(
  variants: ProductVariant[],
  selected: Record<string, string>,
): ProductVariant | null {
  return (
    variants.find((variant) =>
      variant.selectedOptions.every(
        (option) => selected[option.name] === option.value,
      ),
    ) ?? null
  );
}

function hasOptionValue(
  variant: ProductVariant,
  optionName: string,
  value: string,
) {
  return variant.selectedOptions.some(
    (option) => option.name === optionName && option.value === value,
  );
}

/** Variants matching every other option the shopper already picked. */
function matchesSiblings(
  variant: ProductVariant,
  selected: Record<string, string>,
  optionName: string,
) {
  return variant.selectedOptions.every(
    (option) =>
      option.name === optionName ||
      selected[option.name] === undefined ||
      selected[option.name] === option.value,
  );
}

/**
 * Variants for one option value, narrowed to the rest of the current
 * selection. Combinations Shopify never created (e.g. Red exists, Red/XL does
 * not) fall back to the unnarrowed list so the value stays clickable —
 * `selectOptionValue` then moves the siblings to a combination that exists.
 */
function variantsForOptionValue(
  variants: ProductVariant[],
  optionName: string,
  value: string,
  selected: Record<string, string>,
) {
  const withValue = variants.filter((variant) =>
    hasOptionValue(variant, optionName, value),
  );
  const withSelection = withValue.filter((variant) =>
    matchesSiblings(variant, selected, optionName),
  );
  return withSelection.length > 0 ? withSelection : withValue;
}

/**
 * True when this option value can be bought alongside the rest of the current
 * selection. Without `selected` it falls back to "in stock in any combination".
 */
export function isOptionValueInStock(
  variants: ProductVariant[],
  optionName: string,
  value: string,
  selected: Record<string, string> = {},
): boolean {
  return variantsForOptionValue(variants, optionName, value, selected).some(
    (variant) => variant.availableForSale,
  );
}

/**
 * Apply an option choice. Prefer an exact in-stock match; otherwise pick the
 * nearest in-stock variant that includes the new value (may adjust siblings).
 */
export function selectOptionValue(
  variants: ProductVariant[],
  selected: Record<string, string>,
  optionName: string,
  value: string,
): Record<string, string> {
  const next = { ...selected, [optionName]: value };
  const exact = findVariant(variants, next);
  if (exact?.availableForSale) return next;

  const candidates = variants.filter(
    (variant) =>
      variant.availableForSale &&
      variant.selectedOptions.some(
        (option) => option.name === optionName && option.value === value,
      ),
  );

  if (candidates.length > 0) {
    candidates.sort((a, b) => scoreOverlap(b, selected, optionName) - scoreOverlap(a, selected, optionName));
    return Object.fromEntries(
      candidates[0].selectedOptions.map((option) => [option.name, option.value]),
    );
  }

  // No in-stock match — still switch to a sold-out combo so CTA shows Slutsåld.
  if (exact) return next;

  const any = variants.find((variant) =>
    variant.selectedOptions.some(
      (option) => option.name === optionName && option.value === value,
    ),
  );

  return any
    ? Object.fromEntries(
        any.selectedOptions.map((option) => [option.name, option.value]),
      )
    : next;
}

function scoreOverlap(
  variant: ProductVariant,
  selected: Record<string, string>,
  changedOption: string,
) {
  return variant.selectedOptions.reduce((score, option) => {
    if (option.name === changedOption) return score;
    return score + (selected[option.name] === option.value ? 1 : 0);
  }, 0);
}

export function optionsFromVariant(
  variant: ProductVariant | undefined,
): Record<string, string> {
  return Object.fromEntries(
    (variant?.selectedOptions ?? []).map((option) => [
      option.name,
      option.value,
    ]),
  );
}

export function hasSelectableOptions(product: {
  options: { name: string; values: string[] }[];
}) {
  return product.options.some(
    (option) =>
      !(option.name === "Title" && option.values.length === 1) &&
      option.values.some((value) => value !== "Default Title"),
  );
}

/** Price of the first in-stock variant that uses this option value. */
export function priceForOptionValue(
  variants: ProductVariant[],
  optionName: string,
  value: string,
  selected: Record<string, string> = {},
) {
  const pool = variantsForOptionValue(variants, optionName, value, selected);
  const match = pool.find((variant) => variant.availableForSale) ?? pool[0];
  return match?.price ?? null;
}

export function optionPricesVary(
  variants: ProductVariant[],
  optionName: string,
  values: string[],
  selected: Record<string, string> = {},
) {
  const prices = values
    .map(
      (value) =>
        priceForOptionValue(variants, optionName, value, selected)?.amount,
    )
    .filter((amount): amount is string => Boolean(amount));
  return new Set(prices).size > 1;
}
