import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { toast } from "sonner";
import { api, errorMessage } from "@/lib/api";
import type { Cart, Product } from "@/lib/types";
import { useAuth } from "./use-auth";

export const cartKey = ["cart"] as const;

export function useCart() {
  const { user } = useAuth();
  return useQuery({
    queryKey: [...cartKey, user?.id ?? "guest"],
    queryFn: () => api().getCart(),
    enabled: !!user,
  });
}

export function useCartActions() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.href });
  const setCart = (cart: Cart) => {
    qc.setQueryData([...cartKey, user?.id ?? "guest"], cart);
    void qc.invalidateQueries({ queryKey: ["catalog"] });
  };

  const add = useMutation({
    mutationFn: ({ product, quantity }: { product: Product; quantity: number }) =>
      api().addToCart(product.id, quantity),
    onSuccess: (cart, { product }) => {
      setCart(cart);
      toast.success("Added to cart", { description: product.name });
    },
    onError: (e) => toast.error(errorMessage(e, "Could not add to cart")),
  });

  const update = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      api().updateCartItem(itemId, quantity),
    onSuccess: setCart,
    onError: (e) => toast.error(errorMessage(e, "Could not update quantity")),
  });

  const remove = useMutation({
    mutationFn: (itemId: string) => api().removeCartItem(itemId),
    onSuccess: (cart) => {
      setCart(cart);
      toast("Removed from cart");
    },
    onError: (e) => toast.error(errorMessage(e, "Could not remove item")),
  });

  const addToCart = (product: Product, quantity = 1) => {
    if (!user) {
      toast("Sign in to add items to your cart");
      void navigate({ to: "/login", search: { redirect: pathname } });
      return;
    }
    add.mutate({ product, quantity });
  };

  return { addToCart, add, update, remove };
}
