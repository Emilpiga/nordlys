import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LegalFacts } from "@/components/legal-page";
import { AmbientSection, SectionRule } from "@/components/section";
import { getDictionary, t } from "@/lib/i18n/get-dictionary";
import { isLocale, localePath } from "@/lib/i18n/locales";
import { getLegalIdentity, identityFactItems } from "@/lib/legal";
import { shopifyConfig } from "@/lib/shopify/config";
import {
  localeAlternates,
  ogLocaleFor,
  socialMetadata,
} from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const dict = await getDictionary(locale);
  const brand = shopifyConfig.storeName;
  const title = dict.about.metaTitle;
  const description = t(dict.about.metaDescription, { brand });
  const alternates = localeAlternates(locale, "/about");

  return {
    title,
    description,
    alternates,
    ...socialMetadata({
      title: `${title} · ${brand}`,
      description,
      url: alternates.canonical,
      locale: ogLocaleFor(locale),
    }),
  };
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale);
  const brand = shopifyConfig.storeName;
  const identity = getLegalIdentity();
  const a = dict.about;

  return (
    <div>
      <div className="mx-auto w-full max-w-6xl px-5 pt-12 sm:px-8 sm:pt-16">
        <p className="text-[0.68rem] font-medium tracking-[0.2em] uppercase text-glow">
          {t(a.eyebrow, { brand })}
        </p>
        <h1 className="mt-4 max-w-3xl font-display text-5xl font-medium leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
          {a.title}
        </h1>
        <p className="mt-6 max-w-xl text-base font-light leading-relaxed text-muted sm:text-lg">
          {t(a.intro, { brand })}
        </p>
      </div>

      <AmbientSection className="mx-auto grid w-full max-w-6xl gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:gap-16">
        <div className="relative min-h-[280px] overflow-hidden sm:min-h-[420px]">
          <Image
            src="/winter-lighting.png"
            alt={a.imageAlt}
            fill
            className="object-cover object-center"
            sizes="(max-width: 1024px) 100vw, 48vw"
            priority
          />
        </div>
        <div className="max-w-md">
          <p className="text-[0.68rem] font-medium tracking-[0.2em] uppercase text-glow">
            {a.whyEyebrow}
          </p>
          <h2 className="mt-4 font-display text-3xl font-medium tracking-tight sm:text-4xl">
            {a.whyTitle}
          </h2>
          <p className="mt-5 text-base font-light leading-relaxed text-muted">
            {a.whyBody1}
          </p>
          <p className="mt-4 text-base font-light leading-relaxed text-muted">
            {a.whyBody2}
          </p>
        </div>
      </AmbientSection>

      <SectionRule />

      <AmbientSection className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="max-w-2xl">
          <p className="text-[0.68rem] font-medium tracking-[0.2em] uppercase text-glow">
            {a.howEyebrow}
          </p>
          <h2 className="mt-4 font-display text-3xl font-medium tracking-tight sm:text-4xl">
            {a.howTitle}
          </h2>
          <p className="mt-5 text-base font-light leading-relaxed text-muted">
            {a.howBody}
          </p>
        </div>

        <div className="mt-14 max-w-md">
          <p className="text-[0.68rem] font-medium tracking-[0.2em] uppercase text-glow">
            {a.companyEyebrow}
          </p>
          <h2 className="mt-4 font-display text-3xl font-medium tracking-tight sm:text-4xl">
            {a.companyTitle}
          </h2>
          <div className="legal-prose mt-5 text-base font-light leading-relaxed text-muted">
            <LegalFacts items={identityFactItems(dict.common, identity)} />
          </div>
        </div>

        <div className="mt-12 flex flex-wrap gap-x-8 gap-y-4 text-[0.68rem] font-medium tracking-[0.14em] uppercase">
          <Link
            href={localePath(locale, "/products")}
            className="text-foreground transition hover:text-accent"
          >
            {a.exploreCta}
          </Link>
          <Link
            href={localePath(locale, "/faq")}
            className="text-muted transition hover:text-foreground"
          >
            {a.faqLink}
          </Link>
          <Link
            href={localePath(locale, "/contact")}
            className="text-muted transition hover:text-foreground"
          >
            {a.contactLink}
          </Link>
        </div>
      </AmbientSection>
    </div>
  );
}
