import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/legal-page";
import { shopifyConfig } from "@/lib/shopify/config";

export const metadata: Metadata = {
  title: "Terms",
  description: `Terms of use and sale for shopping with ${shopifyConfig.storeName}.`,
};

export default function TermsPage() {
  const brand = shopifyConfig.storeName;
  const email = shopifyConfig.supportEmail;

  return (
    <LegalPage
      title="Terms"
      description={`The basics of browsing and buying from ${brand}.`}
      updated="August 2026"
    >
      <LegalSection title="Agreement">
        <p>
          By using this website or placing an order, you agree to these terms
          and our{" "}
          <Link
            href="/privacy"
            className="text-accent underline-offset-4 hover:underline"
          >
            Privacy
          </Link>{" "}
          policy. If you do not agree, please do not use the store.
        </p>
      </LegalSection>

      <LegalSection title="The store">
        <p>
          {brand} sells skincare and related products online. Product pages,
          prices, and availability are shown through our Shopify-powered
          catalog and may change without notice. We do our best to keep
          descriptions accurate; small differences in packaging or imagery can
          occur.
        </p>
      </LegalSection>

      <LegalSection title="Orders & payment">
        <p>
          Placing an order is an offer to buy. We (or Shopify on our behalf)
          confirm acceptance by email after payment succeeds. Prices are shown
          before checkout; taxes and shipping are calculated at checkout where
          applicable.
        </p>
        <p>
          Payment is processed securely by Shopify and its payment providers.
          We reserve the right to refuse or cancel an order for suspected
          fraud, pricing errors, stock issues, or shipping restrictions.
        </p>
      </LegalSection>

      <LegalSection title="Fulfillment">
        <p>
          Orders are fulfilled through our logistics partners. Processing and
          delivery times vary by destination and product. Tracking is provided
          when available. Risk of loss passes to you when the carrier marks the
          package as delivered, unless local consumer law says otherwise.
        </p>
      </LegalSection>

      <LegalSection title="Personal use">
        <p>
          Products are sold for personal use. Do not misuse content from this
          site, attempt to disrupt the storefront, or scrape the catalog for
          commercial reuse without permission.
        </p>
      </LegalSection>

      <LegalSection title="Product care">
        <p>
          Skincare affects everyone differently. Follow on-label directions,
          patch test when starting something new, and discontinue use if
          irritation occurs. {brand} is not a substitute for medical advice.
          Contact a healthcare professional if you have concerns.
        </p>
      </LegalSection>

      <LegalSection title="Returns">
        <p>
          Shipping, returns, and refunds are described on our{" "}
          <Link
            href="/returns"
            className="text-accent underline-offset-4 hover:underline"
          >
            Shipping & returns
          </Link>{" "}
          page. Local consumer rights that cannot be waived still apply.
        </p>
      </LegalSection>

      <LegalSection title="Liability">
        <p>
          To the fullest extent allowed by law, {brand} is not liable for
          indirect or consequential losses arising from use of the site or
          products. Nothing in these terms limits liability for death or
          personal injury caused by negligence, fraud, or other rights that
          cannot be limited by law.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Questions about these terms:{" "}
          {email ? (
            <a
              href={`mailto:${email}`}
              className="text-accent underline-offset-4 hover:underline"
            >
              {email}
            </a>
          ) : (
            <>
              see{" "}
              <Link
                href="/contact"
                className="text-accent underline-offset-4 hover:underline"
              >
                Contact
              </Link>
            </>
          )}
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
