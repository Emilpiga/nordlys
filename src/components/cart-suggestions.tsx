"use client";

import Image from "@/components/soft-image";
import { useEffect, useState, useTransition } from "react";
import { addToCartAction } from "@/app/actions/cart";
import { getCartSuggestionsAction } from "@/app/actions/cart-suggestions";
import { useCart } from "@/components/cart-provider";
import { useDictionary } from "@/components/dictionary-provider";
import { LocaleLink } from "@/components/locale-link";
import { ProductQuickView } from "@/components/product-quick-view";
import { formatMoney } from "@/lib/format";
import type { Product } from "@/lib/shopify/types";

type CartSuggestionsProps = {
  productIds: string[];
  onNavigate: () => void;
};

/** "Goes with" row in the cart drawer, keyed on what is already in the cart. */
export function CartSuggestions({ productIds, onNavigate }: CartSuggestionsProps) {
  const { locale, dict } = useDictionary();
  const { setCart } = useCart();
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [quickProduct, setQuickProduct] = useState<Product | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const key = [...productIds].sort().join(",");

  useEffect(() => {
    let cancelled = false;
    getCartSuggestionsAction(key ? key.split(",") : [], locale)
      .then((products) => {
        if (!cancelled) setSuggestions(products);
      })
      .catch(() => {
        if (!cancelled) setSuggestions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [key, locale]);

  if (suggestions.length === 0) return null;

  function add(product: Product) {
    const buyable = product.variants.filter((variant) => variant.availableForSale);
    if (buyable.length !== 1) {
      setQuickProduct(product);
      return;
    }
    setAddingId(product.id);
    startTransition(async () => {
      try {
        const result = await addToCartAction(buyable[0].id, 1);
        setCart(result.cart);
      } finally {
        setAddingId(null);
      }
    });
  }

  return (
    <section className="py-5">
      <p className="text-[0.62rem] font-medium tracking-[0.18em] uppercase text-glow">
        {dict.cart.suggestionsTitle}
      </p>
      <ul className="mt-3 space-y-3">
        {suggestions.map((product) => {
          const image = product.featuredImage;
          const single =
            product.variants.filter((variant) => variant.availableForSale)
              .length === 1;
          return (
            <li
              key={product.id}
              className="grid grid-cols-[48px_1fr_auto] items-center gap-3"
            >
              <LocaleLink
                href={`/products/${product.handle}`}
                onClick={onNavigate}
                className="relative h-14 w-12 overflow-hidden bg-mist"
              >
                {image ? (
                  <Image
                    src={image.url}
                    alt={image.altText || product.title}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                ) : null}
              </LocaleLink>
              <div className="min-w-0">
                <LocaleLink
                  href={`/products/${product.handle}`}
                  onClick={onNavigate}
                  className="line-clamp-1 text-sm leading-snug transition hover:text-accent"
                >
                  {product.title}
                </LocaleLink>
                <p className="mt-0.5 text-xs font-light tabular-nums text-muted">
                  {formatMoney(product.priceRange.minVariantPrice, locale)}
                </p>
              </div>
              <button
                type="button"
                disabled={addingId === product.id}
                onClick={() => add(product)}
                className="border border-border/80 px-3 py-1.5 text-[0.62rem] font-medium tracking-[0.12em] uppercase transition hover:border-foreground disabled:opacity-50"
              >
                {single ? dict.cart.suggestionAdd : dict.cart.suggestionChoose}
              </button>
            </li>
          );
        })}
      </ul>

      {quickProduct ? (
        <ProductQuickView
          product={quickProduct}
          open
          onClose={() => setQuickProduct(null)}
        />
      ) : null}
    </section>
  );
}
