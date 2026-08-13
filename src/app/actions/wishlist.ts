"use server";

import { revalidatePath } from "next/cache";
import {
  CustomerAccountAuthError,
  getCustomerProfile,
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
}

export async function getWishlistIdsAction() {
  const profile = await getCustomerProfile();
  return profile?.wishlistProductIds ?? [];
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
