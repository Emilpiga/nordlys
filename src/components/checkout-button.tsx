"use client";

import { useTransition } from "react";
import { beginCheckoutAction } from "@/app/actions/cart";
import {
  metaContentIdFromGid,
  trackInitiateCheckout,
} from "@/lib/ads-events";
import { decorateCheckoutUrl } from "@/lib/ads-linker";
import { getPostHogIds } from "@/lib/posthog";
import type { Cart } from "@/lib/shopify/types";

type CheckoutButtonProps = {
  cart: Cart;
  className?: string;
  children: React.ReactNode;
};

export function CheckoutButton({
  cart,
  className,
  children,
}: CheckoutButtonProps) {
  const [isPending, startTransition] = useTransition();

  function onCheckout() {
    trackInitiateCheckout({
      contentIds: cart.lines.map((line) =>
        metaContentIdFromGid(line.merchandise.id),
      ),
      contentType: "product",
      value: Number(cart.cost.totalAmount.amount),
      currency: cart.cost.totalAmount.currencyCode,
      numItems: cart.totalQuantity,
    });

    startTransition(async () => {
      const result = await beginCheckoutAction(getPostHogIds());
      const url = result.checkoutUrl || cart.checkoutUrl;
      if (url) window.location.assign(decorateCheckoutUrl(url));
    });
  }

  return (
    <button
      type="button"
      className={className}
      disabled={isPending}
      onClick={onCheckout}
    >
      {children}
    </button>
  );
}
