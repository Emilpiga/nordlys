import "server-only";
import type { Locale } from "./locales";
import { defaultLocale, isLocale } from "./locales";
import type sv from "./dictionaries/sv.json";

export type Dictionary = typeof sv;
export { t } from "./interpolate";

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  sv: () => import("./dictionaries/sv.json").then((m) => m.default),
  no: () => import("./dictionaries/no.json").then((m) => m.default),
  da: () => import("./dictionaries/da.json").then((m) => m.default),
  fi: () => import("./dictionaries/fi.json").then((m) => m.default),
};

export async function getDictionary(locale: string): Promise<Dictionary> {
  const key = isLocale(locale) ? locale : defaultLocale;
  return dictionaries[key]();
}
