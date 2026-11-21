import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/PageHeader";
import { ProductFormDialog } from "@/components/admin/ProductFormDialog";
import { StockEditor } from "@/components/admin/StockEditor";
import { ErrorState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { api, errorMessage } from "@/lib/api";
import { categoryName } from "@/lib/categories";
import { formatINR } from "@/lib/pricing";
import type { Product, ProductInput } from "@/lib/types";

export const Route = createFileRoute("/admin/products")({
  component: ProductsAdmin,
});

function ProductsAdmin() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin", "products"], queryFn: () => api().admin.listProducts() });
  const [term, setTerm] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Product | null>(null);

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["admin"] });
    void qc.invalidateQueries({ queryKey: ["catalog"] });
  };
  const save = useMutation({
    mutationFn: (input: ProductInput) => (editing ? api().admin.updateProduct(editing.id, input) : api().admin.createProduct(input)),
    onSuccess: (p) => {
      toast.success(editing ? "Product updated" : "Product created", { description: p.name });
      setFormOpen(false);
      refresh();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const del = useMutation({
    mutationFn: (id: string) => api().admin.deleteProduct(id),
    onSuccess: () => {
      toast.success("Product deleted");
      setDeleting(null);
      refresh();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const rows = useMemo(() => {
    const t = term.trim().toLowerCase();
    return (q.data ?? []).filter((p) => !t || p.name.toLowerCase().includes(t) || p.city.toLowerCase().includes(t) || categoryName(p.categorySlug).toLowerCase().includes(t));
  }, [q.data, term]);

  return (
    <>
      <PageHeader title="Products" description={`${q.data?.length ?? 0} products in the catalogue`} actions={<Button variant="brand" onClick={() => { setEditing(null); setFormOpen(true); }}><Plus /> Add product</Button>} />
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Filter by name, category or city" value={term} onChange={(e) => setTerm(e.target.value)} className="pl-9" aria-label="Filter products" />
      </div>
      {q.isError ? (
        <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} />
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card shadow-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">MRP</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {q.isLoading && Array.from({ length: 6 }, (_, i) => (
                <TableRow key={i}><TableCell colSpan={6}><div className="h-10 animate-pulse rounded bg-muted" /></TableCell></TableRow>
              ))}
              {rows.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img src={p.imageUrl} alt="" className="size-10 rounded-lg bg-surface object-cover" />
                      <div className="min-w-0">
                        <p className="line-clamp-1 max-w-72 font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.city} · ★ {p.rating.toFixed(1)}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{categoryName(p.categorySlug)}</TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">{formatINR(p.originalPrice)}</TableCell>
                  <TableCell className="text-right font-semibold">{formatINR(p.sellingPrice)}</TableCell>
                  <TableCell><StockEditor productId={p.id} stock={p.stock} /></TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" aria-label={`Edit ${p.name}`} onClick={() => { setEditing(p); setFormOpen(true); }}><Pencil /></Button>
                    <Button size="icon" variant="ghost" aria-label={`Delete ${p.name}`} onClick={() => setDeleting(p)}><Trash2 className="text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {!q.isLoading && rows.length === 0 && (
                <TableRow><TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">No products match “{term}”.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <ProductFormDialog open={formOpen} onOpenChange={setFormOpen} product={editing} pending={save.isPending} onSubmit={(input) => save.mutate(input)} />
      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
            <AlertDialogDescription>“{deleting?.name}” will be removed from the store and the search index. Past orders keep their records.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleting && del.mutate(deleting.id)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
