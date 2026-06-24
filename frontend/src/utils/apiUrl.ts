/**
 * API and file URL helpers.
 *
 * Browser requests use relative paths so the app works on both public and
 * private IPs (same host the user opened). Server-side code uses the Docker
 * internal backend URL when available.
 */

export function getClientApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    return "/api";
  }

  if (process.env.BACKEND_INTERNAL_URL) {
    return `${process.env.BACKEND_INTERNAL_URL.replace(/\/$/, "")}/api`;
  }

  return process.env.NEXT_PUBLIC_BASE_URL || "/api";
}

export function getServerApiBaseUrl(): string {
  if (process.env.BACKEND_INTERNAL_URL) {
    return `${process.env.BACKEND_INTERNAL_URL.replace(/\/$/, "")}/api`;
  }

  return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:4000/api";
}

export function getAppOrigin(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return process.env.NEXT_PUBLIC_FRONTEND_URL || "";
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
