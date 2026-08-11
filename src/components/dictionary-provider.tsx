"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { t } from "@/lib/i18n/interpolate";
import type { Locale } from "@/lib/i18n/locales";

type DictionaryContextValue = {
  locale: Locale;
  dict: Dictionary;
  t: typeof t;
};

const DictionaryContext = createContext<DictionaryContextValue | null>(null);

export function DictionaryProvider({
  locale,
  dict,
  children,
}: {
  locale: Locale;
  dict: Dictionary;
  children: ReactNode;
}) {
  return (
    <DictionaryContext.Provider value={{ locale, dict, t }}>
      {children}
    </DictionaryContext.Provider>
  );
}

export function useDictionary() {
  const context = useContext(DictionaryContext);
  if (!context) {
    throw new Error("useDictionary must be used within DictionaryProvider");
  }
  return context;
}
