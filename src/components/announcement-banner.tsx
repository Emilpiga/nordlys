import { LocaleFlag } from "@/components/locale-flag";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/locales";

const COPIES = 4;

function KlarnaBadge() {
  return (
    <span
      aria-hidden
      className="inline-flex h-[1.15rem] items-center rounded-[0.22rem] bg-[#FFB3C7] px-[0.42rem] text-[0.62rem] font-extrabold leading-none tracking-[-0.045em] text-[#0A0B09]"
    >
      Klarna
    </span>
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
          <KlarnaBadge />
          {dict.announcement.klarna}
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
    </ul>
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
      <div className="announcement-track flex w-max text-[0.62rem] font-medium tracking-[0.14em] uppercase">
        {Array.from({ length: COPIES }, (_, index) => (
          <AnnouncementGroup
            key={index}
            locale={locale}
            dict={dict}
            hidden={index > 0}
          />
        ))}
      </div>
    </div>
  );
}
