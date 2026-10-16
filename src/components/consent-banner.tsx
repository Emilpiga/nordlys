"use client";

import { useEffect, useId, useState } from "react";
import { useDictionary } from "@/components/dictionary-provider";
import { LocaleLink } from "@/components/locale-link";

const SHOW_DELAY_MS = 600;

/** Fired by the footer's "Cookie settings" link to ask again. */
export const OPEN_CONSENT_EVENT = "store-consent-open";

export function openConsentBanner() {
  window.dispatchEvent(new Event(OPEN_CONSENT_EVENT));
}

function hasStoredChoice() {
  return /(?:^|; )store_consent=(granted|denied)/.test(document.cookie);
}

/**
 * Cookie banner for EEA/UK/CH visitors. Until they answer, Consent Mode stays
 * denied and Shopify checkout holds back the Google Ads Purchase pixel (see
 * ShopifyConsentBridge). Steps aside when a Google CMP (AdSense) is on the page.
 */
export function ConsentBanner({ consentRequired }: { consentRequired: boolean }) {
  const { dict } = useDictionary();
  const titleId = useId();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // A beat after load, so a Google CMP that is on the page can show up first.
    const timer = window.setTimeout(() => {
      if (
        consentRequired &&
        !hasStoredChoice() &&
        typeof window.__tcfapi !== "function"
      ) {
        setOpen(true);
      }
    }, SHOW_DELAY_MS);
    const reopen = () => setOpen(true);
    window.addEventListener(OPEN_CONSENT_EVENT, reopen);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(OPEN_CONSENT_EVENT, reopen);
    };
  }, [consentRequired]);

  function choose(granted: boolean) {
    window.__storeChooseConsent?.(granted);
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-labelledby={titleId}
      className="fixed inset-x-0 bottom-0 z-[70] p-3 sm:bottom-4 sm:left-4 sm:right-auto sm:max-w-md sm:p-0"
    >
      <div className="bg-[color-mix(in_oklab,var(--frost)_97%,white)] px-5 py-5 shadow-[0_-8px_40px_rgba(20,28,34,0.14)] animate-rise sm:px-6 sm:py-6 sm:shadow-[0_24px_80px_rgba(20,28,34,0.16)]">
        <p id={titleId} className="font-display text-lg font-medium tracking-tight">
          {dict.consent.title}
        </p>
        <p className="mt-2 text-sm font-light leading-relaxed text-muted">
          {dict.consent.body}{" "}
          <LocaleLink href="/privacy" className="underline underline-offset-2">
            {dict.consent.privacyLink}
          </LocaleLink>
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            className="btn-primary flex-1"
            onClick={() => choose(true)}
          >
            {dict.consent.accept}
          </button>
          <button
            type="button"
            className="btn-secondary flex-1"
            onClick={() => choose(false)}
          >
            {dict.consent.reject}
          </button>
        </div>
      </div>
    </div>
  );
}
