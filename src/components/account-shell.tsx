import type { ReactNode } from "react";
import { AccountNav } from "@/components/account-nav";
import { LocaleLink } from "@/components/locale-link";

export type AccountNavLabels = {
  account: string;
  orders: string;
  wishlist: string;
  logout: string;
};

type AccountShellProps = {
  locale: string;
  eyebrow: string;
  title: string;
  description?: string | null;
  active?: "account" | "orders" | "wishlist";
  labels?: AccountNavLabels;
  /** Wider content area (wishlist grid). Header/nav stay aligned. */
  wide?: boolean;
  children: ReactNode;
};

export function AccountShell({
  locale,
  eyebrow,
  title,
  description,
  active,
  labels,
  wide = false,
  children,
}: AccountShellProps) {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-20 pt-12 sm:px-8 sm:pb-28 sm:pt-16">
      <header className="max-w-3xl">
        <p className="text-[0.68rem] font-medium tracking-[0.2em] uppercase text-glow">
          {eyebrow}
        </p>
        <h1 className="mt-4 font-display text-5xl font-medium tracking-tight sm:text-6xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-5 max-w-xl text-base font-light leading-relaxed text-muted">
            {description}
          </p>
        ) : null}
      </header>

      {labels && active ? (
        <div className="mt-10 max-w-3xl">
          <AccountNav locale={locale} active={active} labels={labels} />
        </div>
      ) : null}

      <div className={`mt-10 ${wide ? "" : "max-w-3xl"}`}>{children}</div>
    </div>
  );
}

export function AccountEmptyState({
  body,
  cta,
  href,
}: {
  body: string;
  cta: string;
  href: string;
}) {
  return (
    <div className="space-y-5">
      <p className="text-base font-light leading-relaxed text-muted">{body}</p>
      <LocaleLink href={href} className="btn-primary inline-flex">
        {cta}
      </LocaleLink>
    </div>
  );
}

export function AccountSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-[0.68rem] font-medium tracking-[0.2em] uppercase text-glow">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function AccountLinkRow({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <LocaleLink
      href={href}
      className="group flex items-center justify-between border-b border-border/60 py-4 text-base transition hover:text-accent"
    >
      <span className="font-light">{label}</span>
      <span
        aria-hidden
        className="text-muted transition group-hover:text-accent"
      >
        →
      </span>
    </LocaleLink>
  );
}
