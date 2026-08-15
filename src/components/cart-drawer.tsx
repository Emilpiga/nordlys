"use client";

import Image from "next/image";
import { useEffect, useId, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  removeCartLineAction,
  updateCartLineAction,
} from "@/app/actions/cart";
import { CartDiscountLine } from "@/components/cart-discount-line";
import { useCart } from "@/components/cart-provider";
import { useDictionary } from "@/components/dictionary-provider";
import { LocaleLink } from "@/components/locale-link";
import { formatMoney } from "@/lib/format";
import {
  metaContentIdFromGid,
  trackInitiateCheckout,
} from "@/lib/meta-pixel";

export function CartDrawer() {
  const { locale, dict, t } = useDictionary();
  const router = useRouter();
  const titleId = useId();
  const { cart, isOpen, closeCart, setCart } = useCart();
  const [isPending, startTransition] = useTransition();

  const lines = cart?.lines ?? [];
  const isEmpty = !cart || cart.totalQuantity === 0;

  useEffect(() => {
    if (!isOpen) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeCart();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, closeCart]);

  function updateQuantity(lineId: string, quantity: number) {
    startTransition(async () => {
      const next = await updateCartLineAction(lineId, quantity);
      setCart(next.totalQuantity > 0 ? next : null);
      router.refresh();
    });
  }

  function removeLine(lineId: string) {
    startTransition(async () => {
      const next = await removeCartLineAction(lineId);
      setCart(next.totalQuantity > 0 ? next : null);
      router.refresh();
    });
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label={dict.cart.closeCart}
        className="absolute inset-0 bg-[rgba(20,28,34,0.38)] backdrop-blur-[2px] animate-drawer-backdrop"
        onClick={closeCart}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative flex h-full w-full max-w-md flex-col bg-[color-mix(in_oklab,var(--frost)_97%,white)] shadow-[-12px_0_40px_rgba(20,28,34,0.12)] animate-drawer-panel ${
          isPending ? "opacity-80" : ""
        }`}
      >
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4 sm:px-6">
          <div>
            <p className="text-[0.62rem] font-medium tracking-[0.18em] uppercase text-glow">
              {dict.cart.drawerEyebrow}
            </p>
            <h2
              id={titleId}
              className="mt-1 font-display text-2xl font-medium tracking-tight"
            >
              {isEmpty
                ? dict.cart.title
                : cart.totalQuantity === 1
                  ? dict.cart.itemOne
                  : t(dict.cart.itemMany, { count: cart.totalQuantity })}
            </h2>
          </div>
          <button
            type="button"
            onClick={closeCart}
            className="text-[0.68rem] font-medium tracking-[0.14em] uppercase text-muted transition hover:text-foreground"
          >
            {dict.cart.close}
          </button>
        </div>

        {isEmpty ? (
          <div className="flex flex-1 flex-col items-start justify-center px-5 py-10 sm:px-6">
            <p className="font-display text-3xl font-medium tracking-tight">
              {dict.cart.emptyTitle}
            </p>
            <p className="mt-3 max-w-xs text-sm font-light leading-relaxed text-muted">
              {dict.cart.emptyDrawerBody}
            </p>
            <LocaleLink
              href="/products"
              onClick={closeCart}
              className="btn-primary mt-8"
            >
              {dict.cart.toShop}
            </LocaleLink>
          </div>
        ) : (
          <>
            <ul className="flex-1 overflow-y-auto px-5 py-2 sm:px-6">
              {lines.map((line) => {
                const image = line.merchandise.product.featuredImage;
                const options = line.merchandise.selectedOptions
                  .filter((option) => option.value !== "Default Title")
                  .map((option) => option.value)
                  .join(" · ");

                return (
                  <li
                    key={line.id}
                    className="grid grid-cols-[64px_1fr] gap-3.5 border-b border-border/60 py-5"
                  >
                    <LocaleLink
                      href={`/products/${line.merchandise.product.handle}`}
                      onClick={closeCart}
                      className="relative h-20 w-16 shrink-0 overflow-hidden bg-mist"
                    >
                      {image ? (
                        <Image
                          src={image.url}
                          alt={
                            image.altText || line.merchandise.product.title
                          }
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      ) : null}
                    </LocaleLink>

                    <div className="min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <LocaleLink
                            href={`/products/${line.merchandise.product.handle}`}
                            onClick={closeCart}
                            className="font-display text-lg font-medium leading-tight tracking-tight transition hover:text-accent"
                          >
                            {line.merchandise.product.title}
                          </LocaleLink>
                          {options ? (
                            <p className="mt-1 text-xs font-light text-muted">
                              {options}
                            </p>
                          ) : null}
                        </div>
                        <p className="shrink-0 text-sm tabular-nums">
                          {formatMoney(line.cost.totalAmount, locale)}
                        </p>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <div className="inline-flex items-center border border-border/80">
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() =>
                              updateQuantity(
                                line.id,
                                Math.max(0, line.quantity - 1),
                              )
                            }
                            className="px-2.5 py-1.5 text-sm disabled:opacity-50"
                            aria-label={dict.products.decreaseQty}
                          >
                            −
                          </button>
                          <span className="min-w-7 text-center text-sm tabular-nums">
                            {line.quantity}
                          </span>
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() =>
                              updateQuantity(line.id, line.quantity + 1)
                            }
                            className="px-2.5 py-1.5 text-sm disabled:opacity-50"
                            aria-label={dict.products.increaseQty}
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => removeLine(line.id)}
                          className="text-[0.62rem] font-medium tracking-[0.12em] uppercase text-muted transition hover:text-foreground disabled:opacity-50"
                        >
                          {dict.cart.remove}
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="border-t border-border/60 px-5 py-5 sm:px-6 sm:py-6">
              <div className="flex items-baseline justify-between gap-4">
                <p className="text-[0.68rem] font-medium tracking-[0.16em] uppercase text-muted">
                  {dict.cart.subtotal}
                </p>
                <p className="font-display text-2xl font-medium tracking-tight">
                  {formatMoney(cart.cost.subtotalAmount, locale)}
                </p>
              </div>
              <CartDiscountLine cart={cart} variant="drawer" />
              <p className="mt-1 text-xs font-light text-muted">
                {dict.cart.shipping} · {dict.cart.shippingCheckout}
              </p>

              <a
                href={cart.checkoutUrl}
                className="btn-primary btn-primary-block mt-5"
                onClick={() => {
                  trackInitiateCheckout({
                    contentIds: cart.lines.map((line) =>
                      metaContentIdFromGid(line.merchandise.id),
                    ),
                    contentType: "product",
                    value: Number(cart.cost.totalAmount.amount),
                    currency: cart.cost.totalAmount.currencyCode,
                    numItems: cart.totalQuantity,
                  });
                }}
              >
                {dict.cart.checkout}
              </a>

              <p className="mt-3 text-center text-[0.68rem] font-light leading-relaxed text-muted">
                {t(dict.cart.drawerTrust, { eta: dict.fulfillment.etaShort })}
              </p>

              <LocaleLink
                href="/cart"
                onClick={closeCart}
                className="mt-4 block text-center text-[0.62rem] font-medium tracking-[0.14em] uppercase text-muted transition hover:text-foreground"
              >
                {dict.cart.viewFullCart}
              </LocaleLink>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
