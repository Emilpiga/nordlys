"use client";

import { useDictionary } from "@/components/dictionary-provider";
import { LocaleLink } from "@/components/locale-link";

/** One short line under the buy buttons: shipping, tracking, returns. */
export function ProductTrust() {
  const { dict, t } = useDictionary();
  const items = [
    t(dict.products.secureEta, { processing: dict.fulfillment.processingShort }),
    dict.trust.trackingShort,
    dict.trust.returnsShort,
  ];

  return (
    <p className="text-center text-xs font-light leading-relaxed text-muted">
      {items.join(" · ")}
      {" · "}
      <LocaleLink
        href="/returns"
        className="underline underline-offset-4 transition hover:text-accent"
      >
        {dict.trust.shippingMore}
      </LocaleLink>
    </p>
  );
}
