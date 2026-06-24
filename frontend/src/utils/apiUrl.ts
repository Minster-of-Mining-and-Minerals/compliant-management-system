/**
 * API and file URL helpers.
 *
 * Browser requests resolve from window.location at runtime so no IP can be
 * baked into the JS bundle at build time. Server-side code uses Docker internal URL.
 */

/** Called on every API request in the browser — always same host as the page. */
export function resolveApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/api`;
  }

  if (process.env.BACKEND_INTERNAL_URL) {
    return `${process.env.BACKEND_INTERNAL_URL.replace(/\/$/, "")}/api`;
  }

  return "/api";
}

export function getClientApiBaseUrl(): string {
  return resolveApiBaseUrl();
}

export function getServerApiBaseUrl(): string {
  if (process.env.BACKEND_INTERNAL_URL) {
    return `${process.env.BACKEND_INTERNAL_URL.replace(/\/$/, "")}/api`;
  }

  return "http://localhost:4000/api";
}

export function getAppOrigin(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "";
}

export const API_REQUEST_TIMEOUT_MS = 30_000;

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_REQUEST_TIMEOUT_MS);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timed out. Check your network connection.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
