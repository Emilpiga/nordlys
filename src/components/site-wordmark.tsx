import { BrandLockup } from "@/components/brand-mark";

type SiteWordmarkProps = {
  className?: string;
  size?: "display" | "compact";
  tagline?: string;
};

export function SiteWordmark({
  className = "",
  size = "display",
  tagline,
}: SiteWordmarkProps) {
  return (
    <BrandLockup
      size={size === "compact" ? "header" : "display"}
      tagline={tagline}
      className={className}
    />
  );
}
