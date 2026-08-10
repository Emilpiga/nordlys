import { SectionRule } from "@/components/section";
import { SiteLogo } from "@/components/site-logo";

export function SiteFooter() {
  return (
    <footer className="mt-auto">
      <SectionRule />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-5 py-14 text-sm text-muted sm:flex-row sm:items-end sm:justify-between sm:px-8">
        <div>
          <SiteLogo size="footer" />
          <p className="mt-4 max-w-sm leading-relaxed">
            Nordic skincare rituals for women who prefer calm formulas and clear
            skin.
          </p>
        </div>
        <p className="text-[0.75rem] tracking-[0.12em] uppercase">
          Ships worldwide
        </p>
      </div>
    </footer>
  );
}
