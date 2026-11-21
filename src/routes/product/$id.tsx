import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Banknote, ChevronRight, Heart, MapPin, PackageCheck, RotateCcw, ShoppingCart, Truck, Zap } from "lucide-react";
import { api, ApiError, errorMessage } from "@/lib/api";
import { categoryName } from "@/lib/categories";
import { clampQuantity, formatINR, FREE_DELIVERY_THRESHOLD } from "@/lib/pricing";
import { Button } from "@/components/ui/button";
import { Rating } from "@/components/product/Rating";
import { PriceBlock } from "@/components/product/PriceBlock";
import { StockLabel } from "@/components/product/StockLabel";
import { QuantitySelector } from "@/components/product/QuantitySelector";
import { ProductGrid } from "@/components/product/ProductGrid";
import { EmptyState, ErrorState } from "@/components/states";
import { useCartActions } from "@/hooks/use-cart";
import { useWishlistToggle } from "@/hooks/use-wishlist";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/product/$id")({
  head: () => ({
    meta: [
      { title: "Product details — ShopSphere" },
      { name: "description", content: "Product details, specifications, price and stock availability on ShopSphere." },
      { property: "og:title", content: "Product details — ShopSphere" },
      { property: "og:description", content: "See price, specifications and availability." },
      { property: "og:type", content: "product" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const q = useQuery({ queryKey: ["catalog", "product", id], queryFn: () => api().getProduct(id), retry: (n, e) => !(e instanceof ApiError && e.status === 404) && n < 2 });
  const product = q.data;
  const similar = useQuery({
    queryKey: ["catalog", "similar", product?.categorySlug],
    queryFn: () => api().listProducts({ category: product!.categorySlug, section: "trending", limit: 5 }),
    enabled: !!product,
  });
  const [qty, setQty] = useState(1);
  const { add } = useCartActions();
  const { addToCart } = useCartActions();
  const wish = useWishlistToggle();

  useEffect(() => {
    if (product) {
      setQty((v) => clampQuantity(v, product.stock) || 1);
      document.title = `${product.name} — ShopSphere`;
    }
  }, [product]);

  if (q.isLoading)
    return (
      <div className="container-shop grid gap-10 py-10 lg:grid-cols-2">
        <div className="aspect-square animate-pulse rounded-3xl bg-muted" />
        <div className="space-y-4">
          <div className="h-8 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-5 w-1/3 animate-pulse rounded bg-muted" />
          <div className="h-10 w-1/2 animate-pulse rounded bg-muted" />
          <div className="h-32 animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    );

  if (q.isError || !product)
    return (
      <div className="container-shop py-16">
        {q.error instanceof ApiError && q.error.status === 404 ? (
          <EmptyState icon={<PackageCheck className="size-8" />} title="Product not found" description="This product may have been removed or the link is incorrect." action={<Button asChild><Link to="/search">Browse products</Link></Button>} />
        ) : (
          <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} />
        )}
      </div>
    );

  const outOfStock = product.stock <= 0;
  const wished = wish.isWishlisted(product.id);
  const save = product.originalPrice - product.sellingPrice;

  const buyNow = async () => {
    if (!user) return addToCart(product, qty);
    try {
      await add.mutateAsync({ product, quantity: qty });
      void navigate({ to: "/checkout" });
    } catch {
      /* toast already shown */
    }
  };

  return (
    <div className="container-shop py-8">
      <nav className="mb-6 flex flex-wrap items-center gap-1 text-xs text-muted-foreground" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-foreground">Home</Link>
        <ChevronRight className="size-3" />
        <Link to="/category/$slug" params={{ slug: product.categorySlug }} className="hover:text-foreground">{categoryName(product.categorySlug)}</Link>
        <ChevronRight className="size-3" />
        <span className="line-clamp-1 text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="relative overflow-hidden rounded-3xl border bg-surface shadow-card lg:sticky lg:top-40 lg:self-start">
          <img src={product.imageUrl} alt={product.name} className="aspect-square w-full object-cover" />
          {product.discountPercent > 0 && (
            <span className="absolute left-4 top-4 rounded-xl bg-deal px-3 py-1.5 text-sm font-bold text-deal-foreground shadow">{product.discountPercent}% OFF</span>
          )}
        </div>

        <div>
          <p className="text-sm font-semibold text-electric">{categoryName(product.categorySlug)}</p>
          <h1 className="mt-1 text-3xl font-extrabold leading-tight sm:text-4xl">{product.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <Rating value={product.rating} count={product.ratingCount} size="md" />
            <span className="text-sm text-muted-foreground">{product.soldCount.toLocaleString("en-IN")}+ bought</span>
          </div>

          <div className="mt-6 rounded-2xl border bg-card p-5 shadow-card">
            <PriceBlock selling={product.sellingPrice} original={product.originalPrice} discount={product.discountPercent} size="lg" />
            {save > 0 && <p className="mt-1 text-sm font-semibold text-success">You save {formatINR(save)}</p>}
            <p className="mt-1 text-xs text-muted-foreground">Inclusive of all taxes</p>
            <StockLabel stock={product.stock} className="mt-4 text-sm" />

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <QuantitySelector value={qty} max={Math.max(1, product.stock)} onChange={(v) => setQty(clampQuantity(v, product.stock) || 1)} disabled={outOfStock} />
              {!outOfStock && <span className="text-xs text-muted-foreground">Max {product.stock}</span>}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Button size="xl" variant="default" disabled={outOfStock || add.isPending} onClick={() => addToCart(product, qty)}>
                <ShoppingCart /> {add.isPending ? "Adding…" : "Add to Cart"}
              </Button>
              <Button size="xl" variant="brand" disabled={outOfStock || add.isPending} onClick={buyNow}>
                <Zap /> Buy Now
              </Button>
            </div>
            <Button variant="ghost" className="mt-3 w-full" onClick={() => wish.toggle(product)} aria-pressed={wished}>
              <Heart className={cn(wished && "fill-deal text-deal")} /> {wished ? "Saved to wishlist" : "Add to wishlist"}
            </Button>
          </div>

          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              { icon: Truck, t: product.sellingPrice >= FREE_DELIVERY_THRESHOLD ? "Free delivery" : `Free delivery over ${formatINR(FREE_DELIVERY_THRESHOLD)}`, d: "Delivered in 3–5 days" },
              { icon: Banknote, t: "Cash on Delivery", d: "Pay when your order arrives" },
              { icon: RotateCcw, t: "7-day returns", d: "Easy, no-questions returns" },
              { icon: MapPin, t: `Ships from ${product.city}`, d: "Packed by a verified seller" },
            ].map(({ icon: Icon, t, d }) => (
              <li key={t} className="flex gap-3 rounded-xl border bg-card p-3">
                <Icon className="mt-0.5 size-5 shrink-0 text-electric" />
                <div>
                  <p className="text-sm font-semibold">{t}</p>
                  <p className="text-xs text-muted-foreground">{d}</p>
                </div>
              </li>
            ))}
          </ul>

          <section className="mt-8">
            <h2 className="text-lg font-bold">About this product</h2>
            <p className="mt-2 leading-relaxed text-muted-foreground">{product.description}</p>
          </section>

          {Object.keys(product.specifications).length > 0 && (
            <section className="mt-8">
              <h2 className="text-lg font-bold">Specifications</h2>
              <dl className="mt-3 divide-y overflow-hidden rounded-2xl border bg-card">
                {Object.entries(product.specifications).map(([k, v]) => (
                  <div key={k} className="grid grid-cols-[40%_1fr] gap-4 px-4 py-3 text-sm">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </div>
      </div>

      {(similar.data?.filter((p) => p.id !== product.id).length ?? 0) > 0 && (
        <section className="mt-16">
          <h2 className="mb-5 text-2xl font-extrabold">More in {categoryName(product.categorySlug)}</h2>
          <ProductGrid products={similar.data?.filter((p) => p.id !== product.id).slice(0, 4) ?? []} />
        </section>
      )}
    </div>
  );
}
