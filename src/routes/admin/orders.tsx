import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/PageHeader";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { ErrorState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { api, errorMessage } from "@/lib/api";
import { formatINR } from "@/lib/pricing";
import { ORDER_STATUSES, type Order, type OrderStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/orders")({
  component: OrdersAdmin,
});

/** Admin-settable statuses. CONFIRMED/REJECTED are decided by the inventory consumer. */
const MANUAL: OrderStatus[] = ["PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

function OrderDetail({ order, onClose }: { order: Order; onClose: () => void }) {
  const qc = useQueryClient();
  const [status, setStatus] = useState<OrderStatus | "">("");
  const m = useMutation({
    mutationFn: (s: OrderStatus) => api().admin.updateOrderStatus(order.id, s),
    onSuccess: (o) => {
      toast.success(`Order ${o.orderNumber} marked ${o.status.toLowerCase()}`);
      void qc.invalidateQueries({ queryKey: ["admin"] });
      setStatus("");
      onClose();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const locked = order.status === "PENDING" || order.status === "REJECTED";
  return (
    <div className="space-y-5 p-4">
      <div className="flex items-center justify-between">
        <OrderStatusBadge status={order.status} />
        <span className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleString("en-IN")}</span>
      </div>
      <div className="rounded-xl bg-muted p-4 text-sm">
        <p className="font-semibold">{order.fullName}</p>
        <p className="text-muted-foreground">{order.email} · {order.phone}</p>
        <p className="mt-1 text-muted-foreground">{order.address}, {order.city}, {order.state} {order.pincode}</p>
      </div>
      {order.rejectionReason && <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{order.rejectionReason}</p>}
      <ul className="space-y-2">
        {order.items.map((it) => (
          <li key={it.id} className="flex justify-between gap-3 text-sm">
            <span className="line-clamp-1">{it.quantity} × {it.productName}</span>
            <span className="font-semibold">{formatINR(it.lineTotal)}</span>
          </li>
        ))}
      </ul>
      <dl className="space-y-1 border-t pt-3 text-sm">
        <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{formatINR(order.subtotal)}</dd></div>
        <div className="flex justify-between"><dt className="text-muted-foreground">Delivery</dt><dd>{formatINR(order.deliveryCharge)}</dd></div>
        <div className="flex justify-between font-bold"><dt>Total (COD)</dt><dd>{formatINR(order.total)}</dd></div>
      </dl>
      <div className="space-y-2 rounded-xl border p-4">
        <p className="text-sm font-semibold">Update status</p>
        {locked ? (
          <p className="text-xs text-muted-foreground">{order.status === "PENDING" ? "Waiting for the inventory consumer to confirm or reject this order." : "Rejected orders cannot be changed."}</p>
        ) : (
          <div className="flex gap-2">
            <Select value={status} onValueChange={(v) => setStatus(v as OrderStatus)}>
              <SelectTrigger aria-label="New status"><SelectValue placeholder="Choose status" /></SelectTrigger>
              <SelectContent>{MANUAL.filter((s) => s !== order.status).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
            <Button disabled={!status || m.isPending} onClick={() => status && m.mutate(status)}>{m.isPending && <Loader2 className="animate-spin" />} Update</Button>
          </div>
        )}
      </div>
      <div>
        <p className="mb-2 text-sm font-semibold">Timeline</p>
        <ol className="space-y-2 border-l pl-4">
          {order.timeline.map((t, i) => (
            <li key={i} className="text-xs"><span className="font-semibold">{t.status}</span> — {t.note} <span className="text-muted-foreground">({new Date(t.at).toLocaleTimeString("en-IN")})</span></li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function OrdersAdmin() {
  const [filter, setFilter] = useState<OrderStatus | "ALL">("ALL");
  const [selected, setSelected] = useState<string | null>(null);
  const q = useQuery({ queryKey: ["admin", "orders", filter], queryFn: () => api().admin.listOrders(filter === "ALL" ? undefined : filter), refetchInterval: 5000 });
  const current = q.data?.find((o) => o.id === selected) ?? null;

  return (
    <>
      <PageHeader title="Orders" description="All customer orders. Updates every few seconds." />
      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
        {(["ALL", ...ORDER_STATUSES] as const).map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={cn("whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-medium transition", filter === s ? "border-electric bg-accent text-electric" : "bg-card hover:border-electric")}>
            {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>
      {q.isError ? (
        <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} />
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card shadow-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {q.isLoading && Array.from({ length: 5 }, (_, i) => <TableRow key={i}><TableCell colSpan={5}><div className="h-8 animate-pulse rounded bg-muted" /></TableCell></TableRow>)}
              {q.data?.map((o) => (
                <TableRow key={o.id} className="cursor-pointer" onClick={() => setSelected(o.id)} tabIndex={0} onKeyDown={(e) => e.key === "Enter" && setSelected(o.id)}>
                  <TableCell><p className="font-semibold">{o.orderNumber}</p><p className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleString("en-IN")}</p></TableCell>
                  <TableCell><p className="text-sm">{o.fullName}</p><p className="text-xs text-muted-foreground">{o.city}</p></TableCell>
                  <TableCell className="text-sm">{o.items.reduce((s, i) => s + i.quantity, 0)}</TableCell>
                  <TableCell><OrderStatusBadge status={o.status} /></TableCell>
                  <TableCell className="text-right font-semibold">{formatINR(o.total)}</TableCell>
                </TableRow>
              ))}
              {!q.isLoading && q.data?.length === 0 && <TableRow><TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">No orders {filter !== "ALL" ? `with status ${filter.toLowerCase()}` : "yet"}.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      )}
      <Sheet open={!!current} onOpenChange={(v) => !v && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader><SheetTitle>Order {current?.orderNumber}</SheetTitle></SheetHeader>
          {current && <OrderDetail order={current} onClose={() => setSelected(null)} />}
        </SheetContent>
      </Sheet>
    </>
  );
}
