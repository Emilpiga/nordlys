import Image from "@/components/soft-image";
import {
  HeroCta,
  HeroShowcase,
  type HeroThemeCopy,
} from "@/components/hero-showcase";
import type { HeroImage, HeroTheme } from "@/lib/hero-images";

type HomeHeroProps = {
  images?: HeroImage[];
  eyebrow: string;
  alt: string;
  tabsLabel: string;
  themes: Record<HeroTheme, HeroThemeCopy>;
  /** Copy for the static hero when the catalog has no stills. */
  fallback: Omit<HeroThemeCopy, "label">;
  secondaryCta?: string;
  secondaryCtaHref?: string;
};

export function HomeHero({
  images = [],
  eyebrow,
  alt,
  tabsLabel,
  themes,
  fallback,
  secondaryCta,
  secondaryCtaHref,
}: HomeHeroProps) {
  return (
    <section
      className="relative flex flex-col justify-end overflow-hidden md:min-h-[max(22rem,calc(80svh-var(--header-height)-var(--announcement-height)))] md:justify-center"
      aria-label={alt}
    >
      {images.length > 0 ? (
        <HeroShowcase
          images={images}
          themes={themes}
          eyebrow={eyebrow}
          tabsLabel={tabsLabel}
          secondaryCta={secondaryCta}
          secondaryCtaHref={secondaryCtaHref}
        />
      ) : (
        <>
          <Image
            src="/hero-lighting.png"
            alt=""
            fill
            preload
            fetchPriority="high"
            className="animate-soft-zoom object-cover object-[72%_center] sm:object-[60%_40%]"
            sizes="100vw"
          />

          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_22%,color-mix(in_oklab,var(--frost)_38%,transparent)_60%,var(--frost)_100%)] md:bg-[linear-gradient(100deg,var(--frost)_0%,color-mix(in_oklab,var(--frost)_78%,transparent)_24%,color-mix(in_oklab,var(--frost)_18%,transparent)_50%,transparent_74%)]"
          />

          <div className="relative z-10 w-full px-5 pb-10 pt-16 sm:px-8 sm:pb-12 md:px-12 md:py-20 lg:px-16">
            <div className="max-w-md md:max-w-lg">
              <p className="animate-rise text-[0.68rem] font-medium tracking-[0.2em] uppercase text-glow">
                {eyebrow}
              </p>

              <h1 className="animate-rise delay-1 mt-5 font-display text-[2.05rem] font-medium leading-[1.12] tracking-tight text-foreground sm:mt-6 sm:text-[2.55rem] md:text-[2.85rem]">
                {fallback.headline}
              </h1>

              <p className="animate-rise delay-2 mt-5 max-w-sm text-base font-light leading-relaxed text-muted">
                {fallback.sub}
              </p>

              <div className="animate-rise delay-3 mt-9 flex flex-wrap gap-3">
                <HeroCta href={fallback.ctaHref} className="btn-primary">
                  {fallback.cta}
                </HeroCta>
                {secondaryCta && secondaryCtaHref ? (
                  <HeroCta href={secondaryCtaHref} className="btn-secondary">
                    {secondaryCta}
                  </HeroCta>
                ) : null}
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
