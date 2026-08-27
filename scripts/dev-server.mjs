#!/usr/bin/env node
// Start `next dev` on the preferred port, or the next free one if it is busy.
// Reuse a live server for this project; replace a hung one that still holds the port.

import { execFileSync, spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { request as httpRequest } from "node:http";
import { createServer } from "node:net";
import { join } from "node:path";

const DEFAULT_PORT = 3000;
const MAX_TRIES = 20;
const HEALTH_TIMEOUT_MS = 2500;
const LOCK_PATH = join(process.cwd(), ".next/dev/lock");

function parsePortFlag(argv) {
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "-p" || arg === "--port") {
      return { port: Number(argv[i + 1]), skip: [i, i + 1] };
    }
    if (arg.startsWith("--port=")) {
      return { port: Number(arg.slice("--port=".length)), skip: [i] };
    }
  }
  return { port: null, skip: [] };
}

function preferredPort(flagPort) {
  if (Number.isInteger(flagPort) && flagPort > 0) return flagPort;
  const fromEnv = Number(process.env.PORT);
  if (Number.isInteger(fromEnv) && fromEnv > 0) return fromEnv;
  return DEFAULT_PORT;
}

function isPidAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error?.code === "EPERM";
  }
}

function lockfileServer() {
  try {
    const info = JSON.parse(readFileSync(LOCK_PATH, "utf8"));
    if (!info || !isPidAlive(info.pid)) return null;
    return info;
  } catch {
    return null;
  }
}

function responds(url, timeoutMs = HEALTH_TIMEOUT_MS) {
  return new Promise((resolve) => {
    const req = httpRequest(url, { method: "GET", timeout: timeoutMs }, (res) => {
      res.resume();
      resolve(true);
    });
    req.on("error", () => resolve(false));
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
    req.end();
  });
}

function stopPid(pid) {
  try {
    if (process.platform === "win32") {
      execFileSync("taskkill", ["/PID", String(pid), "/T", "/F"], {
        stdio: "ignore",
      });
    } else {
      process.kill(pid, "SIGTERM");
    }
  } catch {
    // already gone
  }
}

function canListen(port) {
  return new Promise((resolve) => {
    const server = createServer();
    server.unref();
    server.on("error", () => resolve(false));
    server.listen(port, () => {
      server.close((error) => resolve(!error));
    });
  });
}

async function waitUntilFree(port, timeoutMs = 5000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await canListen(port)) return true;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return canListen(port);
}

async function firstFreePort(start) {
  for (let offset = 0; offset < MAX_TRIES; offset += 1) {
    const port = start + offset;
    if (await canListen(port)) return port;
  }
  throw new Error(
    `No free port found between ${start} and ${start + MAX_TRIES - 1}.`,
  );
}

const existing = lockfileServer();
if (existing) {
  const url = existing.appUrl || `http://127.0.0.1:${existing.port}`;
  if (await responds(url)) {
    console.log(`Next.js is already running at ${url} (pid ${existing.pid}).`);
    process.exit(0);
  }

  console.log(
    `Next.js pid ${existing.pid} is still bound to ${url} but not responding. Restarting.`,
  );
  stopPid(existing.pid);
  if (existing.port) await waitUntilFree(existing.port);
}

const argv = process.argv.slice(2);
const { port: flagPort, skip } = parsePortFlag(argv);
const rest = argv.filter((_, index) => !skip.includes(index));
const wanted = preferredPort(flagPort);
const port = await firstFreePort(wanted);

if (port !== wanted) {
  console.log(`Port ${wanted} is busy, using ${port} instead.`);
}

const nextBin = join(process.cwd(), "node_modules/next/dist/bin/next");
const child = spawn(
  process.execPath,
  [nextBin, "dev", "-p", String(port), ...rest],
  {
    stdio: "inherit",
    env: { ...process.env, PORT: String(port) },
  },
);

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
