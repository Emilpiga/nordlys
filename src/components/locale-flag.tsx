import type { Locale } from "@/lib/i18n/locales";

/** Nordic cross flags as compact inline SVG (no external assets). */
export function LocaleFlag({
  locale,
  className,
}: {
  locale: Locale;
  className?: string;
}) {
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
