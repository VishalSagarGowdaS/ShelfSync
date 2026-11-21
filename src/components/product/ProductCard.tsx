import { Link } from "@tanstack/react-router";
import { Heart, ShoppingCart } from "lucide-react";
import type { Product } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Rating } from "./Rating";
import { PriceBlock } from "./PriceBlock";
import { StockLabel } from "./StockLabel";
import { useCartActions } from "@/hooks/use-cart";
import { useWishlistToggle } from "@/hooks/use-wishlist";
import { cn } from "@/lib/utils";

export function ProductCard({ product }: { product: Product }) {
  const { addToCart, add } = useCartActions();
  const wish = useWishlistToggle();
  const wished = wish.isWishlisted(product.id);
  const adding = add.isPending && add.variables?.product.id === product.id;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover">
      <Link to="/product/$id" params={{ id: product.id }} className="relative block aspect-square overflow-hidden bg-surface">
        <img
          src={product.imageUrl}
          alt={product.name}
          loading="lazy"
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {product.discountPercent > 0 && (
          <span className="absolute left-3 top-3 rounded-lg bg-deal px-2 py-1 text-xs font-bold text-deal-foreground shadow">
            {product.discountPercent}% OFF
          </span>
        )}
      </Link>
      <button
        type="button"
        onClick={() => wish.toggle(product)}
        aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
        aria-pressed={wished}
        className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-card/90 shadow-card backdrop-blur transition hover:scale-110"
      >
        <Heart className={cn("size-4", wished ? "fill-deal text-deal" : "text-muted-foreground")} />
      </button>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <Link to="/product/$id" params={{ id: product.id }} className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-foreground hover:text-electric">
          {product.name}
        </Link>
        <Rating value={product.rating} count={product.ratingCount} />
        <PriceBlock selling={product.sellingPrice} original={product.originalPrice} discount={product.discountPercent} />
        <StockLabel stock={product.stock} />
        <Button
          className="mt-auto w-full"
          variant={product.stock > 0 ? "default" : "secondary"}
          disabled={product.stock <= 0 || adding}
          onClick={() => addToCart(product)}
        >
          <ShoppingCart /> {product.stock <= 0 ? "Out of stock" : adding ? "Adding…" : "Add to Cart"}
        </Button>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-card">
      <div className="aspect-square animate-pulse bg-muted" />
      <div className="space-y-2.5 p-4">
        <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
        <div className="h-4 w-2/5 animate-pulse rounded bg-muted" />
        <div className="h-6 w-3/5 animate-pulse rounded bg-muted" />
        <div className="h-9 w-full animate-pulse rounded-md bg-muted" />
      </div>
    </div>
  );
}
