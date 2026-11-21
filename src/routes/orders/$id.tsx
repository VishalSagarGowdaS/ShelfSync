import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Circle, Clock, Loader2, PackageX, XCircle } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { ErrorState, PageLoader } from "@/components/states";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { Button } from "@/components/ui/button";
import { api, errorMessage } from "@/lib/api";
import { formatINR } from "@/lib/pricing";
import type { Order } from "@/lib/types";
import { useApiMode } from "@/hooks/use-mode";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/orders/$id")({
  head: () => ({
    meta: [
      { title: "Order status — ShopSphere" },
      { name: "description", content: "Track the processing and delivery status of your ShopSphere order." },
      { property: "og:title", content: "Order status — ShopSphere" },
      { property: "og:description", content: "Track your order." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <OrderPage />
    </RequireAuth>
  ),
});

const STEPS: { key: string; live: string; demo: string }[] = [
  { key: "PENDING", live: "Order saved in PostgreSQL", demo: "Order saved (demo store)" },
  { key: "OUTBOX", live: "order-placed event written to outbox (same transaction)", demo: "Outbox event recorded (simulated)" },
  { key: "PUBLISHED", live: "Event published to Kafka topic order-placed", demo: "Published to order-placed (simulated)" },
  { key: "DECISION", live: "Inventory consumer reserved stock", demo: "Inventory consumer reserved stock (simulated)" },
  { key: "INVENTORY_UPDATED", live: "inventory-updated event published", demo: "inventory-updated published (simulated)" },
  { key: "INDEXED", live: "OpenSearch product index synchronised", demo: "Search index refreshed (simulated)" },
];

function Pipeline({ order, live }: { order: Order; live: boolean }) {
  const seen = new Map(order.timeline.map((t) => [t.status === "CONFIRMED" || t.status === "REJECTED" ? "DECISION" : t.status, t]));
  const rejected = order.status === "REJECTED";
  const firstMissing = STEPS.findIndex((s) => !seen.has(s.key));
  return (
    <ol className="space-y-4">
      {STEPS.map((s, i) => {
        const entry = seen.get(s.key);
        const isRejectStep = rejected && s.key === "DECISION";
        const skipped = rejected && i > 3;
        const active = !entry && !skipped && i === firstMissing && order.status === "PENDING";
        return (
          <li key={s.key} className={cn("flex gap-3", skipped && "opacity-40")}>
            <span className="mt-0.5">
              {isRejectStep ? <XCircle className="size-5 text-destructive" /> : entry ? <CheckCircle2 className="size-5 text-success" /> : active ? <Loader2 className="size-5 animate-spin text-electric" /> : <Circle className="size-5 text-muted-foreground" />}
            </span>
            <div>
              <p className={cn("text-sm font-semibold", isRejectStep && "text-destructive")}>
                {isRejectStep ? (live ? "Inventory consumer rejected the order" : "Inventory consumer rejected the order (simulated)") : live ? s.live : s.demo}
              </p>
              {entry && <p className="text-xs text-muted-foreground">{entry.note} · {new Date(entry.at).toLocaleTimeString("en-IN")}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function OrderPage() {
  const { id } = Route.useParams();
  const mode = useApiMode();
  const q = useQuery({
    queryKey: ["orders", id],
    queryFn: () => api().getOrder(id),
    refetchInterval: (query) => {
      const o = query.state.data;
      if (!o) return 1000;
      const terminal = o.status !== "PENDING" && o.timeline.some((t) => t.status === "INDEXED" || t.status === "REJECTED");
      return terminal || o.status === "CANCELLED" ? false : 1000;
    },
  });

  if (q.isLoading) return <PageLoader label="Loading your order…" />;
  if (q.isError) return <div className="container-shop py-10"><ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} /></div>;
  const order = q.data!;
  const live = mode === "live";
  const ageSec = (Date.now() - new Date(order.createdAt).getTime()) / 1000;

  return (
    <div className="container-shop max-w-5xl py-10">
      <div className="rounded-3xl border bg-card p-8 text-center shadow-card">
        {order.status === "PENDING" ? (
          <>
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-accent"><Loader2 className="size-8 animate-spin text-electric" /></div>
            <h1 className="mt-4 text-2xl font-extrabold">Processing your order…</h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              We've received order <strong>{order.orderNumber}</strong>. We're now checking stock — this page updates automatically. Your order is not confirmed yet.
            </p>
            {ageSec > 45 && (
              <p className="mx-auto mt-3 flex max-w-md items-center justify-center gap-2 rounded-xl bg-warning-soft p-3 text-xs text-warning-foreground">
                <Clock className="size-4" /> This is taking longer than usual. The order-processing workers may be offline; we'll keep checking.
              </p>
            )}
          </>
        ) : order.status === "REJECTED" ? (
          <>
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-destructive/10"><PackageX className="size-8 text-destructive" /></div>
            <h1 className="mt-4 text-2xl font-extrabold">Sorry, we couldn't confirm this order</h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{order.rejectionReason ?? "Some items are no longer available."} You have not been charged.</p>
            <Button className="mt-5" asChild><Link to="/search">Continue shopping</Link></Button>
          </>
        ) : (
          <>
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-success-soft"><CheckCircle2 className="size-8 text-success" /></div>
            <h1 className="mt-4 text-2xl font-extrabold">{order.status === "CONFIRMED" ? "Order confirmed!" : `Order ${order.status.toLowerCase()}`}</h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Order <strong>{order.orderNumber}</strong> · Pay <strong>{formatINR(order.total)}</strong> by cash on delivery. A confirmation has been recorded for {order.email}.
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <Button variant="outline" asChild><Link to="/account" hash="orders">View my orders</Link></Button>
              <Button variant="brand" asChild><Link to="/search">Continue shopping</Link></Button>
            </div>
          </>
        )}
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_1fr]">
        <section className="rounded-2xl border bg-card p-6 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold">{live ? "Live processing pipeline" : "Processing pipeline (demo simulation)"}</h2>
            <OrderStatusBadge status={order.status} />
          </div>
          <Pipeline order={order} live={live} />
        </section>
        <section className="rounded-2xl border bg-card p-6 shadow-card">
          <h2 className="mb-4 font-bold">Order details</h2>
          <ul className="space-y-3">
            {order.items.map((it) => (
              <li key={it.id} className="flex items-center gap-3">
                {it.imageUrl && <img src={it.imageUrl} alt="" className="size-12 rounded-lg bg-surface object-cover" />}
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-medium">{it.productName}</p>
                  <p className="text-xs text-muted-foreground">{it.quantity} × {formatINR(it.unitPrice)}</p>
                </div>
                <p className="text-sm font-bold">{formatINR(it.lineTotal)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{formatINR(order.subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Delivery</dt><dd>{order.deliveryCharge ? formatINR(order.deliveryCharge) : "FREE"}</dd></div>
            <div className="flex justify-between font-bold"><dt>Total</dt><dd>{formatINR(order.total)}</dd></div>
          </dl>
          <div className="mt-4 rounded-xl bg-muted p-3 text-sm">
            <p className="font-semibold">{order.fullName} · {order.phone}</p>
            <p className="text-muted-foreground">{order.address}, {order.city}, {order.state} {order.pincode}</p>
          </div>
        </section>
      </div>
    </div>
  );
}
