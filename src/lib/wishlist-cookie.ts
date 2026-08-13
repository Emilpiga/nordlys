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

function encodePayload(payload: WishlistCookiePayload) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodePayload(raw: string): WishlistCookiePayload | null {
  // Current format: base64url(JSON)
  try {
    const decoded = Buffer.from(raw, "base64url").toString("utf8");
    const parsed = JSON.parse(decoded) as WishlistCookiePayload;
    if (typeof parsed?.customerId === "string" && Array.isArray(parsed.productIds)) {
      return {
        customerId: parsed.customerId,
        productIds: parsed.productIds.filter(
          (id): id is string => typeof id === "string",
        ),
      };
    }
  } catch {
    // fall through to legacy formats
  }

  // Legacy: raw JSON object
  try {
    const parsed = JSON.parse(raw) as WishlistCookiePayload;
    if (typeof parsed?.customerId === "string" && Array.isArray(parsed.productIds)) {
      return {
        customerId: parsed.customerId,
        productIds: parsed.productIds.filter(
          (id): id is string => typeof id === "string",
        ),
      };
    }
  } catch {
    // fall through
  }

  // Legacy: bare JSON array of product ids
  const ids = parseWishlistValue(raw);
  if (ids.length) {
    return { customerId: "", productIds: ids };
  }

  return null;
}

/** Valid wishlist for this customer, or null when no usable cookie is present. */
export async function readWishlistCookie(
  customerId: string,
): Promise<string[] | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(WISHLIST_COOKIE)?.value;
  if (!raw) return null;

  const parsed = decodePayload(raw);
  if (!parsed) return null;

  // Legacy bare-array cookies have no customer binding — still honor them.
  if (parsed.customerId && parsed.customerId !== customerId) return null;

  return parsed.productIds;
}

export async function writeWishlistCookie(
  customerId: string,
  productIds: string[],
) {
  const cookieStore = await cookies();
  const unique = Array.from(new Set(productIds));
  cookieStore.set(
    WISHLIST_COOKIE,
    encodePayload({ customerId, productIds: unique }),
    COOKIE_BASE,
  );
  return unique;
}

export async function clearWishlistCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(WISHLIST_COOKIE);
}
