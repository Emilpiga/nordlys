import { cache } from "react";
import {
  shopifyFetch,
  ShopifyAuthError,
  ShopifyNotConfiguredError,
  type ShopifyContext,
} from "./client";
import { isShopifyConfigured, shopifyConfig } from "./config";
import {
  mapCart,
  mapCollection,
  mapCollectionCard,
  mapProduct,
  mapProductCard,
} from "./mappers";
import {
  CART_BUYER_IDENTITY_UPDATE_MUTATION,
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
import { getShopifyContext, type Locale } from "@/lib/i18n/locales";

type UserErrors = { field?: string[] | null; message: string }[];

function assertNoUserErrors(userErrors: UserErrors | undefined) {
  if (userErrors?.length) {
    throw new Error(userErrors.map((error) => error.message).join("\n"));
  }
}

function contextFromLocale(locale?: string): ShopifyContext {
  if (locale) return getShopifyContext(locale);
  return {
    country: shopifyConfig.country,
    language: shopifyConfig.language,
  };
}

function localeTag(locale: string | undefined, base: string) {
  const key = locale || "default";
  return `${base}:${key}`;
}

export const getProducts = cache(
  async (first = 24, locale?: string): Promise<Product[]> => {
    if (!isShopifyConfigured()) return [];
    const context = contextFromLocale(locale);

    try {
      const data = await shopifyFetch<{
        products: { nodes: Parameters<typeof mapProductCard>[0][] };
      }>({
        query: GET_PRODUCTS_QUERY,
        variables: { first },
        context,
        tags: [localeTag(locale, "products"), "products"],
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
  },
);

export async function getProductByHandle(
  handle: string,
  locale?: string,
): Promise<Product | null> {
  if (!isShopifyConfigured()) return null;
  const context = contextFromLocale(locale);

  try {
    const data = await shopifyFetch<{
      product: Parameters<typeof mapProduct>[0] | null;
    }>({
      query: GET_PRODUCT_BY_HANDLE_QUERY,
      variables: { handle },
      context,
      tags: [
        localeTag(locale, `product:${handle}`),
        `product:${handle}`,
        localeTag(locale, "products"),
      ],
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
  locale?: string,
): Promise<ProductCategory[]> {
  const products = await getProducts(catalogSize, locale);
  return categoriesFromProducts(products);
}

export async function getProductsByCategory(
  categoryIdOrParam: string,
  catalogSize = 100,
  locale?: string,
): Promise<{ category: ProductCategory | null; products: Product[] }> {
  const products = await getProducts(catalogSize, locale);
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

export async function getCollections(
  first = 24,
  locale?: string,
): Promise<CollectionSummary[]> {
  if (!isShopifyConfigured()) return [];
  const context = contextFromLocale(locale);

  try {
    const fetchCount = Math.min(Math.max(first * 2, first + 8), 50);
    const data = await shopifyFetch<{
      collections: { nodes: Parameters<typeof mapCollectionCard>[0][] };
    }>({
      query: GET_COLLECTIONS_QUERY,
      variables: { first: fetchCount },
      context,
      tags: [localeTag(locale, "collections"), "collections"],
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
  locale?: string,
): Promise<Collection | null> {
  if (!isShopifyConfigured()) return null;
  const context = contextFromLocale(locale);

  try {
    const data = await shopifyFetch<{
      collection: Parameters<typeof mapCollection>[0] | null;
    }>({
      query: GET_COLLECTION_BY_HANDLE_QUERY,
      variables: { handle },
      context,
      tags: [
        localeTag(locale, `collection:${handle}`),
        `collection:${handle}`,
        "collections",
      ],
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

export async function getCart(
  cartId: string,
  locale?: string,
): Promise<Cart | null> {
  if (!isShopifyConfigured()) return null;
  const context = contextFromLocale(locale);

  try {
    const data = await shopifyFetch<{
      cart: Parameters<typeof mapCart>[0] | null;
    }>({
      query: GET_CART_QUERY,
      variables: { cartId },
      context,
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
  locale?: string,
): Promise<Cart> {
  const context = contextFromLocale(locale);

  const data = await shopifyFetch<{
    cartCreate: {
      cart: Parameters<typeof mapCart>[0] | null;
      userErrors: UserErrors;
    };
  }>({
    query: CART_CREATE_MUTATION,
    variables: {
      lines,
      buyerIdentity: { countryCode: context.country },
    },
    context,
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
  locale?: string,
): Promise<Cart> {
  const context = contextFromLocale(locale);

  const data = await shopifyFetch<{
    cartLinesAdd: {
      cart: Parameters<typeof mapCart>[0] | null;
      userErrors: UserErrors;
    };
  }>({
    query: CART_LINES_ADD_MUTATION,
    variables: { cartId, lines },
    context,
    cache: "no-store",
  });

  const userErrors = data.cartLinesAdd.userErrors ?? [];
  const cartGone = userErrors.some((error) =>
    /cart does not exist/i.test(error.message),
  );

  if (data.cartLinesAdd.cart && (userErrors.length === 0 || cartGone)) {
    return mapCart(data.cartLinesAdd.cart);
  }

  assertNoUserErrors(userErrors);
  throw new Error("Failed to add lines to cart.");
}

export async function updateCartLines(
  cartId: string,
  lines: { id: string; quantity: number }[],
  locale?: string,
): Promise<Cart> {
  const context = contextFromLocale(locale);

  const data = await shopifyFetch<{
    cartLinesUpdate: {
      cart: Parameters<typeof mapCart>[0] | null;
      userErrors: UserErrors;
    };
  }>({
    query: CART_LINES_UPDATE_MUTATION,
    variables: { cartId, lines },
    context,
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
  locale?: string,
): Promise<Cart> {
  const context = contextFromLocale(locale);

  const data = await shopifyFetch<{
    cartLinesRemove: {
      cart: Parameters<typeof mapCart>[0] | null;
      userErrors: UserErrors;
    };
  }>({
    query: CART_LINES_REMOVE_MUTATION,
    variables: { cartId, lineIds },
    context,
    cache: "no-store",
  });

  assertNoUserErrors(data.cartLinesRemove.userErrors);
  if (!data.cartLinesRemove.cart) {
    throw new Error("Failed to remove cart lines.");
  }

  return mapCart(data.cartLinesRemove.cart);
}

export async function updateCartBuyerIdentity(
  cartId: string,
  locale: Locale | string,
): Promise<Cart> {
  const context = contextFromLocale(locale);

  const data = await shopifyFetch<{
    cartBuyerIdentityUpdate: {
      cart: Parameters<typeof mapCart>[0] | null;
      userErrors: UserErrors;
    };
  }>({
    query: CART_BUYER_IDENTITY_UPDATE_MUTATION,
    variables: {
      cartId,
      buyerIdentity: { countryCode: context.country },
    },
    context,
    cache: "no-store",
  });

  assertNoUserErrors(data.cartBuyerIdentityUpdate.userErrors);
  if (!data.cartBuyerIdentityUpdate.cart) {
    throw new Error("Failed to update cart buyer identity.");
  }

  return mapCart(data.cartBuyerIdentityUpdate.cart);
}
