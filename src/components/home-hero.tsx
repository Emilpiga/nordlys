import Image from "next/image";
import Link from "next/link";
import { HeroStill } from "@/components/hero-still";
import { LocaleLink } from "@/components/locale-link";
import type { HeroImage } from "@/lib/hero-images";

type HomeHeroProps = {
  images?: HeroImage[];
  eyebrow: string;
  headline: string;
  sub: string;
  cta: string;
  alt: string;
  ctaHref?: string;
};

export function HomeHero({
  images = [],
  eyebrow,
  headline,
  sub,
  cta,
  alt,
  ctaHref = "#categories",
}: HomeHeroProps) {
  const ctaClassName = "btn-primary";
  const isHashCta = ctaHref.startsWith("#");
  const hasStills = images.length > 0;

  return (
    <section
      className="relative flex min-h-[calc(100svh-var(--header-height))] flex-col justify-end overflow-hidden md:justify-center"
      aria-label={alt}
    >
      {hasStills ? (
        <HeroStill images={images} />
      ) : (
        <Image
          src="/hero-lighting.png"
          alt=""
          fill
          priority
          className="animate-soft-zoom object-cover object-[72%_center] sm:object-[60%_40%]"
          sizes="100vw"
        />
      )}

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_22%,color-mix(in_oklab,var(--frost)_38%,transparent)_60%,var(--frost)_100%)] md:bg-[linear-gradient(100deg,var(--frost)_0%,color-mix(in_oklab,var(--frost)_78%,transparent)_24%,color-mix(in_oklab,var(--frost)_18%,transparent)_50%,transparent_74%)]"
      />

      <div className="relative z-10 w-full px-5 pb-14 pt-24 sm:px-8 sm:pb-16 md:px-12 md:py-24 lg:px-16">
        <div className="max-w-md md:max-w-lg">
          <p className="animate-rise text-[0.68rem] font-medium tracking-[0.2em] uppercase text-glow">
            {eyebrow}
          </p>

          <h1 className="animate-rise delay-1 mt-5 font-display text-[2.05rem] font-medium leading-[1.12] tracking-tight text-foreground sm:mt-6 sm:text-[2.55rem] md:text-[2.85rem]">
            {headline}
          </h1>

          <p className="animate-rise delay-2 mt-5 max-w-sm text-base font-light leading-relaxed text-muted">
            {sub}
          </p>

          <div className="animate-rise delay-3 mt-9">
            {isHashCta ? (
              <a href={ctaHref} className={ctaClassName}>
                {cta}
              </a>
            ) : ctaHref.startsWith("/") ? (
              <LocaleLink href={ctaHref} className={ctaClassName}>
                {cta}
              </LocaleLink>
            ) : (
              <Link href={ctaHref} className={ctaClassName}>
                {cta}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
