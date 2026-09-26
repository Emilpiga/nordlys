"use client";

import Image from "@/components/soft-image";
import Link from "next/link";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { useHomeTheme } from "@/components/home-theme-provider";
import { LocaleLink } from "@/components/locale-link";
import type { HeroImage, HeroTheme } from "@/lib/hero-images";

const INTERVAL_MS = 8000;

export type HeroThemeCopy = {
  label: string;
  headline: string;
  sub: string;
  cta: string;
  ctaHref: string;
};

type HeroShowcaseProps = {
  images: HeroImage[];
  themes: Record<HeroTheme, HeroThemeCopy>;
  /** Shown above the headline when only one theme has images. */
  eyebrow: string;
  tabsLabel: string;
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

/** Stacks every theme's copy in one grid cell so switching never shifts layout. */
function Crossfade({
  order,
  active,
  render,
  alignEnd = false,
}: {
  order: HeroTheme[];
  active: HeroTheme;
  render: (theme: HeroTheme, isActive: boolean) => ReactNode;
  /** Sit the shorter copy against what follows, so spare height lands above it. */
  alignEnd?: boolean;
}) {
  return (
    <span className={`grid ${alignEnd ? "items-end" : ""}`}>
      {order.map((theme) => {
        const isActive = theme === active;
        return (
          <span
            key={theme}
            aria-hidden={!isActive}
            className={`[grid-area:1/1] transition-[opacity,translate] duration-700 ease-out motion-reduce:transition-none ${
              isActive
                ? "translate-y-0 opacity-100"
                : "pointer-events-none translate-y-1.5 opacity-0"
            }`}
          >
            {render(theme, isActive)}
          </span>
        );
      })}
    </span>
  );
}

/**
 * Hero that walks the catalog stills and lets the copy follow them: clothing
 * frames show the clothing pitch, home frames the home pitch. The tabs show
 * which side is on screen and jump straight to it.
 */
export function HeroShowcase({
  images,
  themes,
  eyebrow,
  tabsLabel,
  secondaryCta,
  secondaryCtaHref,
}: HeroShowcaseProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const homeTheme = useHomeTheme();

  const order = (["clothing", "home"] as const).filter((theme) =>
    images.some((image) => image.theme === theme),
  );
  const activeTheme = images[index]?.theme ?? order[0] ?? "clothing";
  const switchable = order.length > 1;
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

  function showTheme(theme: HeroTheme) {
    // A click is a choice — sections further down follow it.
    homeTheme?.setTheme(theme);
    if (theme === activeTheme) return;
    for (let step = 1; step <= images.length; step++) {
      const next = (index + step) % images.length;
      if (images[next]?.theme === theme) {
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
              className="animate-rise flex items-center gap-6"
            >
              {order.map((theme) => {
                const isActive = theme === activeTheme;
                return (
                  <button
                    key={theme}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => showTheme(theme)}
                    className={`group relative py-2 text-[0.68rem] font-medium tracking-[0.2em] uppercase transition-colors duration-500 ${
                      isActive ? "text-glow" : "text-muted hover:text-foreground"
                    }`}
                  >
                    {themes[theme].label}
                    <span
                      aria-hidden
                      className="absolute inset-x-0 bottom-0 h-px bg-foreground/15"
                    />
                    {isActive ? (
                      <span
                        key={rotating ? index : "still"}
                        aria-hidden
                        style={progressStyle}
                        className={`absolute inset-x-0 bottom-0 h-px origin-left bg-glow ${
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
            <Crossfade
              order={order}
              active={activeTheme}
              render={(theme) => themes[theme].headline}
              alignEnd
            />
          </h1>

          <p className="animate-rise delay-2 mt-3 max-w-sm text-base font-light leading-relaxed text-muted sm:mt-5">
            <Crossfade
              order={order}
              active={activeTheme}
              render={(theme) => themes[theme].sub}
            />
          </p>

          <div className="animate-rise delay-3 mt-6 flex flex-wrap gap-3 sm:mt-9">
            <Crossfade
              order={order}
              active={activeTheme}
              render={(theme, isActive) => (
                <HeroCta
                  href={themes[theme].ctaHref}
                  className="btn-primary"
                  tabIndex={isActive ? undefined : -1}
                >
                  {themes[theme].cta}
                </HeroCta>
              )}
            />
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
