import type { ReactNode } from "react";

type LegalPageProps = {
  title: string;
  description: string;
  updated: string;
  children: ReactNode;
};

export function LegalPage({
  title,
  description,
  updated,
  children,
}: LegalPageProps) {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 pb-20 pt-12 sm:px-8 sm:pb-28 sm:pt-16">
      <p className="text-[0.68rem] font-medium tracking-[0.2em] uppercase text-glow">
        {updated}
      </p>
      <h1 className="mt-4 font-display text-5xl font-medium tracking-tight sm:text-6xl">
        {title}
      </h1>
      <p className="mt-5 max-w-xl text-base font-light leading-relaxed text-muted">
        {description}
      </p>
      <div className="legal-prose mt-12 space-y-10 text-base font-light leading-[1.75] text-muted">
        {children}
      </div>
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="font-display text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
        {title}
      </h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

export function LegalFacts({
  items,
}: {
  items: { label: string; value: string }[];
}) {
  const visible = items.filter((item) => item.value.trim());
  if (!visible.length) return null;

  return (
    <ul className="space-y-2">
      {visible.map((item) => (
        <li key={item.label}>
          <span className="text-foreground">{item.label}:</span> {item.value}
        </li>
      ))}
    </ul>
  );
}
