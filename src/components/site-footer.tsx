import Link from "next/link";
import { CookieSettingsButton } from "@/components/cookie-banner";
import { SectionRule } from "@/components/section";
import { SiteLogo } from "@/components/site-logo";
import { shopifyConfig } from "@/lib/shopify/config";

const linkClass =
  "text-sm font-light text-muted transition hover:text-foreground";

const headingClass =
  "text-[0.68rem] font-medium tracking-[0.18em] uppercase text-blush";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-auto overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(213,224,228,0.55)_0%,transparent_55%),radial-gradient(ellipse_at_90%_100%,rgba(154,111,105,0.08)_0%,transparent_45%)]"
      />

      <SectionRule />

      <div className="relative mx-auto w-full max-w-6xl px-5 pb-10 pt-16 sm:px-8 sm:pb-12 sm:pt-20">
        <div className="grid gap-14 lg:grid-cols-[1.35fr_1fr] lg:gap-20">
          <div className="max-w-md">
            <Link
              href="/"
              aria-label={shopifyConfig.storeName}
              className="inline-flex"
            >
              <SiteLogo size="footer" />
            </Link>
            <p className="mt-7 font-display text-3xl font-medium leading-[1.2] tracking-tight text-foreground sm:text-4xl">
              Soft formulas for northern light.
            </p>
            <p className="mt-4 max-w-sm text-sm font-light leading-relaxed text-muted">
              Everyday skincare with a quieter glow — moisture, clarity, and
              calm skin.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 sm:gap-8">
            <div>
              <p className={headingClass}>Shop</p>
              <ul className="mt-4 space-y-3">
                <li>
                  <Link href="/products" className={linkClass}>
                    Collection
                  </Link>
                </li>
                <li>
                  <Link href="/cart" className={linkClass}>
                    Bag
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className={headingClass}>Help</p>
              <ul className="mt-4 space-y-3">
                <li>
                  <Link href="/returns" className={linkClass}>
                    Shipping & returns
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className={linkClass}>
                    Contact
                  </Link>
                </li>
                <CookieSettingsButton
                  asListItem
                  className={`${linkClass} text-left`}
                />
              </ul>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <p className={headingClass}>Legal</p>
              <ul className="mt-4 space-y-3">
                <li>
                  <Link href="/privacy" className={linkClass}>
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className={linkClass}>
                    Terms
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-border/60 pt-8 text-[0.72rem] font-light tracking-[0.08em] text-muted sm:mt-20 sm:flex-row sm:items-center sm:justify-between sm:tracking-[0.12em]">
          <p>
            © {year} {shopifyConfig.storeName}
          </p>
          <p className="uppercase">Ships worldwide · Tracking on every order</p>
        </div>
      </div>
    </footer>
  );
}
