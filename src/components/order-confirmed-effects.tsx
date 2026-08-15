"use client";

import { useEffect, useRef } from "react";
import { clearCartAction } from "@/app/actions/cart";
import { markWelcomeDealUsedAction } from "@/app/actions/welcome-deal";
import { useCart } from "@/components/cart-provider";
import { trackPurchase } from "@/lib/meta-pixel";

type OrderConfirmedEffectsProps = {
  order?: string;
  value?: number;
  currency?: string;
};

export function OrderConfirmedEffects({
  order,
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
        orderId: order,
      });
    }
  }, [currency, order, setCart, value]);

  return null;
}
