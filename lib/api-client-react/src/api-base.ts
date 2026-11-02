import { setBaseUrl } from "./custom-fetch";

let configured = false;
let cachedApiRoot: string | null = null;

/** Production site — API is always on the same host, never Render. */
const PRODUCTION_SITE_HOSTS = new Set([
  "gracehighschoolgayaza.academy",
  "www.gracehighschoolgayaza.academy",
]);

const BLOCKED_REMOTE_API = /onrender\.com|render\.com\/databases/i;

function readViteEnv(key: string): string {
  try {
    const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> })
      .env;
    const value = env?.[key];
    return typeof value === "string" ? value.trim() : "";
  } catch {
    return "";
  }
}

function normalizeOrigin(value: string): string {
  return value.replace(/\/+$/, "");
}

function sameOriginApiRootInBrowser(): string | null {
  if (typeof window === "undefined") return null;
  const host = window.location.hostname.toLowerCase();
  if (PRODUCTION_SITE_HOSTS.has(host)) return "/api";
  return null;
}

/** Optional VITE_API_BASE_URL — ignored on production domain and for Render URLs. */
export function resolveApiOrigin(): string | null {
  const sameOrigin = sameOriginApiRootInBrowser();
  if (sameOrigin) return null;

  const raw = readViteEnv("VITE_API_BASE_URL");
  if (!raw) return null;
  if (BLOCKED_REMOTE_API.test(raw)) {
    if (typeof console !== "undefined") {
      console.warn(
        "[api] Ignoring VITE_API_BASE_URL pointing at Render; using same-origin /api instead.",
      );
    }
    return null;
  }
  return normalizeOrigin(raw);
}

/** Wire Orval-generated fetch helpers to a remote API origin (hybrid deploys). */
export function ensureApiClientConfigured(): void {
  if (configured) return;
  setBaseUrl(resolveApiOrigin());
  configured = true;
}

/** `/api` on the same host, or `{VITE_API_BASE_URL}/api` when set (never Render on .academy). */
export function getApiRoot(): string {
  const live = sameOriginApiRootInBrowser();
  if (live) return live;

  if (cachedApiRoot) return cachedApiRoot;
  ensureApiClientConfigured();
  const origin = resolveApiOrigin();
  cachedApiRoot = origin ? `${origin}/api` : "/api";
  return cachedApiRoot;
}

/** Prefix for `/api/storage` object URLs in templates and downloads. */
export function getStoragePrefix(): string {
  return `${getApiRoot()}/storage`;
}
