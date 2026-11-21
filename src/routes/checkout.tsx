import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Banknote, Loader2, Lock, MapPin, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { RequireAuth } from "@/components/RequireAuth";
import { OrderSummary } from "@/components/OrderSummary";
import { EmptyState, ErrorState, PageLoader } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { api, ApiError, errorMessage } from "@/lib/api";
import { formatINR } from "@/lib/pricing";
import type { CheckoutInput } from "@/lib/types";
import { INDIAN_STATES, validateCheckout, type FieldErrors } from "@/lib/validation";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — ShopSphere" },
      { name: "description", content: "Enter your delivery details and place your order with Cash on Delivery." },
      { property: "og:title", content: "Checkout — ShopSphere" },
      { property: "og:description", content: "Secure checkout with Cash on Delivery." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <CheckoutPage />
    </RequireAuth>
  ),
});

const EMPTY: CheckoutInput = { fullName: "", email: "", phone: "", address: "", city: "", state: "", pincode: "" };

function Field({ id, label, error, children }: { id: string; label: string; error?: string | undefined; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p id={`${id}-error`} className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}

function CheckoutPage() {
  const { user } = useAuth();
  const cartQ = useCart();
  const addressesQ = useQuery({ queryKey: ["addresses", user?.id], queryFn: () => api().listAddresses() });
  const [form, setForm] = useState<CheckoutInput>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors<CheckoutInput>>({});
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (!user) return;
    const def = addressesQ.data?.find((a) => a.isDefault) ?? addressesQ.data?.[0];
    setForm((f) => ({
      ...f,
      fullName: f.fullName || def?.fullName || user.fullName,
      email: f.email || user.email,
      phone: f.phone || def?.phone || user.phone || "",
      ...(def && !f.address ? { address: def.line1, city: def.city, state: def.state, pincode: def.pincode } : {}),
    }));
  }, [user, addressesQ.data]);

  const place = useMutation({
    mutationFn: (input: CheckoutInput) => api().placeOrder(input),
    onSuccess: (order) => {
      void qc.invalidateQueries({ queryKey: ["cart"] });
      void qc.invalidateQueries({ queryKey: ["orders"] });
      void navigate({ to: "/orders/$id", params: { id: order.id } });
    },
    onError: (e) => {
      if (e instanceof ApiError && e.details && typeof e.details === "object") setErrors(e.details as FieldErrors<CheckoutInput>);
      toast.error(errorMessage(e, "Could not place your order"));
      void qc.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  if (cartQ.isLoading) return <PageLoader label="Preparing checkout…" />;
  if (cartQ.isError) return <div className="container-shop py-10"><ErrorState message={errorMessage(cartQ.error)} onRetry={() => cartQ.refetch()} /></div>;
  const cart = cartQ.data!;
  if (!cart.items.length && !place.isPending)
    return (
      <div className="container-shop py-16">
        <EmptyState icon={<ShoppingBag className="size-8" />} title="Nothing to checkout" description="Your cart is empty. Add some products first." action={<Button asChild><Link to="/search">Browse products</Link></Button>} />
      </div>
    );

  const set = (k: keyof CheckoutInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }));
  };
  const inputProps = (k: keyof CheckoutInput) => ({
    id: k,
    value: form[k],
    onChange: set(k),
    "aria-invalid": !!errors[k],
    ...(errors[k] ? { "aria-describedby": `${k}-error` } : {}),
    className: cn(errors[k] && "border-destructive focus-visible:ring-destructive"),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateCheckout(form);
    setErrors(errs);
    if (Object.keys(errs).length) {
      toast.error("Please correct the highlighted fields");
      return;
    }
    place.mutate({ ...form, phone: form.phone.replace(/\s|-/g, "") });
  };

  return (
    <div className="container-shop py-8">
      <h1 className="text-3xl font-extrabold">Checkout</h1>
      <form onSubmit={submit} noValidate className="mt-6 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="rounded-2xl border bg-card p-6 shadow-card">
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-lg font-bold"><MapPin className="size-5 text-electric" /> Delivery details</h2>
              {(addressesQ.data?.length ?? 0) > 0 && (
                <Select onValueChange={(id) => { const a = addressesQ.data?.find((x) => x.id === id); if (a) setForm((f) => ({ ...f, fullName: a.fullName, phone: a.phone, address: a.line1, city: a.city, state: a.state, pincode: a.pincode })); }}>
                  <SelectTrigger className="w-48" aria-label="Use a saved address"><SelectValue placeholder="Use saved address" /></SelectTrigger>
                  <SelectContent>{addressesQ.data?.map((a) => <SelectItem key={a.id} value={a.id}>{a.label} · {a.city}</SelectItem>)}</SelectContent>
                </Select>
              )}
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field id="fullName" label="Full name" error={errors.fullName}><Input autoComplete="name" {...inputProps("fullName")} /></Field>
              <Field id="phone" label="Mobile number" error={errors.phone}><Input inputMode="tel" autoComplete="tel" placeholder="10-digit mobile" {...inputProps("phone")} /></Field>
              <div className="sm:col-span-2"><Field id="email" label="Email" error={errors.email}><Input type="email" autoComplete="email" {...inputProps("email")} /></Field></div>
              <div className="sm:col-span-2"><Field id="address" label="Address (house no., street, area)" error={errors.address}><Textarea rows={2} autoComplete="street-address" {...inputProps("address")} /></Field></div>
              <Field id="city" label="City" error={errors.city}><Input autoComplete="address-level2" {...inputProps("city")} /></Field>
              <Field id="state" label="State" error={errors.state}>
                <Select value={form.state} onValueChange={(v) => { setForm((f) => ({ ...f, state: v })); setErrors((x) => ({ ...x, state: undefined })); }}>
                  <SelectTrigger id="state" aria-invalid={!!errors.state} className={cn(errors.state && "border-destructive")}><SelectValue placeholder="Select state" /></SelectTrigger>
                  <SelectContent>{INDIAN_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field id="pincode" label="PIN code" error={errors.pincode}><Input inputMode="numeric" maxLength={6} autoComplete="postal-code" {...inputProps("pincode")} /></Field>
            </div>
          </section>

          <section className="rounded-2xl border bg-card p-6 shadow-card">
            <h2 className="flex items-center gap-2 text-lg font-bold"><Banknote className="size-5 text-electric" /> Payment method</h2>
            <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border-2 border-electric bg-accent p-4">
              <input type="radio" name="payment" checked readOnly className="mt-1 accent-[var(--electric)]" />
              <span>
                <span className="block font-semibold">Cash on Delivery</span>
                <span className="block text-sm text-muted-foreground">Pay {formatINR(cart.total)} in cash or UPI when your order arrives.</span>
              </span>
            </label>
            <p className="mt-3 text-xs text-muted-foreground">Online payments are not enabled yet.</p>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-40 lg:self-start">
          <div className="rounded-2xl border bg-card p-5 shadow-card">
            <h2 className="text-sm font-bold">Items in this order</h2>
            <ul className="mt-3 max-h-72 space-y-3 overflow-y-auto pr-1">
              {cart.items.map((it) => (
                <li key={it.id} className="flex items-center gap-3">
                  <img src={it.product.imageUrl} alt="" className="size-14 rounded-lg bg-surface object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-medium">{it.product.name}</p>
                    <p className="text-xs text-muted-foreground">{it.quantity} × {formatINR(it.product.sellingPrice)}</p>
                  </div>
                  <p className="text-sm font-bold">{formatINR(it.quantity * it.product.sellingPrice)}</p>
                </li>
              ))}
            </ul>
          </div>
          <OrderSummary cart={cart}>
            <Button type="submit" variant="brand" size="xl" className="mt-5 w-full" disabled={place.isPending}>
              {place.isPending ? <><Loader2 className="animate-spin" /> Placing order…</> : <><Lock /> Place Order · {formatINR(cart.total)}</>}
            </Button>
          </OrderSummary>
        </aside>
      </form>
    </div>
  );
}
