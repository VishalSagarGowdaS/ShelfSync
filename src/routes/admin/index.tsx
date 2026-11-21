import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Clock, IndianRupee, Package, ShoppingBag, Users } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { ErrorState } from "@/components/states";
import { api, errorMessage } from "@/lib/api";
import { formatINR } from "@/lib/pricing";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--deal)"];
const tooltipStyle = { borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)", fontSize: 12 };

function Kpi({ label, value, icon, tone }: { label: string; value: string; icon: ReactNode; tone: string }) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <span className={`grid size-9 place-items-center rounded-xl ${tone}`}>{icon}</span>
      </div>
      <p className="mt-3 text-2xl font-extrabold tabular-nums">{value}</p>
    </div>
  );
}

function ChartCard({ title, children, empty }: { title: string; children: ReactNode; empty?: boolean }) {
  return (
    <section className="rounded-2xl border bg-card p-5 shadow-card">
      <h2 className="mb-4 font-bold">{title}</h2>
      <div className="h-64">{empty ? <div className="grid h-full place-items-center rounded-xl bg-muted text-sm text-muted-foreground">No confirmed orders yet</div> : children}</div>
    </section>
  );
}

function Dashboard() {
  const q = useQuery({ queryKey: ["admin", "dashboard"], queryFn: () => api().admin.dashboard(), refetchInterval: 20_000 });
  if (q.isError) return <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} />;
  const d = q.data;
  const noSales = !d || d.dailySales.every((x) => x.revenue === 0);

  return (
    <>
      <PageHeader title="Dashboard" description="Sales and inventory at a glance — computed from real order data." />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 2xl:grid-cols-6">
        {d ? (
          <>
            <Kpi label="Total revenue" value={formatINR(d.totalRevenue)} icon={<IndianRupee className="size-4" />} tone="bg-success-soft text-success" />
            <Kpi label="Total orders" value={d.totalOrders.toLocaleString("en-IN")} icon={<ShoppingBag className="size-4" />} tone="bg-accent text-electric" />
            <Kpi label="Customers" value={d.totalCustomers.toLocaleString("en-IN")} icon={<Users className="size-4" />} tone="bg-accent text-violet" />
            <Kpi label="Products" value={d.totalProducts.toLocaleString("en-IN")} icon={<Package className="size-4" />} tone="bg-accent text-primary" />
            <Kpi label="Low stock" value={d.lowStockProducts.toLocaleString("en-IN")} icon={<AlertTriangle className="size-4" />} tone="bg-warning-soft text-warning-foreground" />
            <Kpi label="Pending orders" value={d.pendingOrders.toLocaleString("en-IN")} icon={<Clock className="size-4" />} tone="bg-destructive/10 text-destructive" />
          </>
        ) : (
          Array.from({ length: 6 }, (_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />)
        )}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <ChartCard title="Daily sales (last 14 days)" empty={noSales}>
          <ResponsiveContainer>
            <AreaChart data={d?.dailySales ?? []}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tickFormatter={(v: string) => v.slice(5)} fontSize={11} stroke="var(--muted-foreground)" />
              <YAxis fontSize={11} stroke="var(--muted-foreground)" tickFormatter={(v: number) => `₹${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatINR(v)} />
              <Area type="monotone" dataKey="revenue" stroke="var(--chart-1)" strokeWidth={2.5} fill="url(#rev)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Monthly revenue" empty={!d?.monthlyRevenue.length}>
          <ResponsiveContainer>
            <BarChart data={d?.monthlyRevenue ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" fontSize={11} stroke="var(--muted-foreground)" />
              <YAxis fontSize={11} stroke="var(--muted-foreground)" />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatINR(v)} />
              <Bar dataKey="revenue" fill="var(--chart-2)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Orders by category" empty={!d?.ordersByCategory.length}>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={d?.ordersByCategory ?? []} dataKey="orders" nameKey="category" innerRadius={55} outerRadius={95} paddingAngle={3}>
                {(d?.ordersByCategory ?? []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Top-selling products" empty={!d?.topProducts.length}>
          <ResponsiveContainer>
            <BarChart data={d?.topProducts ?? []} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" fontSize={11} stroke="var(--muted-foreground)" allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={140} fontSize={11} stroke="var(--muted-foreground)" tickFormatter={(v: string) => (v.length > 20 ? `${v.slice(0, 20)}…` : v)} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="quantity" fill="var(--chart-3)" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <div className="xl:col-span-2">
          <ChartCard title="Inventory distribution (units in stock by category)">
            <ResponsiveContainer>
              <BarChart data={d?.inventoryDistribution ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="category" fontSize={11} stroke="var(--muted-foreground)" />
                <YAxis fontSize={11} stroke="var(--muted-foreground)" />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="stock" radius={[8, 8, 0, 0]}>
                  {(d?.inventoryDistribution ?? []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    </>
  );
}
