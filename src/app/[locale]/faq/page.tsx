import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FaqList } from "@/components/faq-list";
import { getDictionary, t } from "@/lib/i18n/get-dictionary";
import { isLocale, localePath } from "@/lib/i18n/locales";
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
  const title = dict.faq.metaTitle;
  const description = t(dict.faq.metaDescription, { brand });
  const alternates = localeAlternates(locale, "/faq");

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

export default async function FaqPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale);
  const brand = shopifyConfig.storeName;
  const email = shopifyConfig.supportEmail;

  const items = dict.faq.items.map((item) => ({
    question: item.question,
    answer: t(item.answer, { brand, email }),
  }));

  return (
    <div className="mx-auto w-full max-w-3xl px-5 pb-20 pt-12 sm:px-8 sm:pb-28 sm:pt-16">
      <p className="text-[0.68rem] font-medium tracking-[0.2em] uppercase text-glow">
        {dict.faq.eyebrow}
      </p>
      <h1 className="mt-4 font-display text-5xl font-medium tracking-tight sm:text-6xl">
        {dict.faq.title}
      </h1>
      <p className="mt-5 max-w-xl text-base font-light leading-relaxed text-muted">
        {t(dict.faq.intro, { brand })}
      </p>

      <div className="mt-12">
        <FaqList items={items} />
      </div>

      <p className="mt-10 text-sm font-light text-muted">
        {dict.faq.notFound}{" "}
        <Link
          href={localePath(locale, "/contact")}
          className="text-accent underline-offset-4 hover:underline"
        >
          {dict.faq.contactUs}
        </Link>
        {" · "}
        <Link
          href={localePath(locale, "/returns")}
          className="text-accent underline-offset-4 hover:underline"
        >
          {dict.faq.shippingReturns}
        </Link>
      </p>
    </div>
  );
}
