import { formatINR } from "@/lib/pricing";
import { cn } from "@/lib/utils";

export function PriceBlock({ selling, original, discount, size = "sm" }: { selling: number; original: number; discount: number; size?: "sm" | "lg" }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <span className={cn("font-extrabold text-foreground", size === "lg" ? "text-3xl" : "text-lg")}>{formatINR(selling)}</span>
      {original > selling && (
        <>
          <span className={cn("text-muted-foreground line-through", size === "lg" ? "text-base" : "text-xs")}>
            {formatINR(original)}
          </span>
          <span className={cn("font-bold text-success", size === "lg" ? "text-base" : "text-xs")}>{discount}% off</span>
        </>
      )}
    </div>
  );
}
