"use client";

import Image from "next/image";
import { useState, useTransition, type CSSProperties, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { addToCartAction } from "@/app/actions/cart";
import { useCart } from "@/components/cart-provider";
import { useDictionary } from "@/components/dictionary-provider";
import { LocaleLink } from "@/components/locale-link";
import { SaleBadge } from "@/components/product-price";
import { metaContentIdFromGid, trackAddToCart } from "@/lib/meta-pixel";
import type { Product } from "@/lib/shopify/types";
import { hasSelectableOptions } from "@/lib/shopify/variants";

export type HeroMosaicMotion = "enter" | "swap" | "exit";

type HeroMosaicTileProps = {
  product: Product;
  imageUrl: string;
  imageAlt: string;
  index: number;
  motion?: HeroMosaicMotion;
  onOpenQuickView: (product: Product) => void;
};

const motionClassName: Record<HeroMosaicMotion, string> = {
  enter: "animate-mosaic-tile",
  swap: "animate-mosaic-tile-swap",
  exit: "animate-mosaic-tile-out",
};

export function HeroMosaicTile({
  product,
  imageUrl,
  imageAlt,
  index,
  motion = "enter",
  onOpenQuickView,
}: HeroMosaicTileProps) {
  const { dict } = useDictionary();
  const router = useRouter();
  const { openCart, setCart } = useCart();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "error">("idle");

  const defaultVariant =
    product.variants.find((variant) => variant.availableForSale) ??
    product.variants[0];
  const needsOptions = hasSelectableOptions(product);
  const canQuickAdd = Boolean(defaultVariant?.availableForSale);

  function onQuickAdd(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    if (!canQuickAdd) return;

    if (needsOptions) {
      onOpenQuickView(product);
      return;
    }

    setStatus("idle");
    startTransition(async () => {
      try {
        const result = await addToCartAction(defaultVariant!.id, 1);
        if (!result?.ok) {
          setStatus("error");
          return;
        }
        trackAddToCart({
          contentIds: [metaContentIdFromGid(defaultVariant!.id)],
          contentName: product.title,
          contentType: "product",
          value: Number(defaultVariant!.price.amount),
          currency: defaultVariant!.price.currencyCode,
          numItems: 1,
        });
        setCart(result.cart);
        openCart();
        router.refresh();
      } catch {
        setStatus("error");
      }
    });
  }

  function onQuickView(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    onOpenQuickView(product);
  }

  const addLabel = isPending
    ? dict.products.adding
    : status === "error"
      ? dict.products.tryAgain
      : needsOptions
        ? dict.products.chooseOptions
        : dict.products.addToCart;

  return (
    <div
      className={`group/tile relative h-full min-h-0 min-w-0 overflow-hidden ${motionClassName[motion]} ${motion === "exit" ? "pointer-events-none" : ""}`}
      style={
        {
          "--mosaic-delay": motion === "enter" ? `${180 + index * 55}ms` : "0ms",
        } as CSSProperties
      }
    >
      <LocaleLink
        href={`/products/${product.handle}`}
        className="absolute inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
        aria-label={product.title}
      >
        <Image
          src={imageUrl}
          alt={imageAlt || product.title}
          fill
          priority={motion === "enter" && index < 8}
          className="object-cover object-center transition duration-[900ms] ease-out group-hover/tile:scale-[1.04]"
          sizes="(max-width: 768px) 33vw, 18vw"
        />
      </LocaleLink>

      <SaleBadge
        handle={product.handle}
        price={product.priceRange.minVariantPrice}
        shopifyCompareAt={defaultVariant?.compareAtPrice}
        size="sm"
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_42%,rgba(20,32,28,0.42)_100%)] opacity-100 transition duration-300 sm:opacity-0 sm:group-hover/tile:opacity-100 sm:group-focus-within/tile:opacity-100"
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-1.5 opacity-100 transition duration-300 sm:p-2 sm:opacity-0 sm:group-hover/tile:opacity-100 sm:group-focus-within/tile:opacity-100">
        <div className="pointer-events-auto grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={onQuickAdd}
            disabled={!canQuickAdd || isPending}
            className="truncate bg-[color-mix(in_oklab,var(--frost)_92%,white)] px-1 py-1.5 text-[0.52rem] font-semibold tracking-[0.08em] uppercase text-foreground transition hover:bg-foreground hover:text-on-accent disabled:cursor-not-allowed disabled:opacity-45 sm:py-2 sm:text-[0.58rem]"
          >
            {canQuickAdd ? addLabel : dict.products.soldOut}
          </button>
          <button
            type="button"
            onClick={onQuickView}
            className="truncate bg-[color-mix(in_oklab,var(--frost)_92%,white)] px-1 py-1.5 text-[0.52rem] font-semibold tracking-[0.08em] uppercase text-foreground transition hover:bg-foreground hover:text-on-accent sm:py-2 sm:text-[0.58rem]"
          >
            {dict.products.quickView}
          </button>
        </div>
      </div>
    </div>
  );
}
