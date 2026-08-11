import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/legal-page";
import { shopifyConfig } from "@/lib/shopify/config";

export const metadata: Metadata = {
  title: "Villkor",
  description: `Användar- och köpvillkor för handel hos ${shopifyConfig.storeName}.`,
};

export default function TermsPage() {
  const brand = shopifyConfig.storeName;
  const email = shopifyConfig.supportEmail;

  return (
    <LegalPage
      title="Villkor"
      description={`Grunderna för att surfa och handla hos ${brand}.`}
      updated="augusti 2026"
    >
      <LegalSection title="Avtal">
        <p>
          Genom att använda denna webbplats eller lägga en order godkänner du
          dessa villkor och vår{" "}
          <Link
            href="/privacy"
            className="text-accent underline-offset-4 hover:underline"
          >
            Integritetspolicy
          </Link>
          . Om du inte godkänner, använd inte butiken.
        </p>
      </LegalSection>

      <LegalSection title="Butiken">
        <p>
          {brand} säljer hudvård och relaterade produkter online.
          Produktsidor, priser och tillgänglighet visas via vår
          Shopify-drivna katalog och kan ändras utan föregående meddelande. Vi
          gör vårt bästa för att hålla beskrivningar korrekta; små skillnader i
          förpackning eller bilder kan förekomma.
        </p>
      </LegalSection>

      <LegalSection title="Ordrar & betalning">
        <p>
          Att lägga en order är ett erbjudande att köpa. Vi (eller Shopify å
          våra vägnar) bekräftar acceptans via e-post när betalningen lyckas.
          Priser visas före utcheckning; skatter och frakt beräknas i kassan där
          det är tillämpligt.
        </p>
        <p>
          Betalning behandlas säkert av Shopify och deras betalningsleverantörer.
          Vi förbehåller oss rätten att neka eller avbryta en order vid
          misstänkt bedrägeri, prisfel, lagerproblem eller fraktbegränsningar.
        </p>
      </LegalSection>

      <LegalSection title="Fullföljande">
        <p>
          Ordrar fullföljs via våra logistikpartners. Behandlings- och
          leveranstider varierar beroende på destination och produkt. Spårning
          tillhandahålls när den finns tillgänglig. Risken för förlust övergår
          till dig när transportören markerar paketet som levererat, om inte
          lokal konsumentlag säger annat.
        </p>
      </LegalSection>

      <LegalSection title="Personligt bruk">
        <p>
          Produkter säljs för personligt bruk. Missbruka inte innehåll från
          denna webbplats, försök inte störa butiken eller skrapa katalogen för
          kommersiell återanvändning utan tillstånd.
        </p>
      </LegalSection>

      <LegalSection title="Produktskötsel">
        <p>
          Hudvård påverkar alla olika. Följ anvisningarna på förpackningen,
          gör lapptestest när du börjar med något nytt och avbryt användningen om
          irritation uppstår. {brand} ersätter inte medicinsk rådgivning.
          Kontakta en vårdgivare om du har frågor.
        </p>
      </LegalSection>

      <LegalSection title="Returer">
        <p>
          Frakt, returer och återbetalningar beskrivs på vår sida om{" "}
          <Link
            href="/returns"
            className="text-accent underline-offset-4 hover:underline"
          >
            Frakt & returer
          </Link>
          . Lokala konsumenträttigheter som inte kan avtalas bort gäller
          fortfarande.
        </p>
      </LegalSection>

      <LegalSection title="Ansvar">
        <p>
          I den utsträckning lagen tillåter är {brand} inte ansvarig för
          indirekta eller följdskador som uppstår vid användning av webbplatsen
          eller produkterna. Ingenting i dessa villkor begränsar ansvar för
          dödsfall eller personskada orsakad av vårdslöshet, bedrägeri eller
          andra rättigheter som inte får begränsas enligt lag.
        </p>
      </LegalSection>

      <LegalSection title="Kontakt">
        <p>
          Frågor om dessa villkor:{" "}
          {email ? (
            <a
              href={`mailto:${email}`}
              className="text-accent underline-offset-4 hover:underline"
            >
              {email}
            </a>
          ) : (
            <>
              se{" "}
              <Link
                href="/contact"
                className="text-accent underline-offset-4 hover:underline"
              >
                Kontakt
              </Link>
            </>
          )}
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
