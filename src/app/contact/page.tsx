import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/legal-page";
import { shopifyConfig } from "@/lib/shopify/config";

export const metadata: Metadata = {
  title: "Contact",
  description: `Get in touch with ${shopifyConfig.storeName} about orders, shipping, or products.`,
};

export default function ContactPage() {
  const brand = shopifyConfig.storeName;
  const email = shopifyConfig.supportEmail;

  return (
    <LegalPage
      title="Contact"
      description={`Questions about an order, a formula, or the ritual — we are here.`}
      updated="August 2026"
    >
      <LegalSection title="Email">
        {email ? (
          <>
            <p>
              Write to{" "}
              <a
                href={`mailto:${email}?subject=${encodeURIComponent(`${brand} support`)}`}
                className="text-accent underline-offset-4 hover:underline"
              >
                {email}
              </a>
              . We aim to reply within 1–2 business days.
            </p>
            <p>
              <a
                href={`mailto:${email}?subject=${encodeURIComponent(`${brand} support`)}`}
                className="btn-primary mt-2"
              >
                Email support
              </a>
            </p>
          </>
        ) : (
          <p>
            Reply to your Shopify order confirmation email, or use the contact
            details in your shipping notification. To show a public support
            address here, set{" "}
            <code className="font-mono text-sm text-foreground">
              NEXT_PUBLIC_SUPPORT_EMAIL
            </code>{" "}
            in your environment.
          </p>
        )}
      </LegalSection>

      <LegalSection title="Before you write">
        <p>Including these details helps us respond faster:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Order number (from your confirmation email)</li>
          <li>The product or issue you need help with</li>
          <li>Photos, if something arrived damaged or incorrect</li>
        </ul>
      </LegalSection>

      <LegalSection title="Quick links">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <Link
              href="/returns"
              className="text-accent underline-offset-4 hover:underline"
            >
              Shipping & returns
            </Link>
          </li>
          <li>
            <Link
              href="/privacy"
              className="text-accent underline-offset-4 hover:underline"
            >
              Privacy
            </Link>
          </li>
          <li>
            <Link
              href="/terms"
              className="text-accent underline-offset-4 hover:underline"
            >
              Terms
            </Link>
          </li>
          <li>
            <Link
              href="/products"
              className="text-accent underline-offset-4 hover:underline"
            >
              Shop the collection
            </Link>
          </li>
        </ul>
      </LegalSection>
    </LegalPage>
  );
}
