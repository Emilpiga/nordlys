import { LocaleFlag } from "@/components/locale-flag";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/locales";

const COPIES_PER_HALF = 8;
/** One group takes about 18s to travel its own width. */
const SECONDS_PER_GROUP = 18;

function KlarnaMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={className}
      aria-hidden
      focusable="false"
    >
      <rect width="16" height="16" rx="3" fill="#FFA8CD" />
      <path
        fill="#0B051D"
        d="M3.7 3.1h2.15v9.8H3.7V3.1Zm2.15 4.35 4.55-4.35h2.55L7.55 8.05l5.55 4.85H10.4L5.85 8.7V7.45Z"
      />
    </svg>
  );
}

function Separator() {
  return (
    <span
      aria-hidden
      className="h-1 w-1 shrink-0 rounded-full bg-[color-mix(in_oklab,var(--glow)_75%,white)]"
    />
  );
}

function AnnouncementGroup({
  locale,
  dict,
  hidden,
}: {
  locale: Locale;
  dict: Dictionary;
  hidden?: boolean;
}) {
  return (
    <ul
      className="flex shrink-0 items-center gap-7 px-3.5 sm:gap-10 sm:px-5"
      aria-hidden={hidden || undefined}
    >
      <li className="flex items-center gap-7 sm:gap-10">
        <span className="inline-flex items-center gap-2.5 whitespace-nowrap">
          {dict.announcement.returns}
        </span>
        <Separator />
      </li>
      <li className="flex items-center gap-7 sm:gap-10">
        <span className="inline-flex items-center gap-2.5 whitespace-nowrap">
          <LocaleFlag
            locale={locale}
            className="h-3 w-[1.15rem] shrink-0 overflow-hidden shadow-[0_0_0_1px_rgba(255,255,255,0.18)]"
          />
          {dict.announcement.shipping}
        </span>
        <Separator />
      </li>
      <li className="flex items-center gap-7 sm:gap-10">
        <span className="inline-flex items-center gap-2 whitespace-nowrap">
          <KlarnaMark className="h-3.5 w-3.5 shrink-0" />
          {dict.announcement.klarna}
        </span>
        <Separator />
      </li>
    </ul>
  );
}

function AnnouncementHalf({
  locale,
  dict,
  hidden,
}: {
  locale: Locale;
  dict: Dictionary;
  hidden?: boolean;
}) {
  return (
    <div className="flex shrink-0" aria-hidden={hidden || undefined}>
      {Array.from({ length: COPIES_PER_HALF }, (_, index) => (
        <AnnouncementGroup
          key={index}
          locale={locale}
          dict={dict}
          hidden={hidden || index > 0}
        />
      ))}
    </div>
  );
}

export function AnnouncementBanner({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  return (
    <div
      role="region"
      aria-label={dict.announcement.label}
      className="relative z-40 overflow-hidden bg-accent py-2 text-[var(--on-accent)] select-none"
    >
      <div
        className="announcement-track flex w-max text-[0.62rem] font-medium tracking-[0.14em] uppercase"
        style={{
          animationDuration: `${SECONDS_PER_GROUP * COPIES_PER_HALF}s`,
        }}
      >
        <AnnouncementHalf locale={locale} dict={dict} />
        <AnnouncementHalf locale={locale} dict={dict} hidden />
      </div>
    </div>
  );
}
