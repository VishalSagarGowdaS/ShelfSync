import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Rating({ value, count, className, size = "sm" }: { value: number; count?: number; className?: string; size?: "sm" | "md" }) {
  return (
    <div className={cn("flex items-center gap-1.5", className)} aria-label={`Rated ${value.toFixed(1)} out of 5`}>
      <span className={cn("inline-flex items-center gap-1 rounded-md bg-success px-1.5 py-0.5 font-bold text-success-foreground", size === "md" ? "text-sm" : "text-xs")}>
        {value.toFixed(1)}
        <Star className={cn("fill-current", size === "md" ? "size-3.5" : "size-3")} aria-hidden="true" />
      </span>
      {count !== undefined && (
        <span className={cn("text-muted-foreground", size === "md" ? "text-sm" : "text-xs")}>
          ({count.toLocaleString("en-IN")})
        </span>
      )}
    </div>
  );
}
