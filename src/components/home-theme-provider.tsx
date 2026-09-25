"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { HeroTheme } from "@/lib/hero-images";

type HomeThemeContextValue = {
  theme: HeroTheme;
  setTheme: (theme: HeroTheme) => void;
};

const HomeThemeContext = createContext<HomeThemeContextValue | null>(null);

/**
 * The side of the store the shopper chose on the home page (Kläder or Hem).
 * Set by explicit clicks only — the hero's auto-rotation never changes it, so
 * sections further down stay put while someone is reading them.
 */
export function HomeThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<HeroTheme>("clothing");
  return (
    <HomeThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </HomeThemeContext.Provider>
  );
}

/** Null outside the home page, where nothing shares the choice. */
export function useHomeTheme() {
  return useContext(HomeThemeContext);
}
