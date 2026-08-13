"use client";

import { useEffect, useState, useTransition, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { toggleWishlistAction } from "@/app/actions/wishlist";
import { useDictionary } from "@/components/dictionary-provider";

const PENDING_KEY = "harbor:wishlist:pending";

type WishlistButtonProps = {
  productId: string;
  initialSaved?: boolean;
  className?: string;
  /** icon = heart only (cards); labeled = full clickable control (PDP) */
  variant?: "icon" | "labeled";
};

export function WishlistButton({
  productId,
  initialSaved = false,
  className = "",
  variant = "icon",
}: WishlistButtonProps) {
  const { dict, locale } = useDictionary();
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setSaved(initialSaved);
  }, [initialSaved, productId]);

  // After login redirect, finish the pending save once.
  useEffect(() => {
    try {
      const pending = sessionStorage.getItem(PENDING_KEY);
      if (!pending || pending !== productId) return;
      sessionStorage.removeItem(PENDING_KEY);
    } catch {
      return;
    }

    startTransition(async () => {
      const result = await toggleWishlistAction(productId);
      if (result.ok) {
        setSaved(result.added);
        setMessage(null);
        router.refresh();
        return;
      }
      if (result.reason === "auth") {
        setMessage(dict.wishlist.loginRequired);
      } else {
        setMessage(dict.wishlist.error);
      }
    });
  }, [productId, router, dict.wishlist.loginRequired, dict.wishlist.error]);

  function goLogin() {
    try {
      sessionStorage.setItem(PENDING_KEY, productId);
    } catch {
      /* ignore */
    }
    const returnTo = window.location.pathname + window.location.search;
    window.location.href = `/api/auth/login?locale=${encodeURIComponent(locale)}&return_to=${encodeURIComponent(returnTo)}`;
  }

  function onToggle(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    setMessage(null);

    startTransition(async () => {
      const result = await toggleWishlistAction(productId);
      if (!result.ok) {
        if (result.reason === "auth") {
          goLogin();
          return;
        }
        setMessage(dict.wishlist.error);
        return;
      }
      setSaved(result.added);
      router.refresh();
    });
  }

  const label = saved ? dict.wishlist.saved : dict.wishlist.add;
  const aria = saved ? dict.wishlist.remove : dict.wishlist.add;

  if (variant === "labeled") {
    return (
      <div className="flex flex-col items-center gap-1.5">
        <button
          type="button"
          onClick={onToggle}
          disabled={isPending}
          aria-pressed={saved}
          aria-label={aria}
          className={`inline-flex cursor-pointer items-center justify-center gap-2 border border-border/80 bg-transparent px-4 py-2.5 text-sm font-light text-muted transition hover:border-foreground/40 hover:text-foreground disabled:cursor-wait disabled:opacity-50 ${className}`}
        >
          <HeartIcon saved={saved} />
          <span>{isPending ? "…" : label}</span>
        </button>
        {message ? (
          <p className="text-center text-xs text-accent">{message}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        onPointerDown={(event) => event.stopPropagation()}
        disabled={isPending}
        aria-pressed={saved}
        aria-label={aria}
        title={aria}
        className={`pointer-events-auto relative z-10 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-none text-foreground shadow-sm transition hover:text-accent disabled:cursor-wait disabled:opacity-50 ${className}`}
      >
        <HeartIcon saved={saved} />
      </button>
      {message ? (
        <p className="absolute right-0 top-full z-20 mt-1 w-36 bg-frost px-2 py-1 text-[0.65rem] text-accent shadow">
          {message}
        </p>
      ) : null}
    </div>
  );
}

function HeartIcon({ saved }: { saved: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill={saved ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 20.25S4.5 15.2 4.5 9.75A3.75 3.75 0 0 1 12 7.5a3.75 3.75 0 0 1 7.5 2.25c0 5.45-7.5 10.5-7.5 10.5Z"
      />
    </svg>
  );
}
