import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
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

const linkClass = "text-accent underline-offset-4 hover:underline";

/** Link the first case-insensitive occurrence of `phrase`, extending through trailing letters. */
function withLinkedPhrase(
  text: string,
  phrase: string,
  href: string,
): ReactNode {
  const lower = text.toLowerCase();
  const needle = phrase.toLowerCase();
  let idx = lower.indexOf(needle);
  if (idx === -1) return text;

  let end = idx + phrase.length;
  while (end < text.length && /\p{L}/u.test(text[end]!)) end += 1;

  return (
    <>
      {text.slice(0, idx)}
      <Link href={href} className={linkClass}>
        {text.slice(idx, end)}
      </Link>
      {text.slice(end)}
    </>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const dict = await getDictionary(locale);
  const brand = shopifyConfig.storeName;
  const title = dict.terms.metaTitle;
  const description = t(dict.terms.metaDescription, { brand });
  const alternates = localeAlternates(locale, "/terms");

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

export default async function TermsPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale);
  const identity = getLegalIdentity();
  const vars = legalCopyVars(identity);
  const email = identity.email;
  const tm = dict.terms;
  const updatedLabel = t(dict.common.updated, { date: tm.updated });

  return (
    <LegalPage
      title={tm.title}
      description={t(tm.description, vars)}
      updated={updatedLabel}
    >
      <LegalSection title={tm.agreement.title}>
        {tm.agreement.paragraphs.map((paragraph) => (
          <p key={paragraph}>
            {withLinkedPhrase(
              t(paragraph, vars),
              tm.agreement.privacyLink,
              localePath(locale, "/privacy"),
            )}
          </p>
        ))}
      </LegalSection>

      <LegalSection title={tm.seller.title}>
        {tm.seller.paragraphs.map((paragraph) => (
          <p key={paragraph}>{t(paragraph, vars)}</p>
        ))}
        <LegalFacts items={identityFactItems(dict.common, identity)} />
        {!hasRegisteredEntity(identity) ? <p>{tm.seller.missing}</p> : null}
      </LegalSection>

      <LegalSection title={tm.store.title}>
        {tm.store.paragraphs.map((paragraph) => (
          <p key={paragraph}>{t(paragraph, vars)}</p>
        ))}
      </LegalSection>

      <LegalSection title={tm.orders.title}>
        {tm.orders.paragraphs.map((paragraph) => (
          <p key={paragraph}>{t(paragraph, vars)}</p>
        ))}
      </LegalSection>

      <LegalSection title={tm.fulfillment.title}>
        {tm.fulfillment.paragraphs.map((paragraph) => (
          <p key={paragraph}>{t(paragraph, vars)}</p>
        ))}
      </LegalSection>

      <LegalSection title={tm.personalUse.title}>
        {tm.personalUse.paragraphs.map((paragraph) => (
          <p key={paragraph}>{t(paragraph, vars)}</p>
        ))}
      </LegalSection>

      <LegalSection title={tm.care.title}>
        {tm.care.paragraphs.map((paragraph) => (
          <p key={paragraph}>{t(paragraph, vars)}</p>
        ))}
      </LegalSection>

      <LegalSection title={tm.returns.title}>
        {tm.returns.paragraphs.map((paragraph) => (
          <p key={paragraph}>
            {withLinkedPhrase(
              t(paragraph, vars),
              tm.returns.returnsLink,
              localePath(locale, "/returns"),
            )}
          </p>
        ))}
      </LegalSection>

      <LegalSection title={tm.liability.title}>
        {tm.liability.paragraphs.map((paragraph) => (
          <p key={paragraph}>{t(paragraph, vars)}</p>
        ))}
      </LegalSection>

      <LegalSection title={tm.law.title}>
        {tm.law.paragraphs.map((paragraph) => (
          <p key={paragraph}>{t(paragraph, vars)}</p>
        ))}
      </LegalSection>

      <LegalSection title={tm.contact.title}>
        {email ? (
          <p>
            {(() => {
              const [before, after = ""] =
                tm.contact.paragraphs[0].split("{email}");
              return (
                <>
                  {before}
                  <a href={`mailto:${email}`} className={linkClass}>
                    {email}
                  </a>
                  {after}
                </>
              );
            })()}
          </p>
        ) : (
          <p>
            {withLinkedPhrase(
              tm.contact.paragraphs[1],
              tm.contact.contactLink,
              localePath(locale, "/contact"),
            )}
          </p>
        )}
      </LegalSection>
    </LegalPage>
  );
}
