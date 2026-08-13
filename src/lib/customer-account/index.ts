import { cache } from "react";
import { customerAccountFetch, CustomerAccountAuthError } from "./client";
import {
  isCustomerAccountConfigured,
  customerAccountConfig,
} from "./config";
import { getOpenIdConfiguration } from "./discovery";
import {
  CUSTOMER_ORDER_QUERY,
  CUSTOMER_ORDERS_QUERY,
  CUSTOMER_QUERY,
  METAFIELDS_SET_MUTATION,
  WISHLIST_KEY,
  WISHLIST_NAMESPACE,
} from "./graphql";
import {
  generateCodeChallenge,
  generateCodeVerifier,
  generateRandomString,
} from "./pkce";
import {
  clearCustomerTokens,
  clearOAuthPendingCookies,
  exchangeAuthorizationCode,
  getIdToken,
  getValidAccessToken,
  readOAuthPendingCookies,
  setOAuthPendingCookies,
  writeCustomerTokens,
} from "./session";
import type {
  CustomerOrderDetail,
  CustomerOrderSummary,
  CustomerProfile,
  OrdersPage,
} from "./types";
import { parseWishlistValue } from "./types";
import { getLocaleConfig, isLocale, localePath } from "@/lib/i18n/locales";

export {
  CustomerAccountAuthError,
  isCustomerAccountConfigured,
  customerAccountConfig,
};
export type {
  CustomerOrderDetail,
  CustomerOrderSummary,
  CustomerProfile,
  OrdersPage,
} from "./types";
export {
  decodeOrderParam,
  encodeOrderParam,
  parseWishlistValue,
} from "./types";
export { getValidAccessToken, clearCustomerTokens, getIdToken };
export { requireCustomer } from "./require";


type MoneyNode = { amount: string; currencyCode: string } | null | undefined;

function mapMoney(node: MoneyNode) {
  if (!node) return null;
  return { amount: node.amount, currencyCode: node.currencyCode };
}

export async function buildLoginUrl(input: {
  returnTo?: string;
  locale?: string;
}) {
  if (!isCustomerAccountConfigured()) {
    throw new Error("Customer Account API is not configured.");
  }

  const openId = await getOpenIdConfiguration();
  const state = generateRandomString();
  const nonce = generateRandomString();
  // Always use PKCE. Public Headless clients require it; confidential accepts it.
  const verifier = generateCodeVerifier();
  const challenge = generateCodeChallenge(verifier);
  const locale = input.locale && isLocale(input.locale) ? input.locale : "sv";
  const returnTo =
    input.returnTo && input.returnTo.startsWith("/")
      ? input.returnTo
      : localePath(locale, "/account");

  await setOAuthPendingCookies({ state, nonce, verifier, returnTo });

  const url = new URL(openId.authorization_endpoint);
  url.searchParams.set("scope", customerAccountConfig.scopes);
  url.searchParams.set("client_id", customerAccountConfig.clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", customerAccountConfig.callbackUrl);
  url.searchParams.set("state", state);
  url.searchParams.set("nonce", nonce);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");

  const config = getLocaleConfig(locale);
  url.searchParams.set("locale", config.htmlLang);
  url.searchParams.set("region_country", config.country);

  return url.toString();
}

export async function completeLogin(input: {
  code: string;
  state: string;
}) {
  const pending = await readOAuthPendingCookies();
  if (!pending.state || pending.state !== input.state) {
    throw new Error("Invalid OAuth state.");
  }
  if (!pending.verifier) {
    throw new Error("Missing PKCE verifier.");
  }

  const tokens = await exchangeAuthorizationCode({
    code: input.code,
    verifier: pending.verifier,
  });
  await writeCustomerTokens(tokens);
  await clearOAuthPendingCookies();

  return pending.returnTo || "/sv/account";
}

export async function buildLogoutUrl(returnTo: string) {
  const openId = await getOpenIdConfiguration();
  const idToken = await getIdToken();
  await clearCustomerTokens();

  const url = new URL(openId.end_session_endpoint);
  if (idToken) url.searchParams.set("id_token_hint", idToken);
  url.searchParams.set("post_logout_redirect_uri", returnTo);
  return url.toString();
}

export async function isCustomerLoggedIn() {
  return Boolean(await getValidAccessToken());
}

export const getCustomerProfile = cache(
  async (): Promise<CustomerProfile | null> => {
    if (!(await getValidAccessToken())) return null;

    try {
      const data = await customerAccountFetch<{
        customer: {
          id: string;
          firstName?: string | null;
          lastName?: string | null;
          emailAddress?: { emailAddress?: string | null } | null;
          phoneNumber?: { phoneNumber?: string | null } | null;
          defaultAddress?: { formatted?: string[] | null } | null;
          metafield?: { value?: string | null } | null;
        };
      }>({ query: CUSTOMER_QUERY });

      const customer = data.customer;
      return {
        id: customer.id,
        firstName: customer.firstName ?? null,
        lastName: customer.lastName ?? null,
        email: customer.emailAddress?.emailAddress ?? null,
        phone: customer.phoneNumber?.phoneNumber ?? null,
        defaultAddress: customer.defaultAddress?.formatted ?? null,
        wishlistProductIds: parseWishlistValue(customer.metafield?.value),
      };
    } catch (error) {
      if (error instanceof CustomerAccountAuthError) return null;
      console.error("Failed to load customer profile:", error);
      return null;
    }
  },
);

export async function getCustomerOrders(
  first = 10,
  after?: string | null,
): Promise<OrdersPage> {
  const data = await customerAccountFetch<{
    customer: {
      orders: {
        pageInfo: { hasNextPage: boolean; endCursor?: string | null };
        nodes: {
          id: string;
          name: string;
          number?: number | null;
          processedAt: string;
          financialStatus?: string | null;
          fulfillmentStatus?: string | null;
          totalPrice: { amount: string; currencyCode: string };
          lineItems: {
            nodes: {
              name: string;
              quantity: number;
              image?: { url?: string | null } | null;
            }[];
          };
        }[];
      };
    };
  }>({
    query: CUSTOMER_ORDERS_QUERY,
    variables: { first, after: after || null },
  });

  const orders: CustomerOrderSummary[] = data.customer.orders.nodes.map(
    (order) => ({
      id: order.id,
      name: order.name,
      number: order.number ?? null,
      processedAt: order.processedAt,
      financialStatus: order.financialStatus ?? null,
      fulfillmentStatus: order.fulfillmentStatus ?? null,
      totalPrice: order.totalPrice,
      previewItems: order.lineItems.nodes.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        imageUrl: item.image?.url ?? null,
      })),
    }),
  );

  return {
    orders,
    pageInfo: {
      hasNextPage: data.customer.orders.pageInfo.hasNextPage,
      endCursor: data.customer.orders.pageInfo.endCursor ?? null,
    },
  };
}

export async function getCustomerOrder(
  orderId: string,
): Promise<CustomerOrderDetail | null> {
  try {
    const data = await customerAccountFetch<{
      order: {
        id: string;
        name: string;
        number?: number | null;
        processedAt: string;
        financialStatus?: string | null;
        fulfillmentStatus?: string | null;
        statusPageUrl?: string | null;
        totalPrice: { amount: string; currencyCode: string };
        subtotal?: { amount: string; currencyCode: string } | null;
        totalShipping?: { amount: string; currencyCode: string } | null;
        totalTax?: { amount: string; currencyCode: string } | null;
        shippingAddress?: { formatted?: string[] | null } | null;
        lineItems: {
          nodes: {
            title?: string | null;
            name: string;
            quantity: number;
            variantTitle?: string | null;
            currentTotalPrice?: { amount: string; currencyCode: string } | null;
            image?: { url?: string | null } | null;
          }[];
        };
        fulfillments: {
          nodes: {
            id: string;
            status?: string | null;
            createdAt?: string | null;
            latestShipmentStatus?: string | null;
            trackingInformation?:
              | {
                  company?: string | null;
                  number?: string | null;
                  url?: string | null;
                }[]
              | null;
          }[];
        };
      } | null;
    }>({
      query: CUSTOMER_ORDER_QUERY,
      variables: { orderId },
    });

    const order = data.order;
    if (!order) return null;

    return {
      id: order.id,
      name: order.name,
      number: order.number ?? null,
      processedAt: order.processedAt,
      financialStatus: order.financialStatus ?? null,
      fulfillmentStatus: order.fulfillmentStatus ?? null,
      statusPageUrl: order.statusPageUrl ?? null,
      totalPrice: order.totalPrice,
      subtotal: mapMoney(order.subtotal),
      totalShipping: mapMoney(order.totalShipping),
      totalTax: mapMoney(order.totalTax),
      shippingAddress: order.shippingAddress?.formatted ?? null,
      lineItems: order.lineItems.nodes.map((item) => ({
        title: item.title || item.name,
        name: item.name,
        quantity: item.quantity,
        variantTitle: item.variantTitle ?? null,
        price: mapMoney(item.currentTotalPrice),
        imageUrl: item.image?.url ?? null,
      })),
      fulfillments: order.fulfillments.nodes.map((fulfillment) => ({
        id: fulfillment.id,
        status: fulfillment.status ?? null,
        createdAt: fulfillment.createdAt ?? null,
        latestShipmentStatus: fulfillment.latestShipmentStatus ?? null,
        tracking: (fulfillment.trackingInformation ?? []).map((track) => ({
          company: track.company ?? null,
          number: track.number ?? null,
          url: track.url ?? null,
        })),
      })),
    };
  } catch (error) {
    if (error instanceof CustomerAccountAuthError) throw error;
    console.error("Failed to load order:", error);
    return null;
  }
}

export async function setWishlistProductIds(productIds: string[]) {
  const profile = await getCustomerProfile();
  if (!profile) throw new CustomerAccountAuthError();

  const unique = Array.from(new Set(productIds));
  const data = await customerAccountFetch<{
    metafieldsSet: {
      userErrors: { message: string }[];
    };
  }>({
    query: METAFIELDS_SET_MUTATION,
    variables: {
      metafields: [
        {
          namespace: WISHLIST_NAMESPACE,
          key: WISHLIST_KEY,
          ownerId: profile.id,
          type: "json",
          value: JSON.stringify(unique),
        },
      ],
    },
  });

  if (data.metafieldsSet.userErrors.length) {
    throw new Error(
      data.metafieldsSet.userErrors.map((error) => error.message).join("\n"),
    );
  }

  return unique;
}

export async function toggleWishlistProductId(productId: string) {
  const profile = await getCustomerProfile();
  if (!profile) throw new CustomerAccountAuthError();

  const current = profile.wishlistProductIds;
  const next = current.includes(productId)
    ? current.filter((id) => id !== productId)
    : [...current, productId];

  await setWishlistProductIds(next);
  return {
    wishlistProductIds: next,
    added: !current.includes(productId),
  };
}
