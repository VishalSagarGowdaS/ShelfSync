/**
 * DEMO MODE engine — runs entirely in the browser when no backend URL is configured.
 * It mirrors the live order pipeline (outbox → order-placed → inventory consumer →
 * inventory-updated → search sync) as a clearly labelled simulation so the UI can be explored.
 * Nothing here talks to Aiven; live mode uses the Node backend in /backend.
 */
import { seedCategories, seedProducts } from "@/data/catalog";
import { fuzzyScore } from "@/lib/fuzzy";
import { cartTotals, clampQuantity, discountPercent, LOW_STOCK_THRESHOLD } from "@/lib/pricing";
import type {
  Address,
  Cart,
  Category,
  InventoryChange,
  Order,
  OrderStatus,
  Product,
  SearchParams,
  User,
} from "@/lib/types";
import { getToken, setToken } from "./config";
import { ApiError } from "./errors";
import type { ShopApi } from "./types";
import { validateCheckout } from "@/lib/validation";

const STORE_KEY = "shopsphere.demo.v1";
const PUBLISH_DELAY_MS = 1200;
const CONSUME_DELAY_MS = 2600;

interface DemoUser extends User {
  passwordHash: string;
}
interface DemoCartLine {
  id: string;
  productId: string;
  quantity: number;
}
interface DemoState {
  products: Product[];
  users: DemoUser[];
  carts: Record<string, DemoCartLine[]>;
  wishlists: Record<string, string[]>;
  addresses: Record<string, Address[]>;
  orders: Order[];
  inventoryChanges: InventoryChange[];
  lastIndexSync: string | null;
}

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`shopsphere-demo:${text}`));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

let cache: DemoState | null = null;
let initPromise: Promise<DemoState> | null = null;

async function freshState(): Promise<DemoState> {
  const now = new Date().toISOString();
  return {
    products: seedProducts.map((p) => ({ ...p, specifications: { ...p.specifications } })),
    users: [
      {
        id: "demo-customer",
        email: "customer@shopsphere.demo",
        fullName: "Priya Sharma",
        phone: "9876543210",
        role: "CUSTOMER",
        createdAt: now,
        passwordHash: await sha256("Customer@123"),
      },
      {
        id: "demo-customer-2",
        email: "rahul@shopsphere.demo",
        fullName: "Rahul Verma",
        phone: "9123456780",
        role: "CUSTOMER",
        createdAt: now,
        passwordHash: await sha256("Customer@123"),
      },
      {
        id: "demo-admin",
        email: "admin@shopsphere.demo",
        fullName: "ShopSphere Admin",
        phone: null,
        role: "ADMIN",
        createdAt: now,
        passwordHash: await sha256("Admin@123"),
      },
    ],
    carts: {},
    wishlists: {},
    addresses: {},
    orders: [],
    inventoryChanges: [],
    lastIndexSync: now,
  };
}

async function load(): Promise<DemoState> {
  if (cache) return cache;
  if (!initPromise) {
    initPromise = (async () => {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORE_KEY) : null;
      if (raw) {
        try {
          cache = JSON.parse(raw) as DemoState;
          return cache;
        } catch {
          /* fall through to fresh state */
        }
      }
      cache = await freshState();
      save();
      return cache;
    })();
  }
  return initPromise;
}

function save() {
  if (cache && typeof window !== "undefined") window.localStorage.setItem(STORE_KEY, JSON.stringify(cache));
}

export async function resetDemoData() {
  cache = await freshState();
  initPromise = Promise.resolve(cache);
  save();
}

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

async function currentUser(required = true): Promise<DemoUser | null> {
  const s = await load();
  const token = getToken();
  const id = token?.startsWith("demo:") ? token.slice(5) : null;
  const user = s.users.find((u) => u.id === id) ?? null;
  if (!user && required) throw new ApiError(401, "Please sign in to continue", "UNAUTHORIZED");
  return user;
}

async function requireAdmin(): Promise<DemoUser> {
  const u = (await currentUser()) as DemoUser;
  if (u.role !== "ADMIN") throw new ApiError(403, "Administrator access required", "FORBIDDEN");
  return u;
}

const publicUser = ({ passwordHash: _p, ...u }: DemoUser): User => u;

function activeProducts(s: DemoState) {
  return s.products;
}

function buildCart(s: DemoState, userId: string): Cart {
  const lines = (s.carts[userId] ?? [])
    .map((l) => {
      const product = s.products.find((p) => p.id === l.productId);
      return product ? { id: l.id, productId: l.productId, quantity: l.quantity, product } : null;
    })
    .filter((x): x is NonNullable<typeof x> => !!x);
  const t = cartTotals(lines.map((l) => ({ unitPrice: l.product.sellingPrice, quantity: l.quantity })));
  return { items: lines, ...t };
}

/** Lazily advance the simulated Kafka pipeline for orders that are old enough. */
function advancePipeline(s: DemoState) {
  const now = Date.now();
  let changed = false;
  const pending = s.orders
    .filter((o) => o.status === "PENDING")
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  for (const order of pending) {
    const age = now - new Date(order.createdAt).getTime();
    const hasPublished = order.timeline.some((t) => t.status === "PUBLISHED");
    if (age >= PUBLISH_DELAY_MS && !hasPublished) {
      order.timeline.push({
        status: "PUBLISHED",
        note: "Simulated: outbox event published to order-placed",
        at: new Date(new Date(order.createdAt).getTime() + PUBLISH_DELAY_MS).toISOString(),
      });
      changed = true;
    }
    if (age < CONSUME_DELAY_MS) continue;
    const at = new Date(new Date(order.createdAt).getTime() + CONSUME_DELAY_MS).toISOString();
    const shortages = order.items.filter((it) => {
      const p = s.products.find((x) => x.id === it.productId);
      return !p || p.stock < it.quantity;
    });
    if (shortages.length) {
      order.status = "REJECTED";
      order.rejectionReason = `Insufficient stock for ${shortages.map((x) => x.productName).join(", ")}`;
      order.timeline.push({ status: "REJECTED", note: `Simulated inventory consumer: ${order.rejectionReason}`, at });
    } else {
      for (const it of order.items) {
        const p = s.products.find((x) => x.id === it.productId);
        if (!p) continue;
        p.stock -= it.quantity;
        p.soldCount += it.quantity;
        s.inventoryChanges.unshift({
          id: uid(),
          productId: p.id,
          productName: p.name,
          delta: -it.quantity,
          reason: `Order ${order.orderNumber}`,
          stockAfter: p.stock,
          at,
        });
      }
      order.status = "CONFIRMED";
      order.timeline.push(
        { status: "CONFIRMED", note: "Simulated inventory consumer reserved stock", at },
        { status: "INVENTORY_UPDATED", note: "Simulated: inventory-updated event published", at },
        { status: "INDEXED", note: "Simulated: search index refreshed with new stock", at },
      );
      s.lastIndexSync = at;
    }
    order.updatedAt = at;
    changed = true;
  }
  if (changed) save();
}

function sortProducts(items: Product[], sort: SearchParams["sort"]) {
  const arr = [...items];
  switch (sort) {
    case "price_asc":
      return arr.sort((a, b) => a.sellingPrice - b.sellingPrice);
    case "price_desc":
      return arr.sort((a, b) => b.sellingPrice - a.sellingPrice);
    case "popularity":
      return arr.sort((a, b) => b.soldCount - a.soldCount);
    case "rating":
      return arr.sort((a, b) => b.rating - a.rating || b.ratingCount - a.ratingCount);
    case "newest":
      return arr.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    default:
      return arr;
  }
}

function makeProduct(input: import("@/lib/types").ProductInput, base?: Product): Product {
  return {
    id: base?.id ?? uid(),
    slug: base?.slug ?? input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    name: input.name,
    description: input.description,
    categorySlug: input.categorySlug,
    imageUrl: input.imageUrl,
    originalPrice: input.originalPrice,
    sellingPrice: input.sellingPrice,
    discountPercent: discountPercent(input.originalPrice, input.sellingPrice),
    rating: input.rating,
    ratingCount: base?.ratingCount ?? 0,
    stock: input.stock,
    city: input.city,
    soldCount: base?.soldCount ?? 0,
    specifications: input.specifications,
    createdAt: base?.createdAt ?? new Date().toISOString(),
  };
}

export const demoApi: ShopApi = {
  mode: "demo",

  async listCategories(): Promise<Category[]> {
    await delay(120);
    return seedCategories.map((c) => ({ ...c }));
  },

  async listProducts(params = {}) {
    await delay(200);
    const s = await load();
    advancePipeline(s);
    let items = activeProducts(s);
    if (params.category) items = items.filter((p) => p.categorySlug === params.category);
    switch (params.section) {
      case "trending":
        items = [...items].sort((a, b) => b.ratingCount * b.rating - a.ratingCount * a.rating);
        break;
      case "bestsellers":
        items = sortProducts(items, "popularity");
        break;
      case "deals":
        items = [...items].sort((a, b) => b.discountPercent - a.discountPercent);
        break;
      case "recommended":
        items = sortProducts(items, "rating");
        break;
      case "new":
        items = sortProducts(items, "newest");
        break;
    }
    return items.slice(0, params.limit ?? items.length);
  },

  async getProduct(id) {
    await delay(150);
    const s = await load();
    advancePipeline(s);
    const p = s.products.find((x) => x.id === id || x.slug === id);
    if (!p) throw new ApiError(404, "Product not found", "NOT_FOUND");
    return p;
  },

  async search(params) {
    await delay(300);
    const s = await load();
    advancePipeline(s);
    let items = activeProducts(s);
    if (params.category) items = items.filter((p) => p.categorySlug === params.category);
    if (params.minPrice !== undefined) items = items.filter((p) => p.sellingPrice >= params.minPrice!);
    if (params.maxPrice !== undefined) items = items.filter((p) => p.sellingPrice <= params.maxPrice!);
    if (params.city) items = items.filter((p) => p.city === params.city);
    if (params.minRating !== undefined) items = items.filter((p) => p.rating >= params.minRating!);
    if (params.inStock) items = items.filter((p) => p.stock > 0);
    const q = params.q?.trim();
    let ranked = items;
    if (q) {
      ranked = items
        .map((p) => ({ p, score: fuzzyScore(q, p.name, p.description) }))
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((x) => x.p);
    }
    const sort = params.sort ?? (q ? "relevance" : "popularity");
    if (sort !== "relevance") ranked = sortProducts(ranked, sort);
    const page = Math.max(1, params.page ?? 1);
    const pageSize = params.pageSize ?? 12;
    return {
      items: ranked.slice((page - 1) * pageSize, page * pageSize),
      total: ranked.length,
      page,
      pageSize,
      cities: Array.from(new Set(s.products.map((p) => p.city))).sort(),
      engine: "demo",
    };
  },

  async suggest(q) {
    const s = await load();
    if (!q.trim()) return [];
    return s.products
      .map((p) => ({ p, score: fuzzyScore(q, p.name, "") }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map(({ p }) => ({ id: p.id, name: p.name, categorySlug: p.categorySlug }));
  },

  async register(input) {
    await delay(300);
    const s = await load();
    const email = input.email.trim().toLowerCase();
    if (s.users.some((u) => u.email === email))
      throw new ApiError(409, "An account with this email already exists", "EMAIL_TAKEN");
    const user: DemoUser = {
      id: uid(),
      email,
      fullName: input.fullName.trim(),
      phone: input.phone?.trim() || null,
      role: "CUSTOMER",
      createdAt: new Date().toISOString(),
      passwordHash: await sha256(input.password),
    };
    s.users.push(user);
    save();
    const token = `demo:${user.id}`;
    setToken(token);
    return { token, user: publicUser(user) };
  },

  async login(input) {
    await delay(300);
    const s = await load();
    const email = input.email.trim().toLowerCase();
    const user = s.users.find((u) => u.email === email);
    if (!user || user.passwordHash !== (await sha256(input.password)))
      throw new ApiError(401, "Incorrect email or password", "INVALID_CREDENTIALS");
    const token = `demo:${user.id}`;
    setToken(token);
    return { token, user: publicUser(user) };
  },

  async logout() {
    setToken(null);
  },

  async me() {
    const u = await currentUser(false);
    return u ? publicUser(u) : null;
  },

  async updateProfile(input) {
    const u = (await currentUser()) as DemoUser;
    u.fullName = input.fullName.trim();
    u.phone = input.phone.trim() || null;
    save();
    return publicUser(u);
  },

  async getCart() {
    const u = (await currentUser()) as DemoUser;
    const s = await load();
    advancePipeline(s);
    return buildCart(s, u.id);
  },

  async addToCart(productId, quantity) {
    await delay(150);
    const u = (await currentUser()) as DemoUser;
    const s = await load();
    const p = s.products.find((x) => x.id === productId);
    if (!p) throw new ApiError(404, "Product not found", "NOT_FOUND");
    if (p.stock <= 0) throw new ApiError(409, `${p.name} is out of stock`, "OUT_OF_STOCK");
    const lines = (s.carts[u.id] ??= []);
    const existing = lines.find((l) => l.productId === productId);
    const wanted = (existing?.quantity ?? 0) + quantity;
    if (wanted > p.stock)
      throw new ApiError(409, `Only ${p.stock} unit${p.stock === 1 ? "" : "s"} of ${p.name} available`, "STOCK_LIMIT");
    if (existing) existing.quantity = wanted;
    else lines.push({ id: uid(), productId, quantity: clampQuantity(quantity, p.stock) });
    save();
    return buildCart(s, u.id);
  },

  async updateCartItem(itemId, quantity) {
    const u = (await currentUser()) as DemoUser;
    const s = await load();
    const line = (s.carts[u.id] ?? []).find((l) => l.id === itemId);
    if (!line) throw new ApiError(404, "Cart item not found", "NOT_FOUND");
    const p = s.products.find((x) => x.id === line.productId);
    if (!p) throw new ApiError(404, "Product not found", "NOT_FOUND");
    if (quantity > p.stock)
      throw new ApiError(409, `Only ${p.stock} unit${p.stock === 1 ? "" : "s"} available`, "STOCK_LIMIT");
    line.quantity = Math.max(1, Math.floor(quantity));
    save();
    return buildCart(s, u.id);
  },

  async removeCartItem(itemId) {
    const u = (await currentUser()) as DemoUser;
    const s = await load();
    s.carts[u.id] = (s.carts[u.id] ?? []).filter((l) => l.id !== itemId);
    save();
    return buildCart(s, u.id);
  },

  async getWishlist() {
    const u = (await currentUser()) as DemoUser;
    const s = await load();
    const ids = s.wishlists[u.id] ?? [];
    return s.products.filter((p) => ids.includes(p.id));
  },
  async addToWishlist(productId) {
    const u = (await currentUser()) as DemoUser;
    const s = await load();
    const list = (s.wishlists[u.id] ??= []);
    if (!list.includes(productId)) list.push(productId);
    save();
  },
  async removeFromWishlist(productId) {
    const u = (await currentUser()) as DemoUser;
    const s = await load();
    s.wishlists[u.id] = (s.wishlists[u.id] ?? []).filter((x) => x !== productId);
    save();
  },

  async listAddresses() {
    const u = (await currentUser()) as DemoUser;
    const s = await load();
    return s.addresses[u.id] ?? [];
  },
  async addAddress(input) {
    const u = (await currentUser()) as DemoUser;
    const s = await load();
    const list = (s.addresses[u.id] ??= []);
    const addr: Address = { ...input, id: uid(), isDefault: input.isDefault || list.length === 0 };
    if (addr.isDefault) list.forEach((a) => (a.isDefault = false));
    list.push(addr);
    save();
    return addr;
  },
  async deleteAddress(id) {
    const u = (await currentUser()) as DemoUser;
    const s = await load();
    s.addresses[u.id] = (s.addresses[u.id] ?? []).filter((a) => a.id !== id);
    save();
  },

  async placeOrder(input) {
    await delay(400);
    const u = (await currentUser()) as DemoUser;
    const errors = validateCheckout(input);
    if (Object.keys(errors).length) throw new ApiError(400, "Please correct the highlighted fields", "VALIDATION", errors);
    const s = await load();
    const cart = buildCart(s, u.id);
    if (!cart.items.length) throw new ApiError(400, "Your cart is empty", "EMPTY_CART");
    for (const it of cart.items) {
      if (it.quantity > it.product.stock)
        throw new ApiError(409, `Only ${it.product.stock} of ${it.product.name} left — update your cart`, "STOCK_LIMIT");
    }
    const now = new Date().toISOString();
    const order: Order = {
      id: uid(),
      orderNumber: `SS-${Date.now().toString().slice(-8)}`,
      customerId: u.id,
      status: "PENDING",
      rejectionReason: null,
      ...input,
      paymentMethod: "COD",
      subtotal: cart.subtotal,
      deliveryCharge: cart.deliveryCharge,
      total: cart.total,
      items: cart.items.map((it) => ({
        id: uid(),
        productId: it.productId,
        productName: it.product.name,
        imageUrl: it.product.imageUrl,
        unitPrice: it.product.sellingPrice,
        quantity: it.quantity,
        lineTotal: it.product.sellingPrice * it.quantity,
      })),
      timeline: [
        { status: "PENDING", note: "Demo store: order saved with status PENDING", at: now },
        { status: "OUTBOX", note: "Simulated: order-placed event recorded in outbox", at: now },
      ],
      createdAt: now,
      updatedAt: now,
    };
    s.orders.unshift(order);
    s.carts[u.id] = [];
    save();
    return order;
  },

  async listOrders() {
    const u = (await currentUser()) as DemoUser;
    const s = await load();
    advancePipeline(s);
    return s.orders.filter((o) => o.customerId === u.id);
  },

  async getOrder(id) {
    const u = (await currentUser()) as DemoUser;
    const s = await load();
    advancePipeline(s);
    const o = s.orders.find((x) => x.id === id);
    if (!o || (o.customerId !== u.id && u.role !== "ADMIN")) throw new ApiError(404, "Order not found", "NOT_FOUND");
    return o;
  },

  admin: {
    async dashboard() {
      await requireAdmin();
      const s = await load();
      advancePipeline(s);
      const counted = s.orders.filter((o) => !["REJECTED", "CANCELLED", "PENDING"].includes(o.status));
      const byDay = new Map<string, { revenue: number; orders: number }>();
      const byMonth = new Map<string, number>();
      const byCat = new Map<string, number>();
      const byProduct = new Map<string, { quantity: number; revenue: number }>();
      for (let i = 13; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
        byDay.set(d, { revenue: 0, orders: 0 });
      }
      for (const o of counted) {
        const d = o.createdAt.slice(0, 10);
        const day = byDay.get(d);
        if (day) {
          day.revenue += o.total;
          day.orders += 1;
        }
        const m = o.createdAt.slice(0, 7);
        byMonth.set(m, (byMonth.get(m) ?? 0) + o.total);
        for (const it of o.items) {
          const p = s.products.find((x) => x.id === it.productId);
          const cat = seedCategories.find((c) => c.slug === p?.categorySlug)?.name ?? "Other";
          byCat.set(cat, (byCat.get(cat) ?? 0) + 1);
          const cur = byProduct.get(it.productName) ?? { quantity: 0, revenue: 0 };
          cur.quantity += it.quantity;
          cur.revenue += it.lineTotal;
          byProduct.set(it.productName, cur);
        }
      }
      const inv = new Map<string, number>();
      for (const p of s.products) {
        const cat = seedCategories.find((c) => c.slug === p.categorySlug)?.name ?? "Other";
        inv.set(cat, (inv.get(cat) ?? 0) + p.stock);
      }
      return {
        totalRevenue: counted.reduce((sum, o) => sum + o.total, 0),
        totalOrders: s.orders.length,
        totalCustomers: s.users.filter((u) => u.role === "CUSTOMER").length,
        totalProducts: s.products.length,
        lowStockProducts: s.products.filter((p) => p.stock <= LOW_STOCK_THRESHOLD).length,
        pendingOrders: s.orders.filter((o) => o.status === "PENDING").length,
        dailySales: Array.from(byDay, ([date, v]) => ({ date, ...v })),
        monthlyRevenue: Array.from(byMonth, ([month, revenue]) => ({ month, revenue })).sort((a, b) =>
          a.month.localeCompare(b.month),
        ),
        ordersByCategory: Array.from(byCat, ([category, orders]) => ({ category, orders })),
        topProducts: Array.from(byProduct, ([name, v]) => ({ name, ...v }))
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 5),
        inventoryDistribution: Array.from(inv, ([category, stock]) => ({ category, stock })),
      };
    },
    async listProducts() {
      await requireAdmin();
      const s = await load();
      return s.products;
    },
    async createProduct(input) {
      await requireAdmin();
      const s = await load();
      const p = makeProduct(input);
      s.products.unshift(p);
      s.lastIndexSync = new Date().toISOString();
      save();
      return p;
    },
    async updateProduct(id, input) {
      await requireAdmin();
      const s = await load();
      const idx = s.products.findIndex((p) => p.id === id);
      const base = s.products[idx];
      if (!base) throw new ApiError(404, "Product not found", "NOT_FOUND");
      const merged = makeProduct({ ...base, ...input } as import("@/lib/types").ProductInput, base);
      if (merged.stock !== base.stock)
        s.inventoryChanges.unshift({
          id: uid(),
          productId: id,
          productName: merged.name,
          delta: merged.stock - base.stock,
          reason: "Admin update",
          stockAfter: merged.stock,
          at: new Date().toISOString(),
        });
      s.products[idx] = merged;
      s.lastIndexSync = new Date().toISOString();
      save();
      return merged;
    },
    async deleteProduct(id) {
      await requireAdmin();
      const s = await load();
      s.products = s.products.filter((p) => p.id !== id);
      save();
    },
    async updateStock(id, stock) {
      return demoApi.admin.updateProduct(id, { stock });
    },
    async listOrders(status?: OrderStatus) {
      await requireAdmin();
      const s = await load();
      advancePipeline(s);
      return status ? s.orders.filter((o) => o.status === status) : s.orders;
    },
    async getOrder(id) {
      await requireAdmin();
      return demoApi.getOrder(id);
    },
    async updateOrderStatus(id, status) {
      await requireAdmin();
      const s = await load();
      const o = s.orders.find((x) => x.id === id);
      if (!o) throw new ApiError(404, "Order not found", "NOT_FOUND");
      o.status = status;
      o.updatedAt = new Date().toISOString();
      o.timeline.push({ status, note: "Status updated by administrator", at: o.updatedAt });
      save();
      return o;
    },
    async inventory() {
      await requireAdmin();
      const s = await load();
      advancePipeline(s);
      return {
        products: [...s.products].sort((a, b) => a.stock - b.stock),
        lowStockThreshold: LOW_STOCK_THRESHOLD,
        recentChanges: s.inventoryChanges.slice(0, 25),
      };
    },
  },

  async health() {
    const s = await load();
    const now = new Date().toISOString();
    const detail = "Demo mode — no backend connected, so this service is not checked";
    return {
      mode: "demo",
      services: ["ShopSphere API", "PostgreSQL", "Kafka", "OpenSearch"].map((name) => ({
        name,
        state: "not_configured" as const,
        latencyMs: null,
        detail,
        checkedAt: now,
      })),
      consumers: ["outbox-publisher", "inventory-consumer", "search-sync-consumer"].map((name) => ({
        name,
        state: "not_configured" as const,
        lastSeen: null,
        detail: "Simulated in the browser",
      })),
      lastIndexSync: s.lastIndexSync,
      outbox: null,
    };
  },
};
