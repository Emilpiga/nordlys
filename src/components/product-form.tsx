"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addToCartAction } from "@/app/actions/cart";
import { formatMoney } from "@/lib/format";
import type { Product } from "@/lib/shopify/types";

type ProductFormProps = {
  product: Product;
};

export function ProductForm({ product }: ProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);

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

  const selectedVariant = useMemo(() => {
    return (
      product.variants.find((variant) =>
        variant.selectedOptions.every(
          (option) => selectedOptions[option.name] === option.value,
        ),
      ) ?? null
    );
  }, [product.variants, selectedOptions]);

  function onAddToCart() {
    if (!selectedVariant) return;
    setError(null);

    startTransition(async () => {
      try {
        await addToCartAction(selectedVariant.id, quantity);
        router.push("/cart");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not add to cart.");
      }
    });
  }

  const showOptions = product.options.some(
    (option) =>
      !(option.name === "Title" && option.values.length === 1) &&
      option.values.some((value) => value !== "Default Title"),
  );

  const compareAt = selectedVariant?.compareAtPrice;
  const showCompare =
    compareAt &&
    selectedVariant &&
    Number(compareAt.amount) > Number(selectedVariant.price.amount);

  return (
    <div className="space-y-8">
      <div className="flex items-baseline gap-3">
        <p className="font-display text-4xl font-medium tracking-tight">
          {selectedVariant
            ? formatMoney(selectedVariant.price)
            : formatMoney(product.priceRange.minVariantPrice)}
        </p>
        {showCompare && compareAt ? (
          <p className="text-base font-light text-muted line-through">
            {formatMoney(compareAt)}
          </p>
        ) : null}
      </div>

      {showOptions
        ? product.options.map((option) => (
            <fieldset key={option.id} className="space-y-3">
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
                      className={`min-w-12 border px-4 py-2.5 text-sm transition ${
                        active
                          ? "border-foreground bg-foreground text-on-accent"
                          : "border-border/80 bg-transparent text-foreground hover:border-foreground/50"
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

      <div className="space-y-3">
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

      <div className="space-y-3">
        <button
          type="button"
          disabled={!selectedVariant?.availableForSale || isPending}
          onClick={onAddToCart}
          className="btn-primary btn-primary-block w-full disabled:cursor-not-allowed disabled:opacity-45"
        >
          {!selectedVariant?.availableForSale
            ? "Sold out"
            : isPending
              ? "Adding…"
              : "Add to bag"}
        </button>
        <p className="text-center text-xs font-light leading-relaxed text-muted">
          Secure checkout · Tracking on every order
        </p>
      </div>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
