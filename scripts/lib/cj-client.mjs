#!/usr/bin/env node
/**
 * CJ Dropshipping API client (QPS-aware, retries on 1600200).
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { sleep } from "./shopify-admin.mjs";

export const CJ_BASE = "https://developers.cjdropshipping.com/api2.0/v1";

export function loadCjApiKey(cwd = process.cwd()) {
  if (process.env.CJ_API_KEY?.trim()) return process.env.CJ_API_KEY.trim();
  const path = resolve(cwd, "../../harbor/.cj-credentials.local.json");
  if (!existsSync(path)) {
    throw new Error(
      "Set CJ_API_KEY or create harbor/.cj-credentials.local.json with { apiKey }",
    );
  }
  const creds = JSON.parse(readFileSync(path, "utf8"));
  if (!creds.apiKey) throw new Error("CJ credentials file has no apiKey");
  return creds.apiKey;
}

export async function createCjClient({
  apiKey,
  // Free-tier CJ accounts are typically 1 QPS.
  minIntervalMs = 1100,
} = {}) {
  const key = apiKey || loadCjApiKey();
  let accessToken = "";
  let lastCall = 0;

  async function pause() {
    const wait = minIntervalMs - (Date.now() - lastCall);
    if (wait > 0) await sleep(wait);
  }

  async function ensureToken() {
    if (accessToken) return accessToken;
    await pause();
    const res = await fetch(`${CJ_BASE}/authentication/getAccessToken`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey: key }),
    });
    lastCall = Date.now();
    const json = await res.json();
    if (!json.data?.accessToken) {
      throw new Error(`CJ auth failed: ${json.message || res.status}`);
    }
    accessToken = json.data.accessToken;
    return accessToken;
  }

  async function request(path, { method = "GET", body, attempt = 1 } = {}) {
    const token = await ensureToken();
    await pause();
    const res = await fetch(`${CJ_BASE}${path}`, {
      method,
      headers: {
        "CJ-Access-Token": token,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    lastCall = Date.now();
    const json = await res.json();
    const rateLimited =
      json.code === 1600200 || /too many requests/i.test(json.message || "");
    if (rateLimited && attempt < 5) {
      await sleep(minIntervalMs * attempt + 250);
      return request(path, { method, body, attempt: attempt + 1 });
    }
    if (
      json.result === false ||
      (json.code && json.code !== 200 && json.code !== 0)
    ) {
      throw new Error(`CJ ${path} failed (${json.code}): ${json.message}`);
    }
    return json.data;
  }

  return {
    get: (path) => request(path, { method: "GET" }),
    post: (path, body) => request(path, { method: "POST", body }),
    request,
  };
}

export function variantStockTotal(inventories) {
  if (!Array.isArray(inventories)) return 0;
  return inventories.reduce(
    (sum, row) => sum + Number(row.totalInventory ?? row.cjInventory ?? 0),
    0,
  );
}

/** Sum warehouse totals from /product/stock/queryByVid. */
export function stockRowsTotal(rows) {
  if (!Array.isArray(rows)) return 0;
  return rows.reduce(
    (sum, row) => sum + Number(row.totalInventoryNum || row.storageNum || 0),
    0,
  );
}

export function splitVariantKey(variantKey) {
  const parts = String(variantKey || "")
    .split("-")
    .map((part) => part.trim())
    .filter(Boolean);
  if (!parts.length) return { color: "Default", size: "One" };
  if (parts.length === 1) return { color: parts[0], size: "One" };
  const size = parts.pop();
  return { color: parts.join("-"), size };
}

export function pickCheapestFreight(options) {
  const usable = (Array.isArray(options) ? options : [])
    .filter((option) => option.logisticName && Number(option.logisticPrice) > 0)
    .sort((a, b) => Number(a.logisticPrice) - Number(b.logisticPrice));
  return usable[0] || null;
}
