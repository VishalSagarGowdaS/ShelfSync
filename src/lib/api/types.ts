import type {
  Address,
  AuthResponse,
  Cart,
  Category,
  CheckoutInput,
  DashboardStats,
  HealthReport,
  InventoryReport,
  Order,
  OrderStatus,
  Product,
  ProductInput,
  ProductSection,
  SearchParams,
  SearchResult,
  User,
} from "@/lib/types";

export interface ShopApi {
  mode: "live" | "demo";
  listCategories(): Promise<Category[]>;
  listProducts(params?: { category?: string; section?: ProductSection; limit?: number }): Promise<Product[]>;
  getProduct(id: string): Promise<Product>;
  search(params: SearchParams): Promise<SearchResult>;
  suggest(q: string): Promise<{ id: string; name: string; categorySlug: string }[]>;

  register(input: { fullName: string; email: string; password: string; phone?: string }): Promise<AuthResponse>;
  login(input: { email: string; password: string }): Promise<AuthResponse>;
  logout(): Promise<void>;
  me(): Promise<User | null>;
  updateProfile(input: { fullName: string; phone: string }): Promise<User>;

  getCart(): Promise<Cart>;
  addToCart(productId: string, quantity: number): Promise<Cart>;
  updateCartItem(itemId: string, quantity: number): Promise<Cart>;
  removeCartItem(itemId: string): Promise<Cart>;

  getWishlist(): Promise<Product[]>;
  addToWishlist(productId: string): Promise<void>;
  removeFromWishlist(productId: string): Promise<void>;

  listAddresses(): Promise<Address[]>;
  addAddress(input: Omit<Address, "id">): Promise<Address>;
  deleteAddress(id: string): Promise<void>;

  placeOrder(input: CheckoutInput): Promise<Order>;
  listOrders(): Promise<Order[]>;
  getOrder(id: string): Promise<Order>;

  admin: {
    dashboard(): Promise<DashboardStats>;
    listProducts(): Promise<Product[]>;
    createProduct(input: ProductInput): Promise<Product>;
    updateProduct(id: string, input: Partial<ProductInput>): Promise<Product>;
    deleteProduct(id: string): Promise<void>;
    updateStock(id: string, stock: number): Promise<Product>;
    listOrders(status?: OrderStatus): Promise<Order[]>;
    getOrder(id: string): Promise<Order>;
    updateOrderStatus(id: string, status: OrderStatus): Promise<Order>;
    inventory(): Promise<InventoryReport>;
  };

  health(): Promise<HealthReport>;
}
