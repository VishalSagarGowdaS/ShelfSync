import { LOW_STOCK_THRESHOLD } from "@/lib/pricing";
import { cn } from "@/lib/utils";

export function StockLabel({ stock, className }: { stock: number; className?: string }) {
  if (stock <= 0) return <p className={cn("text-xs font-semibold text-destructive", className)}>Out of stock</p>;
  if (stock <= LOW_STOCK_THRESHOLD)
    return <p className={cn("text-xs font-semibold text-warning-foreground", className)}>Only {stock} left — hurry!</p>;
  return <p className={cn("text-xs font-medium text-success", className)}>In stock · {stock} available</p>;
}
