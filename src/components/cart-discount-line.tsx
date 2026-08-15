"use client";

import { useDictionary } from "@/components/dictionary-provider";
import { formatMoney } from "@/lib/format";
import type { Cart } from "@/lib/shopify/types";

export function CartDiscountLine({
  cart,
  variant = "summary",
}: {
  cart: Cart;
  variant?: "summary" | "drawer";
}) {
  const { locale, dict, t } = useDictionary();
  if (!cart.discountTotal) return null;

  const label = t(dict.cart.discount, { percent: 10 });
  const amount = `−${formatMoney(cart.discountTotal, locale)}`;

  if (variant === "drawer") {
    return (
      <div className="mt-2 flex items-baseline justify-between gap-4 text-sm">
        <p className="text-[0.68rem] font-medium tracking-[0.16em] uppercase text-glow">
          {label}
        </p>
        <p className="tabular-nums text-glow">{amount}</p>
      </div>
    );
  }

  return (
    <div className="flex justify-between gap-4">
      <dt className="text-glow">{label}</dt>
      <dd className="text-glow">{amount}</dd>
    </div>
  );
}
