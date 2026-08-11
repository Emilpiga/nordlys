import { cache } from "react";
import {
  shopifyFetch,
  ShopifyAuthError,
  ShopifyNotConfiguredError,
} from "./client";
import { isShopifyConfigured } from "./config";
import {
  mapCart,
  mapCollection,
  mapCollectionCard,
  mapProduct,
  mapProductCard,
} from "./mappers";
import {
  CART_CREATE_MUTATION,
  CART_LINES_ADD_MUTATION,
  CART_LINES_REMOVE_MUTATION,
  CART_LINES_UPDATE_MUTATION,
} from "./mutations";
import {
  GET_CART_QUERY,
  GET_COLLECTION_BY_HANDLE_QUERY,
  GET_COLLECTIONS_QUERY,
  GET_PRODUCT_BY_HANDLE_QUERY,
  GET_PRODUCTS_QUERY,
} from "./queries";
import type {
  Cart,
  Collection,
  CollectionSummary,
  Product,
  ProductCategory,
} from "./types";
import { isBrowsableCollection } from "./collections";
import {
  categoriesFromProducts,
  categoryIdFromParam,
  categoryParamFromId,
  productsInCategory,
} from "./taxonomy";

type UserErrors = { field?: string[] | null; message: string }[];

function assertNoUserErrors(userErrors: UserErrors | undefined) {
  if (userErrors?.length) {
    throw new Error(userErrors.map((error) => error.message).join("\n"));
  }
}

export const getProducts = cache(async (first = 24): Promise<Product[]> => {
  if (!isShopifyConfigured()) return [];

  try {
    const data = await shopifyFetch<{
      products: { nodes: Parameters<typeof mapProductCard>[0][] };
    }>({
      query: GET_PRODUCTS_QUERY,
      variables: { first },
      tags: ["products"],
    });

    return data.products.nodes.map(mapProductCard);
  } catch (error) {
    if (
      error instanceof ShopifyAuthError ||
      error instanceof ShopifyNotConfiguredError
    ) {
      console.error(error.message);
      return [];
    }
    console.error("Failed to load products:", error);
    return [];
  }
});


export async function getProductByHandle(
  handle: string,
): Promise<Product | null> {
  if (!isShopifyConfigured()) return null;

  try {
    const data = await shopifyFetch<{
      product: Parameters<typeof mapProduct>[0] | null;
    }>({
      query: GET_PRODUCT_BY_HANDLE_QUERY,
      variables: { handle },
      tags: [`product:${handle}`],
    });

    return data.product ? mapProduct(data.product) : null;
  } catch (error) {
    if (
      error instanceof ShopifyAuthError ||
      error instanceof ShopifyNotConfiguredError
    ) {
      console.error(error.message);
      return null;
    }
    console.error(`Failed to load product "${handle}":`, error);
    return null;
  }
}

export async function getProductCategories(
  catalogSize = 100,
): Promise<ProductCategory[]> {
  const products = await getProducts(catalogSize);
  return categoriesFromProducts(products);
}

export async function getProductsByCategory(
  categoryIdOrParam: string,
  catalogSize = 100,
): Promise<{ category: ProductCategory | null; products: Product[] }> {
  const products = await getProducts(catalogSize);
  const matched = productsInCategory(products, categoryIdOrParam);
  const targetId = categoryIdFromParam(categoryIdOrParam);
  const targetParam = categoryParamFromId(targetId);
  const categories = categoriesFromProducts(products);

  const category =
    categories.find(
      (item) =>
        item.id === targetId || categoryParamFromId(item.id) === targetParam,
    ) ?? null;

  return { category, products: matched };
}

export async function getCollections(first = 24): Promise<CollectionSummary[]> {
  if (!isShopifyConfigured()) return [];

  try {
    // Fetch extra so filtering out system collections (e.g. Home page) still fills the list.
    const fetchCount = Math.min(Math.max(first * 2, first + 8), 50);
    const data = await shopifyFetch<{
      collections: { nodes: Parameters<typeof mapCollectionCard>[0][] };
    }>({
      query: GET_COLLECTIONS_QUERY,
      variables: { first: fetchCount },
      tags: ["collections"],
    });

    return data.collections.nodes
      .map(mapCollectionCard)
      .filter(isBrowsableCollection)
      .slice(0, first);
  } catch (error) {
    if (
      error instanceof ShopifyAuthError ||
      error instanceof ShopifyNotConfiguredError
    ) {
      console.error(error.message);
      return [];
    }
    console.error("Failed to load collections:", error);
    return [];
  }
}

export async function getCollectionByHandle(
  handle: string,
): Promise<Collection | null> {
  if (!isShopifyConfigured()) return null;

  try {
    const data = await shopifyFetch<{
      collection: Parameters<typeof mapCollection>[0] | null;
    }>({
      query: GET_COLLECTION_BY_HANDLE_QUERY,
      variables: { handle },
      tags: [`collection:${handle}`, "collections"],
    });

    return data.collection ? mapCollection(data.collection) : null;
  } catch (error) {
    if (
      error instanceof ShopifyAuthError ||
      error instanceof ShopifyNotConfiguredError
    ) {
      console.error(error.message);
      return null;
    }
    console.error(`Failed to load collection "${handle}":`, error);
    return null;
  }
}

export async function getCart(cartId: string): Promise<Cart | null> {
  if (!isShopifyConfigured()) return null;

  try {
    const data = await shopifyFetch<{
      cart: Parameters<typeof mapCart>[0] | null;
    }>({
      query: GET_CART_QUERY,
      variables: { cartId },
      cache: "no-store",
    });

    return data.cart ? mapCart(data.cart) : null;
  } catch (error) {
    if (error instanceof ShopifyNotConfiguredError) return null;
    console.error("Failed to load cart:", error);
    return null;
  }
}

export async function createCart(
  lines: { merchandiseId: string; quantity: number }[],
): Promise<Cart> {
  const data = await shopifyFetch<{
    cartCreate: {
      cart: Parameters<typeof mapCart>[0] | null;
      userErrors: UserErrors;
    };
  }>({
    query: CART_CREATE_MUTATION,
    variables: { lines },
    cache: "no-store",
  });

  assertNoUserErrors(data.cartCreate.userErrors);
  if (!data.cartCreate.cart) {
    throw new Error("Failed to create cart.");
  }

  return mapCart(data.cartCreate.cart);
}

export async function addCartLines(
  cartId: string,
  lines: { merchandiseId: string; quantity: number }[],
): Promise<Cart> {
  const data = await shopifyFetch<{
    cartLinesAdd: {
      cart: Parameters<typeof mapCart>[0] | null;
      userErrors: UserErrors;
    };
  }>({
    query: CART_LINES_ADD_MUTATION,
    variables: { cartId, lines },
    cache: "no-store",
  });

  const userErrors = data.cartLinesAdd.userErrors ?? [];
  const cartGone = userErrors.some((error) =>
    /cart does not exist/i.test(error.message),
  );

  // Shopify may return a replacement cart when the old id is invalid — use it.
  if (data.cartLinesAdd.cart && (userErrors.length === 0 || cartGone)) {
    return mapCart(data.cartLinesAdd.cart);
  }

  assertNoUserErrors(userErrors);
  throw new Error("Failed to add lines to cart.");
}

export async function updateCartLines(
  cartId: string,
  lines: { id: string; quantity: number }[],
): Promise<Cart> {
  const data = await shopifyFetch<{
    cartLinesUpdate: {
      cart: Parameters<typeof mapCart>[0] | null;
      userErrors: UserErrors;
    };
  }>({
    query: CART_LINES_UPDATE_MUTATION,
    variables: { cartId, lines },
    cache: "no-store",
  });

  assertNoUserErrors(data.cartLinesUpdate.userErrors);
  if (!data.cartLinesUpdate.cart) {
    throw new Error("Failed to update cart lines.");
  }

  return mapCart(data.cartLinesUpdate.cart);
}

export async function removeCartLines(
  cartId: string,
  lineIds: string[],
): Promise<Cart> {
  const data = await shopifyFetch<{
    cartLinesRemove: {
      cart: Parameters<typeof mapCart>[0] | null;
      userErrors: UserErrors;
    };
  }>({
    query: CART_LINES_REMOVE_MUTATION,
    variables: { cartId, lineIds },
    cache: "no-store",
  });

  assertNoUserErrors(data.cartLinesRemove.userErrors);
  if (!data.cartLinesRemove.cart) {
    throw new Error("Failed to remove cart lines.");
  }

  return mapCart(data.cartLinesRemove.cart);
}
