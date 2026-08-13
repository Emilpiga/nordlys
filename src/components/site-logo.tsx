import { BrandLockup, BrandMark } from "@/components/brand-mark";

type SiteLogoProps = {
  size: "header" | "footer" | "hero";
  priority?: boolean;
  className?: string;
};

const MARK_SIZE = {
  header: "h-8 w-8 sm:h-9 sm:w-9",
  footer: "h-10 w-10",
} as const;

export function SiteLogo({ size, className = "" }: SiteLogoProps) {
  if (size === "hero") {
    return <BrandLockup size="display" className={className} />;
  }

  return <BrandMark className={`${MARK_SIZE[size]} ${className}`} />;
}
