"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  defaultLocale,
  isLocale,
  LOCALE_COOKIE,
  type Locale,
} from "@/lib/i18n/locales";
import { getCart } from "@/lib/shopify";
import {
  cartHasWelcomeCode,
  getWelcomeDealStatus,
  getWelcomeDiscountCode,
  setWelcomeDealAccepted,
  setWelcomeDealDeclined,
  setWelcomeDealUsed,
} from "@/lib/welcome-deal";
import { applyWelcomeDeal } from "@/lib/welcome-deal-apply";

const CART_COOKIE = "shopify_cart_id";

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

async function readLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(LOCALE_COOKIE)?.value;
  if (raw && isLocale(raw)) return raw;
  return defaultLocale;
}

function revalidateCartPage(locale: Locale) {
  revalidatePath(`/${locale}/cart`);
}

export async function declineWelcomeDealAction() {
  await setWelcomeDealDeclined();
  return { ok: true as const };
}

export async function markWelcomeDealUsedAction() {
  if ((await getWelcomeDealStatus()) !== "accepted") {
    return { ok: true as const };
  }
  await setWelcomeDealUsed();
  return { ok: true as const };
}

export async function acceptWelcomeDealAction() {
  const locale = await readLocale();
  const cartId = await readCartId();
  const code = getWelcomeDiscountCode();

  if (!cartId) {
    await setWelcomeDealAccepted();
    return { ok: true as const, cart: null };
  }

  const cart = await getCart(cartId, locale);
  if (!cart) {
    await setWelcomeDealAccepted();
    return { ok: true as const, cart: null };
  }

  const next = await applyWelcomeDeal(cart, locale, [code]);
  const attached = cartHasWelcomeCode(next, code);

  if (!attached && cart.totalQuantity > 0) {
    return { ok: false as const, cart: next };
  }

  await setWelcomeDealAccepted();
  revalidateCartPage(locale);
  return { ok: true as const, cart: next };
}
