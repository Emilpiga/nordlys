"use client";

import Image from "next/image";
import { useState, type MouseEvent } from "react";
import { useDictionary } from "@/components/dictionary-provider";
import { LocaleLink } from "@/components/locale-link";
import { ProductQuickView } from "@/components/product-quick-view";
import { ProductRating } from "@/components/product-rating";
import { ProductPrice, SaleBadge } from "@/components/product-price";
import { WishlistButton } from "@/components/wishlist-button";
import type { Product } from "@/lib/shopify/types";

type ProductCardProps = {
  product: Product;
  wishlistSaved?: boolean;
};

export function ProductCard({
  product,
  wishlistSaved = false,
}: ProductCardProps) {
  const { dict } = useDictionary();
  const [quickOpen, setQuickOpen] = useState(false);

  const image = product.featuredImage;
  const defaultVariant =
    product.variants.find((variant) => variant.availableForSale) ??
    product.variants[0];

  function onQuickView(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    setQuickOpen(true);
  }

  return (
    <>
      <article className="group">
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
          </LocaleLink>

          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-[rgba(20,32,28,0.06)]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(238,242,244,0.18)_0%,transparent_24%,transparent_55%,rgba(20,32,28,0.28)_100%)]"
          />

          <SaleBadge
            handle={product.handle}
            price={product.priceRange.minVariantPrice}
            shopifyCompareAt={defaultVariant?.compareAtPrice}
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
              className="group/qv relative inline-flex h-9 w-9 items-center justify-center bg-[color-mix(in_oklab,var(--frost)_92%,white)] text-foreground shadow-sm transition hover:text-accent"
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
          className="mt-4 flex flex-col gap-1 px-0.5 focus-visible:outline-none"
        >
          <h3 className="font-display text-xl font-medium leading-tight tracking-tight transition group-hover:text-accent">
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
