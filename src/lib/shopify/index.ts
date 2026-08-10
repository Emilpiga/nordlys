import {
  shopifyFetch,
  ShopifyAuthError,
  ShopifyNotConfiguredError,
} from "./client";
import { isShopifyConfigured } from "./config";
import { mapCart, mapProduct, mapProductCard } from "./mappers";
import {
  CART_CREATE_MUTATION,
  CART_LINES_ADD_MUTATION,
  CART_LINES_REMOVE_MUTATION,
  CART_LINES_UPDATE_MUTATION,
} from "./mutations";
import {
  GET_CART_QUERY,
  GET_PRODUCT_BY_HANDLE_QUERY,
  GET_PRODUCTS_QUERY,
} from "./queries";
import type { Cart, Product } from "./types";

type UserErrors = { field?: string[] | null; message: string }[];

function assertNoUserErrors(userErrors: UserErrors | undefined) {
  if (userErrors?.length) {
    throw new Error(userErrors.map((error) => error.message).join("\n"));
  }
}

export async function getProducts(first = 24): Promise<Product[]> {
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
}

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

  assertNoUserErrors(data.cartLinesAdd.userErrors);
  if (!data.cartLinesAdd.cart) {
    throw new Error("Failed to add lines to cart.");
  }

  return mapCart(data.cartLinesAdd.cart);
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
