import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function Logo({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <Link to="/" className={cn("group flex items-center gap-2", className)} aria-label="ShopSphere home">
      <span className="relative grid size-9 place-items-center rounded-xl bg-gradient-brand shadow-glow transition-transform group-hover:scale-105">
        <svg viewBox="0 0 24 24" className="size-5 text-electric-foreground" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
          <circle cx="12" cy="12" r="8.5" />
          <path d="M3.8 9.5h16.4M3.8 14.5h16.4M12 3.5c2.4 2.4 3.4 5.4 3.4 8.5s-1 6.1-3.4 8.5c-2.4-2.4-3.4-5.4-3.4-8.5s1-6.1 3.4-8.5Z" strokeLinecap="round" />
        </svg>
      </span>
      <span className={cn("text-xl font-extrabold tracking-tight", inverted ? "text-navy-foreground" : "text-primary")}>
        Shop<span className="text-gradient-brand">Sphere</span>
      </span>
    </Link>
  );
}
