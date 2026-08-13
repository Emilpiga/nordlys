"use client";

import { useDictionary } from "@/components/dictionary-provider";
import { LocaleLink } from "@/components/locale-link";

function ShippingIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3.8 9.2 12 4.4l8.2 4.8v9.4H3.8V9.2Z"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinejoin="round"
      />
      <path
        d="M12 4.4v14M3.8 9.2h16.4"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ReturnsIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M7.2 8.4A5.6 5.6 0 0 1 17.5 10"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
      />
      <path
        d="M16.2 6.6v3.4h3.3"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.8 15.6A5.6 5.6 0 0 1 6.5 14"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
      />
      <path
        d="M7.8 17.4v-3.4H4.5"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SecureIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M7 11h10v8.2H7V11Z"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinejoin="round"
      />
      <path
        d="M9 11V8.2a3 3 0 0 1 6 0V11"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
      />
      <path
        d="M12 14.4v2"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
      />
    </svg>
  );
}

const ICONS = {
  shipping: ShippingIcon,
  returns: ReturnsIcon,
  secure: SecureIcon,
} as const;

export function HomeTrustStrip() {
  const { dict, t } = useDictionary();

  const items = [
    {
      key: "shipping" as const,
      label: t(dict.home.trustShipping, {
        processing: dict.fulfillment.processingShort,
      }),
      href: "/returns" as const,
    },
    {
      key: "returns" as const,
      label: dict.home.trustReturns,
      href: "/returns" as const,
    },
    {
      key: "secure" as const,
      label: dict.home.trustSecure,
      href: "/faq" as const,
    },
  ];

  return (
    <div className="border-y border-border/60">
      <ul className="grid w-full grid-cols-3 divide-x divide-border/50">
        {items.map((item) => {
          const Icon = ICONS[item.key];
          return (
            <li key={item.key} className="min-w-0">
              <LocaleLink
                href={item.href}
                className="group flex h-full flex-col items-center justify-center gap-1.5 px-2 py-3.5 text-center text-muted transition hover:text-foreground sm:flex-row sm:gap-3 sm:px-5 sm:py-4 sm:text-left"
              >
                <Icon className="h-4 w-4 shrink-0 sm:h-[1.15rem] sm:w-[1.15rem]" />
                <span className="text-[0.58rem] font-medium leading-snug tracking-[0.1em] text-balance uppercase sm:text-[0.68rem] sm:tracking-[0.14em]">
                  {item.label}
                </span>
              </LocaleLink>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
