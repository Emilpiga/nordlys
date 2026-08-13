export const locales = ["sv", "no", "da", "fi"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "sv";

export const LOCALE_COOKIE = "NEXT_LOCALE";

export type LocaleConfig = {
  locale: Locale;
  /** Shopify Storefront LanguageCode (Norwegian shop locale is `nb` → `NB`) */
  language: "SV" | "NB" | "DA" | "FI";
  /** Shopify Storefront CountryCode / Markets */
  country: "SE" | "NO" | "DK" | "FI";
  /** HTML lang attribute */
  htmlLang: string;
  /** Intl / money formatting */
  moneyLocale: string;
  /** Open Graph locale */
  ogLocale: string;
  /** Native name shown in the language selector */
  nativeName: string;
};

export const localeConfigs: Record<Locale, LocaleConfig> = {
  sv: {
    locale: "sv",
    language: "SV",
    country: "SE",
    htmlLang: "sv",
    moneyLocale: "sv-SE",
    ogLocale: "sv_SE",
    nativeName: "Svenska",
  },
  no: {
    locale: "no",
    language: "NB",
    country: "NO",
    htmlLang: "nb",
    moneyLocale: "nb-NO",
    ogLocale: "nb_NO",
    nativeName: "Norsk",
  },
  da: {
    locale: "da",
    language: "DA",
    country: "DK",
    htmlLang: "da",
    moneyLocale: "da-DK",
    ogLocale: "da_DK",
    nativeName: "Dansk",
  },
  fi: {
    locale: "fi",
    language: "FI",
    country: "FI",
    htmlLang: "fi",
    moneyLocale: "fi-FI",
    ogLocale: "fi_FI",
    nativeName: "Suomi",
  },
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function getLocaleConfig(locale: string): LocaleConfig {
  if (isLocale(locale)) return localeConfigs[locale];
  return localeConfigs[defaultLocale];
}

export function getShopifyContext(locale: string) {
  const config = getLocaleConfig(locale);
  return {
    language: config.language,
    country: config.country,
  };
}

/** Prefix an absolute in-app path with the locale segment. */
export function localePath(locale: string, path = "/") {
  const normalized =
    !path || path === "/"
      ? ""
      : path.startsWith("/")
        ? path
        : `/${path}`;
  const base = `/${getLocaleConfig(locale).locale}`;
  return normalized ? `${base}${normalized}` : base;
}

/** Strip a leading locale segment from a pathname. */
export function stripLocalePrefix(pathname: string) {
  const parts = pathname.split("/");
  if (parts.length > 1 && isLocale(parts[1])) {
    const rest = parts.slice(2).join("/");
    return rest ? `/${rest}` : "/";
  }
  return pathname || "/";
}

/** Negotiate locale from Accept-Language style tags. */
export function negotiateLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return defaultLocale;

  const candidates = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, qPart] = part.trim().split(";q=");
      return {
        tag: tag.toLowerCase(),
        q: qPart ? Number(qPart) : 1,
      };
    })
    .sort((a, b) => b.q - a.q);

  for (const { tag } of candidates) {
    if (tag.startsWith("sv")) return "sv";
    if (tag.startsWith("nb") || tag.startsWith("nn") || tag === "no") return "no";
    if (tag.startsWith("da")) return "da";
    if (tag.startsWith("fi")) return "fi";
  }

  return defaultLocale;
}
