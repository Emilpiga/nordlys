"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { addToCartAction } from "@/app/actions/cart";
import {
  ProductQuickView,
  hasSelectableOptions,
} from "@/components/product-quick-view";
import { formatMoney } from "@/lib/format";
import type { Product } from "@/lib/shopify/types";

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const [quickOpen, setQuickOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "added" | "error">("idle");

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
        setStatus("added");
        router.refresh();
        window.setTimeout(() => setStatus("idle"), 1600);
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
    ? "Adding…"
    : status === "added"
      ? "Added"
      : status === "error"
        ? "Try again"
        : needsOptions
          ? "Choose options"
          : "Add to bag";

  return (
    <>
      <article className="group">
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-mist">
          <Link
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
                No image
              </div>
            )}
          </Link>

          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-[rgba(20,32,28,0.06)]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-2xl bg-[linear-gradient(180deg,rgba(238,242,244,0.18)_0%,transparent_24%,transparent_55%,rgba(20,32,28,0.28)_100%)]"
          />

          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-2 p-3 opacity-100 transition duration-300 sm:p-3.5 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
            <div className="pointer-events-auto grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onQuickAdd}
                disabled={!canQuickAdd || isPending}
                className="bg-[color-mix(in_oklab,var(--frost)_92%,white)] px-2 py-2.5 text-[0.62rem] font-semibold tracking-[0.12em] uppercase text-foreground transition hover:bg-foreground hover:text-on-accent disabled:cursor-not-allowed disabled:opacity-45"
              >
                {canQuickAdd ? addLabel : "Sold out"}
              </button>
              <button
                type="button"
                onClick={onQuickView}
                className="bg-[color-mix(in_oklab,var(--frost)_92%,white)] px-2 py-2.5 text-[0.62rem] font-semibold tracking-[0.12em] uppercase text-foreground transition hover:bg-foreground hover:text-on-accent"
              >
                Quick view
              </button>
            </div>
          </div>
        </div>

        <Link
          href={`/products/${product.handle}`}
          className="mt-4 block space-y-1 px-0.5 focus-visible:outline-none"
        >
          <h3 className="font-display text-xl font-medium leading-tight tracking-tight transition group-hover:text-accent">
            {product.title}
          </h3>
          <p className="text-sm font-light text-muted">
            {formatMoney(product.priceRange.minVariantPrice)}
          </p>
        </Link>
      </article>

      <ProductQuickView
        product={product}
        open={quickOpen}
        onClose={() => setQuickOpen(false)}
      />
    </>
  );
}
