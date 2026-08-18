"use client";

import Image from "next/image";
import { useEffect, useId, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addToCartAction } from "@/app/actions/cart";
import { useCart } from "@/components/cart-provider";
import { useDictionary } from "@/components/dictionary-provider";
import { LocaleLink } from "@/components/locale-link";
import { ProductOptionPicker } from "@/components/product-option-picker";
import { ProductPrice } from "@/components/product-price";
import { ProductRating } from "@/components/product-rating";
import { metaContentIdFromGid, trackAddToCart } from "@/lib/ads-events";
import type { Product } from "@/lib/shopify/types";
import { noteWelcomeDealProduct } from "@/lib/welcome-deal-intent";
import {
  findVariant,
  hasSelectableOptions,
  optionsFromVariant,
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
  const { dict } = useDictionary();
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
    noteWelcomeDealProduct(product.handle);
  }, [open, initialOptions, product.handle]);

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
        className="relative z-10 flex max-h-[92svh] w-full max-w-3xl flex-col overflow-hidden bg-[color-mix(in_oklab,var(--frost)_96%,white)] shadow-[0_-8px_40px_rgba(20,28,34,0.12)] sm:shadow-[0_24px_80px_rgba(20,28,34,0.16)]"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border/60 px-5 py-4 sm:px-6">
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

        <div className="flex min-h-0 flex-1 flex-col lg:grid lg:grid-cols-2">
          <div className="relative aspect-[4/5] max-h-[34vh] shrink-0 bg-mist lg:max-h-none lg:h-full lg:min-h-0 lg:aspect-auto">
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

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6 sm:px-7 sm:py-7">
              <h2
                id={titleId}
                className="font-display text-2xl font-medium tracking-tight sm:text-3xl"
              >
                {product.title}
              </h2>
              <div className="mt-2">
                <ProductRating
                  handle={product.handle}
                  href={`/products/${product.handle}#reviews`}
                  onClick={onClose}
                />
              </div>
              <div className="mt-2">
                <ProductPrice
                  handle={product.handle}
                  price={
                    selectedVariant?.price ??
                    product.priceRange.minVariantPrice
                  }
                  shopifyCompareAt={selectedVariant?.compareAtPrice}
                  size="md"
                  showBadge
                />
              </div>

              {showOptions
                ? product.options.map((option) => {
                    const values = option.values.filter(
                      (value) => value !== "Default Title",
                    );
                    if (
                      values.length === 0 ||
                      (option.name === "Title" && values.length === 1)
                    ) {
                      return null;
                    }

                    return (
                      <ProductOptionPicker
                        key={option.id}
                        option={option}
                        values={values}
                        selected={selectedOptions}
                        variants={product.variants}
                        onChange={setSelectedOptions}
                        size="sm"
                      />
                    );
                  })
                : null}

              {error ? (
                <p className="mt-4 text-sm text-red-700">{error}</p>
              ) : null}
            </div>

            <div className="shrink-0 border-t border-border/60 bg-[color-mix(in_oklab,var(--frost)_96%,white)] px-5 py-4 sm:px-7">
              <div className="mb-3 flex items-center justify-between gap-4">
                <p className="text-[0.68rem] font-medium tracking-[0.18em] uppercase text-muted">
                  {dict.products.quantity}
                </p>
                <div className="inline-flex items-center border border-border/80">
                  <button
                    type="button"
                    aria-label={dict.products.decreaseQty}
                    disabled={quantity <= 1}
                    onClick={() =>
                      setQuantity((value) => Math.max(1, value - 1))
                    }
                    className="px-4 py-2 text-sm disabled:opacity-40"
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
                    className="px-4 py-2 text-sm"
                  >
                    +
                  </button>
                </div>
              </div>
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
                className="mt-3 block text-center text-[0.68rem] font-medium tracking-[0.14em] uppercase text-muted transition hover:text-foreground"
              >
                {dict.products.viewFullDetails}
              </LocaleLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
