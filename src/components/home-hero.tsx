"use client";

import Image from "next/image";
import Link from "next/link";
import { useDictionary } from "@/components/dictionary-provider";
import { LocaleLink } from "@/components/locale-link";
import { NordlysWordmark } from "@/components/nordlys-wordmark";
import { shopifyConfig } from "@/lib/shopify/config";

type HomeHeroProps = {
  storeName?: string;
  /** Optional overrides; falls back to dictionary. */
  headline?: string;
  sub?: string;
  cta?: string;
  alt?: string;
  /** Locale-prefixed path from a server page; omit to use LocaleLink `/products`. */
  ctaHref?: string;
};

export function HomeHero({
  storeName = shopifyConfig.storeName,
  headline,
  sub,
  cta,
  alt,
  ctaHref,
}: HomeHeroProps) {
  const { dict, t } = useDictionary();

  const resolvedAlt =
    alt ?? t(dict.home.heroAlt, { brand: storeName });
  const resolvedHeadline = headline ?? dict.home.heroHeadline;
  const resolvedSub = sub ?? dict.home.heroSub;
  const resolvedCta = cta ?? dict.home.heroCta;

  const ctaClassName = "btn-primary";

  return (
    <section className="relative min-h-[100svh] overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="/hero-lighting.png"
          alt={resolvedAlt}
          fill
          priority
          className="animate-soft-zoom object-cover object-[72%_center] sm:object-[60%_40%]"
          sizes="100vw"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(90deg,rgba(241,238,232,0.94)_0%,rgba(241,238,232,0.78)_26%,rgba(241,238,232,0.28)_50%,transparent_66%)]"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(180deg,transparent_0%,rgba(241,238,232,0.5)_100%)] sm:h-36"
        />
      </div>

      <div className="relative mx-auto grid min-h-[100svh] w-full max-w-6xl items-center px-5 pb-16 pt-28 sm:px-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="max-w-xl py-8 lg:py-0">
          <div className="animate-rise">
            <NordlysWordmark size="display" />
          </div>

          <h1 className="animate-rise delay-1 mt-8 max-w-md font-display text-[1.85rem] font-medium leading-[1.15] tracking-tight text-foreground sm:mt-10 sm:text-[2.15rem]">
            {resolvedHeadline}
          </h1>

          <p className="animate-rise delay-2 mt-5 max-w-sm text-base font-light leading-relaxed text-muted">
            {resolvedSub}
          </p>

          <div className="animate-rise delay-3 mt-10">
            {ctaHref ? (
              <Link href={ctaHref} className={ctaClassName}>
                {resolvedCta}
              </Link>
            ) : (
              <LocaleLink href="/products" className={ctaClassName}>
                {resolvedCta}
              </LocaleLink>
            )}
          </div>
        </div>

        <div className="hidden lg:block" aria-hidden />
      </div>
    </section>
  );
}
