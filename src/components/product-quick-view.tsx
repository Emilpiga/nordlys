"use client";

import Image from "next/image";
import { useEffect, useId, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addToCartAction } from "@/app/actions/cart";
import { useCart } from "@/components/cart-provider";
import { useDictionary } from "@/components/dictionary-provider";
import { LocaleLink } from "@/components/locale-link";
import { formatMoney } from "@/lib/format";
import { metaContentIdFromGid, trackAddToCart } from "@/lib/meta-pixel";
import type { Product } from "@/lib/shopify/types";
import {
  findVariant,
  hasSelectableOptions,
  isOptionValueAvailable,
  optionsFromVariant,
  selectOptionValue,
} from "@/lib/shopify/variants";

type ProductQuickViewProps = {
  product: Product;
  open: boolean;
  onClose: () => void;
};

export function ProductQuickView({
  product,
  open,
  onClose,
}: ProductQuickViewProps) {
  const { locale, dict } = useDictionary();
  const router = useRouter();
  const { openCart, setCart } = useCart();
  const titleId = useId();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  const initialOptions = useMemo(() => {
    const firstAvailable =
      product.variants.find((variant) => variant.availableForSale) ??
      product.variants[0];
    return optionsFromVariant(firstAvailable);
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

  const selectedVariant = useMemo(
    () => findVariant(product.variants, selectedOptions),
    [product.variants, selectedOptions],
  );

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
          setError(dict.products.addError);
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
        setCart(result.cart);
        onClose();
        openCart();
        router.refresh();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : dict.products.addError,
        );
      }
    });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <button
        type="button"
        aria-label={dict.products.closeQuickView}
        className="absolute inset-0 bg-[rgba(20,28,34,0.38)] backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[92svh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl bg-[color-mix(in_oklab,var(--frost)_96%,white)] shadow-[0_-8px_40px_rgba(20,28,34,0.12)] sm:rounded-2xl sm:shadow-[0_24px_80px_rgba(20,28,34,0.16)]"
      >
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4 sm:px-6">
          <p className="text-[0.68rem] font-medium tracking-[0.18em] uppercase text-glow">
            {dict.products.quickView}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="text-[0.68rem] font-medium tracking-[0.14em] uppercase text-muted transition hover:text-foreground"
          >
            {dict.products.close}
          </button>
        </div>

        <div className="grid overflow-y-auto lg:grid-cols-2">
          <div className="relative aspect-[4/5] bg-mist lg:aspect-auto lg:min-h-[28rem]">
            {image ? (
              <Image
                key={image.url}
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
                ? formatMoney(selectedVariant.price, locale)
                : formatMoney(product.priceRange.minVariantPrice, locale)}
            </p>

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
                    <fieldset key={option.id} className="mt-7 space-y-3">
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
                              className={`min-w-12 border px-3.5 py-2 text-sm transition ${
                                active
                                  ? "border-foreground bg-foreground text-on-accent"
                                  : available
                                    ? "border-border/80 hover:border-foreground/50"
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

            <div className="mt-7 space-y-3">
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

            <div className="mt-8 space-y-3">
              <button
                type="button"
                disabled={!selectedVariant?.availableForSale || isPending}
                onClick={onAdd}
                className="btn-primary btn-primary-block disabled:cursor-not-allowed disabled:opacity-45"
              >
                {!selectedVariant?.availableForSale
                  ? dict.products.soldOut
                  : isPending
                    ? dict.products.adding
                    : dict.products.addToCart}
              </button>
              <LocaleLink
                href={`/products/${product.handle}`}
                onClick={onClose}
                className="block text-center text-[0.68rem] font-medium tracking-[0.14em] uppercase text-muted transition hover:text-foreground"
              >
                {dict.products.viewFullDetails}
              </LocaleLink>
            </div>

            {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
