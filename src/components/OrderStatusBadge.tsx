import type { OrderStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

const map: Record<OrderStatus, { label: string; variant: "success" | "warning" | "destructive" | "info" | "secondary" | "brand" }> = {
  PENDING: { label: "Pending", variant: "warning" },
  CONFIRMED: { label: "Confirmed", variant: "success" },
  REJECTED: { label: "Rejected", variant: "destructive" },
  PROCESSING: { label: "Processing", variant: "info" },
  SHIPPED: { label: "Shipped", variant: "brand" },
  DELIVERED: { label: "Delivered", variant: "success" },
  CANCELLED: { label: "Cancelled", variant: "secondary" },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const m = map[status];
  return <Badge variant={m.variant}>{m.label}</Badge>;
}
