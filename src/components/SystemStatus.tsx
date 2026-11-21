import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, CheckCircle2, CircleDashed, Database, FlaskConical, Link2, Loader2, RefreshCw, Search, Server, Unplug, Workflow, XCircle } from "lucide-react";
import { toast } from "sonner";
import { api, getApiBaseUrl, hasApiOverride, setApiBaseUrl } from "@/lib/api";
import { setToken } from "@/lib/api/config";
import type { ServiceState } from "@/lib/types";
import { useApiMode } from "@/hooks/use-mode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { resetDemoData } from "@/lib/api/demo";
import { cn } from "@/lib/utils";

const stateMeta: Record<ServiceState, { label: string; icon: typeof CheckCircle2; cls: string; badge: "success" | "destructive" | "secondary" | "warning" }> = {
  healthy: { label: "Healthy", icon: CheckCircle2, cls: "text-success", badge: "success" },
  unhealthy: { label: "Unhealthy", icon: XCircle, cls: "text-destructive", badge: "destructive" },
  not_configured: { label: "Not connected", icon: Unplug, cls: "text-muted-foreground", badge: "secondary" },
  unknown: { label: "Unknown", icon: CircleDashed, cls: "text-warning-foreground", badge: "warning" },
};

const icons: Record<string, typeof Server> = { "ShopSphere API": Server, PostgreSQL: Database, Kafka: Workflow, OpenSearch: Search };

export function SystemStatus() {
  const mode = useApiMode();
  const qc = useQueryClient();
  const [url, setUrl] = useState(() => getApiBaseUrl() ?? "");
  const [testing, setTesting] = useState(false);
  const q = useQuery({ queryKey: ["health", mode], queryFn: () => api().health(), enabled: mode !== null, refetchInterval: 15_000 });

  const connect = async () => {
    const clean = url.trim().replace(/\/+$/, "");
    if (!/^https?:\/\/.+/i.test(clean)) { toast.error("Enter the full backend URL, e.g. https://shopsphere-api.onrender.com"); return; }
    setTesting(true);
    try {
      const r = await fetch(`${clean}/api/health`, { headers: { Accept: "application/json" } });
      if (!r.ok && r.status !== 503) throw new Error(`Backend answered ${r.status}`);
      setApiBaseUrl(clean);
      setToken(null);
      qc.clear();
      toast.success("Backend connected — switched to live mode");
      window.location.reload();
    } catch (e) {
      toast.error(`Could not reach ${clean}/api/health`, { description: e instanceof Error ? e.message : undefined });
    } finally {
      setTesting(false);
    }
  };

  const disconnect = () => {
    setApiBaseUrl(null);
    setToken(null);
    qc.clear();
    toast("Switched back to demo mode");
    window.location.reload();
  };

  const report = q.data;
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border bg-card p-6 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold"><Link2 className="size-5 text-electric" /> Backend connection</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              The storefront talks only to the ShopSphere Node backend. Aiven credentials live on that server and are never sent to the browser.
            </p>
          </div>
          {mode && (
            <Badge variant={mode === "live" ? "success" : "warning"} className="gap-1 text-sm">
              {mode === "live" ? <Activity className="size-3.5" /> : <FlaskConical className="size-3.5" />}
              {mode === "live" ? "Live mode" : "Demo mode"}
            </Badge>
          )}
        </div>
        <form className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={(e) => { e.preventDefault(); void connect(); }}>
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="api-url">Backend URL</Label>
            <Input id="api-url" placeholder="https://shopsphere-api.onrender.com" value={url} onChange={(e) => setUrl(e.target.value)} />
          </div>
          <Button type="submit" variant="brand" disabled={testing}>{testing && <Loader2 className="animate-spin" />} Test & connect</Button>
          {mode === "live" && hasApiOverride() && <Button type="button" variant="outline" onClick={disconnect}>Use demo mode</Button>}
        </form>
        {mode === "demo" && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-warning-soft p-4 text-sm text-warning-foreground">
            <p>Demo mode simulates orders, Kafka processing and search in this browser. Nothing is shown as connected until a real backend passes its health checks.</p>
            <Button size="sm" variant="outline" onClick={async () => { await resetDemoData(); qc.clear(); toast.success("Demo data reset"); }}>Reset demo data</Button>
          </div>
        )}
      </section>

      <section className="rounded-2xl border bg-card p-6 shadow-card">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Service health</h2>
          <Button variant="ghost" size="sm" onClick={() => q.refetch()} disabled={q.isFetching}>
            <RefreshCw className={cn(q.isFetching && "animate-spin")} /> Re-check
          </Button>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {(report?.services ?? ["ShopSphere API", "PostgreSQL", "Kafka", "OpenSearch"].map((name) => ({ name, state: "unknown" as const, latencyMs: null, detail: "Checking…", checkedAt: "" }))).map((s) => {
            const m = stateMeta[s.state];
            const Icon = icons[s.name] ?? Server;
            return (
              <div key={s.name} className="rounded-xl border p-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-semibold"><Icon className="size-4 text-electric" /> {s.name}</span>
                  <m.icon className={cn("size-5", m.cls, !report && "animate-pulse")} />
                </div>
                <Badge variant={m.badge} className="mt-3">{report ? m.label : "Checking"}</Badge>
                <p className="mt-2 text-xs text-muted-foreground">{s.detail}</p>
                {s.latencyMs !== null && <p className="mt-1 text-xs text-muted-foreground">{s.latencyMs} ms</p>}
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border bg-card p-6 shadow-card">
          <h2 className="text-lg font-bold">Background workers</h2>
          <ul className="mt-4 divide-y">
            {(report?.consumers.length ? report.consumers : [{ name: "No worker heartbeats reported", state: "unknown" as const, lastSeen: null, detail: report?.mode === "live" ? "Start the worker process (npm run worker)" : "" }]).map((c) => {
              const m = stateMeta[c.state];
              return (
                <li key={c.name} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.detail}{c.lastSeen ? ` · last heartbeat ${new Date(c.lastSeen).toLocaleTimeString("en-IN")}` : ""}</p>
                  </div>
                  <Badge variant={m.badge}>{m.label}</Badge>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="space-y-4 rounded-2xl border bg-card p-6 shadow-card">
          <h2 className="text-lg font-bold">Synchronisation</h2>
          <div>
            <p className="text-sm text-muted-foreground">Last successful OpenSearch index sync</p>
            <p className="font-semibold">{report?.lastIndexSync ? new Date(report.lastIndexSync).toLocaleString("en-IN") : "Never"}{report?.mode === "demo" && report.lastIndexSync ? " (simulated)" : ""}</p>
          </div>
          {report?.outbox && (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-muted p-3"><p className="text-xs text-muted-foreground">Outbox pending</p><p className="text-2xl font-extrabold">{report.outbox.pending}</p></div>
              <div className="rounded-xl bg-muted p-3"><p className="text-xs text-muted-foreground">Outbox failed attempts</p><p className="text-2xl font-extrabold">{report.outbox.failed}</p></div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
