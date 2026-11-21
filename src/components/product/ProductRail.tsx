import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { api, errorMessage } from "@/lib/api";
import type { ProductSection } from "@/lib/types";
import { ProductCard, ProductCardSkeleton } from "./ProductCard";
import { ErrorState } from "@/components/states";

export function ProductRail({ title, subtitle, section, icon, limit = 8 }: { title: string; subtitle?: string; section: ProductSection; icon?: ReactNode; limit?: number }) {
  const q = useQuery({ queryKey: ["catalog", "section", section, limit], queryFn: () => api().listProducts({ section, limit }) });
  const sort = section === "new" ? "newest" : section === "bestsellers" || section === "trending" ? "popularity" : section === "recommended" ? "rating" : undefined;
  return (
    <section className="container-shop mt-14">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-extrabold text-foreground sm:text-3xl">
            {icon}
            {title}
          </h2>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {section === "deals" ? (
          <Link to="/deals" className="flex shrink-0 items-center gap-1 text-sm font-semibold text-electric hover:underline">
            View all <ArrowRight className="size-4" />
          </Link>
        ) : (
          <Link to="/search" search={sort ? { sort } : {}} className="flex shrink-0 items-center gap-1 text-sm font-semibold text-electric hover:underline">
            View all <ArrowRight className="size-4" />
          </Link>
        )}
      </div>
      {q.isError ? (
        <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} />
      ) : (
        <div className="no-scrollbar flex snap-x gap-4 overflow-x-auto pb-4 pt-1">
          {(q.data ?? Array.from({ length: 5 }, () => null)).map((p, i) => (
            <div key={p?.id ?? i} className="w-[46%] shrink-0 snap-start sm:w-[31%] lg:w-[23%] xl:w-[19%]">
              {p ? <ProductCard product={p} /> : <ProductCardSkeleton />}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
