"use client";

import Image from "next/image";
import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  removeCartLineAction,
  updateCartLineAction,
} from "@/app/actions/cart";
import { formatMoney } from "@/lib/format";
import type { Cart } from "@/lib/shopify/types";

type CartViewProps = {
  cart: Cart;
};

export function CartView({ cart }: CartViewProps) {
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
              <Link
                href={`/products/${line.merchandise.product.handle}`}
                className="relative h-[90px] w-[72px] shrink-0 self-start overflow-hidden bg-[linear-gradient(160deg,#d5e0e4_0%,#e8eef1_48%,#ddd4d0_100%)] sm:h-[110px] sm:w-[88px]"
              >
                {image ? (
                  <Image
                    src={image.url}
                    alt={image.altText || line.merchandise.product.title}
                    fill
                    className="object-contain p-1.5"
                    sizes="88px"
                  />
                ) : null}
              </Link>

              <div className="flex min-w-0 flex-col justify-between gap-4 py-0.5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <Link
                      href={`/products/${line.merchandise.product.handle}`}
                      className="font-display text-2xl font-medium leading-tight tracking-tight transition hover:text-accent"
                    >
                      {line.merchandise.product.title}
                    </Link>
                    {options ? (
                      <p className="mt-2 text-sm font-light text-muted">
                        {options}
                      </p>
                    ) : null}
                    <p className="mt-2 text-sm font-light text-muted">
                      {formatMoney(line.merchandise.price)} styck
                    </p>
                  </div>
                  <p className="shrink-0 font-display text-xl font-medium tracking-tight">
                    {formatMoney(line.cost.totalAmount)}
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
                      aria-label="Minska antal"
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
                      aria-label="Öka antal"
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
                    Ta bort
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
            Ordersammanfattning
          </h2>

          <dl className="mt-8 space-y-4 text-sm font-light">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Delsumma</dt>
              <dd>{formatMoney(cart.cost.subtotalAmount)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Frakt</dt>
              <dd className="text-muted">Beräknas i kassan</dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-border/70 pt-4 text-base font-medium">
              <dt>Totalt</dt>
              <dd className="font-display text-2xl tracking-tight">
                {formatMoney(cart.cost.totalAmount)}
              </dd>
            </div>
          </dl>

          <a
            href={cart.checkoutUrl}
            className="btn-primary btn-primary-block mt-8"
          >
            Till kassan
          </a>

          <p className="mt-4 text-center text-xs font-light leading-relaxed text-muted">
            Säker betalning · Spårning på varje order
          </p>
        </div>

        <p className="mt-5 text-sm font-light leading-relaxed text-muted">
          Behöver du en stund? Din kasse sparas på den här enheten medan du
          fortsätter handla.
        </p>
      </aside>
    </div>
  );
}
