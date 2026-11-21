import { useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Database, FlaskConical, SearchX, SlidersHorizontal, Star } from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import type { CatalogSearch } from "@/lib/search-params";
import { SORT_LABELS } from "@/lib/search-params";
import type { SortOption } from "@/lib/types";
import { CATEGORIES } from "@/lib/categories";
import { ProductGrid } from "@/components/product/ProductGrid";
import { EmptyState, ErrorState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 12;

interface Props {
  search: CatalogSearch;
  onChange: (next: CatalogSearch) => void;
  fixedCategory?: string;
}

function Filters({ search, onChange, fixedCategory, cities }: Props & { cities: string[] }) {
  const [min, setMin] = useState(search.minPrice?.toString() ?? "");
  const [max, setMax] = useState(search.maxPrice?.toString() ?? "");
  useEffect(() => {
    setMin(search.minPrice?.toString() ?? "");
    setMax(search.maxPrice?.toString() ?? "");
  }, [search.minPrice, search.maxPrice]);

  const set = (patch: Partial<CatalogSearch>) => {
    const next: CatalogSearch = { ...search, ...patch };
    delete next.page;
    for (const k of Object.keys(next) as (keyof CatalogSearch)[]) if (next[k] === undefined) delete next[k];
    onChange(next);
  };
  const without = (key: keyof CatalogSearch) => {
    const next = { ...search };
    delete next[key];
    delete next.page;
    onChange(next);
  };

  return (
    <div className="space-y-7">
      {!fixedCategory && (
        <fieldset>
          <legend className="mb-3 text-sm font-bold">Category</legend>
          <div className="space-y-1">
            <button onClick={() => without("category")} className={cn("block w-full rounded-lg px-3 py-1.5 text-left text-sm", !search.category ? "bg-accent font-semibold text-primary" : "hover:bg-accent")}>
              All categories
            </button>
            {CATEGORIES.map((c) => (
              <button key={c.slug} onClick={() => set({ category: c.slug })} className={cn("block w-full rounded-lg px-3 py-1.5 text-left text-sm", search.category === c.slug ? "bg-accent font-semibold text-primary" : "hover:bg-accent")}>
                {c.name}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <fieldset>
        <legend className="mb-3 text-sm font-bold">Price (₹)</legend>
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const mn = min.trim() === "" ? undefined : Number(min);
            const mx = max.trim() === "" ? undefined : Number(max);
            set({ minPrice: Number.isFinite(mn) ? mn : undefined, maxPrice: Number.isFinite(mx) ? mx : undefined } as Partial<CatalogSearch>);
          }}
        >
          <div className="flex-1">
            <Label htmlFor="minPrice" className="text-xs text-muted-foreground">Min</Label>
            <Input id="minPrice" inputMode="numeric" type="number" min={0} value={min} onChange={(e) => setMin(e.target.value)} placeholder="0" />
          </div>
          <div className="flex-1">
            <Label htmlFor="maxPrice" className="text-xs text-muted-foreground">Max</Label>
            <Input id="maxPrice" inputMode="numeric" type="number" min={0} value={max} onChange={(e) => setMax(e.target.value)} placeholder="Any" />
          </div>
          <Button type="submit" size="sm" variant="soft" className="h-9">Go</Button>
        </form>
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-sm font-bold">Customer rating</legend>
        <div className="flex flex-wrap gap-2">
          {[4, 3, 2].map((r) => (
            <button key={r} onClick={() => (search.minRating === r ? without("minRating") : set({ minRating: r }))} aria-pressed={search.minRating === r} className={cn("inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm transition", search.minRating === r ? "border-electric bg-accent font-semibold text-electric" : "hover:border-electric")}>
              {r} <Star className="size-3.5 fill-star text-star" /> & up
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-sm font-bold">Ships from city</legend>
        <Select value={search.city ?? "all"} onValueChange={(v) => (v === "all" ? without("city") : set({ city: v }))}>
          <SelectTrigger aria-label="City"><SelectValue placeholder="Any city" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any city</SelectItem>
            {cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </fieldset>

      <div className="flex items-center justify-between">
        <Label htmlFor="inStock" className="text-sm font-bold">In stock only</Label>
        <Switch id="inStock" checked={!!search.inStock} onCheckedChange={(v) => (v ? set({ inStock: true }) : without("inStock"))} />
      </div>
    </div>
  );
}

export function CatalogBrowser({ search, onChange, fixedCategory }: Props) {
  const page = search.page ?? 1;
  const params = { ...search, ...(fixedCategory ? { category: fixedCategory } : {}), page, pageSize: PAGE_SIZE };
  const q = useQuery({
    queryKey: ["catalog", "search", params],
    queryFn: () => api().search(params),
    placeholderData: keepPreviousData,
  });
  const cities = q.data?.cities ?? [];
  const total = q.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const sort: SortOption = search.sort ?? (search.q ? "relevance" : "popularity");
  const activeFilters = ["minPrice", "maxPrice", "city", "minRating", "inStock", ...(fixedCategory ? [] : ["category"])].filter((k) => search[k as keyof CatalogSearch] !== undefined).length;

  const goPage = (p: number) => {
    onChange({ ...search, page: p });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
      <aside className="hidden lg:block">
        <div className="sticky top-40 rounded-2xl border bg-card p-5 shadow-card">
          <Filters search={search} onChange={onChange} cities={cities} {...(fixedCategory ? { fixedCategory } : {})} />
        </div>
      </aside>

      <div>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {q.isLoading ? "Searching…" : (
                <>
                  <span className="font-bold text-foreground">{total.toLocaleString("en-IN")}</span> result{total === 1 ? "" : "s"}
                  {search.q && <> for <span className="font-semibold text-foreground">“{search.q}”</span></>}
                </>
              )}
            </p>
            {q.data && (
              <Badge variant={q.data.engine === "opensearch" ? "success" : "warning"} className="gap-1">
                {q.data.engine === "opensearch" ? <Database className="size-3" /> : <FlaskConical className="size-3" />}
                {q.data.engine === "opensearch" ? "Aiven OpenSearch" : "Demo search"}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden">
                  <SlidersHorizontal /> Filters{activeFilters ? ` (${activeFilters})` : ""}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 overflow-y-auto">
                <SheetHeader><SheetTitle>Filters</SheetTitle></SheetHeader>
                <div className="p-4">
                  <Filters search={search} onChange={onChange} cities={cities} {...(fixedCategory ? { fixedCategory } : {})} />
                </div>
              </SheetContent>
            </Sheet>
            <Select value={sort} onValueChange={(v) => { const n = { ...search, sort: v as SortOption }; delete n.page; onChange(n); }}>
              <SelectTrigger className="w-48" aria-label="Sort by"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(SORT_LABELS) as SortOption[]).filter((s) => s !== "relevance" || search.q).map((s) => (
                  <SelectItem key={s} value={s}>{SORT_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {q.isError ? (
          <ErrorState title="Search is unavailable" message={errorMessage(q.error)} onRetry={() => q.refetch()} />
        ) : !q.isLoading && total === 0 ? (
          <EmptyState
            icon={<SearchX className="size-8" />}
            title="No products found"
            description={search.q ? `We couldn't find anything matching “${search.q}”. Try a different spelling, fewer words or remove some filters.` : "No products match these filters. Try widening the price range or removing a filter."}
            action={<Button variant="outline" onClick={() => onChange(search.q ? { q: search.q } : {})}>Clear filters</Button>}
          />
        ) : (
          <div className={cn("transition-opacity", q.isFetching && !q.isLoading && "opacity-60")}>
            <ProductGrid products={q.data?.items ?? []} loading={q.isLoading} skeletons={PAGE_SIZE} className="xl:grid-cols-3 2xl:grid-cols-4" />
          </div>
        )}

        {pages > 1 && (
          <nav className="mt-10 flex items-center justify-center gap-1" aria-label="Pagination">
            <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => goPage(page - 1)} aria-label="Previous page"><ChevronLeft /></Button>
            {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
              <Button key={p} variant={p === page ? "default" : "ghost"} size="icon" onClick={() => goPage(p)} aria-current={p === page ? "page" : undefined}>{p}</Button>
            ))}
            <Button variant="outline" size="icon" disabled={page >= pages} onClick={() => goPage(page + 1)} aria-label="Next page"><ChevronRight /></Button>
          </nav>
        )}
      </div>
    </div>
  );
}
