import { updateCartDiscountCodes } from "@/lib/shopify";
import type { Cart } from "@/lib/shopify/types";
import {
  cartHasWelcomeCode,
  cartWelcomeCodeApplicable,
  getAcceptedWelcomeDiscountCodes,
  setWelcomeDealUsed,
} from "@/lib/welcome-deal";

export async function applyWelcomeDeal(
  cart: Cart,
  locale: string,
  codes?: string[],
): Promise<Cart> {
  const welcomeCodes = codes ?? (await getAcceptedWelcomeDiscountCodes());
  if (welcomeCodes.length === 0) return cart;

  const code = welcomeCodes[0];
  if (cartHasWelcomeCode(cart, code)) {
    if (!cartWelcomeCodeApplicable(cart, code) && cart.totalQuantity > 0) {
      await setWelcomeDealUsed();
    }
    return cart;
  }

  const nextCodes = [
    ...new Set([
      ...cart.discountCodes.map((entry) => entry.code),
      ...welcomeCodes,
    ]),
  ];

  try {
    const next = await updateCartDiscountCodes(cart.id, nextCodes, locale);
    if (
      cartHasWelcomeCode(next, code) &&
      !cartWelcomeCodeApplicable(next, code) &&
      next.totalQuantity > 0
    ) {
      await setWelcomeDealUsed();
    }
    return next;
  } catch (error) {
    console.error("Failed to apply welcome discount:", error);
    return cart;
  }
}
