"use client";

import { useDictionary } from "@/components/dictionary-provider";
import { displayCompareAt, discountPercent } from "@/lib/discounts";
import { formatMoney } from "@/lib/format";
import type { Money } from "@/lib/shopify/types";

type ProductPriceProps = {
  handle: string;
  price: Money;
  shopifyCompareAt?: Money | null;
  size?: "sm" | "md" | "lg";
  showBadge?: boolean;
};

const PRICE_CLASS = {
  sm: "text-sm font-light text-muted",
  md: "font-display text-xl font-medium tracking-tight",
  lg: "font-display text-4xl font-medium tracking-tight",
} as const;

const COMPARE_CLASS = {
  sm: "text-[0.78rem] font-light text-muted/70 line-through",
  md: "text-sm font-light text-muted line-through",
  lg: "text-base font-light text-muted line-through",
} as const;

export function ProductPrice({
  handle,
  price,
  shopifyCompareAt = null,
  size = "sm",
  showBadge = false,
}: ProductPriceProps) {
  const { locale, dict, t } = useDictionary();
  const compareAt = displayCompareAt(handle, price, shopifyCompareAt);
  const percent = compareAt ? discountPercent(price, compareAt) : null;
  const formattedPrice = formatMoney(price, locale);
  const priceClass =
    compareAt && size === "sm"
      ? "text-sm font-medium text-foreground"
      : PRICE_CLASS[size];

  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
      <span className={priceClass}>{formattedPrice}</span>
      {compareAt ? (
        <span
          className={COMPARE_CLASS[size]}
          aria-label={t(dict.products.wasPrice, {
            price: formatMoney(compareAt, locale),
          })}
        >
          {formatMoney(compareAt, locale)}
        </span>
      ) : null}
      {showBadge && percent ? (
        <span className="text-[0.68rem] font-semibold tracking-[0.14em] uppercase text-glow">
          {t(dict.products.saleBadge, { percent })}
        </span>
      ) : null}
    </span>
  );
}

export function SaleBadge({
  handle,
  price,
  shopifyCompareAt = null,
  size = "md",
}: {
  handle: string;
  price: Money;
  shopifyCompareAt?: Money | null;
  size?: "sm" | "md";
}) {
  const { dict, t } = useDictionary();
  const compareAt = displayCompareAt(handle, price, shopifyCompareAt);
  const percent = compareAt ? discountPercent(price, compareAt) : null;
  if (!percent) return null;

  const compact = size === "sm";

  return (
    <span
      className={
        compact
          ? "pointer-events-none absolute left-2 top-2 z-10 bg-foreground px-2 py-1 text-[0.58rem] font-semibold tracking-[0.12em] uppercase text-on-accent sm:left-2.5 sm:top-2.5 sm:px-2.5 sm:py-1 sm:text-[0.62rem] sm:tracking-[0.14em]"
          : "pointer-events-none absolute left-3 top-3 z-10 bg-foreground px-2 py-1 text-[0.58rem] font-semibold tracking-[0.14em] uppercase text-on-accent"
      }
    >
      {t(dict.products.saleBadge, { percent })}
    </span>
  );
}
