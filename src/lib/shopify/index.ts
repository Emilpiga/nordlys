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
  CART_DISCOUNT_CODES_UPDATE_MUTATION,
  CART_LINES_ADD_MUTATION,
  CART_LINES_REMOVE_MUTATION,
  CART_LINES_UPDATE_MUTATION,
} from "./mutations";
import {
  GET_CART_QUERY,
  GET_COLLECTION_BY_HANDLE_QUERY,
  GET_COLLECTION_PRODUCTS_PAGE_QUERY,
  GET_COLLECTIONS_QUERY,
  GET_PRODUCT_BY_HANDLE_QUERY,
  GET_PRODUCTS_BY_IDS_QUERY,
  GET_PRODUCTS_PAGE_QUERY,
  GET_PRODUCTS_QUERY,
  PREDICTIVE_SEARCH_QUERY,
  SEARCH_PRODUCTS_QUERY,
} from "./queries";
import type {
  Cart,
  CatalogSearchResult,
  Collection,
  CollectionSummary,
  Product,
  ProductCategory,
  SearchCollectionHit,
  SearchProductHit,
} from "./types";
import { isBrowsableCollection, roomsFromCollections } from "./collections";
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

    return roomsFromCollections(
      data.collections.nodes
        .map(mapCollectionCard)
        .filter(isBrowsableCollection),
    ).slice(0, first);
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

function mapSearchHit(product: {
  id: string;
  handle: string;
  title: string;
  featuredImage: Parameters<typeof mapProductCard>[0]["featuredImage"];
  priceRange: { minVariantPrice: { amount: string; currencyCode: string } };
}): SearchProductHit {
  return {
    id: product.id,
    handle: product.handle,
    title: product.title,
    featuredImage: product.featuredImage
      ? {
          url: product.featuredImage.url,
          altText: product.featuredImage.altText,
          width: product.featuredImage.width,
          height: product.featuredImage.height,
        }
      : null,
    price: product.priceRange.minVariantPrice,
  };
}

const emptySearch: CatalogSearchResult = {
  products: [],
  collections: [],
  suggestions: [],
};

export async function predictiveSearch(
  query: string,
  locale?: string,
  limit = 6,
): Promise<CatalogSearchResult> {
  const q = query.trim();
  if (!q || !isShopifyConfigured()) return emptySearch;
  const context = contextFromLocale(locale);

  try {
    const data = await shopifyFetch<{
      predictiveSearch: {
        products: Parameters<typeof mapSearchHit>[0][];
        collections: SearchCollectionHit[];
        queries: { text: string }[];
      } | null;
    }>({
      query: PREDICTIVE_SEARCH_QUERY,
      variables: { query: q, limit },
      context,
      tags: [localeTag(locale, "search"), "search"],
      revalidate: 30,
    });

    const result = data.predictiveSearch;
    if (!result) return emptySearch;

    return {
      products: result.products.map(mapSearchHit),
      collections: result.collections.map((collection) => ({
        id: collection.id,
        handle: collection.handle,
        title: collection.title,
      })),
      suggestions: result.queries
        .map((item) => item.text.trim())
        .filter(Boolean),
    };
  } catch (error) {
    if (
      error instanceof ShopifyAuthError ||
      error instanceof ShopifyNotConfiguredError
    ) {
      console.error(error.message);
      return emptySearch;
    }
    console.error("Predictive search failed:", error);
    const products = await searchProducts(q, 6, locale);
    return {
      products: products.map((product) => ({
        id: product.id,
        handle: product.handle,
        title: product.title,
        featuredImage: product.featuredImage,
        price: product.priceRange.minVariantPrice,
      })),
      collections: [],
      suggestions: [],
    };
  }
}

export async function searchProducts(
  query: string,
  first = 24,
  locale?: string,
): Promise<Product[]> {
  const q = query.trim();
  if (!q || !isShopifyConfigured()) return [];
  const context = contextFromLocale(locale);

  try {
    const data = await shopifyFetch<{
      search: {
        nodes: Array<Parameters<typeof mapProductCard>[0] | Record<string, never>>;
      };
    }>({
      query: SEARCH_PRODUCTS_QUERY,
      variables: { query: q, first },
      context,
      tags: [localeTag(locale, "search"), "search"],
      revalidate: 60,
    });

    return data.search.nodes
      .filter((node): node is Parameters<typeof mapProductCard>[0] =>
        Boolean(node && "handle" in node && node.handle),
      )
      .map(mapProductCard);
  } catch (error) {
    if (
      error instanceof ShopifyAuthError ||
      error instanceof ShopifyNotConfiguredError
    ) {
      console.error(error.message);
      return [];
    }
    console.error("Failed to search products:", error);
    return [];
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
  discountCodes?: string[],
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
      discountCodes: discountCodes?.length ? discountCodes : undefined,
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

export async function updateCartDiscountCodes(
  cartId: string,
  discountCodes: string[],
  locale?: string,
): Promise<Cart> {
  const context = contextFromLocale(locale);

  const data = await shopifyFetch<{
    cartDiscountCodesUpdate: {
      cart: Parameters<typeof mapCart>[0] | null;
      userErrors: UserErrors;
      warnings?: { code?: string | null; message: string }[];
    };
  }>({
    query: CART_DISCOUNT_CODES_UPDATE_MUTATION,
    variables: { cartId, discountCodes },
    context,
    cache: "no-store",
  });

  for (const warning of data.cartDiscountCodesUpdate.warnings ?? []) {
    console.warn("Shopify discount warning:", warning.message);
  }

  assertNoUserErrors(data.cartDiscountCodesUpdate.userErrors);
  if (!data.cartDiscountCodesUpdate.cart) {
    throw new Error("Failed to update cart discount codes.");
  }

  return mapCart(data.cartDiscountCodesUpdate.cart);
}

export type ProductPageInfo = {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
};

export type ProductConnectionPage = {
  products: Product[];
  pageInfo: ProductPageInfo;
};

export type ProductSortKey =
  | "BEST_SELLING"
  | "PRICE"
  | "TITLE"
  | "CREATED_AT"
  | "RELEVANCE";

export async function getProductsByIds(
  ids: string[],
  locale?: string,
): Promise<Product[]> {
  if (!isShopifyConfigured() || ids.length === 0) return [];
  const context = contextFromLocale(locale);

  try {
    const data = await shopifyFetch<{
      nodes: Array<Parameters<typeof mapProductCard>[0] | null>;
    }>({
      query: GET_PRODUCTS_BY_IDS_QUERY,
      variables: { ids },
      context,
      tags: [localeTag(locale, "products"), "products"],
      cache: "no-store",
    });

    return data.nodes
      .filter((node): node is Parameters<typeof mapProductCard>[0] =>
        Boolean(node?.id),
      )
      .map(mapProductCard);
  } catch (error) {
    console.error("Failed to load products by id:", error);
    return [];
  }
}

export async function getProductsPage(input: {
  first?: number;
  last?: number;
  after?: string | null;
  before?: string | null;
  sortKey?: ProductSortKey;
  reverse?: boolean;
  query?: string | null;
  locale?: string;
}): Promise<ProductConnectionPage> {
  if (!isShopifyConfigured()) {
    return {
      products: [],
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: null,
        endCursor: null,
      },
    };
  }

  const context = contextFromLocale(input.locale);
  const goingBack = Boolean(input.before);
  const variables = {
    first: goingBack ? null : (input.first ?? 12),
    last: goingBack ? (input.last ?? 12) : null,
    after: goingBack ? null : (input.after ?? null),
    before: goingBack ? (input.before ?? null) : null,
    sortKey: input.sortKey ?? "BEST_SELLING",
    reverse: input.reverse ?? false,
    query: input.query || null,
  };

  try {
    const data = await shopifyFetch<{
      products: {
        pageInfo: ProductPageInfo;
        nodes: Parameters<typeof mapProductCard>[0][];
      };
    }>({
      query: GET_PRODUCTS_PAGE_QUERY,
      variables,
      context,
      tags: [localeTag(input.locale, "products"), "products"],
    });

    return {
      products: data.products.nodes.map(mapProductCard),
      pageInfo: {
        hasNextPage: data.products.pageInfo.hasNextPage,
        hasPreviousPage: data.products.pageInfo.hasPreviousPage,
        startCursor: data.products.pageInfo.startCursor ?? null,
        endCursor: data.products.pageInfo.endCursor ?? null,
      },
    };
  } catch (error) {
    console.error("Failed to load products page:", error);
    return {
      products: [],
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: null,
        endCursor: null,
      },
    };
  }
}

export async function getCollectionProductsPage(input: {
  handle: string;
  first?: number;
  last?: number;
  after?: string | null;
  before?: string | null;
  sortKey?: "BEST_SELLING" | "PRICE" | "TITLE" | "CREATED" | "MANUAL";
  reverse?: boolean;
  filters?: Record<string, unknown>[];
  locale?: string;
}): Promise<ProductConnectionPage & { collectionTitle: string | null }> {
  if (!isShopifyConfigured()) {
    return {
      products: [],
      collectionTitle: null,
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: null,
        endCursor: null,
      },
    };
  }

  const context = contextFromLocale(input.locale);
  const goingBack = Boolean(input.before);
  const variables = {
    handle: input.handle,
    first: goingBack ? null : (input.first ?? 12),
    last: goingBack ? (input.last ?? 12) : null,
    after: goingBack ? null : (input.after ?? null),
    before: goingBack ? (input.before ?? null) : null,
    sortKey: input.sortKey ?? "BEST_SELLING",
    reverse: input.reverse ?? false,
    filters: input.filters?.length ? input.filters : null,
  };

  try {
    const data = await shopifyFetch<{
      collection: {
        title: string;
        products: {
          pageInfo: ProductPageInfo;
          nodes: Parameters<typeof mapProductCard>[0][];
        };
      } | null;
    }>({
      query: GET_COLLECTION_PRODUCTS_PAGE_QUERY,
      variables,
      context,
      tags: [
        localeTag(input.locale, `collection:${input.handle}`),
        `collection:${input.handle}`,
        "collections",
      ],
    });

    if (!data.collection) {
      return {
        products: [],
        collectionTitle: null,
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
      };
    }

    return {
      collectionTitle: data.collection.title,
      products: data.collection.products.nodes.map(mapProductCard),
      pageInfo: {
        hasNextPage: data.collection.products.pageInfo.hasNextPage,
        hasPreviousPage: data.collection.products.pageInfo.hasPreviousPage,
        startCursor: data.collection.products.pageInfo.startCursor ?? null,
        endCursor: data.collection.products.pageInfo.endCursor ?? null,
      },
    };
  } catch (error) {
    console.error("Failed to load collection products page:", error);
    return {
      products: [],
      collectionTitle: null,
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: null,
        endCursor: null,
      },
    };
  }
}
