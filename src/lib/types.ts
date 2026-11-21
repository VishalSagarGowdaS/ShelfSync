export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "REJECTED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export const ORDER_STATUSES: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "REJECTED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

export type Role = "CUSTOMER" | "ADMIN";

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  imageUrl: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  categorySlug: string;
  imageUrl: string;
  originalPrice: number;
  sellingPrice: number;
  discountPercent: number;
  rating: number;
  ratingCount: number;
  stock: number;
  city: string;
  soldCount: number;
  specifications: Record<string, string>;
  createdAt: string;
}

export type ProductSection = "trending" | "bestsellers" | "deals" | "recommended" | "new";

export type SortOption = "relevance" | "price_asc" | "price_desc" | "popularity" | "rating" | "newest";

export interface SearchParams {
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  city?: string;
  minRating?: number;
  inStock?: boolean;
  sort?: SortOption;
  page?: number;
  pageSize?: number;
}

export interface SearchResult {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
  cities: string[];
  engine: "opensearch" | "demo";
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: Role;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: Product;
}

export interface Cart {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  deliveryCharge: number;
  total: number;
}

export interface Address {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export interface CheckoutInput {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export interface OrderItem {
  id: string;
  productId: string | null;
  productName: string;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderTimelineEntry {
  status: string;
  note: string;
  at: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  status: OrderStatus;
  rejectionReason: string | null;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  paymentMethod: "COD";
  subtotal: number;
  deliveryCharge: number;
  total: number;
  items: OrderItem[];
  timeline: OrderTimelineEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductInput {
  name: string;
  description: string;
  categorySlug: string;
  imageUrl: string;
  originalPrice: number;
  sellingPrice: number;
  stock: number;
  city: string;
  rating: number;
  specifications: Record<string, string>;
}

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  lowStockProducts: number;
  pendingOrders: number;
  dailySales: { date: string; revenue: number; orders: number }[];
  monthlyRevenue: { month: string; revenue: number }[];
  ordersByCategory: { category: string; orders: number }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
  inventoryDistribution: { category: string; stock: number }[];
}

export interface InventoryChange {
  id: string;
  productId: string;
  productName: string;
  delta: number;
  reason: string;
  stockAfter: number;
  at: string;
}

export interface InventoryReport {
  products: Product[];
  lowStockThreshold: number;
  recentChanges: InventoryChange[];
}

export type ServiceState = "healthy" | "unhealthy" | "not_configured" | "unknown";

export interface ServiceHealth {
  name: string;
  state: ServiceState;
  latencyMs: number | null;
  detail: string;
  checkedAt: string;
}

export interface HealthReport {
  mode: "live" | "demo";
  services: ServiceHealth[];
  consumers: { name: string; state: ServiceState; lastSeen: string | null; detail: string }[];
  lastIndexSync: string | null;
  outbox: { pending: number; failed: number } | null;
}
