"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addToCartAction } from "@/app/actions/cart";
import { useCart } from "@/components/cart-provider";
import { useDictionary } from "@/components/dictionary-provider";
import { ProductTrust } from "@/components/product-trust";
import { formatMoney } from "@/lib/format";
import {
  metaContentIdFromGid,
  trackAddToCart,
  trackInitiateCheckout,
} from "@/lib/meta-pixel";
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

type PendingMode = "add" | "buy" | null;

export function ProductForm({ product, onVariantChange }: ProductFormProps) {
  const { locale, dict, t } = useDictionary();
  const router = useRouter();
  const { openCart, setCart } = useCart();
  const [isPending, startTransition] = useTransition();
  const [pendingMode, setPendingMode] = useState<PendingMode>(null);
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

  function trackCartPixel(variant: ProductVariant, qty: number) {
    trackAddToCart({
      contentIds: [metaContentIdFromGid(variant.id)],
      contentName: product.title,
      contentType: "product",
      value: Number(variant.price.amount) * qty,
      currency: variant.price.currencyCode,
      numItems: qty,
    });
  }

  function onAddToCart() {
    if (!selectedVariant) return;
    setError(null);
    setPendingMode("add");

    startTransition(async () => {
      try {
        const result = await addToCartAction(selectedVariant.id, quantity);
        if (!result?.ok) {
          setError(dict.products.addError);
          setPendingMode(null);
          return;
        }
        trackCartPixel(selectedVariant, quantity);
        setCart(result.cart);
        openCart();
        setPendingMode(null);
        router.refresh();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : dict.products.addError,
        );
        setPendingMode(null);
      }
    });
  }

  function onBuyNow() {
    if (!selectedVariant) return;
    setError(null);
    setPendingMode("buy");

    startTransition(async () => {
      try {
        const result = await addToCartAction(selectedVariant.id, quantity);
        if (!result?.ok || !result.cart.checkoutUrl) {
          setError(dict.products.checkoutError);
          setPendingMode(null);
          return;
        }
        trackCartPixel(selectedVariant, quantity);
        trackInitiateCheckout({
          contentIds: [metaContentIdFromGid(selectedVariant.id)],
          contentName: product.title,
          contentType: "product",
          value: Number(selectedVariant.price.amount) * quantity,
          currency: selectedVariant.price.currencyCode,
          numItems: quantity,
        });
        window.location.assign(result.cart.checkoutUrl);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : dict.products.checkoutError,
        );
        setPendingMode(null);
      }
    });
  }

  const showOptions = hasSelectableOptions(product);

  const compareAt = selectedVariant?.compareAtPrice;
  const showCompare =
    compareAt &&
    selectedVariant &&
    Number(compareAt.amount) > Number(selectedVariant.price.amount);

  const soldOut = !selectedVariant?.availableForSale;
  const busy = isPending || pendingMode !== null;

  return (
    <div className="space-y-8">
      <div className="flex items-baseline gap-3">
        <p className="font-display text-4xl font-medium tracking-tight">
          {selectedVariant
            ? formatMoney(selectedVariant.price, locale)
            : formatMoney(product.priceRange.minVariantPrice, locale)}
        </p>
        {showCompare && compareAt ? (
          <p className="text-base font-light text-muted line-through">
            {formatMoney(compareAt, locale)}
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
          {dict.products.quantity}
        </p>
        <div className="inline-flex items-center border border-border/80">
          <button
            type="button"
            aria-label={dict.products.decreaseQty}
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
            aria-label={dict.products.increaseQty}
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
          disabled={soldOut || busy}
          onClick={onBuyNow}
          className="btn-primary btn-primary-block disabled:cursor-not-allowed disabled:opacity-45"
        >
          {soldOut
            ? dict.products.soldOut
            : pendingMode === "buy"
              ? dict.products.openingCheckout
              : dict.products.buyNow}
        </button>
        <button
          type="button"
          disabled={soldOut || busy}
          onClick={onAddToCart}
          className="btn-secondary btn-primary-block disabled:cursor-not-allowed disabled:opacity-45"
        >
          {pendingMode === "add"
            ? dict.products.adding
            : dict.products.addToCart}
        </button>
        <p className="text-center text-xs font-light leading-relaxed text-muted">
          {t(dict.products.secureEta, {
            secure: dict.fulfillment.secureCheckout,
            processing: dict.fulfillment.processingShort,
          })}
        </p>
      </div>

      <ProductTrust />

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
