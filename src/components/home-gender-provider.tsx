"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { ClothingGender } from "@/lib/shopify/collections";

type HomeGenderContextValue = {
  gender: ClothingGender;
  setGender: (gender: ClothingGender) => void;
};

const HomeGenderContext = createContext<HomeGenderContextValue | null>(null);

/**
 * The side the shopper chose in the hero (Dam or Herr), Dam until they pick.
 * Set by explicit clicks
 * only — the hero's auto-rotation never changes it, so sections further down
 * stay put while someone is reading them.
 */
export function HomeGenderProvider({ children }: { children: ReactNode }) {
  const [gender, setGender] = useState<ClothingGender>("dam");
  return (
    <HomeGenderContext.Provider value={{ gender, setGender }}>
      {children}
    </HomeGenderContext.Provider>
  );
}

/** Null outside the home page, where nothing shares the choice. */
export function useHomeGender() {
  return useContext(HomeGenderContext);
}
