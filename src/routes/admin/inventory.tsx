import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, PackageX, TrendingDown, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { StockEditor } from "@/components/admin/StockEditor";
import { ErrorState } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { api, errorMessage } from "@/lib/api";
import { categoryName } from "@/lib/categories";

export const Route = createFileRoute("/admin/inventory")({
  component: InventoryAdmin,
});

function InventoryAdmin() {
  const q = useQuery({ queryKey: ["admin", "inventory"], queryFn: () => api().admin.inventory(), refetchInterval: 5000 });
  if (q.isError) return <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} />;
  const d = q.data;
  const threshold = d?.lowStockThreshold ?? 10;
  const out = d?.products.filter((p) => p.stock <= 0) ?? [];
  const low = d?.products.filter((p) => p.stock > 0 && p.stock <= threshold) ?? [];
  const max = Math.max(1, ...(d?.products.map((p) => p.stock) ?? [1]));

  return (
    <>
      <PageHeader title="Inventory" description={`Low-stock alerts trigger at ${threshold} units or fewer.`} />
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-destructive/30 bg-card p-5 shadow-card">
          <h2 className="flex items-center gap-2 font-bold text-destructive"><PackageX className="size-5" /> Out of stock ({out.length})</h2>
          <ul className="mt-3 space-y-2">
            {out.length === 0 && <li className="text-sm text-muted-foreground">Nothing is out of stock.</li>}
            {out.map((p) => <li key={p.id} className="flex items-center justify-between gap-3 text-sm"><span className="line-clamp-1">{p.name}</span><StockEditor productId={p.id} stock={p.stock} /></li>)}
          </ul>
        </section>
        <section className="rounded-2xl border border-warning/40 bg-card p-5 shadow-card">
          <h2 className="flex items-center gap-2 font-bold text-warning-foreground"><AlertTriangle className="size-5 text-warning" /> Low stock ({low.length})</h2>
          <ul className="mt-3 space-y-2">
            {low.length === 0 && <li className="text-sm text-muted-foreground">No low-stock products.</li>}
            {low.map((p) => <li key={p.id} className="flex items-center justify-between gap-3 text-sm"><span className="line-clamp-1">{p.name}</span><StockEditor productId={p.id} stock={p.stock} /></li>)}
          </ul>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section className="rounded-2xl border bg-card p-5 shadow-card">
          <h2 className="mb-4 font-bold">Stock levels</h2>
          <ul className="space-y-3">
            {!d && Array.from({ length: 8 }, (_, i) => <li key={i} className="h-8 animate-pulse rounded bg-muted" />)}
            {d?.products.map((p) => (
              <li key={p.id} className="grid grid-cols-[1fr_auto] items-center gap-3 sm:grid-cols-[minmax(0,1fr)_160px_auto]">
                <div className="min-w-0">
                  <p className="line-clamp-1 text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{categoryName(p.categorySlug)}</p>
                </div>
                <Progress value={(p.stock / max) * 100} className="hidden h-2 sm:block" aria-label={`${p.stock} units`} />
                <div className="flex items-center gap-2">
                  {p.stock <= 0 ? <Badge variant="destructive">Out</Badge> : p.stock <= threshold ? <Badge variant="warning">Low</Badge> : null}
                  <StockEditor productId={p.id} stock={p.stock} />
                </div>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border bg-card p-5 shadow-card">
          <h2 className="mb-4 font-bold">Recent inventory changes</h2>
          <ul className="space-y-3">
            {d?.recentChanges.length === 0 && <li className="text-sm text-muted-foreground">No changes recorded yet.</li>}
            {d?.recentChanges.map((c) => (
              <li key={c.id} className="flex items-start gap-3 text-sm">
                {c.delta < 0 ? <TrendingDown className="mt-0.5 size-4 text-destructive" /> : <TrendingUp className="mt-0.5 size-4 text-success" />}
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 font-medium">{c.productName}</p>
                  <p className="text-xs text-muted-foreground">{c.reason} · {new Date(c.at).toLocaleString("en-IN")}</p>
                </div>
                <div className="text-right">
                  <p className={c.delta < 0 ? "font-bold text-destructive" : "font-bold text-success"}>{c.delta > 0 ? `+${c.delta}` : c.delta}</p>
                  <p className="text-xs text-muted-foreground">→ {c.stockAfter}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
