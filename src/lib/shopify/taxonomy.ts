import type { Product, ProductCategory } from "./types";

/** URL segment for a taxonomy category (last part of the Shopify GID). */
export function categoryParamFromId(id: string) {
  const match = id.match(/TaxonomyCategory\/(.+)$/i);
  return match?.[1] ?? id;
}

/** Rebuild Shopify taxonomy GID from a route param. */
export function categoryIdFromParam(param: string) {
  const decoded = decodeURIComponent(param);
  if (decoded.startsWith("gid://")) return decoded;
  return `gid://shopify/TaxonomyCategory/${decoded}`;
}

export function categoriesFromProducts(products: Product[]): ProductCategory[] {
  const byId = new Map<string, ProductCategory>();

  for (const product of products) {
    if (!product.category?.id || !product.category.name) continue;
    const existing = byId.get(product.category.id);
    if (existing) {
      existing.productCount += 1;
    } else {
      byId.set(product.category.id, {
        id: product.category.id,
        name: product.category.name,
        productCount: 1,
      });
    }
  }

  return [...byId.values()].sort((a, b) =>
    a.name.localeCompare(b.name, "sv"),
  );
}

export function productsInCategory(
  products: Product[],
  categoryId: string,
): Product[] {
  const normalized = categoryIdFromParam(categoryParamFromId(categoryId));
  const short = categoryParamFromId(normalized);

  return products.filter((product) => {
    if (!product.category?.id) return false;
    return (
      product.category.id === normalized ||
      product.category.id === categoryId ||
      categoryParamFromId(product.category.id) === short
    );
  });
}
