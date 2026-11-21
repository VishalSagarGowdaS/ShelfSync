import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, errorMessage } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function StockEditor({ productId, stock }: { productId: string; stock: number }) {
  const [v, setV] = useState(String(stock));
  const qc = useQueryClient();
  useEffect(() => setV(String(stock)), [stock]);
  const m = useMutation({
    mutationFn: (n: number) => api().admin.updateStock(productId, n),
    onSuccess: (p) => {
      toast.success(`Stock updated to ${p.stock}`, { description: p.name });
      void qc.invalidateQueries({ queryKey: ["admin"] });
      void qc.invalidateQueries({ queryKey: ["catalog"] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const n = Number(v);
  const dirty = v !== String(stock);
  return (
    <form className="flex items-center gap-1" onSubmit={(e) => { e.preventDefault(); if (!Number.isInteger(n) || n < 0) { toast.error("Stock must be a whole number ≥ 0"); return; } m.mutate(n); }}>
      <Input aria-label="Stock quantity" type="number" min={0} step={1} value={v} onChange={(e) => setV(e.target.value)} className="h-8 w-20" />
      <Button type="submit" size="icon" variant={dirty ? "default" : "ghost"} className="size-8" disabled={!dirty || m.isPending} aria-label="Save stock">
        {m.isPending ? <Loader2 className="animate-spin" /> : <Check />}
      </Button>
    </form>
  );
}
