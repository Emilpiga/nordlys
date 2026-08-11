"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createConsent,
  hasMarketingPixelsConfigured,
  readConsentFromDocument,
  writeConsentToDocument,
  type ConsentState,
} from "@/lib/consent";

type ConsentContextValue = {
  ready: boolean;
  consent: ConsentState | null;
  bannerOpen: boolean;
  marketingAllowed: boolean;
  pixelsConfigured: boolean;
  acceptMarketing: () => void;
  rejectMarketing: () => void;
  openBanner: () => void;
  closeBanner: () => void;
};

const ConsentContext = createContext<ConsentContextValue | null>(null);

export function ConsentProvider({ children }: { children: ReactNode }) {
  const pixelsConfigured = hasMarketingPixelsConfigured();
  const [ready, setReady] = useState(false);
  const [consent, setConsent] = useState<ConsentState | null>(null);
  const [bannerOpen, setBannerOpen] = useState(false);

  useEffect(() => {
    const stored = readConsentFromDocument();
    setConsent(stored);
    setBannerOpen(pixelsConfigured && !stored);
    setReady(true);
  }, [pixelsConfigured]);

  const persist = useCallback(
    (marketing: boolean, options?: { reloadIfRevoking?: boolean }) => {
      const wasMarketing = Boolean(consent?.marketing);
      const next = createConsent(marketing);
      writeConsentToDocument(next);
      setConsent(next);
      setBannerOpen(false);

      // Pixel scripts already in the page cannot be fully unloaded; refresh
      // when revoking marketing so tags stop for the next session.
      if (options?.reloadIfRevoking && wasMarketing && !marketing) {
        window.location.reload();
      }
    },
    [consent?.marketing],
  );

  const acceptMarketing = useCallback(() => persist(true), [persist]);
  const rejectMarketing = useCallback(
    () => persist(false, { reloadIfRevoking: true }),
    [persist],
  );
  const openBanner = useCallback(() => setBannerOpen(true), []);
  const closeBanner = useCallback(() => {
    if (consent) setBannerOpen(false);
  }, [consent]);

  const value = useMemo<ConsentContextValue>(
    () => ({
      ready,
      consent,
      bannerOpen,
      marketingAllowed: Boolean(consent?.marketing),
      pixelsConfigured,
      acceptMarketing,
      rejectMarketing,
      openBanner,
      closeBanner,
    }),
    [
      ready,
      consent,
      bannerOpen,
      pixelsConfigured,
      acceptMarketing,
      rejectMarketing,
      openBanner,
      closeBanner,
    ],
  );

  return (
    <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>
  );
}

export function useConsent() {
  const ctx = useContext(ConsentContext);
  if (!ctx) {
    throw new Error("useConsent must be used within ConsentProvider");
  }
  return ctx;
}
