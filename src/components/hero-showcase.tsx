"use client";

import Image from "@/components/soft-image";
import Link from "next/link";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { LocaleLink } from "@/components/locale-link";
import type { HeroImage } from "@/lib/hero-images";
import {
  CLOTHING_GENDERS,
  type ClothingGender,
} from "@/lib/shopify/collections";

const INTERVAL_MS = 8000;

export type HeroCopy = {
  headline: string;
  sub: string;
  cta: string;
  ctaHref: string;
};

export type HeroTab = {
  label: string;
  cta: string;
  ctaHref: string;
};

type HeroShowcaseProps = {
  images: HeroImage[];
  tabs: Record<ClothingGender, HeroTab>;
  tabsLabel: string;
  copy: HeroCopy;
  /** Shown above the headline when only one side has images. */
  eyebrow: string;
  secondaryCta?: string;
  secondaryCtaHref?: string;
};

export function HeroCta({
  href,
  className,
  children,
  tabIndex,
}: {
  href: string;
  className: string;
  children: ReactNode;
  tabIndex?: number;
}) {
  if (href.startsWith("#")) {
    return (
      <a href={href} className={className} tabIndex={tabIndex}>
        {children}
      </a>
    );
  }
  if (href.startsWith("/")) {
    return (
      <LocaleLink href={href} className={className} tabIndex={tabIndex}>
        {children}
      </LocaleLink>
    );
  }
  return (
    <Link href={href} className={className} tabIndex={tabIndex}>
      {children}
    </Link>
  );
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Hero that walks the catalog stills. The Dam/Herr tabs show which side is on
 * screen, jump straight to it, and point the CTA at that side's collection.
 */
export function HeroShowcase({
  images,
  tabs,
  tabsLabel,
  copy,
  eyebrow,
  secondaryCta,
  secondaryCtaHref,
}: HeroShowcaseProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const order = CLOTHING_GENDERS.filter((gender) =>
    images.some((image) => image.gender === gender),
  );
  const activeGender = images[index]?.gender ?? order[0] ?? "dam";
  const switchable = order.length > 1;
  const cta = switchable ? tabs[activeGender] : copy;
  const rotating = images.length > 1 && !paused && !reducedMotion;

  useEffect(() => {
    // Read once on mount; the server render always starts on the first frame.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReducedMotion(prefersReducedMotion());
  }, []);

  useEffect(() => {
    if (!rotating) return;
    const timeout = window.setTimeout(() => {
      setIndex((current) => (current + 1) % images.length);
    }, INTERVAL_MS);
    return () => window.clearTimeout(timeout);
  }, [rotating, index, images.length]);

  function showGender(gender: ClothingGender) {
    if (gender === activeGender) return;
    for (let step = 1; step <= images.length; step++) {
      const next = (index + step) % images.length;
      if (images[next]?.gender === gender) {
        setIndex(next);
        return;
      }
    }
  }

  const progressStyle = {
    "--hero-interval": `${INTERVAL_MS}ms`,
  } as CSSProperties;

  return (
    <>
      <div className="pointer-events-none absolute inset-0 bg-mist">
        {images.map((image, i) => {
          const active = i === index;
          return (
            <div
              key={`${image.product.id}-${image.url}`}
              className={`absolute inset-0 transition-opacity duration-[1400ms] ease-in-out ${
                active ? "opacity-100" : "opacity-0"
              }`}
            >
              <Image
                src={image.url}
                alt={active ? image.alt : ""}
                fill
                preload={i === 0}
                fetchPriority={i === 0 ? "high" : "low"}
                sizes="100vw"
                className="object-cover object-[center_40%]"
              />
            </div>
          );
        })}
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_8%,color-mix(in_oklab,var(--frost)_72%,transparent)_38%,var(--frost)_86%)] md:bg-[linear-gradient(100deg,var(--frost)_0%,color-mix(in_oklab,var(--frost)_78%,transparent)_24%,color-mix(in_oklab,var(--frost)_18%,transparent)_50%,transparent_74%)]"
      />

      <div
        className="relative z-10 w-full px-5 pb-8 pt-12 sm:px-8 sm:pb-12 sm:pt-16 md:px-12 md:py-20 lg:px-16"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
        }}
      >
        <div className="max-w-md md:max-w-lg">
          {switchable ? (
            <div
              role="group"
              aria-label={tabsLabel}
              // A solid toggle: it sits on the photo, where thin text vanished.
              className="animate-rise inline-flex border border-border/70 bg-[color-mix(in_oklab,var(--frost)_88%,transparent)] p-1 shadow-sm backdrop-blur-sm"
            >
              {order.map((gender) => {
                const isActive = gender === activeGender;
                return (
                  <button
                    key={gender}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => showGender(gender)}
                    className={`relative min-w-24 overflow-hidden px-4 py-3 text-xs font-semibold tracking-[0.16em] uppercase transition-colors duration-500 ${
                      isActive
                        ? "bg-foreground text-[var(--on-accent)]"
                        : "text-foreground/75 hover:text-foreground"
                    }`}
                  >
                    {tabs[gender].label}
                    {isActive ? (
                      <span
                        key={rotating ? index : "still"}
                        aria-hidden
                        style={progressStyle}
                        className={`absolute inset-x-0 bottom-0 h-0.5 origin-left bg-glow ${
                          rotating ? "hero-progress" : ""
                        }`}
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="animate-rise text-[0.68rem] font-medium tracking-[0.2em] uppercase text-glow">
              {eyebrow}
            </p>
          )}

          <h1 className="animate-rise delay-1 mt-4 font-display text-[2.05rem] font-medium leading-[1.12] tracking-tight text-foreground sm:mt-6 sm:text-[2.55rem] md:text-[2.85rem]">
            {copy.headline}
          </h1>

          <p className="animate-rise delay-2 mt-3 max-w-sm text-base font-light leading-relaxed text-muted sm:mt-5">
            {copy.sub}
          </p>

          <div className="animate-rise delay-3 mt-6 flex flex-wrap gap-3 sm:mt-9">
            <HeroCta href={cta.ctaHref} className="btn-primary">
              {cta.cta}
            </HeroCta>
            {secondaryCta && secondaryCtaHref ? (
              // Hidden on phones: "Till hela sortimentet" sits right below.
              <span className="hidden sm:contents">
                <HeroCta href={secondaryCtaHref} className="btn-secondary">
                  {secondaryCta}
                </HeroCta>
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
