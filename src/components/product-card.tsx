"use client";

import Image from "next/image";
import { useState, useTransition, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { addToCartAction } from "@/app/actions/cart";
import { useCart } from "@/components/cart-provider";
import { useDictionary } from "@/components/dictionary-provider";
import { LocaleLink } from "@/components/locale-link";
import { ProductQuickView } from "@/components/product-quick-view";
import { ProductRating } from "@/components/product-rating";
import { ProductPrice, SaleBadge } from "@/components/product-price";
import { metaContentIdFromGid, trackAddToCart } from "@/lib/meta-pixel";
import type { Product } from "@/lib/shopify/types";
import { hasSelectableOptions } from "@/lib/shopify/variants";

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const { dict } = useDictionary();
  const router = useRouter();
  const { openCart, setCart } = useCart();
  const [quickOpen, setQuickOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "error">("idle");

  const image = product.featuredImage;
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
      setQuickOpen(true);
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
    setQuickOpen(true);
  }

  const addLabel = isPending
    ? dict.products.adding
    : status === "error"
      ? dict.products.tryAgain
      : needsOptions
        ? dict.products.chooseOptions
        : dict.products.addToCart;

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

          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-2 p-3 opacity-100 transition duration-300 sm:p-3.5 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
            <div className="pointer-events-auto grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onQuickAdd}
                disabled={!canQuickAdd || isPending}
                className="bg-[color-mix(in_oklab,var(--frost)_92%,white)] px-2 py-2.5 text-[0.62rem] font-semibold tracking-[0.12em] uppercase text-foreground transition hover:bg-foreground hover:text-on-accent disabled:cursor-not-allowed disabled:opacity-45"
              >
                {canQuickAdd ? addLabel : dict.products.soldOut}
              </button>
              <button
                type="button"
                onClick={onQuickView}
                className="bg-[color-mix(in_oklab,var(--frost)_92%,white)] px-2 py-2.5 text-[0.62rem] font-semibold tracking-[0.12em] uppercase text-foreground transition hover:bg-foreground hover:text-on-accent"
              >
                {dict.products.quickView}
              </button>
            </div>
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
