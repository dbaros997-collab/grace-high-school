import { ApiError } from "@workspace/api-client-react";

export interface FriendlyError {
  title: string;
  description: string;
}

const SESSION_MESSAGE =
  "Your session may have expired or your browser is blocking cookies. Try signing in again, or open the admin in a new browser tab.";

/** True for browser/network failures (API unreachable, offline, CORS, etc.). */
export function isNetworkError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  if (err instanceof ApiError) return false;
  const message = err.message.toLowerCase();
  return (
    err.name === "TypeError" ||
    message.includes("failed to fetch") ||
    message.includes("networkerror") ||
    message.includes("network request failed") ||
    message.includes("load failed") ||
    message.includes("fetch failed")
  );
}

/**
 * Turn any thrown error into a non-technical title + description suitable for a
 * toast. Authentication failures (401/403) — which most often mean the staff
 * member's session cookie didn't reach the server (common when a browser blocks
 * third-party cookies in the admin iframe) — get a clear, actionable message
 * instead of a generic "HTTP 401" string.
 */
function apiErrorMessage(err: ApiError): string | undefined {
  const body = err.data as { error?: string } | undefined;
  return typeof body?.error === "string" && body.error.trim()
    ? body.error.trim()
    : undefined;
}

export function toFriendlyError(err: unknown): FriendlyError {
  const status = err instanceof ApiError ? err.status : undefined;

  if (status === 503 && err instanceof ApiError) {
    const serverMessage = apiErrorMessage(err);
    return {
      title: "Database not connected",
      description:
        serverMessage ??
        "The server cannot reach PostgreSQL. In Coolify, link a Postgres database, set DATABASE_URL on the app, and redeploy.",
    };
  }

  if (status === 401 || status === 403) {
    const serverMessage =
      err instanceof ApiError ? apiErrorMessage(err) : undefined;
    // Prefer the API's message (wrong password / no admin yet) over the
    // generic cookie hint — that hint is only useful when a session was expected.
    if (serverMessage && !/^not authenticated$/i.test(serverMessage)) {
      return { title: "Sign-in failed", description: serverMessage };
    }
    return { title: "Sign-in needed", description: SESSION_MESSAGE };
  }

  if (status === 409 && err instanceof ApiError) {
    return {
      title: "Already set up",
      description:
        apiErrorMessage(err) ?? "An admin account already exists. Sign in instead.",
    };
  }

  if (err instanceof ApiError) {
    const serverMessage = apiErrorMessage(err);
    if (serverMessage) {
      return { title: "Error", description: serverMessage };
    }
  }

  if (isNetworkError(err)) {
    return {
      title: "Still connecting",
      description: "Please wait a moment and try again.",
    };
  }

  const message = err instanceof Error ? err.message : "Something went wrong";
  return { title: "Error", description: message };
}
