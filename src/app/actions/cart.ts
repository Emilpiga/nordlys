"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  addCartLines,
  createCart,
  getCart,
  removeCartLines,
  updateCartBuyerIdentity,
  updateCartLines,
} from "@/lib/shopify";
import {
  defaultLocale,
  isLocale,
  LOCALE_COOKIE,
  type Locale,
} from "@/lib/i18n/locales";

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

export async function addToCartAction(merchandiseId: string, quantity = 1) {
  const locale = await readLocale();

  try {
    const lines = [{ merchandiseId, quantity }];
    const cartId = await readCartId();

    let cart;
    if (cartId) {
      try {
        cart = await addCartLines(cartId, lines, locale);
      } catch (error) {
        console.error("addCartLines failed, creating a new cart:", error);
        await clearCartId();
        cart = await createCart(lines, locale);
      }
    } else {
      cart = await createCart(lines, locale);
    }

    await writeCartId(cart.id);
    revalidateCartPaths(locale);

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
