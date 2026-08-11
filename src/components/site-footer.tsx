"use client";

import { useDictionary } from "@/components/dictionary-provider";
import { LocaleLink } from "@/components/locale-link";
import { SectionRule } from "@/components/section";
import { SiteLogo } from "@/components/site-logo";
import { shopifyConfig } from "@/lib/shopify/config";

const linkClass =
  "text-sm font-light text-muted transition hover:text-foreground";

const headingClass =
  "text-[0.68rem] font-medium tracking-[0.18em] uppercase text-glow";

export function SiteFooter() {
  const { dict, t } = useDictionary();
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-auto overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(229,221,210,0.55)_0%,transparent_55%),radial-gradient(ellipse_at_90%_100%,rgba(176,138,74,0.1)_0%,transparent_45%)]"
      />

      <SectionRule />

      <div className="relative mx-auto w-full max-w-6xl px-5 pb-10 pt-16 sm:px-8 sm:pb-12 sm:pt-20">
        <div className="grid gap-14 lg:grid-cols-[1.35fr_1fr] lg:gap-20">
          <div className="max-w-md">
            <LocaleLink
              href="/"
              aria-label={shopifyConfig.storeName}
              className="inline-flex"
            >
              <SiteLogo size="footer" />
            </LocaleLink>
            <p className="mt-7 font-display text-3xl font-medium leading-[1.2] tracking-tight text-foreground sm:text-4xl">
              {dict.footer.tagline}
            </p>
            <p className="mt-4 max-w-sm text-sm font-light leading-relaxed text-muted">
              {dict.footer.blurb}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 sm:gap-8">
            <div>
              <p className={headingClass}>{dict.footer.shopHeading}</p>
              <ul className="mt-4 space-y-3">
                <li>
                  <LocaleLink href="/products" className={linkClass}>
                    {dict.footer.collection}
                  </LocaleLink>
                </li>
                <li>
                  <LocaleLink href="/cart" className={linkClass}>
                    {dict.footer.cart}
                  </LocaleLink>
                </li>
              </ul>
            </div>

            <div>
              <p className={headingClass}>{dict.footer.helpHeading}</p>
              <ul className="mt-4 space-y-3">
                <li>
                  <LocaleLink href="/about" className={linkClass}>
                    {dict.footer.about}
                  </LocaleLink>
                </li>
                <li>
                  <LocaleLink href="/faq" className={linkClass}>
                    {dict.footer.faq}
                  </LocaleLink>
                </li>
                <li>
                  <LocaleLink href="/returns" className={linkClass}>
                    {dict.footer.shippingReturns}
                  </LocaleLink>
                </li>
                <li>
                  <LocaleLink href="/contact" className={linkClass}>
                    {dict.footer.contact}
                  </LocaleLink>
                </li>
              </ul>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <p className={headingClass}>{dict.footer.legalHeading}</p>
              <ul className="mt-4 space-y-3">
                <li>
                  <LocaleLink href="/privacy" className={linkClass}>
                    {dict.footer.privacy}
                  </LocaleLink>
                </li>
                <li>
                  <LocaleLink href="/terms" className={linkClass}>
                    {dict.footer.terms}
                  </LocaleLink>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-border/60 pt-8 text-[0.72rem] font-light tracking-[0.08em] text-muted sm:mt-20 sm:flex-row sm:items-center sm:justify-between sm:tracking-[0.12em]">
          <p>
            © {year} {shopifyConfig.storeName}
          </p>
          <p className="uppercase">
            {t(dict.footer.shippingBadge, {
              eta: dict.fulfillment.etaShort,
            })}
          </p>
        </div>
      </div>
    </footer>
  );
}
