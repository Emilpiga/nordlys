"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toggleWishlistAction } from "@/app/actions/wishlist";
import { useDictionary } from "@/components/dictionary-provider";

type WishlistButtonProps = {
  productId: string;
  initialSaved?: boolean;
  className?: string;
};

export function WishlistButton({
  productId,
  initialSaved = false,
  className = "",
}: WishlistButtonProps) {
  const { dict, locale } = useDictionary();
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [isPending, startTransition] = useTransition();

  function onToggle(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    startTransition(async () => {
      const result = await toggleWishlistAction(productId);
      if (!result.ok) {
        if (result.reason === "auth") {
          const returnTo = window.location.pathname;
          window.location.href = `/api/auth/login?locale=${encodeURIComponent(locale)}&return_to=${encodeURIComponent(returnTo)}`;
        }
        return;
      }
      setSaved(result.added);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={isPending}
      aria-pressed={saved}
      aria-label={saved ? dict.wishlist.remove : dict.wishlist.add}
      className={`inline-flex h-9 w-9 items-center justify-center transition hover:text-accent disabled:opacity-50 ${className}`}
    >
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
    </button>
  );
}
