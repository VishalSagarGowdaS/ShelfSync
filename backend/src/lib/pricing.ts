/** Server-side pricing rules — the source of truth for order totals. */
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

export function cartTotals(lines: { unitPrice: number; quantity: number }[]) {
  const subtotal = round2(lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0));
  const itemCount = lines.reduce((s, l) => s + l.quantity, 0);
  const deliveryCharge = deliveryChargeFor(subtotal);
  return { subtotal, itemCount, deliveryCharge, total: round2(subtotal + deliveryCharge) };
}

export const round2 = (n: number) => Math.round(n * 100) / 100;
