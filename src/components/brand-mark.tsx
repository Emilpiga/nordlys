import { BRAND_CREAM, BRAND_INK, BRAND_MARK_V_PATH, splitBrandName } from "@/lib/brand";
import { shopifyConfig } from "@/lib/shopify/config";

type BrandMarkProps = {
  className?: string;
  title?: string;
};

export function BrandMark({ className = "", title }: BrandMarkProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      <rect width="64" height="64" fill={BRAND_INK} />
      <path d={BRAND_MARK_V_PATH} fill={BRAND_CREAM} />
    </svg>
  );
}

type BrandLockupProps = {
  className?: string;
  size?: "header" | "footer" | "display";
  tagline?: string;
};

const LOCKUP = {
  header: {
    mark: "h-8 w-8 sm:h-9 sm:w-9",
    name: "text-[1.02rem] font-semibold leading-none tracking-tight sm:text-[1.12rem]",
    gap: "gap-2.5",
  },
  footer: {
    mark: "h-10 w-10",
    name: "text-[1.25rem] font-semibold leading-none tracking-tight",
    gap: "gap-3",
  },
  display: {
    mark: "h-12 w-12 sm:h-14 sm:w-14",
    name: "text-[clamp(1.7rem,5vw,2.45rem)] font-semibold leading-none tracking-tight",
    gap: "gap-1 sm:gap-1.5",
  },
} as const;

export function BrandLockup({
  className = "",
  size = "header",
  tagline,
}: BrandLockupProps) {
  const preset = LOCKUP[size];
  const { main, tld } = splitBrandName(shopifyConfig.storeName);
  const displayMain =
    size === "display" && /^v/i.test(main) ? main.slice(1) : main;
  const align = tagline ? "items-start" : "items-center";

  return (
    <span
      className={`inline-flex ${align} ${preset.gap} text-foreground ${className}`}
      role="img"
      aria-label={shopifyConfig.storeName}
    >
      <BrandMark className={`shrink-0 ${preset.mark}`} />
      <span className="flex min-w-0 flex-col items-start" aria-hidden>
        <span className={preset.name}>
          {displayMain}
          {tld ? <span className="text-muted">{tld}</span> : null}
        </span>
        {tagline ? (
          <span className="mt-2 text-sm font-normal text-muted">{tagline}</span>
        ) : null}
      </span>
    </span>
  );
}
