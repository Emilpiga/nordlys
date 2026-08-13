import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContactForm } from "@/components/contact-form";
import { LegalFacts, LegalPage, LegalSection } from "@/components/legal-page";
import { getDictionary, t } from "@/lib/i18n/get-dictionary";
import { isLocale, localePath } from "@/lib/i18n/locales";
import {
  getLegalIdentity,
  hasRegisteredEntity,
  identityFactItems,
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
  const title = dict.contact.metaTitle;
  const description = t(dict.contact.metaDescription, { brand });
  const alternates = localeAlternates(locale, "/contact");

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

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale);
  const brand = shopifyConfig.storeName;
  const identity = getLegalIdentity();
  const email = identity.email;
  const c = dict.contact;
  const updatedLabel = t(dict.common.updated, { date: c.updated });
  const emailSubject = t(c.emailSubject, { brand });
  const [emailBefore, emailAfter = ""] = c.emailBody.split("{email}");

  return (
    <LegalPage
      title={c.title}
      description={c.description}
      updated={updatedLabel}
    >
      <LegalSection title={c.formTitle}>
        <ContactForm />
      </LegalSection>

      <LegalSection title={c.emailTitle}>
        {email ? (
          <>
            <p>
              {emailBefore}
              <a
                href={`mailto:${email}?subject=${encodeURIComponent(emailSubject)}`}
                className="text-accent underline-offset-4 hover:underline"
              >
                {email}
              </a>
              {emailAfter}
            </p>
            <p>
              <a
                href={`mailto:${email}?subject=${encodeURIComponent(emailSubject)}`}
                className="btn-secondary mt-2"
              >
                {c.emailCta}
              </a>
            </p>
          </>
        ) : (
          <p>{c.emailFallback}</p>
        )}
      </LegalSection>

      <LegalSection title={c.companyTitle}>
        <LegalFacts items={identityFactItems(dict.common, identity)} />
        {!hasRegisteredEntity(identity) ? <p>{c.companyMissing}</p> : null}
      </LegalSection>

      <LegalSection title={c.beforeTitle}>
        <p>{c.beforeIntro}</p>
        <ul className="list-disc space-y-2 pl-5">
          {c.beforeItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </LegalSection>

      <LegalSection title={c.linksTitle}>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <Link
              href={localePath(locale, "/returns")}
              className="text-accent underline-offset-4 hover:underline"
            >
              {c.linkReturns}
            </Link>
          </li>
          <li>
            <Link
              href={localePath(locale, "/privacy")}
              className="text-accent underline-offset-4 hover:underline"
            >
              {c.linkPrivacy}
            </Link>
          </li>
          <li>
            <Link
              href={localePath(locale, "/terms")}
              className="text-accent underline-offset-4 hover:underline"
            >
              {c.linkTerms}
            </Link>
          </li>
          <li>
            <Link
              href={localePath(locale, "/products")}
              className="text-accent underline-offset-4 hover:underline"
            >
              {c.linkShop}
            </Link>
          </li>
        </ul>
      </LegalSection>
    </LegalPage>
  );
}
