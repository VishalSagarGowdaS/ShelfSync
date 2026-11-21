import type { ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";
import { media } from "@/data/catalog";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="container-shop py-10">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl border bg-card shadow-card-hover lg:grid-cols-2">
        <div className="relative hidden bg-gradient-hero p-10 text-navy-foreground lg:block">
          <img src={media.hero} alt="" className="absolute inset-0 size-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/70 to-navy/40" />
          <div className="relative flex h-full flex-col justify-end gap-4">
            <h2 className="text-3xl font-extrabold">Everything You Need. One Shopping Destination.</h2>
            <ul className="space-y-2 text-sm text-navy-foreground/85">
              {["Your cart is saved across devices", "Track every order in real time", "Wishlist and saved addresses"].map((t) => (
                <li key={t} className="flex items-center gap-2"><CheckCircle2 className="size-4 text-success" /> {t}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="p-8 sm:p-10">
          <h1 className="text-3xl font-extrabold">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
