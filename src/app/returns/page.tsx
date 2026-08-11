import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/legal-page";
import { shopifyConfig } from "@/lib/shopify/config";

export const metadata: Metadata = {
  title: "Frakt & returer",
  description: `Hur ${shopifyConfig.storeName} skickar ordrar och hanterar returer.`,
};

export default function ReturnsPage() {
  const brand = shopifyConfig.storeName;
  const email = shopifyConfig.supportEmail;

  return (
    <LegalPage
      title="Frakt & returer"
      description="Vad du kan förvänta dig vid leverans och hur du får hjälp om något inte stämmer."
      updated="augusti 2026"
    >
      <LegalSection title="Frakt">
        <p>
          Vi skickar världen över där våra transportörer och
          betalningsleverantörer tillåter. Fraktkostnad och alternativ beräknas
          i kassan utifrån din adress och varorna i din kasse.
        </p>
        <p>
          Ordrar packas av våra fullföljandepartners. De flesta ordrar lämnar
          lagret inom några arbetsdagar efter att betalningen gått igenom.
          Transittiden beror sedan på destination — inrikesleveranser är
          vanligtvis snabbare än internationella.
        </p>
        <p>
          Du får spårning när transportörens skanning finns tillgänglig. Om
          spårning saknas flera arbetsdagar efter din orderbekräftelse,{" "}
          <Link
            href="/contact"
            className="text-accent underline-offset-4 hover:underline"
          >
            kontakta oss
          </Link>{" "}
          med ditt ordernummer.
        </p>
      </LegalSection>

      <LegalSection title="Tull & avgifter">
        <p>
          Internationella ordrar kan beläggas med importtullar, skatter eller
          klareringsavgifter från ditt land. Dessa avgifter är ditt ansvar om
          inte kassan uttryckligen anger något annat.
        </p>
      </LegalSection>

      <LegalSection title="Returer">
        <p>
          Om en vara anländer skadad, felaktig eller defekt, mejla oss inom 14
          dagar från leverans med ordernummer och foton. Vi ordnar ersättning
          eller återbetalning när vi bekräftat problemet.
        </p>
        <p>
          Vid ångerrätt kan oanvända produkter i originalförpackning och
          säljbart skick vara berättigade inom 14 dagar från leverans, med
          förbehåll för lokal konsumentlag. Eftersom {brand} säljer belysning
          och elektriska produkter kan varor som öppnats, installerats eller
          använts i regel inte återföras till lager om de inte längre är i
          väsentligen oförändrat skick — om inte produkten är felaktig.
        </p>
        <p>
          Godkända returer ska skickas med spårbar metod. Ursprunglig utgående
          frakt återbetalas vanligtvis inte om vi inte gjort ett fel.
        </p>
      </LegalSection>

      <LegalSection title="Återbetalningar">
        <p>
          Återbetalningar görs till ursprunglig betalningsmetod efter att vi
          mottagit och granskat en godkänd retur, eller tidigare när vi
          överenskommer om återbetalning utan retur. Behandlingen kan ta flera
          arbetsdagar beroende på din bank eller kortleverantör.
        </p>
      </LegalSection>

      <LegalSection title="Förlorade eller försenade paket">
        <p>
          Om spårningen står stilla under längre tid, kontakta oss så
          undersöker vi med transportören. Utfallet beror på undersökningen —
          ersättning, återbetalning eller fortsatt leverans — och vi håller dig
          uppdaterad.
        </p>
      </LegalSection>

      <LegalSection title="Behöver du hjälp?">
        <p>
          Nå {brand} support{" "}
          {email ? (
            <>
              på{" "}
              <a
                href={`mailto:${email}`}
                className="text-accent underline-offset-4 hover:underline"
              >
                {email}
              </a>
            </>
          ) : (
            <>
              via vår{" "}
              <Link
                href="/contact"
                className="text-accent underline-offset-4 hover:underline"
              >
                kontaktsida
              </Link>
            </>
          )}
          . Ange ditt ordernummer så att vi kan hjälpa dig snabbt.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
