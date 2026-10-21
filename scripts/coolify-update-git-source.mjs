#!/usr/bin/env node
/**
 * Update a Coolify application's Git repository URL via the REST API.
 *
 * Usage (from repo root or anywhere):
 *   set COOLIFY_URL=http://157.245.47.90:8000
 *   set COOLIFY_TOKEN=your_api_token
 *   node scripts/coolify-update-git-source.mjs
 *
 * Optional env:
 *   COOLIFY_APP_NAME=grace-high-school   (default)
 *   COOLIFY_GIT_REPO=https://github.com/dbaros997-collab/grace-high-school.git
 *   COOLIFY_GIT_BRANCH=main
 *   COOLIFY_DEPLOY=1                      (trigger deploy after PATCH)
 *   COOLIFY_FORCE_DEPLOY=1                (force rebuild, with COOLIFY_DEPLOY)
 *
 * Create token: Coolify UI → Keys & Tokens → API tokens (read/write/deploy).
 */

const COOLIFY_URL = (process.env.COOLIFY_URL ?? "http://157.245.47.90:8000").replace(
  /\/$/,
  "",
);
const COOLIFY_TOKEN = process.env.COOLIFY_TOKEN?.trim();
const APP_NAME = process.env.COOLIFY_APP_NAME ?? "grace-high-school";
const GIT_REPO =
  process.env.COOLIFY_GIT_REPO ??
  "https://github.com/dbaros997-collab/grace-high-school.git";
const GIT_BRANCH = process.env.COOLIFY_GIT_BRANCH ?? "main";
const SHOULD_DEPLOY = process.env.COOLIFY_DEPLOY === "1";
const FORCE_DEPLOY = process.env.COOLIFY_FORCE_DEPLOY === "1";

const WRONG_REPO_PATTERNS = [
  /github\.com\/dbaros997\/grace-high-school/i,
  /dbaros997\/grace-high-school/i,
];

function authHeaders(extra = {}) {
  if (!COOLIFY_TOKEN) {
    console.error("Missing COOLIFY_TOKEN. Create one in Coolify → Keys & Tokens.");
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

function findApp(apps, name) {
  const list = Array.isArray(apps) ? apps : [];
  const exact = list.filter(
    (a) => (a.name ?? "").toLowerCase() === name.toLowerCase(),
  );
  if (exact.length === 1) return exact[0];
  if (exact.length > 1) {
    console.error(`Multiple apps named "${name}":`, exact.map((a) => a.uuid));
    process.exit(1);
  }
  const fuzzy = list.filter((a) =>
    (a.name ?? "").toLowerCase().includes(name.toLowerCase()),
  );
  if (fuzzy.length === 1) return fuzzy[0];
  return null;
}

async function main() {
  console.log("[coolify] API base:", COOLIFY_URL);
  console.log("[coolify] Looking for app:", APP_NAME);

  const apps = await api("/applications", { headers: authHeaders() });
  const app = findApp(apps, APP_NAME);

  if (!app) {
    console.error(`App "${APP_NAME}" not found. Available names:`);
    for (const a of apps ?? []) console.error(" -", a.name, a.uuid);
    process.exit(1);
  }

  const { uuid, git_repository: currentRepo, git_branch: currentBranch } = app;
  console.log("[coolify] Found uuid:", uuid);
  console.log("[coolify] Current git_repository:", currentRepo ?? "(unset)");
  console.log("[coolify] Current git_branch:", currentBranch ?? "(unset)");

  const needsFix =
    !currentRepo ||
    WRONG_REPO_PATTERNS.some((re) => re.test(String(currentRepo))) ||
    currentRepo !== GIT_REPO;

  if (!needsFix && currentBranch === GIT_BRANCH) {
    console.log("[coolify] Repository URL already correct; nothing to PATCH.");
  } else {
    const patchBody = {
      git_repository: GIT_REPO,
      git_branch: GIT_BRANCH,
      build_pack: "nixpacks",
      install_command: "",
      build_command: "",
      start_command: "",
      health_check_enabled: true,
      health_check_path: "/healthz",
    };

    console.log("[coolify] PATCH →", GIT_REPO);
    await api(`/applications/${uuid}`, {
      method: "PATCH",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(patchBody),
    });
    console.log("[coolify] Application updated.");
  }

  if (SHOULD_DEPLOY) {
    const q = new URLSearchParams({ uuid });
    if (FORCE_DEPLOY) q.set("force", "true");
    console.log("[coolify] POST /deploy?", q.toString());
    const deploy = await api(`/deploy?${q}`, {
      method: "POST",
      headers: authHeaders(),
    });
    console.log("[coolify] Deploy queued:", JSON.stringify(deploy, null, 2));
  } else {
    console.log("[coolify] Set COOLIFY_DEPLOY=1 to trigger a deploy after PATCH.");
  }
}

main().catch((err) => {
  console.error("[coolify] FAILED:", err.message ?? err);
  process.exit(1);
});
