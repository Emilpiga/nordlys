import "server-only";
import type { Locale } from "./locales";
import { defaultLocale, isLocale } from "./locales";
import da from "./dictionaries/da.json";
import fi from "./dictionaries/fi.json";
import no from "./dictionaries/no.json";
import sv from "./dictionaries/sv.json";

export type Dictionary = typeof sv;
export { t } from "./interpolate";

const dictionaries: Record<Locale, Dictionary> = { sv, no, da, fi };

export async function getDictionary(locale: string): Promise<Dictionary> {
  const key = isLocale(locale) ? locale : defaultLocale;
  return dictionaries[key];
}
