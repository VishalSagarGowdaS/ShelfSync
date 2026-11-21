import { getMode } from "./config";
import { demoApi } from "./demo";
import { liveApi } from "./live";
import type { ShopApi } from "./types";

/** Returns the live backend client when a backend URL is configured, otherwise the demo engine. */
export function api(): ShopApi {
  return getMode() === "live" ? liveApi : demoApi;
}

export { ApiError, errorMessage } from "./errors";
export { getMode, getApiBaseUrl, setApiBaseUrl, hasApiOverride } from "./config";
export type { ShopApi } from "./types";
