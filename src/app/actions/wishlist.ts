"use server";

import { revalidatePath } from "next/cache";
import {
  CustomerAccountAuthError,
  getCustomerProfile,
  setWishlistProductIds,
  toggleWishlistProductId,
} from "@/lib/customer-account";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n/locales";
import { cookies } from "next/headers";
import { LOCALE_COOKIE } from "@/lib/i18n/locales";

async function readLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(LOCALE_COOKIE)?.value;
  if (raw && isLocale(raw)) return raw;
  return defaultLocale;
}

function revalidateWishlist(locale: Locale) {
  revalidatePath(`/${locale}/account/wishlist`);
  revalidatePath(`/${locale}/account`);
  revalidatePath(`/${locale}/products`);
  revalidatePath(`/${locale}`, "layout");
}

export async function getWishlistIdsAction() {
  const profile = await getCustomerProfile();
  return profile?.wishlistProductIds ?? [];
}

/** Merge client-restored ids into the cookie when the server copy was lost. */
export async function restoreWishlistAction(productIds: string[]) {
  try {
    const profile = await getCustomerProfile();
    if (!profile) return { ok: false as const, reason: "auth" as const };

    const incoming = productIds.filter((id): id is string => typeof id === "string");
    if (incoming.length === 0) {
      return { ok: true as const, wishlistProductIds: profile.wishlistProductIds };
    }

    // Only restore when the server list is empty — never clobber a newer cookie.
    if (profile.wishlistProductIds.length > 0) {
      return { ok: true as const, wishlistProductIds: profile.wishlistProductIds };
    }

    const wishlistProductIds = await setWishlistProductIds(incoming);
    const locale = await readLocale();
    revalidateWishlist(locale);
    return { ok: true as const, wishlistProductIds };
  } catch (error) {
    if (error instanceof CustomerAccountAuthError) {
      return { ok: false as const, reason: "auth" as const };
    }
    console.error("restoreWishlistAction failed:", error);
    return { ok: false as const, reason: "error" as const };
  }
}

export async function toggleWishlistAction(productId: string) {
  try {
    const result = await toggleWishlistProductId(productId);
    const locale = await readLocale();
    revalidateWishlist(locale);
    return { ok: true as const, ...result };
  } catch (error) {
    if (error instanceof CustomerAccountAuthError) {
      return { ok: false as const, reason: "auth" as const };
    }
    console.error("toggleWishlistAction failed:", error);
    return { ok: false as const, reason: "error" as const };
  }
}
