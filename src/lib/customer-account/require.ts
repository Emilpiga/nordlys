import { redirect } from "next/navigation";
import {
  getCustomerProfile,
  isCustomerAccountConfigured,
  isCustomerLoggedIn,
} from "@/lib/customer-account";
import { localePath } from "@/lib/i18n/locales";

export async function requireCustomer(locale: string) {
  if (!isCustomerAccountConfigured()) {
    return { configured: false as const, customer: null };
  }

  const loggedIn = await isCustomerLoggedIn();
  if (!loggedIn) {
    const returnTo = localePath(locale, "/account");
    redirect(
      `/api/auth/login?locale=${encodeURIComponent(locale)}&return_to=${encodeURIComponent(returnTo)}`,
    );
  }

  const customer = await getCustomerProfile();
  if (!customer) {
    redirect(
      `/api/auth/login?locale=${encodeURIComponent(locale)}&return_to=${encodeURIComponent(localePath(locale, "/account"))}`,
    );
  }

  return { configured: true as const, customer };
}
