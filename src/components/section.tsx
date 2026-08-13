import type { ReactNode } from "react";

type SectionProps = {
  children: ReactNode;
  className?: string;
  id?: string;
};

/**
 * Editorial section with no background of its own — the page aurora shows
 * through, so there is no hard transition at the edges.
 */
export function AmbientSection({ children, className = "", id }: SectionProps) {
  return (
    <section id={id} className={`ambient-section ${className}`}>
      {children}
    </section>
  );
}

/** Hairline rule that fades out at both ends. */
export function SectionRule({ className = "" }: { className?: string }) {
  return (
    <div className={`mx-auto w-full max-w-6xl px-5 sm:px-8 ${className}`}>
      <div className="section-rule" aria-hidden />
    </div>
  );
}
