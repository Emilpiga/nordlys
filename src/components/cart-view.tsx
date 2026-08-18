"use client";

import Image from "next/image";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  removeCartLineAction,
  updateCartLineAction,
} from "@/app/actions/cart";
import { CartDiscountLine } from "@/components/cart-discount-line";
import { CheckoutButton } from "@/components/checkout-button";
import { useDictionary } from "@/components/dictionary-provider";
import { LocaleLink } from "@/components/locale-link";
import { formatMoney } from "@/lib/format";
import type { Cart } from "@/lib/shopify/types";

type CartViewProps = {
  cart: Cart;
};

export function CartView({ cart }: CartViewProps) {
  const { locale, dict, t } = useDictionary();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function updateQuantity(lineId: string, quantity: number) {
    startTransition(async () => {
      await updateCartLineAction(lineId, quantity);
      router.refresh();
    });
  }

  function removeLine(lineId: string) {
    startTransition(async () => {
      await removeCartLineAction(lineId);
      router.refresh();
    });
  }

  return (
    <div
      className={`grid gap-12 lg:grid-cols-[1.35fr_0.85fr] lg:gap-16 ${
        isPending ? "opacity-70 transition-opacity" : ""
      }`}
    >
      <ul className="divide-y divide-border/70 border-y border-border/70">
        {cart.lines.map((line) => {
          const image = line.merchandise.product.featuredImage;
          const options = line.merchandise.selectedOptions
            .filter((option) => option.value !== "Default Title")
            .map((option) => option.value)
            .join(" · ");

          return (
            <li
              key={line.id}
              className="grid grid-cols-[72px_1fr] gap-4 py-6 sm:grid-cols-[88px_1fr] sm:gap-5"
            >
              <LocaleLink
                href={`/products/${line.merchandise.product.handle}`}
                className="relative h-[90px] w-[72px] shrink-0 self-start overflow-hidden bg-[linear-gradient(160deg,#e5ddd2_0%,#efeae3_48%,#e8e0d4_100%)] sm:h-[110px] sm:w-[88px]"
              >
                {image ? (
                  <Image
                    src={image.url}
                    alt={image.altText || line.merchandise.product.title}
                    fill
                    className="object-cover"
                    sizes="88px"
                  />
                ) : null}
              </LocaleLink>

              <div className="flex min-w-0 flex-col justify-between gap-4 py-0.5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <LocaleLink
                      href={`/products/${line.merchandise.product.handle}`}
                      className="font-display text-2xl font-medium leading-tight tracking-tight transition hover:text-accent"
                    >
                      {line.merchandise.product.title}
                    </LocaleLink>
                    {options ? (
                      <p className="mt-2 text-sm font-light text-muted">
                        {options}
                      </p>
                    ) : null}
                    <p className="mt-2 text-sm font-light text-muted">
                      {t(dict.cart.each, {
                        price: formatMoney(line.merchandise.price, locale),
                      })}
                    </p>
                  </div>
                  <p className="shrink-0 font-display text-xl font-medium tracking-tight">
                    {formatMoney(line.cost.totalAmount, locale)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="inline-flex items-center border border-border/80">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() =>
                        updateQuantity(line.id, Math.max(0, line.quantity - 1))
                      }
                      className="px-3.5 py-2 text-sm disabled:opacity-50"
                      aria-label={dict.products.decreaseQty}
                    >
                      −
                    </button>
                    <span className="min-w-9 text-center text-sm tabular-nums">
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() =>
                        updateQuantity(line.id, line.quantity + 1)
                      }
                      className="px-3.5 py-2 text-sm disabled:opacity-50"
                      aria-label={dict.products.increaseQty}
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => removeLine(line.id)}
                    className="text-[0.68rem] font-medium tracking-[0.14em] uppercase text-muted underline-offset-4 transition hover:text-foreground hover:underline disabled:opacity-50"
                  >
                    {dict.cart.remove}
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <aside className="h-fit lg:sticky lg:top-28">
        <div className="border border-border/70 bg-[linear-gradient(180deg,rgba(247,249,250,0.9)_0%,rgba(232,238,241,0.55)_100%)] p-7 sm:p-8">
          <h2 className="font-display text-3xl font-medium tracking-tight">
            {dict.cart.summary}
          </h2>

          <dl className="mt-8 space-y-4 text-sm font-light">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">{dict.cart.subtotal}</dt>
              <dd>{formatMoney(cart.cost.subtotalAmount, locale)}</dd>
            </div>
            <CartDiscountLine cart={cart} />
            <div className="flex justify-between gap-4">
              <dt className="text-muted">{dict.cart.shipping}</dt>
              <dd className="text-muted">{dict.cart.shippingCheckout}</dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-border/70 pt-4 text-base font-medium">
              <dt>{dict.cart.total}</dt>
              <dd className="font-display text-2xl tracking-tight">
                {formatMoney(cart.cost.totalAmount, locale)}
              </dd>
            </div>
          </dl>

          <CheckoutButton
            cart={cart}
            className="btn-primary btn-primary-block mt-8"
          >
            {dict.cart.checkout}
          </CheckoutButton>

          <p className="mt-4 text-center text-xs font-light leading-relaxed text-muted">
            {t(dict.cart.trustLine, { eta: dict.fulfillment.etaShort })}
          </p>
        </div>

        <p className="mt-5 text-sm font-light leading-relaxed text-muted">
          {dict.cart.savedNote}
        </p>
      </aside>
    </div>
  );
}
