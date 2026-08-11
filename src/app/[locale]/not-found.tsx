import Link from "next/link";
import { cookies } from "next/headers";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import {
  defaultLocale,
  isLocale,
  localePath,
  LOCALE_COOKIE,
} from "@/lib/i18n/locales";

export default async function NotFound() {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale =
    cookieLocale && isLocale(cookieLocale) ? cookieLocale : defaultLocale;
  const dict = await getDictionary(locale);

  return (
    <div className="mx-auto flex min-h-[50vh] w-full max-w-6xl flex-col items-start justify-center px-5 pb-16 pt-28 sm:px-8 sm:pt-32">
      <h1 className="font-display text-4xl tracking-tight">
        {dict.notFound.title}
      </h1>
      <p className="mt-3 text-muted">{dict.notFound.body}</p>
      <Link
        href={localePath(locale, "/products")}
        className="mt-6 text-sm font-medium text-accent underline-offset-4 hover:underline"
      >
        {dict.notFound.cta}
      </Link>
    </div>
  );
}
