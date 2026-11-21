import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Product, ProductInput } from "@/lib/types";
import { CATEGORIES } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const blank: ProductInput = { name: "", description: "", categorySlug: "electronics", imageUrl: "", originalPrice: 0, sellingPrice: 0, stock: 0, city: "", rating: 4, specifications: {} };

export function ProductFormDialog({ open, onOpenChange, product, onSubmit, pending }: { open: boolean; onOpenChange: (v: boolean) => void; product: Product | null; onSubmit: (input: ProductInput) => void; pending: boolean }) {
  const [f, setF] = useState<ProductInput>(blank);
  const [specs, setSpecs] = useState<[string, string][]>([]);
  useEffect(() => {
    if (!open) return;
    if (product) {
      const { name, description, categorySlug, imageUrl, originalPrice, sellingPrice, stock, city, rating, specifications } = product;
      setF({ name, description, categorySlug, imageUrl, originalPrice, sellingPrice, stock, city, rating, specifications });
      setSpecs(Object.entries(specifications));
    } else {
      setF(blank);
      setSpecs([["", ""]]);
    }
  }, [open, product]);

  const num = (k: "originalPrice" | "sellingPrice" | "stock" | "rating") => (e: React.ChangeEvent<HTMLInputElement>) => setF((x) => ({ ...x, [k]: Number(e.target.value) }));
  const txt = (k: "name" | "description" | "imageUrl" | "city") => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((x) => ({ ...x, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (f.name.trim().length < 3) { toast.error("Product name must be at least 3 characters"); return; }
    if (f.description.trim().length < 10) { toast.error("Description must be at least 10 characters"); return; }
    if (!/^(https?:\/\/|\/)/.test(f.imageUrl.trim())) { toast.error("Enter a valid image URL"); return; }
    if (!(f.originalPrice > 0) || !(f.sellingPrice > 0)) { toast.error("Prices must be greater than zero"); return; }
    if (f.sellingPrice > f.originalPrice) { toast.error("Selling price cannot exceed the original price"); return; }
    if (!Number.isInteger(f.stock) || f.stock < 0) { toast.error("Stock must be a whole number ≥ 0"); return; }
    if (f.rating < 0 || f.rating > 5) { toast.error("Rating must be between 0 and 5"); return; }
    if (f.city.trim().length < 2) { toast.error("Enter the dispatch city"); return; }
    onSubmit({ ...f, name: f.name.trim(), description: f.description.trim(), imageUrl: f.imageUrl.trim(), city: f.city.trim(), specifications: Object.fromEntries(specs.filter(([k, v]) => k.trim() && v.trim()).map(([k, v]) => [k.trim(), v.trim()])) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>{product ? "Edit product" : "Add product"}</DialogTitle></DialogHeader>
        <form id="product-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="p-name">Name</Label><Input id="p-name" value={f.name} onChange={txt("name")} /></div>
          <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="p-desc">Description</Label><Textarea id="p-desc" rows={3} value={f.description} onChange={txt("description")} /></div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={f.categorySlug} onValueChange={(v) => setF((x) => ({ ...x, categorySlug: v }))}>
              <SelectTrigger aria-label="Category"><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label htmlFor="p-city">Dispatch city</Label><Input id="p-city" value={f.city} onChange={txt("city")} /></div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="p-img">Image URL</Label>
            <div className="flex gap-3">
              <Input id="p-img" value={f.imageUrl} onChange={txt("imageUrl")} placeholder="https://…" />
              {f.imageUrl && <img src={f.imageUrl} alt="" className="size-10 shrink-0 rounded-lg bg-surface object-cover" />}
            </div>
          </div>
          <div className="space-y-1.5"><Label htmlFor="p-mrp">Original price (₹)</Label><Input id="p-mrp" type="number" min={1} value={f.originalPrice || ""} onChange={num("originalPrice")} /></div>
          <div className="space-y-1.5"><Label htmlFor="p-price">Selling price (₹)</Label><Input id="p-price" type="number" min={1} value={f.sellingPrice || ""} onChange={num("sellingPrice")} /></div>
          <div className="space-y-1.5"><Label htmlFor="p-stock">Stock</Label><Input id="p-stock" type="number" min={0} step={1} value={f.stock} onChange={num("stock")} /></div>
          <div className="space-y-1.5"><Label htmlFor="p-rating">Rating (0–5)</Label><Input id="p-rating" type="number" min={0} max={5} step={0.1} value={f.rating} onChange={num("rating")} /></div>
          <div className="space-y-2 sm:col-span-2">
            <div className="flex items-center justify-between"><Label>Specifications</Label><Button type="button" size="sm" variant="ghost" onClick={() => setSpecs((s) => [...s, ["", ""]])}><Plus /> Add row</Button></div>
            {specs.map(([k, v], i) => (
              <div key={i} className="flex gap-2">
                <Input placeholder="Name" value={k} onChange={(e) => setSpecs((s) => s.map((r, j) => (j === i ? [e.target.value, r[1]] : r)))} />
                <Input placeholder="Value" value={v} onChange={(e) => setSpecs((s) => s.map((r, j) => (j === i ? [r[0], e.target.value] : r)))} />
                <Button type="button" size="icon" variant="ghost" aria-label="Remove row" onClick={() => setSpecs((s) => s.filter((_, j) => j !== i))}><Trash2 /></Button>
              </div>
            ))}
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" form="product-form" disabled={pending}>{pending && <Loader2 className="animate-spin" />} {product ? "Save changes" : "Create product"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
