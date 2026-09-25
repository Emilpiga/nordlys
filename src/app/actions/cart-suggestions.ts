"use server";

import { CART_COMPLEMENTS } from "@/lib/complements";
import { isLocale, defaultLocale } from "@/lib/i18n/locales";
import { getCollectionByHandle, getCollections } from "@/lib/shopify";
import type { Product } from "@/lib/shopify/types";

const LIMIT = 3;

function isBuyable(product: Product) {
  return product.variants.some((variant) => variant.availableForSale);
}

/** Up to three in-stock products that complement what is already in the cart. */
export async function getCartSuggestionsAction(
  productIds: string[],
  locale: string,
): Promise<Product[]> {
  const ids = [...new Set(productIds)].slice(0, 10);
  if (ids.length === 0) return [];
  const lang = isLocale(locale) ? locale : defaultLocale;

  const handles: string[] = [];
  for (const collection of await getCollections(100, lang)) {
    if (!collection.productIds.some((id) => ids.includes(id))) continue;
    for (const handle of CART_COMPLEMENTS[collection.handle] ?? []) {
      if (!handles.includes(handle)) handles.push(handle);
    }
  }

  const collections = await Promise.all(
    handles.slice(0, 4).map((handle) => getCollectionByHandle(handle, lang)),
  );

  const taken = new Set(ids);
  const picks: Product[] = [];
  // Round-robin across collections so one outfit gets a mix, not three scarves.
  const pools = collections.map((collection) =>
    (collection?.products ?? []).filter(isBuyable),
  );
  for (let round = 0; picks.length < LIMIT; round++) {
    let added = false;
    for (const pool of pools) {
      const product = pool.find((item) => !taken.has(item.id));
      if (!product) continue;
      taken.add(product.id);
      picks.push(product);
      added = true;
      if (picks.length >= LIMIT) break;
    }
    if (!added || round > LIMIT) break;
  }

  return picks;
}
