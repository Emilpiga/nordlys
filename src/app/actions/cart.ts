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

async function readCartId() {
  const cookieStore = await cookies();
  return cookieStore.get(CART_COOKIE)?.value;
}

async function writeCartId(cartId: string) {
  const cookieStore = await cookies();
  cookieStore.set(CART_COOKIE, cartId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function getCartAction() {
  const cartId = await readCartId();
  if (!cartId) return null;
  return getCart(cartId);
}

export async function addToCartAction(merchandiseId: string, quantity = 1) {
  const cartId = await readCartId();
  const lines = [{ merchandiseId, quantity }];

  const cart = cartId
    ? await addCartLines(cartId, lines).catch(async () => createCart(lines))
    : await createCart(lines);

  await writeCartId(cart.id);
  revalidatePath("/", "layout");
  return cart;
}

export async function updateCartLineAction(lineId: string, quantity: number) {
  const cartId = await readCartId();
  if (!cartId) throw new Error("Cart not found.");

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
