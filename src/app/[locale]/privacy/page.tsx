import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LegalFacts, LegalPage, LegalSection } from "@/components/legal-page";
import { getDictionary, t } from "@/lib/i18n/get-dictionary";
import { isLocale, localePath } from "@/lib/i18n/locales";
import {
  getLegalIdentity,
  hasRegisteredEntity,
  identityFactItems,
  legalCopyVars,
} from "@/lib/legal";
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
  const title = dict.privacy.metaTitle;
  const description = t(dict.privacy.metaDescription, { brand });
  const alternates = localeAlternates(locale, "/privacy");

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

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale);
  const identity = getLegalIdentity();
  const vars = legalCopyVars(identity);
  const email = identity.email;
  const p = dict.privacy;
  const updatedLabel = t(dict.common.updated, { date: p.updated });

  return (
    <LegalPage
      title={p.title}
      description={t(p.description, vars)}
      updated={updatedLabel}
    >
      <LegalSection title={p.whoWeAre.title}>
        {p.whoWeAre.paragraphs.map((paragraph) => (
          <p key={paragraph}>{t(paragraph, vars)}</p>
        ))}
        <LegalFacts items={identityFactItems(dict.common, identity)} />
        {!hasRegisteredEntity(identity) ? (
          <p>{dict.contact.companyMissing}</p>
        ) : null}
      </LegalSection>

      <LegalSection title={p.whatWeCollect.title}>
        <p>{p.whatWeCollect.intro}</p>
        <ul className="list-disc space-y-2 pl-5">
          {p.whatWeCollect.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        {p.whatWeCollect.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </LegalSection>

      <LegalSection title={p.whyWeUse.title}>
        <ul className="list-disc space-y-2 pl-5">
          {p.whyWeUse.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </LegalSection>

      <LegalSection title={p.legalBases.title}>
        <p>{p.legalBases.intro}</p>
        <ul className="list-disc space-y-2 pl-5">
          {p.legalBases.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </LegalSection>

      <LegalSection title={p.partners.title}>
        {p.partners.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </LegalSection>

      <LegalSection title={p.transfers.title}>
        {p.transfers.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </LegalSection>

      <LegalSection title={p.cookies.title}>
        {p.cookies.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </LegalSection>

      <LegalSection title={p.retention.title}>
        {p.retention.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </LegalSection>

      <LegalSection title={p.yourChoices.title}>
        <p>{p.yourChoices.paragraphs[0]}</p>
        {email ? (
          <p>
            {(() => {
              const [before, after = ""] =
                p.yourChoices.paragraphs[1].split("{email}");
              return (
                <>
                  {before}
                  <a
                    href={`mailto:${email}`}
                    className="text-accent underline-offset-4 hover:underline"
                  >
                    {email}
                  </a>
                  {after}
                </>
              );
            })()}
          </p>
        ) : (
          <p>
            {(() => {
              const text = p.yourChoices.paragraphs[2];
              const markers = [
                "kontaktsida",
                "kontaktsiden",
                "kontaktside",
                "yhteystieto",
              ];
              const lower = text.toLowerCase();
              const marker = markers.find((m) => lower.includes(m));
              if (!marker) return text;
              const idx = lower.indexOf(marker);
              let end = idx + marker.length;
              while (end < text.length && /\p{L}/u.test(text[end]!)) end += 1;
              return (
                <>
                  {text.slice(0, idx)}
                  <Link
                    href={localePath(locale, "/contact")}
                    className="text-accent underline-offset-4 hover:underline"
                  >
                    {text.slice(idx, end)}
                  </Link>
                  {text.slice(end)}
                </>
              );
            })()}
          </p>
        )}
        {p.yourChoices.paragraphs[3] ? (
          <p>{p.yourChoices.paragraphs[3]}</p>
        ) : null}
      </LegalSection>

      <LegalSection title={p.children.title}>
        {p.children.paragraphs.map((paragraph) => (
          <p key={paragraph}>{t(paragraph, vars)}</p>
        ))}
      </LegalSection>

      <LegalSection title={p.updates.title}>
        {p.updates.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </LegalSection>
    </LegalPage>
  );
}
