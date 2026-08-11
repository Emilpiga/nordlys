import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LegalPage, LegalSection } from "@/components/legal-page";
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
  const title = dict.returns.metaTitle;
  const description = t(dict.returns.metaDescription, { brand });
  const alternates = localeAlternates(locale, "/returns");

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

function HelpParagraph({
  locale,
  brand,
  email,
  withEmail,
  withContact,
}: {
  locale: string;
  brand: string;
  email: string | undefined;
  withEmail: string;
  withContact: string;
}) {
  if (email) {
    const [before, after = ""] = withEmail.split("{email}");
    return (
      <p>
        {t(before, { brand })}
        <a
          href={`mailto:${email}`}
          className="text-accent underline-offset-4 hover:underline"
        >
          {email}
        </a>
        {after}
      </p>
    );
  }

  const contactPath = localePath(locale, "/contact");
  const text = t(withContact, { brand });
  const markers = [
    "kontaktsida",
    "kontaktsiden",
    "kontaktside",
    "yhteystieto",
  ];
  const lower = text.toLowerCase();
  const marker = markers.find((m) => lower.includes(m));
  if (!marker) {
    return <p>{text}</p>;
  }

  const idx = lower.indexOf(marker);
  let end = idx + marker.length;
  while (end < text.length && /\p{L}/u.test(text[end]!)) end += 1;

  return (
    <p>
      {text.slice(0, idx)}
      <Link
        href={contactPath}
        className="text-accent underline-offset-4 hover:underline"
      >
        {text.slice(idx, end)}
      </Link>
      {text.slice(end)}
    </p>
  );
}

export default async function ReturnsPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale);
  const brand = shopifyConfig.storeName;
  const email = shopifyConfig.supportEmail;
  const r = dict.returns;
  const updatedLabel = t(dict.common.updated, { date: r.updated });

  const sections = [
    r.shipping,
    r.customs,
    r.returns,
    r.refunds,
    r.lost,
  ] as const;

  return (
    <LegalPage
      title={r.title}
      description={r.description}
      updated={updatedLabel}
    >
      {sections.map((section) => (
        <LegalSection key={section.title} title={section.title}>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph}>{t(paragraph, { brand })}</p>
          ))}
        </LegalSection>
      ))}

      <LegalSection title={r.help.title}>
        <HelpParagraph
          locale={locale}
          brand={brand}
          email={email}
          withEmail={r.help.paragraphs[0]}
          withContact={r.help.paragraphs[1]}
        />
      </LegalSection>
    </LegalPage>
  );
}
