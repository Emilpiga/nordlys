"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { useDictionary } from "@/components/dictionary-provider";
import { localePath } from "@/lib/i18n/locales";

type LocaleLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  href: string;
};

/** Next Link that prefixes the active locale. Absolute http(s) and hash urls pass through. */
export function LocaleLink({ href, ...props }: LocaleLinkProps) {
  const { locale } = useDictionary();
  const localized =
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("mailto:") ||
    href.startsWith("#")
      ? href
      : localePath(locale, href);

  return <Link href={localized} {...props} />;
}
