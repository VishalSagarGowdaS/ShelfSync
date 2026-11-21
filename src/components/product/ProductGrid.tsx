import type { Product } from "@/lib/types";
import { ProductCard, ProductCardSkeleton } from "./ProductCard";
import { cn } from "@/lib/utils";

export function ProductGrid({ products, loading, skeletons = 8, className }: { products?: Product[]; loading?: boolean; skeletons?: number; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4", className)}>
      {loading
        ? Array.from({ length: skeletons }, (_, i) => <ProductCardSkeleton key={i} />)
        : products?.map((p) => <ProductCard key={p.id} product={p} />)}
    </div>
  );
}
