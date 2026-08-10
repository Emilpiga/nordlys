import type { Money } from "./shopify/types";

export function formatMoney(money: Money, locale = "en-US") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: money.currencyCode,
  }).format(Number(money.amount));
}
