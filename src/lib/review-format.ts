import { getLocaleConfig, type Locale } from "@/lib/i18n/locales";

export function formatReviewDate(isoDate: string, locale: string | Locale) {
  const { moneyLocale } = getLocaleConfig(locale);
  const date = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;

  return new Intl.DateTimeFormat(moneyLocale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function formatReviewAverage(average: number, locale: string | Locale) {
  const { moneyLocale } = getLocaleConfig(locale);
  return new Intl.NumberFormat(moneyLocale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(average);
}
