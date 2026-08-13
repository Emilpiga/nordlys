"use server";

import { predictiveSearch } from "@/lib/shopify";
import type { CatalogSearchResult } from "@/lib/shopify/types";

const empty: CatalogSearchResult = {
  products: [],
  collections: [],
  suggestions: [],
};

export async function predictiveSearchAction(
  query: string,
  locale: string,
): Promise<CatalogSearchResult> {
  const q = query.trim();
  if (q.length < 2) return empty;
  return predictiveSearch(q, locale, 6);
}
