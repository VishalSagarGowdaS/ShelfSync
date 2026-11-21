import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BadgePercent } from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ErrorState } from "@/components/states";
import { Countdown } from "@/components/home/Countdown";

export const Route = createFileRoute("/deals")({
  head: () => ({
    meta: [
      { title: "Today's Deals — ShopSphere" },
      { name: "description", content: "The biggest discounts of the day across electronics, fashion, home, grocery, beauty and sports." },
      { property: "og:title", content: "Today's Deals — ShopSphere" },
      { property: "og:description", content: "Lightning deals that end at midnight." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DealsPage,
});

function DealsPage() {
  const q = useQuery({ queryKey: ["catalog", "section", "deals", "all"], queryFn: () => api().listProducts({ section: "deals" }) });
  return (
    <div className="container-shop py-8">
      <div className="mb-8 flex flex-col justify-between gap-6 rounded-3xl bg-gradient-promo p-8 text-navy-foreground sm:flex-row sm:items-center">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-navy-foreground/80"><BadgePercent className="size-4" /> Updated daily</p>
          <h1 className="mt-1 text-4xl font-extrabold">Today's Deals</h1>
          <p className="mt-2 text-navy-foreground/80">Sorted by the biggest discount first. Offers end at midnight.</p>
        </div>
        <Countdown />
      </div>
      {q.isError ? <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} /> : <ProductGrid products={q.data ?? []} loading={q.isLoading} skeletons={12} />}
    </div>
  );
}
