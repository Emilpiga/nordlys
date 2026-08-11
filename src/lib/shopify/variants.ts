import type { ProductVariant } from "./types";

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

/**
 * True when an in-stock variant exists for this option value while keeping
 * the other currently selected options fixed.
 */
export function isOptionValueAvailable(
  variants: ProductVariant[],
  optionName: string,
  value: string,
  selected: Record<string, string>,
): boolean {
  return variants.some((variant) => {
    if (!variant.availableForSale) return false;
    return variant.selectedOptions.every((option) => {
      if (option.name === optionName) return option.value === value;
      return selected[option.name] === option.value;
    });
  });
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
