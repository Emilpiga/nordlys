"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useCart } from "@/components/cart-provider";
import { useDictionary } from "@/components/dictionary-provider";
import { HeaderSearch } from "@/components/header-search";
import { LanguageSelector } from "@/components/language-selector";
import { LocaleLink } from "@/components/locale-link";
import { SiteLogo } from "@/components/site-logo";
import { shopifyConfig } from "@/lib/shopify/config";
import type { CollectionSummary } from "@/lib/shopify/types";

type SiteHeaderProps = {
  collections?: CollectionSummary[];
};

function BagIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M6.5 8.5h11l-.7 11.2a1.5 1.5 0 0 1-1.5 1.4H8.7a1.5 1.5 0 0 1-1.5-1.4L6.5 8.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M9 8.5V7a3 3 0 0 1 6 0v1.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M2.5 4.5 6 8l3.5-3.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SiteHeader({ collections = [] }: SiteHeaderProps) {
  const { dict, t } = useDictionary();
  const { cart, openCart } = useCart();
  const cartCount = cart?.totalQuantity ?? 0;
  const [shopOpen, setShopOpen] = useState(false);
  const panelId = useId();
  const shopRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countLabel =
    cartCount > 99 ? "99+" : cartCount > 0 ? String(cartCount) : null;
  const hasCategories = collections.length > 0;

  useEffect(() => {
    if (!shopOpen) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShopOpen(false);
    };

    const onPointer = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (target && shopRef.current?.contains(target)) return;
      setShopOpen(false);
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("touchstart", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("touchstart", onPointer);
    };
  }, [shopOpen]);

  function clearCloseTimer() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  function openShop() {
    if (!hasCategories) return;
    clearCloseTimer();
    setShopOpen(true);
  }

  function scheduleCloseShop() {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => setShopOpen(false), 120);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-frost">
      <div className="flex h-[var(--header-height)] w-full items-center justify-between gap-6 px-5 sm:px-8 md:grid md:grid-cols-[var(--rail-width)_minmax(0,1fr)] md:gap-0 md:px-0">
        <div className="flex h-full items-center md:border-r md:border-border/70 md:px-8">
          <LocaleLink
            href="/"
            aria-label={shopifyConfig.storeName}
            className="inline-flex shrink-0 items-center"
            onClick={() => setShopOpen(false)}
          >
            <SiteLogo size="header" priority />
          </LocaleLink>
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-3 md:h-full md:items-stretch md:justify-between md:gap-0">
          <HeaderSearch collections={collections} />

          <nav className="flex shrink-0 items-center gap-5 text-[0.8rem] font-medium tracking-[0.14em] uppercase text-foreground/70 sm:gap-7 md:px-8">
            <div
            ref={shopRef}
            className="relative"
            onMouseEnter={openShop}
            onMouseLeave={scheduleCloseShop}
          >
            {hasCategories ? (
              <button
                type="button"
                className="inline-flex items-center gap-1.5 uppercase transition hover:text-foreground"
                aria-expanded={shopOpen}
                aria-controls={panelId}
                onClick={() => setShopOpen((open) => !open)}
              >
                {dict.nav.shop}
                <ChevronIcon
                  className={`h-2.5 w-2.5 transition ${shopOpen ? "rotate-180" : ""}`}
                />
              </button>
            ) : (
              <LocaleLink
                href="/products"
                className="uppercase transition hover:text-foreground"
              >
                {dict.nav.shop}
              </LocaleLink>
            )}

            {hasCategories && shopOpen ? (
              <div
                id={panelId}
                role="region"
                aria-label={dict.nav.categories}
                className="absolute right-0 top-full z-50 pt-4"
                onMouseEnter={openShop}
                onMouseLeave={scheduleCloseShop}
              >
                <div className="w-[min(92vw,34rem)] border border-border/70 bg-[color-mix(in_oklab,var(--frost)_96%,white)] p-5 shadow-[0_18px_50px_rgba(20,28,34,0.12)] sm:w-[36rem] sm:p-6">
                  <div className="flex items-end justify-between gap-4 border-b border-border/60 pb-4">
                    <div>
                      <p className="text-[0.62rem] font-medium tracking-[0.18em] uppercase text-glow">
                        {dict.nav.categories}
                      </p>
                      <p className="mt-1 font-display text-2xl font-medium tracking-tight text-foreground">
                        {dict.nav.exploreCatalog}
                      </p>
                    </div>
                    <LocaleLink
                      href="/products"
                      onClick={() => setShopOpen(false)}
                      className="shrink-0 text-[0.62rem] font-medium tracking-[0.14em] uppercase text-muted transition hover:text-foreground"
                    >
                      {dict.nav.viewAll}
                    </LocaleLink>
                  </div>

                  <ul className="mt-4 grid grid-cols-1 gap-1 sm:grid-cols-2 sm:gap-x-4 sm:gap-y-1">
                    {collections.map((collection) => (
                      <li key={collection.id}>
                        <LocaleLink
                          href={`/collections/${encodeURIComponent(collection.handle)}`}
                          onClick={() => setShopOpen(false)}
                          className="flex items-baseline justify-between gap-3 px-2 py-2.5 text-[0.78rem] font-normal normal-case tracking-normal text-foreground/85 transition hover:bg-[color-mix(in_oklab,var(--mist)_55%,white)] hover:text-foreground"
                        >
                          <span>{collection.title}</span>
                          <span className="tabular-nums text-[0.68rem] text-muted">
                            {collection.productCount}
                          </span>
                        </LocaleLink>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}
          </div>

          <LanguageSelector />

          <LocaleLink
            href="/account"
            className="hidden uppercase transition hover:text-foreground sm:inline"
            onClick={() => setShopOpen(false)}
          >
            {dict.nav.account}
          </LocaleLink>

          <button
            type="button"
            aria-label={
              cartCount > 0
                ? t(dict.nav.openCartWithCount, { count: cartCount })
                : dict.nav.openCart
            }
            className="relative inline-flex h-9 w-9 items-center justify-center text-foreground transition hover:text-accent"
            onClick={() => {
              setShopOpen(false);
              openCart();
            }}
          >
            <BagIcon className="h-[1.35rem] w-[1.35rem]" />
            {countLabel ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center bg-accent px-1 text-[0.62rem] font-semibold leading-none tracking-normal text-[var(--on-accent)] tabular-nums">
                {countLabel}
              </span>
            ) : null}
          </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
