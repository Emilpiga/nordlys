import { cookies } from "next/headers";

export const WELCOME_DEAL_COOKIE = "welcome_deal";
export const WELCOME_DEAL_PERCENT = 10;
export const WELCOME_DEAL_DECLINE_DAYS = 14;

export type WelcomeDealStatus = "eligible" | "accepted" | "declined" | "used";

const COOKIE_BASE = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
};

function cleanEnv(value: string | undefined) {
  return value?.trim().replace(/^["']|["']$/g, "") ?? "";
}

/** Shopify discount code created in Admin. Override with SHOPIFY_WELCOME_DISCOUNT_CODE. */
export function getWelcomeDiscountCode() {
  return cleanEnv(process.env.SHOPIFY_WELCOME_DISCOUNT_CODE) || "VARDAG10";
}

function parseStatus(raw: string | undefined): WelcomeDealStatus | null {
  if (raw === "accepted" || raw === "declined" || raw === "used") return raw;
  return null;
}

export async function getWelcomeDealStatus(): Promise<WelcomeDealStatus> {
  const cookieStore = await cookies();
  return parseStatus(cookieStore.get(WELCOME_DEAL_COOKIE)?.value) ?? "eligible";
}

export async function isWelcomeDealEligible() {
  return (await getWelcomeDealStatus()) === "eligible";
}

export async function getAcceptedWelcomeDiscountCodes() {
  if ((await getWelcomeDealStatus()) !== "accepted") return [];
  const code = getWelcomeDiscountCode();
  return code ? [code] : [];
}

export function cartHasWelcomeCode(
  cart: { discountCodes: { code: string; applicable: boolean }[] },
  code = getWelcomeDiscountCode(),
) {
  const needle = code.toLowerCase();
  return cart.discountCodes.some((entry) => entry.code.toLowerCase() === needle);
}

export function cartWelcomeCodeApplicable(
  cart: { discountCodes: { code: string; applicable: boolean }[] },
  code = getWelcomeDiscountCode(),
) {
  const needle = code.toLowerCase();
  return cart.discountCodes.some(
    (entry) => entry.code.toLowerCase() === needle && entry.applicable,
  );
}

async function writeStatus(status: Exclude<WelcomeDealStatus, "eligible">, maxAge: number) {
  const cookieStore = await cookies();
  cookieStore.set(WELCOME_DEAL_COOKIE, status, { ...COOKIE_BASE, maxAge });
}

export async function setWelcomeDealAccepted() {
  await writeStatus("accepted", 60 * 60 * 24 * 365);
}

export async function setWelcomeDealDeclined() {
  await writeStatus("declined", 60 * 60 * 24 * WELCOME_DEAL_DECLINE_DAYS);
}

export async function setWelcomeDealUsed() {
  await writeStatus("used", 60 * 60 * 24 * 365);
}
