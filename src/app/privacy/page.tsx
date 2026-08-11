import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/legal-page";
import { shopifyConfig } from "@/lib/shopify/config";

export const metadata: Metadata = {
  title: "Integritet",
  description: `Hur ${shopifyConfig.storeName} samlar in, använder och skyddar din information.`,
};

export default function PrivacyPage() {
  const brand = shopifyConfig.storeName;
  const email = shopifyConfig.supportEmail;

  return (
    <LegalPage
      title="Integritet"
      description={`Hur ${brand} hanterar din information när du surfar, handlar och tar emot ordrar.`}
      updated="augusti 2026"
    >
      <LegalSection title="Vilka vi är">
        <p>
          {brand} är en webbutik för hudvård. Kassa och orderhantering sker via
          Shopify. Ordrar kan fullföljas av våra logistikpartners å våra vägnar.
        </p>
      </LegalSection>

      <LegalSection title="Vad vi samlar in">
        <p>Beroende på hur du använder webbplatsen kan vi behandla:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Kontakt- och leveransuppgifter som du lämnar i kassan (namn, e-post,
            adress, telefon)
          </li>
          <li>Orderhistorik, betalningsstatus och leveransuppdateringar</li>
          <li>
            Tekniska uppgifter som enhetstyp, webbläsare och ungefärlig plats som
            behövs för att driva butiken
          </li>
          <li>
            Kassainformation som lagras i en cookie på din enhet så att din
            kasse sparas medan du surfar
          </li>
        </ul>
        <p>
          Kortbetalningar hanteras av Shopify och deras betalningsleverantörer.
          Vi lagrar inte fullständiga kortnummer på våra servrar.
        </p>
      </LegalSection>

      <LegalSection title="Varför vi använder det">
        <ul className="list-disc space-y-2 pl-5">
          <li>För att fullfölja och leverera dina ordrar</li>
          <li>För att skicka order-, frakt- och supportmeddelanden</li>
          <li>För att förebygga bedrägerier och hålla butiken säker</li>
          <li>
            För att förbättra webbplatsen och förstå allmänna köpmönster
          </li>
          <li>
            För att uppfylla juridiska, skattemässiga och bokföringskrav där de
            gäller
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Partners som hjälper oss">
        <p>
          Vi delar endast det som behövs med tjänster som hjälper till att driva
          butiken — till exempel Shopify (kassa, betalningar, orderhantering)
          och fullföljandepartners som packar och skickar din order. De
          behandlar uppgifter enligt sina egna policyer och våra instruktioner.
        </p>
      </LegalSection>

      <LegalSection title="Cookies">
        <p>
          Vi använder nödvändiga cookies för att din kasse och session ska
          fungera. Shopify kan sätta cookies som krävs för säker utcheckning.
          Om du blockerar nödvändiga cookies kanske kassen eller utcheckningen
          inte fungerar korrekt.
        </p>
        <p>
          För besökare i EES, Storbritannien och Schweiz samlar vi in samtycke
          till annonscookies via Googles certifierade samtyckesplattform (CMP)
          som visas på webbplatsen. Där kan du godkänna, neka eller hantera
          alternativ för Google AdSense och relaterad annonsmätning. Meta-
          (Facebook) och Google Ads-taggar följer samma samtyckesval via Google
          Consent Mode. Du kan ändra ditt val senare via Googles
          samtyckesverktyg på sidan när det visas.
        </p>
      </LegalSection>

      <LegalSection title="Hur länge vi sparar det">
        <p>
          Order- och kunduppgifter sparas så länge det behövs för att fullfölja
          köp, hantera returer eller tvister och uppfylla lagstadgade
          sparkrav. Kasscookies upphör när de raderas eller åldras ut i din
          webbläsare.
        </p>
      </LegalSection>

      <LegalSection title="Dina val">
        <p>
          Beroende på var du bor kan du ha rätt att få tillgång till, rätta,
          radera eller begränsa viss personuppgift, eller invända mot viss
          behandling. Du kan också fråga oss var dina uppgifter har delats för
          orderfullföljande.
        </p>
        <p>
          För en integritetsförfrågan, mejla{" "}
          {email ? (
            <a
              href={`mailto:${email}`}
              className="text-accent underline-offset-4 hover:underline"
            >
              {email}
            </a>
          ) : (
            <>
              oss via adressen på vår{" "}
              <Link
                href="/contact"
                className="text-accent underline-offset-4 hover:underline"
              >
                kontaktsida
              </Link>
            </>
          )}
          . Vi kan behöva verifiera din identitet innan vi svarar.
        </p>
      </LegalSection>

      <LegalSection title="Barn">
        <p>
          {brand} riktar sig inte till barn under 16 år. Vi samlar inte
          medvetet in personuppgifter från barn.
        </p>
      </LegalSection>

      <LegalSection title="Uppdateringar">
        <p>
          Vi kan uppdatera denna policy när butiken eller våra partners
          förändras. Datumet högst upp på sidan ändras när vi gör det.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
