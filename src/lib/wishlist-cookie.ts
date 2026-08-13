import { cookies } from "next/headers";
import { parseWishlistValue } from "@/lib/customer-account/types";

export const WISHLIST_COOKIE = "harbor_wishlist";

const COOKIE_BASE = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 365,
};

type WishlistCookiePayload = {
  customerId: string;
  productIds: string[];
};

export async function hasWishlistCookie() {
  const cookieStore = await cookies();
  return Boolean(cookieStore.get(WISHLIST_COOKIE)?.value);
}

export async function readWishlistCookie(
  customerId: string,
): Promise<string[]> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(WISHLIST_COOKIE)?.value;
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as WishlistCookiePayload;
    if (parsed?.customerId !== customerId) return [];
    return Array.isArray(parsed.productIds)
      ? parsed.productIds.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    // Legacy: bare JSON array (pre-customer binding)
    const ids = parseWishlistValue(raw);
    return ids;
  }
}

export async function writeWishlistCookie(
  customerId: string,
  productIds: string[],
) {
  const cookieStore = await cookies();
  const unique = Array.from(new Set(productIds));
  cookieStore.set(
    WISHLIST_COOKIE,
    JSON.stringify({ customerId, productIds: unique } satisfies WishlistCookiePayload),
    COOKIE_BASE,
  );
  return unique;
}

export async function clearWishlistCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(WISHLIST_COOKIE);
}
