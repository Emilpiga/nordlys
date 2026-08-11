"use client";

import Link from "next/link";
import { useConsent } from "@/components/consent-provider";

export function CookieBanner() {
  const {
    ready,
    bannerOpen,
    pixelsConfigured,
    acceptMarketing,
    rejectMarketing,
  } = useConsent();

  if (!ready || !pixelsConfigured || !bannerOpen) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-desc"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border/80 bg-[color-mix(in_oklab,var(--frost)_92%,white)] px-5 py-5 shadow-[0_-12px_40px_rgba(20,32,28,0.08)] backdrop-blur-md sm:px-8 sm:py-6"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
        <div className="max-w-2xl">
          <p
            id="cookie-banner-title"
            className="font-display text-2xl font-medium tracking-tight text-foreground"
          >
            Cookies & ads
          </p>
          <p
            id="cookie-banner-desc"
            className="mt-2 text-sm font-light leading-relaxed text-muted"
          >
            We use essential cookies to keep your bag working. With your OK, we
            also use Meta and Google advertising cookies to measure and improve
            our ads. See our{" "}
            <Link
              href="/privacy"
              className="text-accent underline-offset-4 hover:underline"
            >
              Privacy
            </Link>{" "}
            page for details.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={rejectMarketing}
            className="btn-secondary"
          >
            Essential only
          </button>
          <button
            type="button"
            onClick={acceptMarketing}
            className="btn-primary"
          >
            Accept ads cookies
          </button>
        </div>
      </div>
    </div>
  );
}

export function CookieSettingsButton({
  className,
  asListItem = false,
}: {
  className?: string;
  asListItem?: boolean;
}) {
  const { pixelsConfigured, openBanner } = useConsent();
  if (!pixelsConfigured) return null;

  const button = (
    <button type="button" onClick={openBanner} className={className}>
      Cookies
    </button>
  );

  return asListItem ? <li>{button}</li> : button;
}
