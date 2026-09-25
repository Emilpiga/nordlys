"use client";

import Image from "@/components/soft-image";
import { useState } from "react";
import { useDictionary } from "@/components/dictionary-provider";
import { useHomeTheme } from "@/components/home-theme-provider";
import { LocaleLink } from "@/components/locale-link";
import { ProductQuickView } from "@/components/product-quick-view";
import { formatMoney } from "@/lib/format";
import type { HeroTheme } from "@/lib/hero-images";
import type { Look } from "@/lib/lookbook";
import type { Product } from "@/lib/shopify/types";

/** Collage cells: the outer layer large on the left, two pieces stacked right. */
const CELLS = [
  "col-span-3 row-span-2",
  "col-span-2",
  "col-span-2",
] as const;

/** Where each piece's hotspot sits inside its cell. */
const HOTSPOTS = ["left-[38%] top-[44%]", "left-[52%] top-[40%]", "left-[46%] top-[48%]"];

function lookTotal(pieces: Product[]) {
  const first = pieces[0]?.priceRange.minVariantPrice;
  if (!first) return null;
  const amount = pieces.reduce(
    (sum, piece) => sum + Number(piece.priceRange.minVariantPrice.amount),
    0,
  );
  return { amount: amount.toFixed(2), currencyCode: first.currencyCode };
}

/**
 * "Veckans look": a shoppable collage with numbered hotspots. Follows the
 * Kläder/Hem choice made in the hero — outfits for clothing, a room for home.
 */
export function HomeLookbook({ looks }: { looks: Look[] }) {
  const { dict, locale, t } = useDictionary();
  const home = dict.home;
  const shared = useHomeTheme();
  // Remember the picked look per side so switching back restores it.
  const [lookKeys, setLookKeys] = useState<Partial<Record<HeroTheme, string>>>(
    {},
  );
  const [highlight, setHighlight] = useState<number | null>(null);
  const [openSpot, setOpenSpot] = useState<number | null>(null);
  const [quickProduct, setQuickProduct] = useState<Product | null>(null);

  const available = (["clothing", "home"] as const).filter((theme) =>
    looks.some((item) => item.theme === theme),
  );
  const wanted = shared?.theme ?? "clothing";
  const theme = available.includes(wanted) ? wanted : available[0];
  if (!theme) return null;
  const otherTheme = available.find((item) => item !== theme);
  const themeLooks = looks.filter((item) => item.theme === theme);
  const look =
    themeLooks.find((item) => item.key === lookKeys[theme]) ?? themeLooks[0];
  const total = lookTotal(look.pieces);
  const copy =
    theme === "home"
      ? {
          eyebrow: home.lookHomeEyebrow,
          title: home.lookHomeTitle,
          sub: home.lookHomeSub,
          total: home.lookHomeTotal,
          piece: home.lookHomePiece,
          tabsLabel: home.lookHomeTabsLabel,
          switchTo: home.lookSwitchToClothing,
        }
      : {
          eyebrow: home.lookEyebrow,
          title: home.lookTitle,
          sub: home.lookSub,
          total: home.lookTotal,
          piece: home.lookPiece,
          tabsLabel: home.lookTabsLabel,
          switchTo: home.lookSwitchToHome,
        };

  function reset() {
    setOpenSpot(null);
    setHighlight(null);
  }

  function selectLook(key: string) {
    setLookKeys((current) => ({ ...current, [theme!]: key }));
    reset();
  }

  return (
    <section
      aria-labelledby="lookbook-heading"
      className="border-b border-border/60"
    >
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-center lg:gap-14">
        <div className="grid aspect-[5/4] grid-cols-5 grid-rows-2 gap-2.5 sm:gap-3">
          {look.pieces.map((piece, index) => {
            const image = piece.featuredImage;
            const active = highlight === index || openSpot === index;
            return (
              <div
                key={`${look.key}-${piece.id}`}
                className={`relative overflow-hidden bg-mist animate-fade ${CELLS[index]}`}
              >
                {image ? (
                  <Image
                    src={image.url}
                    alt={image.altText || piece.title}
                    fill
                    sizes={
                      index === 0
                        ? "(max-width: 1024px) 60vw, 35vw"
                        : "(max-width: 1024px) 40vw, 22vw"
                    }
                    className={`object-cover transition duration-700 ease-out ${
                      active ? "scale-[1.03]" : ""
                    }`}
                  />
                ) : null}

                <div className={`absolute ${HOTSPOTS[index]}`}>
                  <button
                    type="button"
                    aria-expanded={openSpot === index}
                    aria-label={`${t(copy.piece, { n: index + 1 })}: ${piece.title}`}
                    onClick={() =>
                      setOpenSpot((current) => (current === index ? null : index))
                    }
                    className={`relative flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-xs font-medium tabular-nums shadow-[0_4px_16px_rgba(20,28,34,0.25)] transition ${
                      active
                        ? "bg-foreground text-frost"
                        : "bg-frost/95 text-foreground hover:bg-foreground hover:text-frost"
                    }`}
                  >
                    <span
                      aria-hidden
                      className="absolute inset-0 animate-ping rounded-full bg-frost/60 motion-reduce:hidden [animation-duration:2.4s]"
                    />
                    <span className="relative">{index + 1}</span>
                  </button>

                  {openSpot === index ? (
                    <div className="absolute left-1/2 top-5 z-10 w-48 -translate-x-1/2 bg-frost p-3 text-left shadow-[0_12px_32px_rgba(20,28,34,0.18)] animate-fade">
                      <p className="line-clamp-2 text-sm leading-snug">
                        {piece.title}
                      </p>
                      <p className="mt-1 text-xs font-light tabular-nums text-muted">
                        {formatMoney(piece.priceRange.minVariantPrice, locale)}
                      </p>
                      <button
                        type="button"
                        onClick={() => setQuickProduct(piece)}
                        className="btn-primary mt-3 w-full !px-3 !py-2 !text-[0.62rem]"
                      >
                        {home.lookChoose}
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        <div>
          <p className="text-[0.68rem] font-medium tracking-[0.2em] uppercase text-glow">
            {copy.eyebrow}
          </p>
          <h2
            id="lookbook-heading"
            className="mt-3 font-display text-[1.65rem] font-medium leading-[1.15] tracking-tight sm:text-[1.9rem]"
          >
            {copy.title}
          </h2>
          <p className="mt-4 max-w-sm text-base font-light leading-relaxed text-muted">
            {copy.sub}
          </p>

          {themeLooks.length > 1 ? (
            <div
              role="group"
              aria-label={copy.tabsLabel}
              className="mt-7 flex items-center gap-6"
            >
              {themeLooks.map((item) => {
                const isActive = item.key === look.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => selectLook(item.key)}
                    className={`relative py-2 text-[0.68rem] font-medium tracking-[0.2em] uppercase transition-colors duration-500 ${
                      isActive ? "text-glow" : "text-muted hover:text-foreground"
                    }`}
                  >
                    {item.label}
                    <span
                      aria-hidden
                      className={`absolute inset-x-0 bottom-0 h-px ${
                        isActive ? "bg-glow" : "bg-foreground/15"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          ) : null}

          <ol className="mt-6 divide-y divide-border/60 border-y border-border/60">
            {look.pieces.map((piece, index) => (
              <li
                key={`${look.key}-${piece.id}`}
                onMouseEnter={() => setHighlight(index)}
                onMouseLeave={() => setHighlight(null)}
                className="flex items-center gap-4 py-3.5"
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[0.68rem] font-medium tabular-nums transition ${
                    highlight === index || openSpot === index
                      ? "bg-foreground text-frost"
                      : "border border-border text-muted"
                  }`}
                >
                  {index + 1}
                </span>
                <LocaleLink
                  href={`/products/${piece.handle}`}
                  className="min-w-0 flex-1 truncate text-sm transition hover:text-accent"
                >
                  {piece.title}
                </LocaleLink>
                <span className="shrink-0 text-sm font-light tabular-nums text-muted">
                  {formatMoney(piece.priceRange.minVariantPrice, locale)}
                </span>
                <button
                  type="button"
                  onClick={() => setQuickProduct(piece)}
                  className="shrink-0 border border-border/80 px-3 py-1.5 text-[0.62rem] font-medium tracking-[0.12em] uppercase transition hover:border-foreground"
                >
                  {home.lookChoose}
                </button>
              </li>
            ))}
          </ol>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
            {total ? (
              <p className="text-sm">
                <span className="text-[0.68rem] font-medium tracking-[0.16em] uppercase text-muted">
                  {copy.total}
                </span>
                <span className="ml-3 font-display text-xl font-medium tabular-nums">
                  {formatMoney(total, locale)}
                </span>
              </p>
            ) : null}
            <LocaleLink
              href={look.href}
              className="text-[0.68rem] font-medium tracking-[0.14em] uppercase text-muted transition hover:text-foreground"
            >
              {look.label} →
            </LocaleLink>
          </div>

          {otherTheme && shared ? (
            <button
              type="button"
              onClick={() => {
                shared.setTheme(otherTheme);
                reset();
              }}
              className="mt-8 text-sm font-light text-muted underline decoration-border underline-offset-4 transition hover:text-foreground hover:decoration-foreground"
            >
              {copy.switchTo} →
            </button>
          ) : null}
        </div>
      </div>

      {quickProduct ? (
        <ProductQuickView
          product={quickProduct}
          open
          onClose={() => setQuickProduct(null)}
        />
      ) : null}
    </section>
  );
}
