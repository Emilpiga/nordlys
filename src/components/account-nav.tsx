import { LocaleLink } from "@/components/locale-link";

type AccountNavProps = {
  labels: {
    account: string;
    orders: string;
    wishlist: string;
    logout: string;
  };
  locale: string;
  active?: "account" | "orders" | "wishlist";
};

export function AccountNav({ labels, locale, active }: AccountNavProps) {
  const linkClass = (key: typeof active) =>
    `text-[0.72rem] font-medium tracking-[0.12em] uppercase transition ${
      active === key ? "text-foreground" : "text-muted hover:text-foreground"
    }`;

  return (
    <nav className="flex flex-wrap items-center gap-5 border-b border-border/60 pb-5">
      <LocaleLink href="/account" className={linkClass("account")}>
        {labels.account}
      </LocaleLink>
      <LocaleLink href="/account/orders" className={linkClass("orders")}>
        {labels.orders}
      </LocaleLink>
      <LocaleLink href="/account/wishlist" className={linkClass("wishlist")}>
        {labels.wishlist}
      </LocaleLink>
      <a
        href={`/api/auth/logout?locale=${encodeURIComponent(locale)}`}
        className="ml-auto text-[0.72rem] font-medium tracking-[0.12em] uppercase text-muted transition hover:text-foreground"
      >
        {labels.logout}
      </a>
    </nav>
  );
}
