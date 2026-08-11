"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addToCartAction } from "@/app/actions/cart";
import { formatMoney } from "@/lib/format";
import type { Product } from "@/lib/shopify/types";

type ProductQuickViewProps = {
  product: Product;
  open: boolean;
  onClose: () => void;
};

function hasSelectableOptions(product: Product) {
  return product.options.some(
    (option) =>
      !(option.name === "Title" && option.values.length === 1) &&
      option.values.some((value) => value !== "Default Title"),
  );
}

export function ProductQuickView({
  product,
  open,
  onClose,
}: ProductQuickViewProps) {
  const router = useRouter();
  const titleId = useId();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  const initialOptions = useMemo(() => {
    const firstAvailable =
      product.variants.find((variant) => variant.availableForSale) ??
      product.variants[0];

    return Object.fromEntries(
      (firstAvailable?.selectedOptions ?? []).map((option) => [
        option.name,
        option.value,
      ]),
    );
  }, [product.variants]);

  const [selectedOptions, setSelectedOptions] = useState(initialOptions);

  useEffect(() => {
    if (!open) return;
    setSelectedOptions(initialOptions);
    setQuantity(1);
    setError(null);
  }, [open, initialOptions]);

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const selectedVariant = useMemo(() => {
    return (
      product.variants.find((variant) =>
        variant.selectedOptions.every(
          (option) => selectedOptions[option.name] === option.value,
        ),
      ) ?? null
    );
  }, [product.variants, selectedOptions]);

  const image =
    selectedVariant?.image ?? product.featuredImage ?? product.images[0];
  const showOptions = hasSelectableOptions(product);

  function onAdd() {
    if (!selectedVariant?.availableForSale) return;
    setError(null);

    startTransition(async () => {
      try {
        const result = await addToCartAction(selectedVariant.id, quantity);
        if (!result?.ok) {
          setError("Could not add to bag.");
          return;
        }
        onClose();
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not add to bag.");
      }
    });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Close quick view"
        className="absolute inset-0 bg-[rgba(20,32,28,0.38)] backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[92svh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl bg-[color-mix(in_oklab,var(--frost)_96%,white)] shadow-[0_-8px_40px_rgba(20,32,28,0.12)] sm:rounded-2xl sm:shadow-[0_24px_80px_rgba(20,32,28,0.16)]"
      >
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4 sm:px-6">
          <p className="text-[0.68rem] font-medium tracking-[0.18em] uppercase text-blush">
            Quick view
          </p>
          <button
            type="button"
            onClick={onClose}
            className="text-[0.68rem] font-medium tracking-[0.14em] uppercase text-muted transition hover:text-foreground"
          >
            Close
          </button>
        </div>

        <div className="grid overflow-y-auto lg:grid-cols-2">
          <div className="relative aspect-[4/5] bg-mist lg:aspect-auto lg:min-h-[28rem]">
            {image ? (
              <Image
                src={image.url}
                alt={image.altText || product.title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 420px"
              />
            ) : null}
          </div>

          <div className="flex flex-col px-5 py-6 sm:px-7 sm:py-8">
            <h2
              id={titleId}
              className="font-display text-3xl font-medium tracking-tight sm:text-4xl"
            >
              {product.title}
            </h2>
            <p className="mt-3 font-display text-2xl font-medium tracking-tight">
              {selectedVariant
                ? formatMoney(selectedVariant.price)
                : formatMoney(product.priceRange.minVariantPrice)}
            </p>

            {showOptions
              ? product.options.map((option) => (
                  <fieldset key={option.id} className="mt-7 space-y-3">
                    <legend className="text-[0.68rem] font-medium tracking-[0.18em] uppercase text-muted">
                      {option.name}
                    </legend>
                    <div className="flex flex-wrap gap-2">
                      {option.values.map((value) => {
                        const active = selectedOptions[option.name] === value;
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() =>
                              setSelectedOptions((current) => ({
                                ...current,
                                [option.name]: value,
                              }))
                            }
                            className={`min-w-12 border px-3.5 py-2 text-sm transition ${
                              active
                                ? "border-foreground bg-foreground text-on-accent"
                                : "border-border/80 hover:border-foreground/50"
                            }`}
                          >
                            {value}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>
                ))
              : null}

            <div className="mt-7 space-y-3">
              <p className="text-[0.68rem] font-medium tracking-[0.18em] uppercase text-muted">
                Quantity
              </p>
              <div className="inline-flex items-center border border-border/80">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                  className="px-4 py-2.5 text-sm disabled:opacity-40"
                >
                  −
                </button>
                <span className="min-w-10 text-center text-sm tabular-nums">
                  {quantity}
                </span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  onClick={() => setQuantity((value) => value + 1)}
                  className="px-4 py-2.5 text-sm"
                >
                  +
                </button>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <button
                type="button"
                disabled={!selectedVariant?.availableForSale || isPending}
                onClick={onAdd}
                className="btn-primary btn-primary-block disabled:cursor-not-allowed disabled:opacity-45"
              >
                {!selectedVariant?.availableForSale
                  ? "Sold out"
                  : isPending
                    ? "Adding…"
                    : "Add to bag"}
              </button>
              <Link
                href={`/products/${product.handle}`}
                onClick={onClose}
                className="block text-center text-[0.68rem] font-medium tracking-[0.14em] uppercase text-muted transition hover:text-foreground"
              >
                View full details
              </Link>
            </div>

            {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export { hasSelectableOptions };
