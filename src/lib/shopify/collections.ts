import type { CollectionSummary } from "./types";

const EXCLUDED_HANDLES = new Set([
  "frontpage",
  "home",
  "home-page",
  "homepage",
  "startsida",
  "all",
  "all-products",
]);

const EXCLUDED_TITLE_PATTERN =
  /^(home\s*page|homepage|frontpage|startsida|alla produkter|all products)$/i;

/** Drop Shopify system collections that should not appear as shop categories. */
export function isBrowsableCollection(
  collection: Pick<CollectionSummary, "handle" | "title">,
): boolean {
  const handle = collection.handle.trim().toLowerCase();
  const title = collection.title.trim();

  if (EXCLUDED_HANDLES.has(handle)) return false;
  if (EXCLUDED_TITLE_PATTERN.test(title)) return false;

  return true;
}
