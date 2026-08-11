"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SiteLogo } from "@/components/site-logo";
import { shopifyConfig } from "@/lib/shopify/config";

type SiteHeaderProps = {
  cartCount: number;
};

function BagIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M6.5 8.5h11l-.7 11.2a1.5 1.5 0 0 1-1.5 1.4H8.7a1.5 1.5 0 0 1-1.5-1.4L6.5 8.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M9 8.5V7a3 3 0 0 1 6 0v1.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SiteHeader({ cartCount }: SiteHeaderProps) {
  const [progress, setProgress] = useState(0);
  const countLabel =
    cartCount > 99 ? "99+" : cartCount > 0 ? String(cartCount) : null;

  useEffect(() => {
    const update = () => {
      setProgress(Math.min(1, window.scrollY / 72));
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  const frosted = progress > 0.02;

  return (
    <header
      className="fixed inset-x-0 top-0 z-40 border-b"
      style={{
        backgroundColor: `rgba(247, 249, 250, ${(progress * 0.86).toFixed(3)})`,
        backdropFilter: frosted ? `blur(${(progress * 16).toFixed(1)}px)` : "none",
        WebkitBackdropFilter: frosted
          ? `blur(${(progress * 16).toFixed(1)}px)`
          : "none",
        borderBottomColor: `rgba(20, 32, 28, ${(progress * 0.12).toFixed(3)})`,
      }}
    >
      <div className="mx-auto flex h-[4.25rem] w-full max-w-6xl items-center justify-between gap-6 px-5 sm:h-[4.5rem] sm:px-8">
        <Link
          href="/"
          aria-label={shopifyConfig.storeName}
          className="inline-flex shrink-0 items-center"
        >
          <SiteLogo size="header" priority />
        </Link>

        <nav className="flex items-center gap-7 text-[0.8rem] font-medium tracking-[0.14em] uppercase text-muted">
          <Link href="/products" className="transition hover:text-foreground">
            Shoppa
          </Link>
          <Link
            href="/cart"
            aria-label={
              cartCount > 0 ? `Kasse, ${cartCount} varor` : "Kasse"
            }
            className="relative inline-flex h-9 w-9 items-center justify-center text-foreground transition hover:text-accent"
          >
            <BagIcon className="h-[1.35rem] w-[1.35rem]" />
            {countLabel ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center bg-accent px-1 text-[0.62rem] font-semibold leading-none tracking-normal text-on-accent tabular-nums">
                {countLabel}
              </span>
            ) : null}
          </Link>
        </nav>
      </div>
    </header>
  );
}
