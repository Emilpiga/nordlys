"use client";

import { useEffect, useRef } from "react";
import { clearCartAction } from "@/app/actions/cart";
import { markWelcomeDealUsedAction } from "@/app/actions/welcome-deal";
import { useCart } from "@/components/cart-provider";
import { trackPurchase } from "@/lib/ads-events";

type OrderConfirmedEffectsProps = {
  order?: string;
  /** Shopify order GID — used as Google Ads transaction_id for dedup. */
  transactionId?: string;
  value?: number;
  currency?: string;
};

export function OrderConfirmedEffects({
  order,
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

    if (typeof value === "number" && currency) {
      trackPurchase({
        contentIds: order ? [order] : ["order"],
        contentType: "product",
        value,
        currency,
        orderId: transactionId || order,
      });
    }
  }, [currency, order, setCart, transactionId, value]);

  return null;
}
