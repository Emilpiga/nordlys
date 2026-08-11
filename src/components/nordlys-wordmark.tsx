import { shopifyConfig } from "@/lib/shopify/config";

type NordlysWordmarkProps = {
  className?: string;
  /** Compact mark for header/footer; display for hero. */
  size?: "display" | "compact";
};

/**
 * Typographic wordmark: uppercase serif, open tracking, thin rule.
 */
export function NordlysWordmark({
  className = "",
  size = "display",
}: NordlysWordmarkProps) {
  const name = shopifyConfig.storeName.toUpperCase();

  if (size === "compact") {
    return (
      <span
        className={`inline-flex flex-col items-start leading-none text-foreground ${className}`}
      >
        <span className="font-display text-[1.15rem] font-medium tracking-[0.32em] sm:text-[1.25rem]">
          {name}
        </span>
      </span>
    );
  }

  return (
    <div
      className={`flex max-w-full flex-col items-start text-foreground ${className}`}
    >
      <span
        aria-hidden
        className="mb-4 h-px w-10 bg-foreground/35 sm:mb-5 sm:w-12"
      />
      <p className="font-display text-[clamp(2.4rem,8vw,4.25rem)] font-medium leading-[0.95] tracking-[0.34em]">
        {name}
      </p>
      <span
        aria-hidden
        className="mt-4 h-px w-10 bg-foreground/35 sm:mt-5 sm:w-12"
      />
      <p className="mt-4 text-[0.62rem] font-medium tracking-[0.28em] uppercase text-muted sm:mt-5 sm:text-[0.68rem]">
        Nordisk belysning
      </p>
    </div>
  );
}
