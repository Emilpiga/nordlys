"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { updateCartLocaleAction } from "@/app/actions/cart";
import { useDictionary } from "@/components/dictionary-provider";
import {
  LOCALE_COOKIE,
  localeConfigs,
  locales,
  localePath,
  stripLocalePrefix,
  type Locale,
} from "@/lib/i18n/locales";

function setLocaleCookie(locale: Locale) {
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=${maxAge};samesite=lax`;
}

/** Nordic cross flags as compact inline SVG (no external assets). */
function FlagIcon({ locale, className }: { locale: Locale; className?: string }) {
  const common = {
    className,
    viewBox: "0 0 24 16",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": true as const,
    focusable: false as const,
  };

  switch (locale) {
    case "sv":
      return (
        <svg {...common}>
          <rect width="24" height="16" fill="#006AA7" />
          <rect x="7" width="3.2" height="16" fill="#FECC00" />
          <rect y="6.4" width="24" height="3.2" fill="#FECC00" />
        </svg>
      );
    case "no":
      return (
        <svg {...common}>
          <rect width="24" height="16" fill="#BA0C2F" />
          <rect x="6.5" width="4" height="16" fill="#fff" />
          <rect y="6" width="24" height="4" fill="#fff" />
          <rect x="7.4" width="2.2" height="16" fill="#00205B" />
          <rect y="6.9" width="24" height="2.2" fill="#00205B" />
        </svg>
      );
    case "da":
      return (
        <svg {...common}>
          <rect width="24" height="16" fill="#C8102E" />
          <rect x="7" width="3.2" height="16" fill="#fff" />
          <rect y="6.4" width="24" height="3.2" fill="#fff" />
        </svg>
      );
    case "fi":
      return (
        <svg {...common}>
          <rect width="24" height="16" fill="#fff" />
          <rect x="7" width="3.2" height="16" fill="#002F6C" />
          <rect y="6.4" width="24" height="3.2" fill="#002F6C" />
          <rect
            x="0.4"
            y="0.4"
            width="23.2"
            height="15.2"
            fill="none"
            stroke="rgba(26,24,20,0.12)"
            strokeWidth="0.8"
          />
        </svg>
      );
  }
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M2.5 4.5 6 8l3.5-3.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LanguageSelector() {
  const { locale, dict } = useDictionary();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const current = localeConfigs[locale];

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onPointer = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (target && rootRef.current?.contains(target)) return;
      setOpen(false);
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("touchstart", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("touchstart", onPointer);
    };
  }, [open]);

  function onSelect(next: Locale) {
    setOpen(false);
    if (next === locale) return;
    setLocaleCookie(next);
    const bare = stripLocalePrefix(pathname || "/");
    const target = localePath(next, bare);

    startTransition(async () => {
      try {
        await updateCartLocaleAction(next);
      } catch {
        // Cart may be empty; navigation still proceeds.
      }
      router.push(target);
      router.refresh();
    });
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={isPending}
        aria-label={dict.nav.language}
        aria-expanded={open}
        aria-controls={listId}
        aria-haspopup="listbox"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-2 text-foreground/70 transition hover:text-foreground disabled:opacity-50"
      >
        <FlagIcon
          locale={locale}
          className="h-3.5 w-[1.35rem] shrink-0 overflow-hidden shadow-[0_0_0_1px_rgba(26,24,20,0.1)]"
        />
        <span className="text-[0.72rem] font-medium tracking-[0.14em] uppercase">
          {current.language}
        </span>
        <ChevronIcon
          className={`h-2.5 w-2.5 transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 pt-3">
          <ul
            id={listId}
            role="listbox"
            aria-label={dict.nav.language}
            className="min-w-[11.5rem] border border-border/70 bg-[color-mix(in_oklab,var(--frost)_96%,white)] py-1.5 shadow-[0_18px_50px_rgba(20,28,34,0.12)]"
          >
            {locales.map((code) => {
              const config = localeConfigs[code];
              const selected = code === locale;
              return (
                <li key={code} role="option" aria-selected={selected}>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => onSelect(code)}
                    className={`flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition ${
                      selected
                        ? "bg-[color-mix(in_oklab,var(--mist)_55%,white)] text-foreground"
                        : "text-foreground/80 hover:bg-[color-mix(in_oklab,var(--mist)_40%,white)] hover:text-foreground"
                    }`}
                  >
                    <FlagIcon
                      locale={code}
                      className="h-3.5 w-[1.35rem] shrink-0 overflow-hidden shadow-[0_0_0_1px_rgba(26,24,20,0.1)]"
                    />
                    <span className="flex-1 text-[0.78rem] font-normal normal-case tracking-normal">
                      {config.nativeName}
                    </span>
                    <span className="text-[0.62rem] font-medium tracking-[0.12em] uppercase text-muted">
                      {config.language}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
