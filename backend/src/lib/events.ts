import { z } from "zod";

/** order-placed — produced via the transactional outbox when an order is created. */
export const orderPlacedSchema = z.object({
  eventId: z.string().uuid(),
  eventType: z.literal("ORDER_PLACED"),
  orderId: z.string().uuid(),
  customerId: z.string().uuid(),
  items: z.array(z.object({ productId: z.string().uuid(), quantity: z.number().int().positive() })).min(1),
  occurredAt: z.string().datetime(),
});
export type OrderPlacedEvent = z.infer<typeof orderPlacedSchema>;

/** inventory-updated — produced after stock or product data changes; consumed by search sync. */
export const inventoryUpdatedSchema = z.object({
  eventId: z.string().uuid(),
  eventType: z.literal("INVENTORY_UPDATED"),
  reason: z.enum(["ORDER_CONFIRMED", "ADMIN_STOCK_UPDATE", "PRODUCT_CREATED", "PRODUCT_UPDATED", "PRODUCT_DELETED"]),
  orderId: z.string().uuid().nullable(),
  productIds: z.array(z.string().uuid()).min(1),
  occurredAt: z.string().datetime(),
});
export type InventoryUpdatedEvent = z.infer<typeof inventoryUpdatedSchema>;

export interface StockRow {
  productId: string;
  name: string;
  stock: number;
}

export type ReservationDecision =
  | { ok: true; updates: { productId: string; newStock: number; delta: number }[] }
  | { ok: false; reason: string; shortages: { productId: string; requested: number; available: number }[] };

/**
 * Pure decision: can every line be satisfied from the (locked) stock rows?
 * Quantities for the same product are summed. All-or-nothing: no partial reservations.
 */
export function decideReservation(stock: StockRow[], items: { productId: string; quantity: number }[]): ReservationDecision {
  const wanted = new Map<string, number>();
  for (const it of items) wanted.set(it.productId, (wanted.get(it.productId) ?? 0) + it.quantity);
  const byId = new Map(stock.map((s) => [s.productId, s]));
  const shortages: { productId: string; requested: number; available: number }[] = [];
  const names: string[] = [];
  for (const [productId, requested] of wanted) {
    const row = byId.get(productId);
    const available = row?.stock ?? 0;
    if (available < requested) {
      shortages.push({ productId, requested, available });
      names.push(row?.name ?? "an unavailable product");
    }
  }
  if (shortages.length) return { ok: false, reason: `Insufficient stock for ${names.join(", ")}`, shortages };
  return {
    ok: true,
    updates: [...wanted].map(([productId, q]) => ({ productId, delta: -q, newStock: (byId.get(productId)?.stock ?? 0) - q })),
  };
}
