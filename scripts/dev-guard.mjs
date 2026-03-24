#!/usr/bin/env node
/**
 * Fails fast if the dev port is already in use (usually a duplicate dev server).
 * Invoked from each app's package.json predev hook.
 *
 * Usage: node ../../scripts/dev-guard.mjs <port> [appLabel]
 */
import { execSync } from "node:child_process";
import net from "node:net";
import process from "node:process";

const port = Number(process.argv[2]);
const label = process.argv[3] ?? "Dev server";

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error("dev-guard: pass a valid port as the first argument (e.g. 3000).");
  process.exit(1);
}

function portIsFree() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.once("error", (err) => {
      if (err && err.code === "EADDRINUSE") resolve(false);
      else reject(err);
    });
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, "127.0.0.1");
  });
}

let free;
try {
  free = await portIsFree();
} catch (err) {
  console.error("dev-guard: could not check port:", err instanceof Error ? err.message : err);
  process.exit(1);
}

if (!free) {
  let extra = "";
  try {
    const pid = execSync(`lsof -ti:tcp:${port} -sTCP:LISTEN -n`, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "ignore"],
    }).trim();
    if (pid) {
      extra = `\nListening PID(s): ${pid.replace(/\n/g, ", ")}`;
    }
  } catch {
    // lsof unavailable or no match
  }

  console.error(
    `\n[dev-guard] ${label}: port ${port} is already in use.${extra}\n` +
      "Stop the existing dev server in the other terminal, or close that session.\n" +
      "Starting two dev servers for the same app causes flaky behavior and wrong ports.\n",
  );
  process.exit(1);
}

process.exit(0);
