import { LETTER_SIZES, isSizeOptionName } from "@/lib/size-guide";
import type { Product } from "@/lib/shopify/types";

/**
 * Size filter for collection pages. Values are matched exactly as they are
 * written in Shopify — "54 XXL" or "XXXXL" is not treated as XXL — and only
 * plain letter sizes (XS … 5XL) get a filter chip.
 */

/** Product cards load this many variants (ProductCardFields). */
const CARD_VARIANT_LIMIT = 40;

function isLetterSize(value: string) {
  return (LETTER_SIZES as readonly string[]).includes(value);
}

/** Letter sizes offered anywhere in these products, in wearing order. */
export function sizeFacet(products: Product[]): string[] {
  const found = new Set<string>();
  for (const product of products) {
    for (const option of product.options) {
      if (!isSizeOptionName(option.name)) continue;
      for (const value of option.values) {
        if (isLetterSize(value)) found.add(value);
      }
    }
  }
  return LETTER_SIZES.filter((size) => found.has(size));
}

/**
 * True when the product can be bought in one of `sizes`: a variant in stock
 * with exactly that size. Products with more variants than the card loads
 * fall back to the product's own list of size values.
 */
export function productHasSize(product: Product, sizes: string[]) {
  if (sizes.length === 0) return true;
  const wanted = new Set(sizes);

  if (
    product.variants.length > 0 &&
    product.variants.length < CARD_VARIANT_LIMIT
  ) {
    return product.variants.some(
      (variant) =>
        variant.availableForSale &&
        variant.selectedOptions.some(
          (option) => isSizeOptionName(option.name) && wanted.has(option.value),
        ),
    );
  }

  return product.options.some(
    (option) =>
      isSizeOptionName(option.name) &&
      option.values.some((value) => wanted.has(value)),
  );
}
