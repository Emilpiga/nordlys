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
              Mjuka formler för nordiskt ljus.
            </p>
            <p className="mt-4 max-w-sm text-sm font-light leading-relaxed text-muted">
              Vardaglig hudvård med en lugnare lyster — fukt, klarhet och
              balanserad hy.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 sm:gap-8">
            <div>
              <p className={headingClass}>Shoppa</p>
              <ul className="mt-4 space-y-3">
                <li>
                  <Link href="/products" className={linkClass}>
                    Kollektion
                  </Link>
                </li>
                <li>
                  <Link href="/cart" className={linkClass}>
                    Kasse
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className={headingClass}>Hjälp</p>
              <ul className="mt-4 space-y-3">
                <li>
                  <Link href="/returns" className={linkClass}>
                    Frakt & returer
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className={linkClass}>
                    Kontakt
                  </Link>
                </li>
                <CookieSettingsButton
                  asListItem
                  className={`${linkClass} text-left`}
                />
              </ul>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <p className={headingClass}>Juridiskt</p>
              <ul className="mt-4 space-y-3">
                <li>
                  <Link href="/privacy" className={linkClass}>
                    Integritet
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className={linkClass}>
                    Villkor
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
          <p className="uppercase">
            Frakt världen över · Spårning på varje order
          </p>
        </div>
      </div>
    </footer>
  );
}
