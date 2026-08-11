"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  addCartLines,
  createCart,
  getCart,
  removeCartLines,
  updateCartLines,
} from "@/lib/shopify";

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

export async function getCartAction() {
  const cartId = await readCartId();
  if (!cartId) return null;

  const cart = await getCart(cartId);
  if (!cart) {
    // Can't delete cookies from a Server Component (layout reads the cart).
    // Stale ids are cleared on the next cart mutation instead.
    return null;
  }

  return cart;
}

export async function addToCartAction(merchandiseId: string, quantity = 1) {
  try {
    const lines = [{ merchandiseId, quantity }];
    const cartId = await readCartId();

    let cart;
    if (cartId) {
      try {
        cart = await addCartLines(cartId, lines);
      } catch (error) {
        console.error("addCartLines failed, creating a new cart:", error);
        await clearCartId();
        cart = await createCart(lines);
      }
    } else {
      cart = await createCart(lines);
    }

    await writeCartId(cart.id);
    revalidatePath("/", "layout");
    revalidatePath("/cart");

    return {
      ok: true as const,
      totalQuantity: cart.totalQuantity,
    };
  } catch (error) {
    console.error("addToCartAction failed:", error);
    throw error instanceof Error
      ? error
      : new Error("Kunde inte lägga till i kassen.");
  }
}

export async function updateCartLineAction(lineId: string, quantity: number) {
  const cartId = await readCartId();
  if (!cartId) throw new Error("Kassan hittades inte.");

  const cart =
    quantity <= 0
      ? await removeCartLines(cartId, [lineId])
      : await updateCartLines(cartId, [{ id: lineId, quantity }]);

  await writeCartId(cart.id);
  revalidatePath("/cart");
  revalidatePath("/", "layout");
  return cart;
}

export async function removeCartLineAction(lineId: string) {
  return updateCartLineAction(lineId, 0);
}
