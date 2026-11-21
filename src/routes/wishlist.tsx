import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { ProductGrid } from "@/components/product/ProductGrid";
import { EmptyState, ErrorState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { useWishlist } from "@/hooks/use-wishlist";
import { errorMessage } from "@/lib/api";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "My wishlist — ShopSphere" },
      { name: "description", content: "Products you've saved for later on ShopSphere." },
      { property: "og:title", content: "My wishlist — ShopSphere" },
      { property: "og:description", content: "Your saved products." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <WishlistPage />
    </RequireAuth>
  ),
});

function WishlistPage() {
  const q = useWishlist();
  return (
    <div className="container-shop py-8">
      <h1 className="text-3xl font-extrabold">My wishlist</h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">{q.data?.length ?? 0} saved item{q.data?.length === 1 ? "" : "s"}</p>
      {q.isError ? (
        <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} />
      ) : q.data?.length === 0 ? (
        <EmptyState icon={<Heart className="size-8" />} title="Your wishlist is empty" description="Tap the heart on any product to save it here for later." action={<Button asChild><Link to="/search">Explore products</Link></Button>} />
      ) : (
        <ProductGrid products={q.data ?? []} loading={q.isLoading} skeletons={4} />
      )}
    </div>
  );
}
