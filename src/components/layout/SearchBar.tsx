import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { api } from "@/lib/api";
import { categoryName } from "@/lib/categories";
import { cn } from "@/lib/utils";

export function SearchBar({ className, initial = "" }: { className?: string; initial?: string }) {
  const navigate = useNavigate();
  const [value, setValue] = useState(initial);
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value.trim()), 200);
    return () => clearTimeout(t);
  }, [value]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const { data: suggestions = [] } = useQuery({
    queryKey: ["catalog", "suggest", debounced],
    queryFn: () => api().suggest(debounced),
    enabled: debounced.length >= 2,
    staleTime: 30_000,
  });

  const go = (q: string) => {
    setOpen(false);
    void navigate({ to: "/search", search: q ? { q } : {} });
  };

  return (
    <div ref={boxRef} className={cn("relative", className)}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          const pick = suggestions[active];
          if (open && pick) {
            setOpen(false);
            void navigate({ to: "/product/$id", params: { id: pick.id } });
          } else go(value.trim());
        }}
        className="flex h-11 items-center overflow-hidden rounded-xl border border-input bg-card shadow-card focus-within:border-electric focus-within:ring-2 focus-within:ring-electric/20"
      >
        <Search className="ml-3.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <input
          type="search"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, suggestions.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, -1));
            } else if (e.key === "Escape") setOpen(false);
          }}
          placeholder="Search for earphones, kurtis, air fryers…"
          aria-label="Search products"
          aria-autocomplete="list"
          className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          className="h-full bg-gradient-brand px-5 text-sm font-semibold text-electric-foreground transition hover:brightness-110"
        >
          Search
        </button>
      </form>
      {open && debounced.length >= 2 && suggestions.length > 0 && (
        <ul
          role="listbox"
          className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-xl border bg-popover py-1 shadow-card-hover animate-in fade-in-0 slide-in-from-top-1"
        >
          {suggestions.map((s, i) => (
            <li key={s.id} role="option" aria-selected={i === active}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => {
                  setOpen(false);
                  void navigate({ to: "/product/$id", params: { id: s.id } });
                }}
                className={cn(
                  "flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm",
                  i === active ? "bg-accent" : "hover:bg-accent",
                )}
              >
                <span className="flex items-center gap-2">
                  <Search className="size-3.5 text-muted-foreground" aria-hidden="true" />
                  <span className="line-clamp-1">{s.name}</span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">in {categoryName(s.categorySlug)}</span>
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => go(value.trim())}
              className="w-full border-t px-4 py-2.5 text-left text-sm font-medium text-electric hover:bg-accent"
            >
              See all results for “{value.trim()}”
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
