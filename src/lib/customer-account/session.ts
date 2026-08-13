import { cookies } from "next/headers";
import { AUTH_COOKIES, customerAccountConfig } from "./config";
import { getOpenIdConfiguration } from "./discovery";

export type CustomerTokens = {
  accessToken: string;
  refreshToken: string;
  idToken: string | null;
  expiresAt: number;
};

const COOKIE_BASE = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
};

function confidentialAuthHeader() {
  const credentials = Buffer.from(
    `${customerAccountConfig.clientId}:${customerAccountConfig.clientSecret}`,
    "utf8",
  ).toString("base64");
  return `Basic ${credentials}`;
}

export async function setOAuthPendingCookies(input: {
  state: string;
  nonce: string;
  verifier: string;
  returnTo: string;
}) {
  const cookieStore = await cookies();
  const maxAge = 60 * 10;
  cookieStore.set(AUTH_COOKIES.state, input.state, { ...COOKIE_BASE, maxAge });
  cookieStore.set(AUTH_COOKIES.nonce, input.nonce, { ...COOKIE_BASE, maxAge });
  cookieStore.set(AUTH_COOKIES.verifier, input.verifier, {
    ...COOKIE_BASE,
    maxAge,
  });
  cookieStore.set(AUTH_COOKIES.returnTo, input.returnTo, {
    ...COOKIE_BASE,
    maxAge,
  });
}

export async function readOAuthPendingCookies() {
  const cookieStore = await cookies();
  return {
    state: cookieStore.get(AUTH_COOKIES.state)?.value ?? null,
    nonce: cookieStore.get(AUTH_COOKIES.nonce)?.value ?? null,
    verifier: cookieStore.get(AUTH_COOKIES.verifier)?.value ?? null,
    returnTo: cookieStore.get(AUTH_COOKIES.returnTo)?.value ?? null,
  };
}

export async function clearOAuthPendingCookies() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIES.state);
  cookieStore.delete(AUTH_COOKIES.nonce);
  cookieStore.delete(AUTH_COOKIES.verifier);
  cookieStore.delete(AUTH_COOKIES.returnTo);
}

export async function writeCustomerTokens(tokens: CustomerTokens) {
  const cookieStore = await cookies();
  const maxAge = 60 * 60 * 24 * 30;
  cookieStore.set(AUTH_COOKIES.accessToken, tokens.accessToken, {
    ...COOKIE_BASE,
    maxAge,
  });
  cookieStore.set(AUTH_COOKIES.refreshToken, tokens.refreshToken, {
    ...COOKIE_BASE,
    maxAge,
  });
  cookieStore.set(AUTH_COOKIES.expiresAt, String(tokens.expiresAt), {
    ...COOKIE_BASE,
    maxAge,
  });
  if (tokens.idToken) {
    cookieStore.set(AUTH_COOKIES.idToken, tokens.idToken, {
      ...COOKIE_BASE,
      maxAge,
    });
  }
}

export async function clearCustomerTokens() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIES.accessToken);
  cookieStore.delete(AUTH_COOKIES.refreshToken);
  cookieStore.delete(AUTH_COOKIES.expiresAt);
  cookieStore.delete(AUTH_COOKIES.idToken);
}

export async function readCustomerTokens(): Promise<CustomerTokens | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(AUTH_COOKIES.accessToken)?.value;
  const refreshToken = cookieStore.get(AUTH_COOKIES.refreshToken)?.value;
  const expiresRaw = cookieStore.get(AUTH_COOKIES.expiresAt)?.value;
  const idToken = cookieStore.get(AUTH_COOKIES.idToken)?.value ?? null;

  if (!accessToken || !refreshToken || !expiresRaw) return null;
  const expiresAt = Number(expiresRaw);
  if (!Number.isFinite(expiresAt)) return null;

  return { accessToken, refreshToken, idToken, expiresAt };
}

type TokenResponse = {
  access_token: string;
  expires_in: number;
  id_token?: string;
  refresh_token: string;
};

export async function exchangeAuthorizationCode(input: {
  code: string;
  verifier?: string;
}): Promise<CustomerTokens> {
  const openId = await getOpenIdConfiguration();
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: customerAccountConfig.clientId,
    redirect_uri: customerAccountConfig.callbackUrl,
    code: input.code,
  });
  if (input.verifier) {
    body.set("code_verifier", input.verifier);
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
    "User-Agent": "HarborStorefront",
  };
  if (customerAccountConfig.clientSecret) {
    headers.Authorization = confidentialAuthHeader();
  }

  const response = await fetch(openId.token_endpoint, {
    method: "POST",
    headers,
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Token exchange failed (${response.status}): ${text}`);
  }

  const json = (await response.json()) as TokenResponse;
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    idToken: json.id_token ?? null,
    expiresAt: Date.now() + json.expires_in * 1000,
  };
}

export async function refreshCustomerTokens(
  refreshToken: string,
): Promise<CustomerTokens> {
  const openId = await getOpenIdConfiguration();
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: customerAccountConfig.clientId,
    refresh_token: refreshToken,
  });

  const response = await fetch(openId.token_endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: confidentialAuthHeader(),
      "User-Agent": "HarborStorefront",
    },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Token refresh failed (${response.status}): ${text}`);
  }

  const json = (await response.json()) as TokenResponse;
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token || refreshToken,
    idToken: json.id_token ?? null,
    expiresAt: Date.now() + json.expires_in * 1000,
  };
}

function isCookieMutationError(error: unknown) {
  if (!(error instanceof Error)) return false;
  return error.message.includes(
    "Cookies can only be modified in a Server Action or Route Handler",
  );
}

/** Persist auth cookies when allowed; no-op during Server Component renders. */
export async function writeCustomerTokensSafe(tokens: CustomerTokens) {
  try {
    await writeCustomerTokens(tokens);
    return true;
  } catch (error) {
    if (isCookieMutationError(error)) return false;
    throw error;
  }
}

async function clearCustomerTokensSafe() {
  try {
    await clearCustomerTokens();
  } catch (error) {
    if (!isCookieMutationError(error)) throw error;
  }
}

/**
 * Returns a valid access token, refreshing when within 60s of expiry.
 * Cookie persistence is skipped in Server Components (Next.js forbids it);
 * call `/api/auth/refresh` from the client to persist rotated tokens.
 */
export async function getValidAccessToken(): Promise<string | null> {
  const tokens = await readCustomerTokens();
  if (!tokens) return null;

  if (tokens.expiresAt > Date.now() + 60_000) {
    return tokens.accessToken;
  }

  try {
    const next = await refreshCustomerTokens(tokens.refreshToken);
    await writeCustomerTokensSafe(next);
    return next.accessToken;
  } catch (error) {
    console.error("Failed to refresh customer access token:", error);
    await clearCustomerTokensSafe();
    return null;
  }
}

export async function getIdToken(): Promise<string | null> {
  const tokens = await readCustomerTokens();
  return tokens?.idToken ?? null;
}
