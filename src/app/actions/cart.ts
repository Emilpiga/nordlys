"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  addCartLines,
  createCart,
  getCart,
  removeCartLines,
  updateCartAttributes,
  updateCartBuyerIdentity,
  updateCartLines,
} from "@/lib/shopify";
import { getAcceptedWelcomeDiscountCodes } from "@/lib/welcome-deal";
import { applyWelcomeDeal } from "@/lib/welcome-deal-apply";
import {
  defaultLocale,
  isLocale,
  LOCALE_COOKIE,
  type Locale,
} from "@/lib/i18n/locales";
import { recordCart } from "@/lib/product-traction";

const CART_COOKIE = "shopify_cart_id";

function encodeCartId(cartId: string) {
  return Buffer.from(cartId, "utf8").toString("base64url");
}

function decodeCartId(raw: string) {
  try {
    const decoded = Buffer.from(raw, "base64url").toString("utf8");
    if (decoded.startsWith("gid://shopify/Cart/")) return decoded;
  } catch {
    // fall through — may be a legacy cookie value
  }

  try {
    const uriDecoded = decodeURIComponent(raw);
    if (uriDecoded.startsWith("gid://shopify/Cart/")) return uriDecoded;
  } catch {
    // fall through
  }

  if (raw.startsWith("gid://shopify/Cart/")) return raw;
  return null;
}

async function readCartId() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(CART_COOKIE)?.value;
  if (!raw) return null;
  return decodeCartId(raw);
}

async function writeCartId(cartId: string) {
  const cookieStore = await cookies();
  cookieStore.set(CART_COOKIE, encodeCartId(cartId), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 14,
  });
}

async function clearCartId() {
  const cookieStore = await cookies();
  cookieStore.delete(CART_COOKIE);
}

async function readLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(LOCALE_COOKIE)?.value;
  if (raw && isLocale(raw)) return raw;
  return defaultLocale;
}

async function writeLocale(locale: Locale) {
  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
  });
}

function revalidateCartPaths(locale: Locale) {
  revalidatePath("/", "layout");
  revalidatePath(`/${locale}`, "layout");
  revalidatePath(`/${locale}/cart`);
}

export async function getCartAction() {
  const cartId = await readCartId();
  if (!cartId) return null;

  const locale = await readLocale();
  const cart = await getCart(cartId, locale);
  if (!cart) {
    return null;
  }

  return cart;
}

async function addLinesToCart(
  lines: { merchandiseId: string; quantity: number }[],
) {
  const locale = await readLocale();
  const cartId = await readCartId();

  let cart;
  if (cartId) {
    try {
      cart = await addCartLines(cartId, lines, locale);
    } catch (error) {
      console.error("addCartLines failed, creating a new cart:", error);
      await clearCartId();
      cart = await createCart(
        lines,
        locale,
        await getAcceptedWelcomeDiscountCodes(),
      );
    }
  } else {
    cart = await createCart(
      lines,
      locale,
      await getAcceptedWelcomeDiscountCodes(),
    );
  }

  cart = await applyWelcomeDeal(cart, locale);
  await writeCartId(cart.id);
  revalidateCartPaths(locale);

  for (const { merchandiseId, quantity } of lines) {
    const addedLine = cart.lines.find(
      (line) => line.merchandise.id === merchandiseId,
    );
    const productId = addedLine?.merchandise.product.id;
    if (productId) {
      void recordCart(productId, quantity).catch((error) => {
        console.error("recordCart failed:", error);
      });
    }
  }

  return cart;
}

export async function addToCartAction(merchandiseId: string, quantity = 1) {
  try {
    const cart = await addLinesToCart([{ merchandiseId, quantity }]);
    return {
      ok: true as const,
      cart,
    };
  } catch (error) {
    console.error("addToCartAction failed:", error);
    throw error instanceof Error
      ? error
      : new Error("Kunde inte lägga till i kassen.");
  }
}

/** "Veckans look": every piece in one cart update, so the look discount applies at once. */
export async function addLookToCartAction(merchandiseIds: string[]) {
  const ids = [...new Set(merchandiseIds)].filter((id) =>
    id.startsWith("gid://shopify/ProductVariant/"),
  );
  if (ids.length === 0 || ids.length > 6) {
    throw new Error("Ogiltig look.");
  }
  try {
    const cart = await addLinesToCart(
      ids.map((merchandiseId) => ({ merchandiseId, quantity: 1 })),
    );
    return { ok: true as const, cart };
  } catch (error) {
    console.error("addLookToCartAction failed:", error);
    throw error instanceof Error
      ? error
      : new Error("Kunde inte lägga till looken i kassen.");
  }
}

export async function updateCartLineAction(lineId: string, quantity: number) {
  const locale = await readLocale();
  const cartId = await readCartId();
  if (!cartId) throw new Error("Kassan hittades inte.");

  const cart =
    quantity <= 0
      ? await removeCartLines(cartId, [lineId], locale)
      : await updateCartLines(cartId, [{ id: lineId, quantity }], locale);

  await writeCartId(cart.id);
  revalidateCartPaths(locale);
  return cart;
}

export async function removeCartLineAction(lineId: string) {
  return updateCartLineAction(lineId, 0);
}

export async function clearCartAction() {
  await clearCartId();
  const locale = await readLocale();
  revalidateCartPaths(locale);
  return { ok: true as const };
}

/**
 * Re-attach the Customer Account token to the cart. Call from login/refresh
 * and immediately before redirecting to Shopify checkout.
 */
export async function syncCartBuyerIdentity() {
  const cartId = await readCartId();
  if (!cartId) return { ok: false as const, cart: null };

  const locale = await readLocale();
  try {
    const cart = await updateCartBuyerIdentity(cartId, locale);
    await writeCartId(cart.id);
    return { ok: true as const, cart };
  } catch (error) {
    console.error("syncCartBuyerIdentity failed:", error);
    return { ok: false as const, cart: null };
  }
}

/** PostHog ids from the browser, stored on the cart for the checkout pixel. */
async function tagCartForAnalytics(
  analytics: { distinctId: string; sessionId: string } | null | undefined,
) {
  if (!analytics?.distinctId) return;
  const cartId = await readCartId();
  if (!cartId) return;
  try {
    await updateCartAttributes(cartId, [
      { key: "_posthog_distinct_id", value: analytics.distinctId.slice(0, 200) },
      { key: "_posthog_session_id", value: analytics.sessionId.slice(0, 200) },
    ]);
  } catch (error) {
    console.error("tagCartForAnalytics failed:", error);
  }
}

/** Refresh buyer identity, then return the Shopify checkout URL. */
export async function beginCheckoutAction(
  analytics?: { distinctId: string; sessionId: string } | null,
) {
  await tagCartForAnalytics(analytics);
  const synced = await syncCartBuyerIdentity();
  if (synced.ok && synced.cart?.checkoutUrl) {
    return { ok: true as const, checkoutUrl: synced.cart.checkoutUrl };
  }

  const cartId = await readCartId();
  if (!cartId) return { ok: false as const, checkoutUrl: null };

  const locale = await readLocale();
  const cart = await getCart(cartId, locale);
  if (!cart?.checkoutUrl) return { ok: false as const, checkoutUrl: null };
  return { ok: true as const, checkoutUrl: cart.checkoutUrl };
}

/** Sync Markets country + Storefront language when the shopper changes locale. */
export async function updateCartLocaleAction(locale: string) {
  if (!isLocale(locale)) return { ok: false as const };

  await writeLocale(locale);

  const cartId = await readCartId();
  if (!cartId) {
    revalidateCartPaths(locale);
    return { ok: true as const, cart: null };
  }

  try {
    const cart = await updateCartBuyerIdentity(cartId, locale);
    await writeCartId(cart.id);
    revalidateCartPaths(locale);
    return { ok: true as const, cart };
  } catch (error) {
    console.error("updateCartLocaleAction failed:", error);
    revalidateCartPaths(locale);
    return { ok: false as const };
  }
}
