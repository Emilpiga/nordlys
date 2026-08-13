import { createHash, randomBytes } from "crypto";

export function generateRandomString(bytes = 32) {
  return base64Url(randomBytes(bytes));
}

export function generateCodeVerifier() {
  return generateRandomString(32);
}

export function generateCodeChallenge(verifier: string) {
  return base64Url(createHash("sha256").update(verifier).digest());
}

function base64Url(buffer: Buffer) {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}
