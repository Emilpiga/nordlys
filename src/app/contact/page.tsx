import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/legal-page";
import { shopifyConfig } from "@/lib/shopify/config";

export const metadata: Metadata = {
  title: "Kontakt",
  description: `Kontakta ${shopifyConfig.storeName} om ordrar, frakt eller produkter.`,
};

export default function ContactPage() {
  const brand = shopifyConfig.storeName;
  const email = shopifyConfig.supportEmail;

  return (
    <LegalPage
      title="Kontakt"
      description="Frågor om en order, en lampa eller leverans — vi finns här."
      updated="augusti 2026"
    >
      <LegalSection title="E-post">
        {email ? (
          <>
            <p>
              Skriv till{" "}
              <a
                href={`mailto:${email}?subject=${encodeURIComponent(`${brand} support`)}`}
                className="text-accent underline-offset-4 hover:underline"
              >
                {email}
              </a>
              . Vi strävar efter att svara inom 1–2 arbetsdagar.
            </p>
            <p>
              <a
                href={`mailto:${email}?subject=${encodeURIComponent(`${brand} support`)}`}
                className="btn-primary mt-2"
              >
                Mejla support
              </a>
            </p>
          </>
        ) : (
          <p>
            Svara på din Shopify-orderbekräftelse, eller använd
            kontaktuppgifterna i ditt fraktmeddelande. För att visa en offentlig
            supportadress här, sätt{" "}
            <code className="font-mono text-sm text-foreground">
              NEXT_PUBLIC_SUPPORT_EMAIL
            </code>{" "}
            i din miljö.
          </p>
        )}
      </LegalSection>

      <LegalSection title="Innan du skriver">
        <p>Om du inkluderar följande svarar vi snabbare:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Ordernummer (från din bekräftelsemejl)</li>
          <li>Produkten eller problemet du behöver hjälp med</li>
          <li>Foton, om något anlänt skadat eller felaktigt</li>
        </ul>
      </LegalSection>

      <LegalSection title="Snabblänkar">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <Link
              href="/returns"
              className="text-accent underline-offset-4 hover:underline"
            >
              Frakt & returer
            </Link>
          </li>
          <li>
            <Link
              href="/privacy"
              className="text-accent underline-offset-4 hover:underline"
            >
              Integritet
            </Link>
          </li>
          <li>
            <Link
              href="/terms"
              className="text-accent underline-offset-4 hover:underline"
            >
              Villkor
            </Link>
          </li>
          <li>
            <Link
              href="/products"
              className="text-accent underline-offset-4 hover:underline"
            >
              Handla kollektionen
            </Link>
          </li>
        </ul>
      </LegalSection>
    </LegalPage>
  );
}
