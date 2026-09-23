"use client";

import { useEffect, useRef } from "react";
import { clearCartAction } from "@/app/actions/cart";
import { markWelcomeDealUsedAction } from "@/app/actions/welcome-deal";
import { useCart } from "@/components/cart-provider";
import { trackPurchase } from "@/lib/ads-events";

type OrderConfirmedEffectsProps = {
  transactionId?: string;
  value?: number;
  currency?: string;
};

export function OrderConfirmedEffects({
  transactionId,
  value,
  currency,
}: OrderConfirmedEffectsProps) {
  const { setCart } = useCart();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    void clearCartAction().then(() => setCart(null));
    void markWelcomeDealUsedAction();

    if (!transactionId && value === undefined) return;

    const dedupeKey = `ads_purchase_${transactionId || `${value}_${currency}`}`;
    try {
      if (sessionStorage.getItem(dedupeKey)) return;
      sessionStorage.setItem(dedupeKey, "1");
    } catch {
      // Private mode — still fire once per mount via `ran`.
    }

    trackPurchase({
      contentIds: [],
      contentType: "product",
      ...(typeof value === "number" && Number.isFinite(value) ? { value } : {}),
      ...(currency ? { currency } : {}),
      ...(transactionId ? { orderId: transactionId } : {}),
    });
  }, [setCart, transactionId, value, currency]);

  return null;
}
