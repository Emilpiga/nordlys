import Image from "next/image";
import { NordlysWordmark } from "@/components/nordlys-wordmark";
import { shopifyConfig } from "@/lib/shopify/config";

const ICON_SIZES = {
  header: {
    className: "w-[4.25rem] sm:w-[5rem]",
    sizes: "80px",
  },
  footer: {
    className: "w-[4.75rem] sm:w-[5.5rem]",
    sizes: "88px",
  },
} as const;

type SiteLogoProps = {
  size: "header" | "footer" | "hero";
  priority?: boolean;
  className?: string;
};

export function SiteLogo({ size, priority = false, className }: SiteLogoProps) {
  if (size === "hero") {
    return (
      <NordlysWordmark
        size="display"
        className={className}
      />
    );
  }

  const preset = ICON_SIZES[size];

  return (
    <span
      className={`relative block leading-none ${preset.className}${className ? ` ${className}` : ""}`}
    >
      <Image
        src="/logo-ikon.png"
        alt={shopifyConfig.storeName}
        width={1536}
        height={1024}
        priority={priority}
        sizes={preset.sizes}
        className="h-auto w-full"
      />
    </span>
  );
}
