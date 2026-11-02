#!/usr/bin/env node
/**
 * Wire Grace High School production on Coolify: git source, required env vars, redeploy.
 *
 *   set COOLIFY_URL=http://157.245.47.90:8000
 *   set COOLIFY_TOKEN=...
 *   set COOLIFY_DATABASE_URL=postgresql://...   (from Coolify → PostgreSQL → Connection URL)
 *   set COOLIFY_SESSION_SECRET=long-random-string
 *   node scripts/coolify-sync-production.mjs
 *
 * Optional:
 *   COOLIFY_APP_UUID=guq118zj0qnrqsrmzhxepu0n
 *   COOLIFY_APP_NAME=grace-high-school
 *   COOLIFY_GIT_REPO=https://github.com/dbaros997-collab/website-greener-2.git
 */

import { randomBytes } from "node:crypto";

const COOLIFY_URL = (process.env.COOLIFY_URL ?? "http://157.245.47.90:8000").replace(
  /\/$/,
  "",
);
const COOLIFY_TOKEN = process.env.COOLIFY_TOKEN?.trim();
const APP_UUID = process.env.COOLIFY_APP_UUID ?? "guq118zj0qnrqsrmzhxepu0n";
const APP_NAME = process.env.COOLIFY_APP_NAME ?? "grace-high-school";
const GIT_REPO =
  process.env.COOLIFY_GIT_REPO ??
  "https://github.com/dbaros997-collab/website-greener-2.git";
const GIT_BRANCH = process.env.COOLIFY_GIT_BRANCH ?? "main";
const DATABASE_URL = process.env.COOLIFY_DATABASE_URL?.trim();
const SESSION_SECRET =
  process.env.COOLIFY_SESSION_SECRET?.trim() ?? randomBytes(32).toString("hex");

const ALLOWED_ORIGINS =
  process.env.COOLIFY_ALLOWED_ORIGINS ??
  "https://gracehighschoolgayaza.academy,https://www.gracehighschoolgayaza.academy";

function authHeaders(extra = {}) {
  if (!COOLIFY_TOKEN) {
    console.error("Missing COOLIFY_TOKEN.");
    process.exit(1);
  }
  return {
    Authorization: `Bearer ${COOLIFY_TOKEN}`,
    Accept: "application/json",
    ...extra,
  };
}

async function api(path, options = {}) {
  const url = `${COOLIFY_URL}/api/v1${path}`;
  const res = await fetch(url, options);
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) {
    throw new Error(
      `${options.method ?? "GET"} ${path} → ${res.status}\n${typeof body === "string" ? body : JSON.stringify(body, null, 2)}`,
    );
  }
  return body;
}

async function resolveAppUuid() {
  if (APP_UUID) return APP_UUID;
  const apps = await api("/applications", { headers: authHeaders() });
  const match = (apps ?? []).find(
    (a) => (a.name ?? "").toLowerCase() === APP_NAME.toLowerCase(),
  );
  if (!match?.uuid) {
    throw new Error(`App not found: ${APP_NAME}`);
  }
  return match.uuid;
}

async function upsertEnv(uuid, key, value) {
  await api(`/applications/${uuid}/envs`, {
    method: "PATCH",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      key,
      value,
      is_literal: true,
      is_runtime: true,
      is_buildtime: false,
    }),
  });
  console.log("[coolify] env set:", key);
}

async function main() {
  console.log("[coolify] Production sync →", COOLIFY_URL);
  const uuid = await resolveAppUuid();
  console.log("[coolify] App uuid:", uuid);

  await api(`/applications/${uuid}`, {
    method: "PATCH",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      git_repository: GIT_REPO,
      git_branch: GIT_BRANCH,
      build_pack: "nixpacks",
      install_command: "",
      build_command: "",
      start_command: "",
      health_check_enabled: true,
      health_check_path: "/healthz",
    }),
  });
  console.log("[coolify] Git source →", GIT_REPO);

  if (!DATABASE_URL) {
    console.warn(
      "[coolify] COOLIFY_DATABASE_URL not set — skipping DATABASE_URL (admin saves will fail until you set it in Coolify).",
    );
  } else {
    await upsertEnv(uuid, "DATABASE_URL", DATABASE_URL);
  }

  await upsertEnv(uuid, "SESSION_SECRET", SESSION_SECRET);
  await upsertEnv(uuid, "ALLOWED_ORIGINS", ALLOWED_ORIGINS);
  await upsertEnv(uuid, "NODE_ENV", "production");
  await upsertEnv(uuid, "PGSSL", "false");

  const q = new URLSearchParams({ uuid, force: "true" });
  const deploy = await api(`/deploy?${q}`, {
    method: "POST",
    headers: authHeaders(),
  });
  console.log("[coolify] Deploy queued:", JSON.stringify(deploy, null, 2));
  console.log("[coolify] After deploy:");
  console.log("  DB:         https://gracehighschoolgayaza.academy/api/readyz");
  console.log("  Dashboard:  https://gracehighschoolgayaza.academy/dashboard/");
  console.log("  Public site https://gracehighschoolgayaza.academy/");
}

main().catch((err) => {
  console.error("[coolify] FAILED:", err.message ?? err);
  process.exit(1);
});
