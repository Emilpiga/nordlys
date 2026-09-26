"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { addToCartAction, buyNowAction } from "@/app/actions/cart";
import { useCart } from "@/components/cart-provider";
import { useDictionary } from "@/components/dictionary-provider";
import { ProductOptionPicker } from "@/components/product-option-picker";
import { isApparel } from "@/lib/size-guide";
import { ProductTrust } from "@/components/product-trust";
import { ProductViewingActivity } from "@/components/product-viewing-activity";
import { ProductPrice } from "@/components/product-price";
import { WishlistButton } from "@/components/wishlist-button";
import {
  metaContentIdFromGid,
  trackAddToCart,
  trackInitiateCheckout,
} from "@/lib/ads-events";
import { decorateCheckoutUrl } from "@/lib/ads-linker";
import { formatMoney } from "@/lib/format";
import { getPostHogIds } from "@/lib/posthog";
import type { Product, ProductVariant } from "@/lib/shopify/types";
import {
  findVariant,
  findVariantByParam,
  hasSelectableOptions,
  optionsFromVariant,
} from "@/lib/shopify/variants";

type ProductFormProps = {
  product: Product;
  initialVariantId?: string;
  onVariantChange?: (variant: ProductVariant | null) => void;
  /** Bumped when the shopper picks a gallery photo that may belong to a variant. */
  wishlistSaved?: boolean;
};

type PendingMode = "add" | "buy" | null;

function subscribeNever() {
  return () => {};
}

export function ProductForm({
  product,
  initialVariantId,
  onVariantChange,
  wishlistSaved = false,
}: ProductFormProps) {
  const { dict, locale } = useDictionary();
  const router = useRouter();
  const { openCart, setCart } = useCart();
  const [isPending, startTransition] = useTransition();
  const [pendingMode, setPendingMode] = useState<PendingMode>(null);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const initialOptions = useMemo(() => {
    const fromUrl = findVariantByParam(product.variants, initialVariantId);
    const firstAvailable =
      fromUrl ??
      product.variants.find((variant) => variant.availableForSale) ??
      product.variants[0];
    return optionsFromVariant(firstAvailable);
  }, [initialVariantId, product.variants]);

  const [selectedOptions, setSelectedOptions] = useState(initialOptions);

  // Mobile buy bar: shown once the real buttons have scrolled up out of view.
  const buttonsRef = useRef<HTMLDivElement>(null);
  const [barVisible, setBarVisible] = useState(false);
  useEffect(() => {
    const buttons = buttonsRef.current;
    if (!buttons) return;
    const observer = new IntersectionObserver(([entry]) => {
      setBarVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    observer.observe(buttons);
    return () => observer.disconnect();
  }, []);

  // The bar renders into <body>: the product column animates in with a
  // transform, which would pin a fixed child to the column, not the screen.
  const isClient = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );

  // Room under the footer so the bar never covers the last line of the page.
  useEffect(() => {
    document.documentElement.classList.toggle("has-buy-bar", barVisible);
    return () => document.documentElement.classList.remove("has-buy-bar");
  }, [barVisible]);

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
        const result = await buyNowAction(
          selectedVariant.id,
          quantity,
          getPostHogIds(),
        );
        if (!result.ok) {
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
        window.location.assign(decorateCheckoutUrl(result.checkoutUrl));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : dict.products.checkoutError,
        );
        setPendingMode(null);
      }
    });
  }

  const showOptions = hasSelectableOptions(product);
  const soldOut = !selectedVariant?.availableForSale;
  const busy = isPending || pendingMode !== null;

  return (
    <div className="space-y-6 lg:space-y-8">
      <ProductPrice
        handle={product.handle}
        price={
          selectedVariant?.price ?? product.priceRange.minVariantPrice
        }
        shopifyCompareAt={selectedVariant?.compareAtPrice}
        size="lg"
        showBadge
      />

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
                sizeGuide={isApparel(product.productType)}
              />
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

      <ProductViewingActivity productId={product.id} />

      <div ref={buttonsRef} className="space-y-3">
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
          {soldOut
            ? dict.products.soldOut
            : pendingMode === "add"
              ? dict.products.adding
              : dict.products.addToCart}
        </button>
        <WishlistButton
          productId={product.id}
          initialSaved={wishlistSaved}
          variant="labeled"
        />
        <ProductTrust />
      </div>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      {isClient
        ? createPortal(
            <div
              inert={!barVisible}
              className={`fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur transition-transform duration-300 lg:hidden ${
                barVisible ? "translate-y-0" : "translate-y-full"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{product.title}</p>
                  <p className="truncate text-xs font-light text-muted">
                    {[
                      ...(selectedVariant?.selectedOptions ?? [])
                        .filter((option) => option.value !== "Default Title")
                        .map((option) => option.value),
                      formatMoney(
                        selectedVariant?.price ?? product.priceRange.minVariantPrice,
                        locale,
                      ),
                    ].join(" · ")}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={soldOut || busy}
                  onClick={onBuyNow}
                  className="btn-primary shrink-0 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {soldOut
                    ? dict.products.soldOut
                    : pendingMode === "buy"
                      ? dict.products.openingCheckout
                      : dict.products.buyNow}
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
