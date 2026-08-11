import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/legal-page";
import { shopifyConfig } from "@/lib/shopify/config";

export const metadata: Metadata = {
  title: "Privacy",
  description: `How ${shopifyConfig.storeName} collects, uses, and protects your information.`,
};

export default function PrivacyPage() {
  const brand = shopifyConfig.storeName;
  const email = shopifyConfig.supportEmail;

  return (
    <LegalPage
      title="Privacy"
      description={`How ${brand} handles your information when you browse, shop, and receive orders.`}
      updated="August 2026"
    >
      <LegalSection title="Who we are">
        <p>
          {brand} is an online skincare storefront. Checkout and order
          processing run through Shopify. Orders may be fulfilled by our
          logistics partners on our behalf.
        </p>
      </LegalSection>

      <LegalSection title="What we collect">
        <p>Depending on how you use the site, we may process:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Contact and shipping details you provide at checkout (name, email,
            address, phone)
          </li>
          <li>Order history, payment status, and delivery updates</li>
          <li>
            Technical data such as device type, browser, and approximate
            location needed to run the storefront
          </li>
          <li>
            Cart information stored in a cookie on your device so your bag can
            persist while you browse
          </li>
        </ul>
        <p>
          Card payments are handled by Shopify and its payment providers. We do
          not store full card numbers on our servers.
        </p>
      </LegalSection>

      <LegalSection title="Why we use it">
        <ul className="list-disc space-y-2 pl-5">
          <li>To complete and deliver your orders</li>
          <li>To send order, shipping, and support messages</li>
          <li>To prevent fraud and keep the storefront secure</li>
          <li>To improve the site and understand general shopping patterns</li>
          <li>
            To meet legal, tax, and accounting requirements where they apply
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Partners who help us">
        <p>
          We share only what is needed with services that help operate the
          store — for example Shopify (checkout, payments, order management)
          and fulfillment partners who pack and ship your order. They process
          data under their own policies and our instructions.
        </p>
      </LegalSection>

      <LegalSection title="Cookies">
        <p>
          We use essential cookies to keep your shopping bag and session working,
          and to remember your cookie preferences. Shopify may set cookies
          required for secure checkout. If you block essential cookies, cart or
          checkout may not work correctly.
        </p>
        <p>
          With your consent, we also load Meta (Facebook) and Google advertising
          pixels to measure campaigns and show more relevant ads. These only run
          after you choose “Accept ads cookies.” You can change your mind anytime
          via the Cookies link in the footer.
        </p>
      </LegalSection>

      <LegalSection title="How long we keep it">
        <p>
          Order and customer records are kept as long as needed to fulfill
          purchases, handle returns or disputes, and meet legal retention rules.
          Cart cookies expire when cleared or after they age out in your
          browser.
        </p>
      </LegalSection>

      <LegalSection title="Your choices">
        <p>
          Depending on where you live, you may have rights to access, correct,
          delete, or restrict certain personal data, or to object to some
          processing. You can also ask us where your data has been shared for
          order fulfillment.
        </p>
        <p>
          To make a privacy request, email{" "}
          {email ? (
            <a
              href={`mailto:${email}`}
              className="text-accent underline-offset-4 hover:underline"
            >
              {email}
            </a>
          ) : (
            <>
              us via the address on our{" "}
              <Link
                href="/contact"
                className="text-accent underline-offset-4 hover:underline"
              >
                contact page
              </Link>
            </>
          )}
          . We may need to verify your identity before responding.
        </p>
      </LegalSection>

      <LegalSection title="Children">
        <p>
          {brand} is not directed at children under 16. We do not knowingly
          collect personal information from children.
        </p>
      </LegalSection>

      <LegalSection title="Updates">
        <p>
          We may update this policy as the store or our partners change. The
          date at the top of this page will change when we do.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
