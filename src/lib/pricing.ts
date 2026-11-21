/**
 * Pricing rules shared by cart, checkout and the demo engine.
 * The backend applies the same rules in backend/src/lib/pricing.ts and is the source of truth
 * in live mode — these frontend values are for display only.
 */
export const FREE_DELIVERY_THRESHOLD = 499;
export const DELIVERY_CHARGE = 49;
export const LOW_STOCK_THRESHOLD = 10;

export function deliveryChargeFor(subtotal: number): number {
  if (subtotal <= 0) return 0;
  return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE;
}

export function discountPercent(originalPrice: number, sellingPrice: number): number {
  if (originalPrice <= 0 || sellingPrice >= originalPrice) return 0;
  return Math.round(((originalPrice - sellingPrice) / originalPrice) * 100);
}

/** Never allow a quantity below 1 or above the available stock. */
export function clampQuantity(requested: number, stock: number): number {
  if (stock <= 0) return 0;
  const q = Math.floor(Number.isFinite(requested) ? requested : 1);
  return Math.min(Math.max(q, 1), stock);
}

export function cartTotals(lines: { unitPrice: number; quantity: number }[]) {
  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);
  const deliveryCharge = deliveryChargeFor(subtotal);
  return { subtotal, itemCount, deliveryCharge, total: subtotal + deliveryCharge };
}

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatINR(amount: number): string {
  return inr.format(amount);
}
