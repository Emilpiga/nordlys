"use client";

import NextImage from "next/image";
import Image from "@/components/soft-image";
import { useState, type MouseEvent } from "react";
import { useDictionary } from "@/components/dictionary-provider";
import { LocaleLink } from "@/components/locale-link";
import { ProductQuickView } from "@/components/product-quick-view";
import { ProductRating } from "@/components/product-rating";
import { ProductPrice, SaleBadge } from "@/components/product-price";
import { WishlistButton } from "@/components/wishlist-button";
import type { TractionBadge } from "@/lib/product-traction-types";
import type { Product } from "@/lib/shopify/types";

type ProductCardProps = {
  product: Product;
  wishlistSaved?: boolean;
  tractionBadge?: TractionBadge;
};

export function ProductCard({
  product,
  wishlistSaved = false,
  tractionBadge,
}: ProductCardProps) {
  const { dict } = useDictionary();
  const [quickOpen, setQuickOpen] = useState(false);
  // The alternate photo loads on first hover, not with every card.
  const [hovered, setHovered] = useState(false);
  const [altReady, setAltReady] = useState(false);

  const image = product.featuredImage;
  const altImage = image
    ? product.images.find(
        (candidate) =>
          candidate.url.split("?")[0] !== image.url.split("?")[0],
      )
    : undefined;
  const defaultVariant =
    product.variants.find((variant) => variant.availableForSale) ??
    product.variants[0];

  const tractionLabel =
    tractionBadge === "bestseller"
      ? dict.products.badgeBestseller
      : tractionBadge === "trending"
        ? dict.products.badgeTrending
        : tractionBadge === "in_demand"
          ? dict.products.badgeInDemand
          : tractionBadge === "popular"
            ? dict.products.badgePopular
            : null;

  function onQuickView(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    setQuickOpen(true);
  }

  return (
    <>
      <article
        className="group"
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse") setHovered(true);
        }}
      >
        <div className="relative aspect-[4/5] overflow-hidden bg-mist">
          <LocaleLink
            href={`/products/${product.handle}`}
            className="absolute inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label={product.title}
          >
            {image ? (
              <Image
                src={image.url}
                alt={image.altText || product.title}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition duration-[900ms] ease-out group-hover:scale-[1.035]"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted">
                {dict.products.noImage}
              </div>
            )}
            {altImage && hovered ? (
              <NextImage
                src={altImage.url}
                alt=""
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                onLoad={() => setAltReady(true)}
                className={`object-cover opacity-0 transition duration-[900ms] ease-out group-hover:scale-[1.035] ${
                  altReady ? "group-hover:opacity-100" : ""
                }`}
              />
            ) : null}
          </LocaleLink>

          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-[rgba(20,32,28,0.06)]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(238,242,244,0.18)_0%,transparent_24%,transparent_55%,rgba(20,32,28,0.28)_100%)]"
          />

          {tractionLabel ? (
            <span className="pointer-events-none absolute left-2 top-2 z-10 bg-[color-mix(in_oklab,var(--frost)_94%,white)] px-2 py-1 text-[0.58rem] font-semibold tracking-[0.12em] uppercase text-foreground shadow-sm sm:left-2.5 sm:top-2.5 sm:px-2.5 sm:text-[0.62rem] sm:tracking-[0.14em]">
              {tractionLabel}
            </span>
          ) : null}

          <SaleBadge
            handle={product.handle}
            price={product.priceRange.minVariantPrice}
            shopifyCompareAt={defaultVariant?.compareAtPrice}
            size="sm"
            offsetForTraction={Boolean(tractionLabel)}
          />

          <div className="absolute right-2 top-2 z-20 flex flex-col gap-1.5 pointer-events-auto">
            <WishlistButton
              productId={product.id}
              initialSaved={wishlistSaved}
              className="bg-[color-mix(in_oklab,var(--frost)_92%,white)] text-foreground"
            />
            <button
              type="button"
              onClick={onQuickView}
              aria-label={dict.products.quickView}
              // Desktop only: on a phone the card is too small for two
              // buttons, and tapping through to the product is quicker.
              className="group/qv relative hidden h-9 w-9 md:inline-flex items-center justify-center bg-[color-mix(in_oklab,var(--frost)_92%,white)] text-foreground shadow-sm transition hover:text-accent"
            >
              <EyeIcon />
              <span className="pointer-events-none absolute right-full top-1/2 mr-2 hidden -translate-y-1/2 whitespace-nowrap bg-foreground px-2 py-1 text-[0.62rem] font-medium tracking-[0.12em] uppercase text-on-accent opacity-0 transition group-hover/qv:opacity-100 md:block">
                {dict.products.quickView}
              </span>
            </button>
          </div>
        </div>

        <LocaleLink
          href={`/products/${product.handle}`}
          className="mt-3 flex flex-col gap-1 px-0.5 focus-visible:outline-none sm:mt-4"
        >
          <h3 className="line-clamp-2 font-display text-base font-medium leading-snug tracking-tight transition group-hover:text-accent sm:text-lg md:text-xl md:leading-tight">
            {product.title}
          </h3>
          <ProductRating handle={product.handle} />
          <ProductPrice
            handle={product.handle}
            price={product.priceRange.minVariantPrice}
            shopifyCompareAt={defaultVariant?.compareAtPrice}
          />
        </LocaleLink>
      </article>

      <ProductQuickView
        product={product}
        open={quickOpen}
        onClose={() => setQuickOpen(false)}
      />
    </>
  );
}

function EyeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.6 12s3.4-6.4 9.4-6.4 9.4 6.4 9.4 6.4-3.4 6.4-9.4 6.4S2.6 12 2.6 12Z"
      />
      <circle cx="12" cy="12" r="2.6" />
    </svg>
  );
}
