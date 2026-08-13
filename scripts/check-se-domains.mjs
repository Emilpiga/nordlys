#!/usr/bin/env node
/**
 * Check .se / .nu domain availability via Internetstiftelsen DAS (free.iis.se).
 *
 *   node scripts/check-se-domains.mjs
 *   node scripts/check-se-domains.mjs --file scripts/domain-candidates.txt
 *   node scripts/check-se-domains.mjs hemstil.se vardagshem.se
 *
 * Official DAS: http://free.iis.se/free?q=example.se
 * Replies: "free", "occupied", or "not_valid". Limit ~34 req/s — we stay well under.
 */

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { domainToASCII } from "node:url";

const DAS = {
  se: "http://free.iis.se/free",
  nu: "http://free.iis.nu/free",
};

const DELAY_MS = 140;
const DEFAULT_LIST = resolve(
  import.meta.dirname,
  "domain-candidates.txt",
);

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseList(text) {
  const seen = new Set();
  const domains = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, "").trim().toLowerCase();
    if (!line) continue;
    const domain = line.includes(".") ? line : `${line}.se`;
    if (seen.has(domain)) continue;
    seen.add(domain);
    domains.push(domain);
  }
  return domains;
}

function dasUrl(domain) {
  const ascii = domainToASCII(domain);
  const tld = ascii.split(".").pop();
  const base = DAS[tld] ?? DAS.se;
  return `${base}?q=${encodeURIComponent(ascii)}`;
}

async function check(domain) {
  const response = await fetch(dasUrl(domain), {
    headers: { Accept: "text/plain" },
  });
  if (!response.ok) {
    throw new Error(`${domain}: HTTP ${response.status}`);
  }
  const body = (await response.text()).trim().toLowerCase();
  const status = body.split(/\s+/)[0];
  if (!["free", "occupied", "not_valid"].includes(status)) {
    throw new Error(`${domain}: unexpected reply "${body}"`);
  }
  return status;
}

async function loadDomains(argv) {
  const fileFlag = argv.indexOf("--file");
  if (fileFlag !== -1) {
    const path = argv[fileFlag + 1];
    if (!path) throw new Error("--file needs a path");
    return parseList(await readFile(path, "utf8"));
  }
  const inline = argv.filter((arg) => !arg.startsWith("--") && arg.includes("."));
  if (inline.length) return parseList(inline.join("\n"));
  return parseList(await readFile(DEFAULT_LIST, "utf8"));
}

async function main() {
  const argv = process.argv.slice(2);
  const domains = await loadDomains(argv);
  if (domains.length === 0) {
    console.error("No domains to check.");
    process.exit(1);
  }

  const free = [];
  const occupied = [];
  const invalid = [];
  const errors = [];

  console.error(`Checking ${domains.length} domains via free.iis.se …\n`);

  for (const [index, domain] of domains.entries()) {
    try {
      const status = await check(domain);
      const mark =
        status === "free" ? "FREE" : status === "occupied" ? "taken" : "invalid";
      console.error(`  [${index + 1}/${domains.length}] ${mark.padEnd(7)} ${domain}`);
      if (status === "free") free.push(domain);
      else if (status === "occupied") occupied.push(domain);
      else invalid.push(domain);
    } catch (error) {
      errors.push({ domain, error: String(error.message ?? error) });
      console.error(`  [${index + 1}/${domains.length}] ERROR   ${domain} (${error.message})`);
    }
    await sleep(DELAY_MS);
  }

  const report = { free, occupied, invalid, errors, checked: domains.length };
  console.log(JSON.stringify(report, null, 2));

  console.error("\n—— available ——");
  if (free.length === 0) console.error("(none)");
  else for (const domain of free) console.error(domain);
  console.error(
    `\n${free.length} free · ${occupied.length} taken · ${invalid.length} invalid · ${errors.length} errors`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
