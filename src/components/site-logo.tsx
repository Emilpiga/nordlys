import Image from "next/image";
import { shopifyConfig } from "@/lib/shopify/config";

const LOGO_SIZES = {
  header: {
    src: "/logo-ikon.png",
    className: "w-[4.25rem] sm:w-[5rem]",
    sizes: "80px",
  },
  footer: {
    src: "/logo-ikon.png",
    className: "w-[4.75rem] sm:w-[5.5rem]",
    sizes: "88px",
  },
  hero: {
    src: "/logo.png",
    className: "w-full max-w-[20rem] sm:max-w-[28rem]",
    sizes: "(max-width: 640px) 90vw, 448px",
  },
} as const;

type SiteLogoProps = {
  size: keyof typeof LOGO_SIZES;
  priority?: boolean;
  className?: string;
};

export function SiteLogo({ size, priority = false, className }: SiteLogoProps) {
  const preset = LOGO_SIZES[size];

  return (
    <span
      className={`relative block leading-none ${preset.className}${className ? ` ${className}` : ""}`}
    >
      <Image
        src={preset.src}
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
