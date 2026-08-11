"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { addToCartAction } from "@/app/actions/cart";
import { formatMoney } from "@/lib/format";
import { metaContentIdFromGid, trackAddToCart } from "@/lib/meta-pixel";
import type { Product, ProductVariant } from "@/lib/shopify/types";
import {
  findVariant,
  hasSelectableOptions,
  isOptionValueAvailable,
  optionsFromVariant,
  selectOptionValue,
} from "@/lib/shopify/variants";

type ProductFormProps = {
  product: Product;
  onVariantChange?: (variant: ProductVariant | null) => void;
};

export function ProductForm({ product, onVariantChange }: ProductFormProps) {
  const [isPending, startTransition] = useTransition();
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const initialOptions = useMemo(() => {
    const firstAvailable =
      product.variants.find((variant) => variant.availableForSale) ??
      product.variants[0];
    return optionsFromVariant(firstAvailable);
  }, [product.variants]);

  const [selectedOptions, setSelectedOptions] = useState(initialOptions);

  const selectedVariant = useMemo(
    () => findVariant(product.variants, selectedOptions),
    [product.variants, selectedOptions],
  );

  useEffect(() => {
    onVariantChange?.(selectedVariant);
  }, [selectedVariant, onVariantChange]);

  function onAddToCart() {
    if (!selectedVariant) return;
    setError(null);

    startTransition(async () => {
      try {
        const result = await addToCartAction(selectedVariant.id, quantity);
        if (!result?.ok) {
          setError("Kunde inte lägga till i kassen.");
          return;
        }
        trackAddToCart({
          contentIds: [metaContentIdFromGid(selectedVariant.id)],
          contentName: product.title,
          contentType: "product",
          value: Number(selectedVariant.price.amount) * quantity,
          currency: selectedVariant.price.currencyCode,
          numItems: quantity,
        });
        window.location.assign("/cart");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Kunde inte lägga till i kassen.",
        );
      }
    });
  }

  const showOptions = hasSelectableOptions(product);

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
        ? product.options.map((option) => {
            if (
              option.name === "Title" &&
              option.values.length === 1 &&
              option.values[0] === "Default Title"
            ) {
              return null;
            }

            return (
              <fieldset key={option.id} className="space-y-3">
                <legend className="text-[0.68rem] font-medium tracking-[0.18em] uppercase text-muted">
                  {option.name}
                  {selectedOptions[option.name] ? (
                    <span className="ml-2 font-normal normal-case tracking-normal text-foreground/70">
                      {selectedOptions[option.name]}
                    </span>
                  ) : null}
                </legend>
                <div className="flex flex-wrap gap-2">
                  {option.values.map((value) => {
                    if (value === "Default Title") return null;
                    const active = selectedOptions[option.name] === value;
                    const available = isOptionValueAvailable(
                      product.variants,
                      option.name,
                      value,
                      selectedOptions,
                    );
                    return (
                      <button
                        key={value}
                        type="button"
                        disabled={!available && !active}
                        aria-pressed={active}
                        onClick={() =>
                          setSelectedOptions((current) =>
                            selectOptionValue(
                              product.variants,
                              current,
                              option.name,
                              value,
                            ),
                          )
                        }
                        className={`min-w-12 border px-4 py-2.5 text-sm transition ${
                          active
                            ? "border-foreground bg-foreground text-on-accent"
                            : available
                              ? "border-border/80 bg-transparent text-foreground hover:border-foreground/50"
                              : "cursor-not-allowed border-border/50 text-muted/55 line-through opacity-55"
                        }`}
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            );
          })
        : null}

      <div className="space-y-3">
        <p className="text-[0.68rem] font-medium tracking-[0.18em] uppercase text-muted">
          Antal
        </p>
        <div className="inline-flex items-center border border-border/80">
          <button
            type="button"
            aria-label="Minska antal"
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
            aria-label="Öka antal"
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
            ? "Slutsåld"
            : isPending
              ? "Lägger till…"
              : "Lägg i kassen"}
        </button>
        <p className="text-center text-xs font-light leading-relaxed text-muted">
          Säker kassa · Spårning på varje order
        </p>
      </div>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
