"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { HeroMosaicTile } from "@/components/hero-mosaic-tile";
import { useDictionary } from "@/components/dictionary-provider";
import { LocaleLink } from "@/components/locale-link";
import { SiteWordmark } from "@/components/site-wordmark";
import { ProductQuickView } from "@/components/product-quick-view";
import { HERO_MOSAIC_TILE_COUNT } from "@/lib/home-mosaic";
import { shopifyConfig } from "@/lib/shopify/config";
import type { Product } from "@/lib/shopify/types";

export type HeroMosaicImage = {
  url: string;
  alt: string;
  product: Product;
};

export { HERO_MOSAIC_TILE_COUNT };

type HomeHeroProps = {
  storeName?: string;
  mosaicImages?: HeroMosaicImage[];
  headline?: string;
  sub?: string;
  cta?: string;
  alt?: string;
  ctaHref?: string;
};

export function HomeHero({
  storeName = shopifyConfig.storeName,
  mosaicImages = [],
  headline,
  sub,
  cta,
  alt,
  ctaHref = "#categories",
}: HomeHeroProps) {
  const { dict, t } = useDictionary();
  const [quickProduct, setQuickProduct] = useState<Product | null>(null);

  const resolvedAlt =
    alt ?? t(dict.home.heroAlt, { brand: storeName });
  const resolvedHeadline = headline ?? dict.home.heroHeadline;
  const resolvedSub = sub ?? dict.home.heroSub;
  const resolvedCta = cta ?? dict.home.heroCta;

  const ctaClassName = "btn-primary";
  const isHashCta = ctaHref.startsWith("#");
  const tiles = mosaicImages.slice(0, HERO_MOSAIC_TILE_COUNT);
  const hasMosaic = tiles.length > 0;

  return (
    <section
      className="relative flex min-h-[calc(100svh-var(--header-height))] flex-col overflow-hidden md:flex-row"
      aria-label={resolvedAlt}
    >
      <div className="relative z-10 flex w-full shrink-0 flex-col justify-center border-b border-border/70 bg-frost px-5 pb-14 pt-14 sm:px-8 md:min-h-[calc(100svh-var(--header-height))] md:w-[var(--rail-width)] md:border-b-0 md:border-r md:pb-16">
        <div className="mx-auto w-full max-w-md md:mx-0">
          <div className="animate-rise">
            <SiteWordmark size="display" />
          </div>

          <h1 className="animate-rise delay-1 mt-8 font-display text-[1.85rem] font-medium leading-[1.15] tracking-tight text-foreground sm:mt-10 sm:text-[2.15rem]">
            {resolvedHeadline}
          </h1>

          <p className="animate-rise delay-2 mt-5 max-w-sm text-base font-light leading-relaxed text-muted">
            {resolvedSub}
          </p>

          <div className="animate-rise delay-3 mt-10">
            {isHashCta ? (
              <a href={ctaHref} className={ctaClassName}>
                {resolvedCta}
              </a>
            ) : ctaHref.startsWith("/") ? (
              <LocaleLink href={ctaHref} className={ctaClassName}>
                {resolvedCta}
              </LocaleLink>
            ) : (
              <Link href={ctaHref} className={ctaClassName}>
                {resolvedCta}
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="relative min-h-[70svh] flex-1 md:min-h-[calc(100svh-var(--header-height))]">
        {hasMosaic ? (
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-4 gap-[2px] bg-mist sm:grid-cols-4 sm:grid-rows-3 md:gap-[3px]">
            {tiles.slice(0, 12).map((image, index) => (
              <HeroMosaicTile
                key={`${image.product.id}-${image.url}-${index}`}
                product={image.product}
                imageUrl={image.url}
                imageAlt={image.alt}
                index={index}
                onOpenQuickView={setQuickProduct}
              />
            ))}
          </div>
        ) : (
          <Image
            src="/hero-lighting.png"
            alt=""
            fill
            priority
            className="animate-soft-zoom object-cover object-[72%_center] sm:object-[60%_40%]"
            sizes="(max-width: 768px) 100vw, 54vw"
          />
        )}
      </div>

      {quickProduct ? (
        <ProductQuickView
          key={quickProduct.id}
          product={quickProduct}
          open
          onClose={() => setQuickProduct(null)}
        />
      ) : null}
    </section>
  );
}
