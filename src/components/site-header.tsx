"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { SiteLogo } from "@/components/site-logo";
import { shopifyConfig } from "@/lib/shopify/config";
import { categoryParamFromId } from "@/lib/shopify/taxonomy";
import type { ProductCategory } from "@/lib/shopify/types";

type SiteHeaderProps = {
  cartCount: number;
  categories?: ProductCategory[];
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

export function SiteHeader({
  cartCount,
  categories = [],
}: SiteHeaderProps) {
  const [progress, setProgress] = useState(0);
  const [shopOpen, setShopOpen] = useState(false);
  const panelId = useId();
  const shopRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countLabel =
    cartCount > 99 ? "99+" : cartCount > 0 ? String(cartCount) : null;
  const hasCategories = categories.length > 0;

  useEffect(() => {
    const update = () => {
      setProgress(Math.min(1, window.scrollY / 72));
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

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

  const frosted = progress > 0.02;

  return (
    <header
      className="fixed inset-x-0 top-0 z-40 border-b"
      style={{
        backgroundColor: `rgba(247, 249, 250, ${(progress * 0.86).toFixed(3)})`,
        backdropFilter: frosted ? `blur(${(progress * 16).toFixed(1)}px)` : "none",
        WebkitBackdropFilter: frosted
          ? `blur(${(progress * 16).toFixed(1)}px)`
          : "none",
        borderBottomColor: `rgba(20, 32, 28, ${(progress * 0.12).toFixed(3)})`,
      }}
    >
      <div className="mx-auto flex h-[4.25rem] w-full max-w-6xl items-center justify-between gap-6 px-5 sm:h-[4.5rem] sm:px-8">
        <Link
          href="/"
          aria-label={shopifyConfig.storeName}
          className="inline-flex shrink-0 items-center"
          onClick={() => setShopOpen(false)}
        >
          <SiteLogo size="header" priority />
        </Link>

        <nav className="flex items-center gap-7 text-[0.8rem] font-medium tracking-[0.14em] uppercase text-muted">
          <div
            ref={shopRef}
            className="relative"
            onMouseEnter={openShop}
            onMouseLeave={scheduleCloseShop}
          >
            {hasCategories ? (
              <button
                type="button"
                className="inline-flex items-center gap-1.5 transition hover:text-foreground"
                aria-expanded={shopOpen}
                aria-controls={panelId}
                onClick={() => setShopOpen((open) => !open)}
              >
                Shoppa
                <ChevronIcon
                  className={`h-2.5 w-2.5 transition ${shopOpen ? "rotate-180" : ""}`}
                />
              </button>
            ) : (
              <Link
                href="/products"
                className="transition hover:text-foreground"
              >
                Shoppa
              </Link>
            )}

            {hasCategories && shopOpen ? (
              <div
                id={panelId}
                role="region"
                aria-label="Produktkategorier"
                className="absolute right-0 top-full z-50 pt-4"
                onMouseEnter={openShop}
                onMouseLeave={scheduleCloseShop}
              >
                <div className="w-[min(92vw,34rem)] border border-border/70 bg-[color-mix(in_oklab,var(--frost)_96%,white)] p-5 shadow-[0_18px_50px_rgba(20,32,28,0.12)] sm:w-[36rem] sm:p-6">
                  <div className="flex items-end justify-between gap-4 border-b border-border/60 pb-4">
                    <div>
                      <p className="text-[0.62rem] font-medium tracking-[0.18em] uppercase text-blush">
                        Kategorier
                      </p>
                      <p className="mt-1 font-display text-2xl font-medium tracking-tight text-foreground">
                        Utforska sortimentet
                      </p>
                    </div>
                    <Link
                      href="/products"
                      onClick={() => setShopOpen(false)}
                      className="shrink-0 text-[0.62rem] font-medium tracking-[0.14em] uppercase text-muted transition hover:text-foreground"
                    >
                      Visa alla
                    </Link>
                  </div>

                  <ul className="mt-4 grid grid-cols-1 gap-1 sm:grid-cols-2 sm:gap-x-4 sm:gap-y-1">
                    {categories.map((category) => (
                      <li key={category.id}>
                        <Link
                          href={`/categories/${encodeURIComponent(categoryParamFromId(category.id))}`}
                          onClick={() => setShopOpen(false)}
                          className="flex items-baseline justify-between gap-3 px-2 py-2.5 text-[0.78rem] font-normal normal-case tracking-normal text-foreground/85 transition hover:bg-[color-mix(in_oklab,var(--mist)_55%,white)] hover:text-foreground"
                        >
                          <span>{category.name}</span>
                          <span className="tabular-nums text-[0.68rem] text-muted">
                            {category.productCount}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}
          </div>

          <Link
            href="/cart"
            aria-label={
              cartCount > 0 ? `Kasse, ${cartCount} varor` : "Kasse"
            }
            className="relative inline-flex h-9 w-9 items-center justify-center text-foreground transition hover:text-accent"
            onClick={() => setShopOpen(false)}
          >
            <BagIcon className="h-[1.35rem] w-[1.35rem]" />
            {countLabel ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center bg-accent px-1 text-[0.62rem] font-semibold leading-none tracking-normal text-[var(--on-accent)] tabular-nums">
                {countLabel}
              </span>
            ) : null}
          </Link>
        </nav>
      </div>
    </header>
  );
}
