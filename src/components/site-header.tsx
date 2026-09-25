"use client";

import { useEffect, useId, useRef, useState, type RefObject } from "react";
import { useCart } from "@/components/cart-provider";
import { useDictionary } from "@/components/dictionary-provider";
import { HeaderSearch } from "@/components/header-search";
import { LanguageSelector } from "@/components/language-selector";
import { LocaleLink } from "@/components/locale-link";
import { SiteLogo } from "@/components/site-logo";
import { shopifyConfig } from "@/lib/shopify/config";
import {
  collectionFilterTree,
  shortCollectionLabel,
  type CollectionTreeNode,
} from "@/lib/shopify/collections";
import type { CollectionSummary } from "@/lib/shopify/types";
import { lockPageScroll } from "@/lib/scroll-lock";

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

function AccountIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="8"
        r="3.25"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M5.5 19.25c1.35-3.1 3.55-4.75 6.5-4.75s5.15 1.65 6.5 4.75"
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

function ShopMenu({
  collections,
  panelId,
  panelRef,
  onClose,
  onMouseEnter,
  onMouseLeave,
  onKeepOpen,
}: {
  collections: CollectionSummary[];
  panelId: string;
  panelRef: RefObject<HTMLDivElement | null>;
  onClose: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onKeepOpen: (point: { x: number; y: number }) => void;
}) {
  const { dict } = useDictionary();
  const tree = collectionFilterTree(collections);
  const [stack, setStack] = useState<CollectionTreeNode[]>([]);
  const [direction, setDirection] = useState<1 | -1>(1);
  const current = stack.at(-1) ?? null;
  const parent = stack.at(-2) ?? null;
  const items = current ? current.children : tree;
  const title = current ? current.collection.title : dict.nav.exploreCatalog;
  const backLabel = parent ? parent.collection.title : dict.nav.categories;
  const viewHref = current
    ? `/collections/${encodeURIComponent(current.collection.handle)}`
    : "/products";

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || stack.length === 0) return;
      event.stopPropagation();
      onKeepOpen({ x: Number.NaN, y: Number.NaN });
      setDirection(-1);
      setStack((path) => path.slice(0, -1));
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onKeepOpen, stack.length]);

  function openBranch(node: CollectionTreeNode, event: { clientX: number; clientY: number }) {
    onKeepOpen({ x: event.clientX, y: event.clientY });
    setDirection(1);
    setStack((path) => [...path, node]);
  }

  function goBack(event: { clientX: number; clientY: number }) {
    onKeepOpen({ x: event.clientX, y: event.clientY });
    setDirection(-1);
    setStack((path) => path.slice(0, -1));
  }

  const rowClass =
    "flex min-h-12 w-full items-center justify-between gap-3 border-b border-border/50 px-1 text-left text-base font-medium normal-case tracking-normal text-foreground transition hover:text-accent";

  return (
    <>
      <button
        type="button"
        aria-label={dict.search.close}
        className="animate-shop-backdrop absolute inset-x-0 top-full z-40 h-[100svh] bg-[rgba(20,28,34,0.32)] md:hidden"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        id={panelId}
        role="region"
        aria-label={dict.nav.categories}
        className="animate-shop-sheet absolute inset-x-0 top-full z-50 md:inset-x-auto md:right-8 md:w-[min(36rem,calc(100vw-4rem))] md:pt-3"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <div className="max-h-[calc(100svh-var(--header-height))] overflow-y-auto overscroll-contain border-b border-border/70 bg-[color-mix(in_oklab,var(--frost)_98%,white)] shadow-[0_18px_40px_rgba(20,28,34,0.1)] md:border">
          <div className="sticky top-0 z-10 flex items-end justify-between gap-4 border-b border-border/60 bg-[color-mix(in_oklab,var(--frost)_98%,white)] px-4 py-4 md:px-6">
            <div className="min-w-0 flex-1">
              {current ? (
                <button
                  type="button"
                  onClick={(event) => goBack(event)}
                  className="mb-1 inline-flex items-center gap-1.5 text-[0.62rem] font-medium tracking-[0.18em] uppercase text-glow transition hover:text-foreground"
                >
                  <ChevronIcon className="h-2.5 w-2.5 rotate-90" />
                  {backLabel}
                </button>
              ) : (
                <p className="text-[0.62rem] font-medium tracking-[0.18em] uppercase text-glow">
                  {dict.nav.categories}
                </p>
              )}
              <p className="font-display text-2xl font-medium tracking-tight text-foreground">
                {title}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-4">
              <LocaleLink
                href={viewHref}
                onClick={onClose}
                className="text-[0.62rem] font-medium tracking-[0.14em] uppercase text-muted transition hover:text-foreground"
              >
                {dict.nav.viewAll}
              </LocaleLink>
              <button
                type="button"
                className="text-[0.62rem] font-medium tracking-[0.14em] uppercase text-muted transition hover:text-foreground md:hidden"
                onClick={onClose}
              >
                {dict.search.close}
              </button>
            </div>
          </div>

          <ul
            key={current?.collection.id ?? "root"}
            className={`px-3 py-1 md:px-5 ${
              direction > 0 ? "animate-shop-drill-in" : "animate-shop-drill-back"
            }`}
          >
            {items.map((node) => {
              const label = current
                ? shortCollectionLabel(node.collection.title, current.collection.title)
                : node.collection.title;
              const hasChildren = node.children.length > 0;

              if (hasChildren) {
                return (
                  <li key={node.collection.id}>
                    <button
                      type="button"
                      onClick={(event) => openBranch(node, event)}
                      className={rowClass}
                    >
                      <span className="min-w-0">{label}</span>
                      <span className="flex shrink-0 items-center gap-2.5 text-muted">
                        <span className="tabular-nums text-sm font-normal">
                          {node.collection.productCount}
                        </span>
                        <ChevronIcon className="h-3 w-3 -rotate-90" />
                      </span>
                    </button>
                  </li>
                );
              }

              return (
                <li key={node.collection.id}>
                  <LocaleLink
                    href={`/collections/${encodeURIComponent(node.collection.handle)}`}
                    onClick={onClose}
                    className={rowClass}
                  >
                    <span className="min-w-0">{label}</span>
                    <span className="tabular-nums text-sm font-normal text-muted">
                      {node.collection.productCount}
                    </span>
                  </LocaleLink>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </>
  );
}

export function SiteHeader({ collections = [] }: SiteHeaderProps) {
  const { dict, t } = useDictionary();
  const { cart, openCart } = useCart();
  const cartCount = cart?.totalQuantity ?? 0;
  const [shopOpen, setShopOpen] = useState(false);
  const panelId = useId();
  const shopRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverHold = useRef<{ x: number; y: number } | null>(null);
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
      if (
        target &&
        (shopRef.current?.contains(target) || panelRef.current?.contains(target))
      ) {
        return;
      }
      setShopOpen(false);
    };

    const mobile = window.matchMedia("(max-width: 767px)");
    const releaseScroll = mobile.matches ? lockPageScroll() : null;

    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("touchstart", onPointer);
    return () => {
      releaseScroll?.();
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

  function hoverEnabled() {
    return window.matchMedia("(min-width: 768px)").matches;
  }

  function openShop() {
    if (!hasCategories || !hoverEnabled()) return;
    clearCloseTimer();
    setShopOpen(true);
  }

  function holdShopOpen(point: { x: number; y: number }) {
    hoverHold.current = point;
    clearCloseTimer();
  }

  function scheduleCloseShop() {
    if (!hoverEnabled() || hoverHold.current) return;
    clearCloseTimer();
    closeTimer.current = setTimeout(() => setShopOpen(false), 200);
  }

  useEffect(() => {
    if (!shopOpen) {
      hoverHold.current = null;
      return;
    }

    function onMove(event: MouseEvent) {
      const point = hoverHold.current;
      if (!point) return;
      const dx = event.clientX - point.x;
      const dy = event.clientY - point.y;
      const moved =
        Number.isNaN(point.x) || dx * dx + dy * dy >= 64;
      if (!moved) return;
      hoverHold.current = null;
      const target = event.target as Node | null;
      const inside = Boolean(
        (target && panelRef.current?.contains(target)) ||
          (target && shopRef.current?.contains(target)),
      );
      if (!inside) scheduleCloseShop();
    }

    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [shopOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-frost">
      <div className="flex h-[var(--header-height)] w-full items-center justify-between gap-3 px-4 sm:gap-6 sm:px-8 md:grid md:grid-cols-[var(--rail-width)_minmax(0,1fr)] md:gap-0 md:px-0">
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

        <div className="flex min-w-0 items-center justify-end gap-1.5 sm:gap-3 md:h-full md:flex-1 md:items-stretch md:justify-between md:gap-0">
          <HeaderSearch collections={collections} />

          <nav className="flex shrink-0 items-center gap-2.5 text-[0.72rem] font-medium tracking-[0.12em] uppercase text-foreground/70 sm:gap-5 sm:text-[0.8rem] sm:tracking-[0.14em] md:gap-7 md:px-8">
            <div
              ref={shopRef}
              className="relative"
              onMouseEnter={openShop}
              onMouseLeave={scheduleCloseShop}
            >
            {hasCategories ? (
              <button
                type="button"
                className="inline-flex min-h-11 items-center gap-1.5 uppercase transition hover:text-foreground"
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
          </div>

          <LanguageSelector />

          <LocaleLink
            href="/account"
            aria-label={dict.nav.account}
            className="relative inline-flex h-9 w-9 items-center justify-center text-foreground transition hover:text-accent"
            onClick={() => setShopOpen(false)}
          >
            <AccountIcon className="h-[1.35rem] w-[1.35rem]" />
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
      {hasCategories && shopOpen ? (
        <ShopMenu
          collections={collections}
          panelId={panelId}
          panelRef={panelRef}
          onClose={() => setShopOpen(false)}
          onMouseEnter={openShop}
          onMouseLeave={scheduleCloseShop}
          onKeepOpen={holdShopOpen}
        />
      ) : null}
    </header>
  );
}
