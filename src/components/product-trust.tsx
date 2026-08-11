"use client";

import { useDictionary } from "@/components/dictionary-provider";
import { LocaleLink } from "@/components/locale-link";

export function ProductTrust() {
  const { dict, t } = useDictionary();

  const items = [
    {
      title: dict.trust.shippingTitle,
      body: (
        <>
          {t(dict.trust.shippingBody, { eta: dict.fulfillment.etaShort })}{" "}
          <LocaleLink
            href="/returns"
            className="underline-offset-4 transition hover:text-accent hover:underline"
          >
            {dict.trust.shippingMore}
          </LocaleLink>
        </>
      ),
    },
    {
      title: dict.trust.trackingTitle,
      body: dict.trust.trackingBody,
    },
    {
      title: dict.trust.safetyTitle,
      body: (
        <>
          {dict.trust.safetyBody}{" "}
          <LocaleLink
            href="/faq"
            className="underline-offset-4 transition hover:text-accent hover:underline"
          >
            {dict.trust.faqLink}
          </LocaleLink>
        </>
      ),
    },
  ];

  return (
    <ul className="space-y-3.5 border-t border-border/70 pt-6">
      {items.map((item) => (
        <li key={item.title} className="flex gap-3 text-sm">
          <span
            aria-hidden
            className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
          />
          <div>
            <p className="text-[0.68rem] font-medium tracking-[0.16em] uppercase text-muted">
              {item.title}
            </p>
            <p className="mt-1 font-light leading-relaxed text-foreground/90">
              {item.body}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
