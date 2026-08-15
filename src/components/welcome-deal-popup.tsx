"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import {
  acceptWelcomeDealAction,
  declineWelcomeDealAction,
} from "@/app/actions/welcome-deal";
import { useCart } from "@/components/cart-provider";
import { useDictionary } from "@/components/dictionary-provider";

const SHOW_DELAY_MS = 8000;
const SUCCESS_MS = 2200;
const PERCENT = 10;

export function WelcomeDealPopup() {
  const { dict, t } = useDictionary();
  const { isOpen: cartOpen, setCart } = useCart();
  const pathname = usePathname();
  const titleId = useId();
  const yesRef = useRef<HTMLButtonElement>(null);
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onConfirmedPage = pathname.includes("/order/confirmed");

  useEffect(() => {
    if (onConfirmedPage || cartOpen || open || done) return;

    const timer = window.setTimeout(() => setOpen(true), SHOW_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [cartOpen, done, onConfirmedPage, open]);

  useEffect(() => {
    if (!open || !done) return;
    const timer = window.setTimeout(() => setOpen(false), SUCCESS_MS);
    return () => window.clearTimeout(timer);
  }, [done, open]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    yesRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || done) return;
      startTransition(async () => {
        await declineWelcomeDealAction();
        setOpen(false);
        setDone(true);
      });
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [done, open]);

  function decline() {
    startTransition(async () => {
      await declineWelcomeDealAction();
      setOpen(false);
      setDone(true);
    });
  }

  function accept() {
    setError(null);
    startTransition(async () => {
      const result = await acceptWelcomeDealAction();
      if (!result.ok) {
        setError(dict.deal.error);
        return;
      }
      if (result.cart) setCart(result.cart);
      setDone(true);
    });
  }

  if (!open || onConfirmedPage) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6">
      <div
        className="absolute inset-0 bg-[rgba(20,28,34,0.38)] backdrop-blur-[2px] animate-drawer-backdrop"
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-md bg-[color-mix(in_oklab,var(--frost)_97%,white)] px-6 py-8 shadow-[0_-8px_40px_rgba(20,28,34,0.12)] animate-rise sm:px-8 sm:py-10 sm:shadow-[0_24px_80px_rgba(20,28,34,0.16)]"
      >
        <p className="text-[0.62rem] font-medium tracking-[0.18em] uppercase text-glow">
          {t(dict.deal.eyebrow, { percent: PERCENT })}
        </p>
        <h2
          id={titleId}
          className="mt-3 font-display text-3xl font-medium tracking-tight sm:text-4xl"
        >
          {t(dict.deal.title, { percent: PERCENT })}
        </h2>

        {done ? (
          <p className="mt-4 text-sm font-light leading-relaxed text-muted">
            {t(dict.deal.applied, { percent: PERCENT })}
          </p>
        ) : (
          <>
            <p className="mt-4 text-sm font-light leading-relaxed text-muted">
              {t(dict.deal.body, { percent: PERCENT })}
            </p>
            {error ? (
              <p className="mt-3 text-sm text-accent" role="alert">
                {error}
              </p>
            ) : null}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                ref={yesRef}
                type="button"
                className="btn-primary flex-1"
                disabled={isPending}
                onClick={accept}
              >
                {dict.deal.yes}
              </button>
              <button
                type="button"
                className="btn-secondary flex-1"
                disabled={isPending}
                onClick={decline}
              >
                {dict.deal.no}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
