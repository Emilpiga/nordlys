import type { Money } from "./shopify/types";
import { getLocaleConfig } from "@/lib/i18n/locales";

export function formatMoney(money: Money, localeOrMoneyLocale = "sv-SE") {
  const moneyLocale =
    localeOrMoneyLocale.includes("-") || localeOrMoneyLocale.includes("_")
      ? localeOrMoneyLocale.replace("_", "-")
      : getLocaleConfig(localeOrMoneyLocale).moneyLocale;

  return new Intl.NumberFormat(moneyLocale, {
    style: "currency",
    currency: money.currencyCode,
  }).format(Number(money.amount));
}
