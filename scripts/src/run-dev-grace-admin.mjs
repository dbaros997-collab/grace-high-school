import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

/** Read a single KEY=value from the repo .env without pulling in dotenv. */
function readEnvFileValue(key) {
  const envPath = path.join(root, ".env");
  if (!fs.existsSync(envPath)) return undefined;
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    if (trimmed.slice(0, eq).trim() !== key) continue;
    return trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
  }
  return undefined;
}

// Live site (custom domain) — public pages + /api + /dashboard.
const LIVE_API = "https://gracehighschoolgayaza.academy";

function normalizeProxyTarget(raw) {
  const value = (raw ?? "").trim();
  if (!value) return LIVE_API;
  if (/onrender\.com/i.test(value)) {
    console.warn(
      "[grace-admin] API_PROXY_TARGET pointed at Render; using",
      LIVE_API,
      "instead.",
    );
    return LIVE_API;
  }
  return value;
}

const apiProxyTarget = normalizeProxyTarget(
  process.env.API_PROXY_TARGET ?? readEnvFileValue("API_PROXY_TARGET"),
);

const env = {
  ...process.env,
  PORT: "23745",
  BASE_PATH: "/dashboard/",
  API_PROXY_TARGET: apiProxyTarget,
};

console.log(`[grace-admin] API proxy → ${apiProxyTarget}`);
if (apiProxyTarget.includes("gracehighschoolgayaza.academy")) {
  console.log(
    "[grace-admin] Saves go to the live site; open visitors will update over SSE as soon as you save.",
  );
}

const isWin = process.platform === "win32";
const child = isWin
  ? spawn(
      "cmd.exe",
      ["/d", "/s", "/c", "pnpm --filter @workspace/grace-admin run dev"],
      { cwd: root, env, stdio: "inherit" },
    )
  : spawn("pnpm", ["--filter", "@workspace/grace-admin", "run", "dev"], {
      cwd: root,
      env,
      stdio: "inherit",
    });

child.on("exit", (code) => process.exit(code ?? 1));
