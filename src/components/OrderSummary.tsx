import type { ReactNode } from "react";
import { ShieldCheck, Truck } from "lucide-react";
import { FREE_DELIVERY_THRESHOLD, formatINR } from "@/lib/pricing";
import type { Cart } from "@/lib/types";

export function OrderSummary({ cart, children }: { cart: Pick<Cart, "subtotal" | "deliveryCharge" | "total" | "itemCount">; children?: ReactNode }) {
  const remaining = FREE_DELIVERY_THRESHOLD - cart.subtotal;
  return (
    <div className="rounded-2xl border bg-card p-6 shadow-card">
      <h2 className="text-lg font-bold">Order summary</h2>
      <dl className="mt-4 space-y-3 text-sm">
        <div className="flex justify-between"><dt className="text-muted-foreground">Items ({cart.itemCount})</dt><dd className="font-medium">{formatINR(cart.subtotal)}</dd></div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Delivery</dt>
          <dd className={cart.deliveryCharge === 0 ? "font-semibold text-success" : "font-medium"}>{cart.deliveryCharge === 0 ? "FREE" : formatINR(cart.deliveryCharge)}</dd>
        </div>
        <div className="flex justify-between border-t pt-3 text-base"><dt className="font-bold">Total payable</dt><dd className="font-extrabold">{formatINR(cart.total)}</dd></div>
      </dl>
      {remaining > 0 && cart.subtotal > 0 && (
        <p className="mt-4 flex items-center gap-2 rounded-xl bg-accent p-3 text-xs text-accent-foreground">
          <Truck className="size-4 shrink-0 text-electric" /> Add {formatINR(remaining)} more for FREE delivery
        </p>
      )}
      {children}
      <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="size-4 text-success" /> Prices and stock are re-verified when you place the order.</p>
    </div>
  );
}

