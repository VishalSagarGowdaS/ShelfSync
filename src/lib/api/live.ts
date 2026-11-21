import { getApiBaseUrl, getToken } from "./config";
import { ApiError } from "./errors";
import type { ShopApi } from "./types";
import type { HealthReport, SearchParams } from "@/lib/types";

async function request<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const base = getApiBaseUrl();
  if (!base) throw new ApiError(0, "No backend URL configured", "NO_BACKEND");
  const headers: Record<string, string> = { Accept: "application/json" };
  if (init.body !== undefined) headers["Content-Type"] = "application/json";
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  let res: Response;
  try {
    res = await fetch(`${base}${path}`, {
      method: init.method ?? "GET",
      headers,
      ...(init.body !== undefined ? { body: JSON.stringify(init.body) } : {}),
    });
  } catch {
    throw new ApiError(0, "Cannot reach the ShopSphere backend. Check that it is running.", "NETWORK");
  }
  if (res.status === 204) return undefined as T;
  const data = (await res.json().catch(() => null)) as
    | { error?: { message?: string; code?: string; details?: unknown } }
    | null;
  if (!res.ok) {
    throw new ApiError(
      res.status,
      data?.error?.message ?? `Request failed (${res.status})`,
      data?.error?.code ?? "ERROR",
      data?.error?.details,
    );
  }
  return data as T;
}

function qs(params: Record<string, string | number | boolean | undefined>): string {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") s.set(k, String(v));
  const out = s.toString();
  return out ? `?${out}` : "";
}

export const liveApi: ShopApi = {
  mode: "live",
  listCategories: () => request("/api/categories"),
  listProducts: (p = {}) => request(`/api/products${qs({ ...p })}`),
  getProduct: (id) => request(`/api/products/${encodeURIComponent(id)}`),
  search: (p: SearchParams) => request(`/api/products/search${qs({ ...p })}`),
  suggest: (q) => request(`/api/products/suggest${qs({ q })}`),

  register: (input) => request("/api/auth/register", { method: "POST", body: input }),
  login: (input) => request("/api/auth/login", { method: "POST", body: input }),
  logout: () => request("/api/auth/logout", { method: "POST", body: {} }),
  me: async () => {
    if (!getToken()) return null;
    try {
      const r = await request<{ user: import("@/lib/types").User }>("/api/auth/me");
      return r.user;
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return null;
      throw e;
    }
  },
  updateProfile: (input) => request("/api/account/profile", { method: "PUT", body: input }),

  getCart: () => request("/api/cart"),
  addToCart: (productId, quantity) => request("/api/cart/items", { method: "POST", body: { productId, quantity } }),
  updateCartItem: (id, quantity) => request(`/api/cart/items/${id}`, { method: "PUT", body: { quantity } }),
  removeCartItem: (id) => request(`/api/cart/items/${id}`, { method: "DELETE" }),

  getWishlist: () => request("/api/wishlist"),
  addToWishlist: (productId) => request("/api/wishlist", { method: "POST", body: { productId } }),
  removeFromWishlist: (productId) => request(`/api/wishlist/${productId}`, { method: "DELETE" }),

  listAddresses: () => request("/api/account/addresses"),
  addAddress: (input) => request("/api/account/addresses", { method: "POST", body: input }),
  deleteAddress: (id) => request(`/api/account/addresses/${id}`, { method: "DELETE" }),

  placeOrder: (input) => request("/api/orders", { method: "POST", body: input }),
  listOrders: () => request("/api/orders"),
  getOrder: (id) => request(`/api/orders/${id}`),

  admin: {
    dashboard: () => request("/api/admin/dashboard"),
    listProducts: () => request("/api/admin/products"),
    createProduct: (input) => request("/api/products", { method: "POST", body: input }),
    updateProduct: (id, input) => request(`/api/products/${id}`, { method: "PUT", body: input }),
    deleteProduct: (id) => request(`/api/products/${id}`, { method: "DELETE" }),
    updateStock: (id, stock) => request(`/api/admin/inventory/${id}`, { method: "PUT", body: { stock } }),
    listOrders: (status) => request(`/api/admin/orders${qs({ status })}`),
    getOrder: (id) => request(`/api/admin/orders/${id}`),
    updateOrderStatus: (id, status) =>
      request(`/api/admin/orders/${id}/status`, { method: "PUT", body: { status } }),
    inventory: () => request("/api/admin/inventory"),
  },

  health: async () => {
    try {
      const r = await request<Omit<HealthReport, "mode">>("/api/health");
      return { ...r, mode: "live" };
    } catch (e) {
      const detail = e instanceof Error ? e.message : "Backend unreachable";
      const now = new Date().toISOString();
      return {
        mode: "live",
        services: ["ShopSphere API", "PostgreSQL", "Kafka", "OpenSearch"].map((name) => ({
          name,
          state: name === "ShopSphere API" ? "unhealthy" : "unknown",
          latencyMs: null,
          detail: name === "ShopSphere API" ? detail : "Unknown — backend unreachable",
          checkedAt: now,
        })),
        consumers: [],
        lastIndexSync: null,
        outbox: null,
      };
    }
  },
};
