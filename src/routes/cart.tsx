import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ShoppingBag, Trash2 } from "lucide-react";
import { useCart, useCartActions } from "@/hooks/use-cart";
import { RequireAuth } from "@/components/RequireAuth";
import { EmptyState, ErrorState, PageLoader } from "@/components/states";
import { QuantitySelector } from "@/components/product/QuantitySelector";
import { StockLabel } from "@/components/product/StockLabel";
import { Button } from "@/components/ui/button";
import { errorMessage } from "@/lib/api";
import { formatINR } from "@/lib/pricing";
import { OrderSummary } from "@/components/OrderSummary";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your cart — ShopSphere" },
      { name: "description", content: "Review the items in your ShopSphere cart and proceed to checkout." },
      { property: "og:title", content: "Your cart — ShopSphere" },
      { property: "og:description", content: "Review your cart and checkout." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <CartPage />
    </RequireAuth>
  ),
});

function CartPage() {
  const q = useCart();
  const { update, remove } = useCartActions();

  if (q.isLoading) return <PageLoader label="Loading your cart…" />;
  if (q.isError) return <div className="container-shop py-10"><ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} /></div>;
  const cart = q.data!;

  if (!cart.items.length)
    return (
      <div className="container-shop py-16">
        <EmptyState icon={<ShoppingBag className="size-8" />} title="Your cart is empty" description="Looks like you haven't added anything yet. Explore our deals and best sellers." action={<Button variant="brand" asChild><Link to="/search">Start shopping</Link></Button>} />
      </div>
    );

  return (
    <div className="container-shop py-8">
      <h1 className="text-3xl font-extrabold">Shopping cart</h1>
      <p className="mt-1 text-sm text-muted-foreground">{cart.itemCount} item{cart.itemCount === 1 ? "" : "s"} in your cart</p>
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
        <ul className="space-y-4">
          {cart.items.map((item) => {
            const busy = (update.isPending && update.variables?.itemId === item.id) || (remove.isPending && remove.variables === item.id);
            const over = item.quantity > item.product.stock;
            return (
              <li key={item.id} className="flex gap-4 rounded-2xl border bg-card p-4 shadow-card">
                <Link to="/product/$id" params={{ id: item.productId }} className="shrink-0">
                  <img src={item.product.imageUrl} alt={item.product.name} className="size-24 rounded-xl bg-surface object-cover sm:size-32" />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex justify-between gap-3">
                    <Link to="/product/$id" params={{ id: item.productId }} className="line-clamp-2 font-semibold hover:text-electric">{item.product.name}</Link>
                    <p className="shrink-0 text-right font-extrabold">{formatINR(item.product.sellingPrice * item.quantity)}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatINR(item.product.sellingPrice)} each
                    {item.product.originalPrice > item.product.sellingPrice && <span className="ml-2 line-through">{formatINR(item.product.originalPrice)}</span>}
                  </p>
                  <StockLabel stock={item.product.stock} />
                  {over && <p className="text-xs font-semibold text-destructive">Only {item.product.stock} available — reduce the quantity to continue.</p>}
                  <div className="mt-auto flex items-center justify-between gap-3">
                    <QuantitySelector size="sm" value={item.quantity} max={Math.max(item.product.stock, 1)} disabled={busy} onChange={(v) => update.mutate({ itemId: item.id, quantity: v })} />
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" disabled={busy} onClick={() => remove.mutate(item.id)}>
                      <Trash2 /> Remove
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        <div className="lg:sticky lg:top-40 lg:self-start">
          <OrderSummary cart={cart}>
            <Button variant="brand" size="xl" className="mt-5 w-full" asChild disabled={cart.items.some((i) => i.quantity > i.product.stock)}>
              <Link to="/checkout">Proceed to checkout <ArrowRight /></Link>
            </Button>
          </OrderSummary>
        </div>
      </div>
    </div>
  );
}
