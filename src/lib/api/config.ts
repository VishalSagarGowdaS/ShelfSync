/**
 * Decides between LIVE mode (ShopSphere Node backend → Aiven PostgreSQL, Kafka, OpenSearch)
 * and DEMO mode (in-browser simulation, used when no backend URL is configured).
 * Only the public backend URL lives here — Aiven credentials stay on the backend.
 */
const API_URL_KEY = "shopsphere.apiUrl";
const TOKEN_KEY = "shopsphere.token";

const isBrowser = () => typeof window !== "undefined";

function envApiUrl(): string | null {
  const v = (import.meta.env["VITE_API_URL"] as string | undefined)?.trim();
  return v ? v.replace(/\/+$/, "") : null;
}

export function getApiBaseUrl(): string | null {
  if (isBrowser()) {
    const override = window.localStorage.getItem(API_URL_KEY);
    if (override) return override.replace(/\/+$/, "");
  }
  return envApiUrl();
}

export function setApiBaseUrl(url: string | null) {
  if (!isBrowser()) return;
  if (url && url.trim()) window.localStorage.setItem(API_URL_KEY, url.trim().replace(/\/+$/, ""));
  else window.localStorage.removeItem(API_URL_KEY);
}

export function hasApiOverride(): boolean {
  return isBrowser() && !!window.localStorage.getItem(API_URL_KEY);
}

export type ApiMode = "live" | "demo";

export function getMode(): ApiMode {
  return getApiBaseUrl() ? "live" : "demo";
}

export function getToken(): string | null {
  return isBrowser() ? window.localStorage.getItem(TOKEN_KEY) : null;
}

export function setToken(token: string | null) {
  if (!isBrowser()) return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}
