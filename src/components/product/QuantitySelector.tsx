import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function QuantitySelector({ value, max, onChange, disabled, size = "md" }: { value: number; max: number; onChange: (v: number) => void; disabled?: boolean; size?: "sm" | "md" }) {
  const btn = cn("grid place-items-center transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40", size === "sm" ? "size-8" : "size-10");
  return (
    <div className={cn("inline-flex items-center overflow-hidden rounded-xl border bg-card", disabled && "opacity-60")}>
      <button type="button" className={btn} onClick={() => onChange(value - 1)} disabled={disabled || value <= 1} aria-label="Decrease quantity">
        <Minus className="size-4" />
      </button>
      <span className={cn("min-w-10 text-center font-bold tabular-nums", size === "sm" ? "text-sm" : "")} aria-live="polite" aria-label={`Quantity ${value}`}>
        {value}
      </span>
      <button type="button" className={btn} onClick={() => onChange(value + 1)} disabled={disabled || value >= max} aria-label="Increase quantity">
        <Plus className="size-4" />
      </button>
    </div>
  );
}
