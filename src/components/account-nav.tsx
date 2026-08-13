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
  const items = [
    { key: "account" as const, href: "/account", label: labels.account },
    { key: "orders" as const, href: "/account/orders", label: labels.orders },
    {
      key: "wishlist" as const,
      href: "/account/wishlist",
      label: labels.wishlist,
    },
  ];

  return (
    <nav
      aria-label={labels.account}
      className="flex flex-wrap items-center gap-x-1 gap-y-2 border-b border-border/60"
    >
      {items.map((item) => {
        const isActive = active === item.key;
        return (
          <LocaleLink
            key={item.key}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={`relative -mb-px border-b-2 px-3 pb-3.5 pt-1 text-[0.72rem] font-medium tracking-[0.12em] uppercase transition ${
              isActive
                ? "border-foreground text-foreground"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {item.label}
          </LocaleLink>
        );
      })}
      <a
        href={`/api/auth/logout?locale=${encodeURIComponent(locale)}`}
        className="ml-auto px-1 pb-3.5 text-[0.72rem] font-medium tracking-[0.12em] uppercase text-muted transition hover:text-foreground"
      >
        {labels.logout}
      </a>
    </nav>
  );
}
