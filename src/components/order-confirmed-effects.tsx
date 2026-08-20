"use client";

import { useEffect, useRef } from "react";
import { clearCartAction } from "@/app/actions/cart";
import { markWelcomeDealUsedAction } from "@/app/actions/welcome-deal";
import { useCart } from "@/components/cart-provider";

export function OrderConfirmedEffects() {
  const { setCart } = useCart();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    void clearCartAction().then(() => setCart(null));
    void markWelcomeDealUsedAction();
  }, [setCart]);

  return null;
}
