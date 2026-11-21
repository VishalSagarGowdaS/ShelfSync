import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { toast } from "sonner";
import { api, errorMessage } from "@/lib/api";
import type { Product } from "@/lib/types";
import { useAuth } from "./use-auth";

export function useWishlist() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["wishlist", user?.id ?? "guest"],
    queryFn: () => api().getWishlist(),
    enabled: !!user,
  });
}

export function useWishlistToggle() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const href = useRouterState({ select: (s) => s.location.href });
  const { data } = useWishlist();
  const ids = new Set((data ?? []).map((p) => p.id));

  const m = useMutation({
    mutationFn: async (product: Product) => {
      if (ids.has(product.id)) {
        await api().removeFromWishlist(product.id);
        return { product, added: false };
      }
      await api().addToWishlist(product.id);
      return { product, added: true };
    },
    onSuccess: ({ product, added }) => {
      void qc.invalidateQueries({ queryKey: ["wishlist"] });
      toast.success(added ? "Saved to wishlist" : "Removed from wishlist", { description: product.name });
    },
    onError: (e) => toast.error(errorMessage(e, "Could not update wishlist")),
  });

  return {
    isWishlisted: (id: string) => ids.has(id),
    toggle: (product: Product) => {
      if (!user) {
        toast("Sign in to save items to your wishlist");
        void navigate({ to: "/login", search: { redirect: href } });
        return;
      }
      m.mutate(product);
    },
    pending: m.isPending,
  };
}
