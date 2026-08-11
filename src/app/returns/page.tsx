import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/legal-page";
import { shopifyConfig } from "@/lib/shopify/config";

export const metadata: Metadata = {
  title: "Shipping & returns",
  description: `How ${shopifyConfig.storeName} ships orders and handles returns.`,
};

export default function ReturnsPage() {
  const brand = shopifyConfig.storeName;
  const email = shopifyConfig.supportEmail;

  return (
    <LegalPage
      title="Shipping & returns"
      description={`Delivery expectations and how to get help if something is not right.`}
      updated="August 2026"
    >
      <LegalSection title="Shipping">
        <p>
          We ship worldwide where our carriers and payment providers allow.
          Shipping cost and options are calculated at checkout based on your
          address and the items in your bag.
        </p>
        <p>
          Orders are packed by our fulfillment partners. Most orders leave the
          warehouse within a few business days after payment clears. Transit
          time then depends on destination — domestic deliveries are usually
          faster than international.
        </p>
        <p>
          You will receive tracking when the carrier scan is available. If
          tracking has not appeared several business days after your order
          confirmation,{" "}
          <Link
            href="/contact"
            className="text-accent underline-offset-4 hover:underline"
          >
            contact us
          </Link>{" "}
          with your order number.
        </p>
      </LegalSection>

      <LegalSection title="Customs & duties">
        <p>
          International orders may be subject to import duties, taxes, or
          clearance fees charged by your country. Those charges are your
          responsibility unless checkout explicitly states otherwise.
        </p>
      </LegalSection>

      <LegalSection title="Returns">
        <p>
          If an item arrives damaged, incorrect, or defective, email us within
          14 days of delivery with your order number and photos. We will arrange
          a replacement or refund once we confirm the issue.
        </p>
        <p>
          For change-of-mind returns, unopened products in original condition
          may be eligible within 14 days of delivery, subject to local consumer
          law. Because {brand} sells skincare, opened or used hygiene and
          cosmetic products generally cannot be restocked for health and safety
          reasons — unless the product is faulty.
        </p>
        <p>
          Approved returns must be sent with a trackable method. Original
          outbound shipping is typically non-refundable unless we made an error.
        </p>
      </LegalSection>

      <LegalSection title="Refunds">
        <p>
          Refunds are issued to the original payment method after we receive and
          inspect an approved return, or sooner when we agree a refund without
          return. Processing can take several business days depending on your
          bank or card provider.
        </p>
      </LegalSection>

      <LegalSection title="Lost or delayed parcels">
        <p>
          If tracking stalls for an extended period, contact us and we will
          investigate with the carrier. Outcomes depend on the investigation —
          replacement, refund, or continued transit — and we will keep you
          updated.
        </p>
      </LegalSection>

      <LegalSection title="Need help?">
        <p>
          Reach {brand} support{" "}
          {email ? (
            <>
              at{" "}
              <a
                href={`mailto:${email}`}
                className="text-accent underline-offset-4 hover:underline"
              >
                {email}
              </a>
            </>
          ) : (
            <>
              on our{" "}
              <Link
                href="/contact"
                className="text-accent underline-offset-4 hover:underline"
              >
                contact page
              </Link>
            </>
          )}
          . Include your order number so we can help quickly.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
