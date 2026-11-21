import { Link } from "@tanstack/react-router";
import { FlaskConical, Radio } from "lucide-react";
import { useApiMode } from "@/hooks/use-mode";

export function ModeBanner() {
  const mode = useApiMode();
  if (mode === null) return <div className="h-8 bg-navy" aria-hidden="true" />;
  if (mode === "live")
    return (
      <div className="flex h-8 items-center justify-center gap-2 bg-navy px-4 text-xs text-navy-foreground">
        <Radio className="size-3.5 text-success" aria-hidden="true" />
        <span>Live mode — connected to the ShopSphere backend.</span>
        <Link to="/status" className="font-semibold underline underline-offset-2">
          Service status
        </Link>
      </div>
    );
  return (
    <div className="flex min-h-8 flex-wrap items-center justify-center gap-x-2 bg-navy px-4 py-1 text-center text-xs text-navy-foreground">
      <FlaskConical className="size-3.5 text-warning" aria-hidden="true" />
      <span>
        <strong className="font-semibold">Demo mode:</strong> data and order processing are simulated in your
        browser. No Aiven services are connected.
      </span>
      <Link to="/status" className="font-semibold underline underline-offset-2">
        Connect backend
      </Link>
    </div>
  );
}
