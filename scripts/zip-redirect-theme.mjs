#!/usr/bin/env node
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { cwd } from "node:process";

const SKIP = new Set([".git", "node_modules", ".DS_Store"]);
const themeRoot = resolve(cwd(), "shopify-redirect-theme");
const outFile = resolve(cwd(), "shopify-redirect-theme.zip");

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

function crc32(buf) {
  let crc = ~0;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return ~crc >>> 0;
}

function u16(n) {
  const b = Buffer.alloc(2);
  b.writeUInt16LE(n);
  return b;
}

function u32(n) {
  const b = Buffer.alloc(4);
  b.writeUInt32LE(n);
  return b;
}

const files = walk(themeRoot);
const locals = [];
const central = [];
let offset = 0;

for (const full of files) {
  const name = relative(themeRoot, full).replaceAll("\\", "/");
  const data = readFileSync(full);
  const crc = crc32(data);
  const nameBuf = Buffer.from(name, "utf8");
  const local = Buffer.concat([
    Buffer.from([0x50, 0x4b, 0x03, 0x04]),
    u16(20),
    u16(0),
    u16(0),
    u16(0),
    u16(0),
    u32(crc),
    u32(data.length),
    u32(data.length),
    u16(nameBuf.length),
    u16(0),
    nameBuf,
    data,
  ]);
  locals.push(local);
  central.push(
    Buffer.concat([
      Buffer.from([0x50, 0x4b, 0x01, 0x02]),
      u16(20),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(data.length),
      u32(data.length),
      u16(nameBuf.length),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(0),
      u32(offset),
      nameBuf,
    ]),
  );
  offset += local.length;
}

const centralBuf = Buffer.concat(central);
writeFileSync(
  outFile,
  Buffer.concat([
    ...locals,
    centralBuf,
    Buffer.concat([
      Buffer.from([0x50, 0x4b, 0x05, 0x06]),
      u16(0),
      u16(0),
      u16(files.length),
      u16(files.length),
      u32(centralBuf.length),
      u32(offset),
      u16(0),
    ]),
  ]),
);

console.log(`Wrote ${relative(cwd(), outFile)} (${files.length} files)`);
