import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, MapPin, Package, Plus, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { RequireAuth } from "@/components/RequireAuth";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { EmptyState, ErrorState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { api, errorMessage } from "@/lib/api";
import { formatINR } from "@/lib/pricing";
import type { Address } from "@/lib/types";
import { INDIAN_STATES, PHONE_RE, PINCODE_RE } from "@/lib/validation";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "My account — ShopSphere" },
      { name: "description", content: "Manage your ShopSphere profile, saved addresses and order history." },
      { property: "og:title", content: "My account — ShopSphere" },
      { property: "og:description", content: "Your profile, addresses and orders." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <AccountPage />
    </RequireAuth>
  ),
});

function ProfileCard() {
  const { user, refresh } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  useEffect(() => {
    setFullName(user?.fullName ?? "");
    setPhone(user?.phone ?? "");
  }, [user]);
  const m = useMutation({
    mutationFn: () => api().updateProfile({ fullName: fullName.trim(), phone: phone.trim() }),
    onSuccess: async () => {
      await refresh();
      toast.success("Profile updated");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  return (
    <section className="rounded-2xl border bg-card p-6 shadow-card">
      <h2 className="flex items-center gap-2 text-lg font-bold"><UserRound className="size-5 text-electric" /> Profile</h2>
      <form
        className="mt-4 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (fullName.trim().length < 2) { toast.error("Enter your full name"); return; }
          if (phone.trim() && !PHONE_RE.test(phone.trim())) { toast.error("Enter a valid 10-digit mobile number"); return; }
          m.mutate();
        }}
      >
        <div className="space-y-1.5"><Label>Email</Label><Input value={user?.email ?? ""} disabled /></div>
        <div className="space-y-1.5"><Label htmlFor="pf-name">Full name</Label><Input id="pf-name" value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor="pf-phone">Mobile number</Label><Input id="pf-phone" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
        <p className="text-xs text-muted-foreground">Account type: {user?.role === "ADMIN" ? "Administrator" : "Customer"}</p>
        <Button type="submit" disabled={m.isPending}>{m.isPending && <Loader2 className="animate-spin" />} Save changes</Button>
      </form>
    </section>
  );
}

const EMPTY_ADDR: Omit<Address, "id"> = { label: "Home", fullName: "", phone: "", line1: "", city: "", state: "", pincode: "", isDefault: false };

function AddressesCard() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["addresses", user?.id], queryFn: () => api().listAddresses() });
  const [open, setOpen] = useState(false);
  const [a, setA] = useState(EMPTY_ADDR);
  const add = useMutation({
    mutationFn: () => api().addAddress(a),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["addresses"] });
      setOpen(false);
      setA(EMPTY_ADDR);
      toast.success("Address saved");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const del = useMutation({
    mutationFn: (id: string) => api().deleteAddress(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["addresses"] });
      toast("Address removed");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const set = (k: keyof typeof a) => (e: React.ChangeEvent<HTMLInputElement>) => setA((x) => ({ ...x, [k]: e.target.value }));

  return (
    <section className="rounded-2xl border bg-card p-6 shadow-card">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold"><MapPin className="size-5 text-electric" /> Saved addresses</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm" variant="soft"><Plus /> Add</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add a new address</DialogTitle></DialogHeader>
            <form
              id="addr-form"
              className="grid gap-3 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (a.fullName.trim().length < 2 || a.line1.trim().length < 8 || a.city.trim().length < 2 || !a.state) { toast.error("Please fill in all address fields"); return; }
                if (!PHONE_RE.test(a.phone.trim())) { toast.error("Enter a valid 10-digit mobile number"); return; }
                if (!PINCODE_RE.test(a.pincode.trim())) { toast.error("Enter a valid 6-digit PIN code"); return; }
                add.mutate();
              }}
            >
              <div className="space-y-1.5"><Label htmlFor="a-label">Label</Label><Input id="a-label" value={a.label} onChange={set("label")} placeholder="Home, Office…" /></div>
              <div className="space-y-1.5"><Label htmlFor="a-name">Full name</Label><Input id="a-name" value={a.fullName} onChange={set("fullName")} /></div>
              <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="a-line">Address</Label><Input id="a-line" value={a.line1} onChange={set("line1")} /></div>
              <div className="space-y-1.5"><Label htmlFor="a-city">City</Label><Input id="a-city" value={a.city} onChange={set("city")} /></div>
              <div className="space-y-1.5">
                <Label>State</Label>
                <Select value={a.state} onValueChange={(v) => setA((x) => ({ ...x, state: v }))}>
                  <SelectTrigger aria-label="State"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{INDIAN_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label htmlFor="a-pin">PIN code</Label><Input id="a-pin" value={a.pincode} onChange={set("pincode")} maxLength={6} /></div>
              <div className="space-y-1.5"><Label htmlFor="a-phone">Mobile</Label><Input id="a-phone" value={a.phone} onChange={set("phone")} /></div>
              <label className="flex items-center gap-2 text-sm sm:col-span-2"><Checkbox checked={a.isDefault} onCheckedChange={(v) => setA((x) => ({ ...x, isDefault: v === true }))} /> Make this my default address</label>
            </form>
            <DialogFooter>
              <Button type="submit" form="addr-form" disabled={add.isPending}>{add.isPending && <Loader2 className="animate-spin" />} Save address</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="mt-4 space-y-3">
        {q.isLoading && <div className="h-20 animate-pulse rounded-xl bg-muted" />}
        {q.isError && <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} />}
        {q.data?.length === 0 && <p className="text-sm text-muted-foreground">No saved addresses yet.</p>}
        {q.data?.map((ad) => (
          <div key={ad.id} className="flex items-start justify-between gap-3 rounded-xl border p-4">
            <div className="text-sm">
              <p className="font-semibold">{ad.label} {ad.isDefault && <span className="ml-1 rounded bg-accent px-1.5 py-0.5 text-[10px] font-bold text-electric">DEFAULT</span>}</p>
              <p className="text-muted-foreground">{ad.fullName} · {ad.phone}</p>
              <p className="text-muted-foreground">{ad.line1}, {ad.city}, {ad.state} {ad.pincode}</p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild><Button variant="ghost" size="icon" aria-label="Delete address"><Trash2 className="text-destructive" /></Button></AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this address?</AlertDialogTitle>
                  <AlertDialogDescription>{ad.line1}, {ad.city} will be removed from your saved addresses.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => del.mutate(ad.id)}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ))}
      </div>
    </section>
  );
}

function OrdersCard() {
  const { user } = useAuth();
  const q = useQuery({ queryKey: ["orders", "mine", user?.id], queryFn: () => api().listOrders(), refetchInterval: (qq) => (qq.state.data?.some((o) => o.status === "PENDING") ? 2000 : false) });
  return (
    <section id="orders" className="scroll-mt-40 rounded-2xl border bg-card p-6 shadow-card">
      <h2 className="flex items-center gap-2 text-lg font-bold"><Package className="size-5 text-electric" /> Order history</h2>
      <div className="mt-4">
        {q.isLoading && <div className="h-24 animate-pulse rounded-xl bg-muted" />}
        {q.isError && <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} />}
        {q.data?.length === 0 && (
          <EmptyState icon={<Package className="size-8" />} title="No orders yet" description="When you place an order it will appear here." action={<Button asChild><Link to="/search">Start shopping</Link></Button>} />
        )}
        <ul className="space-y-3">
          {q.data?.map((o) => (
            <li key={o.id}>
              <Link to="/orders/$id" params={{ id: o.id }} className="flex flex-wrap items-center gap-4 rounded-xl border p-4 transition hover:border-electric hover:shadow-card">
                <div className="flex -space-x-3">
                  {o.items.slice(0, 3).map((it) => it.imageUrl && <img key={it.id} src={it.imageUrl} alt="" className="size-12 rounded-lg border-2 border-card bg-surface object-cover" />)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{o.orderNumber}</p>
                  <p className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleString("en-IN")} · {o.items.reduce((s, i) => s + i.quantity, 0)} items</p>
                </div>
                <OrderStatusBadge status={o.status} />
                <p className="w-24 text-right font-bold">{formatINR(o.total)}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function AccountPage() {
  const { user } = useAuth();
  return (
    <div className="container-shop py-8">
      <h1 className="text-3xl font-extrabold">Hello, {user?.fullName.split(" ")[0]}</h1>
      <p className="mt-1 text-sm text-muted-foreground">Manage your profile, addresses and orders.</p>
      <div className="mt-6 grid gap-6 lg:grid-cols-[380px_1fr]">
        <div className="space-y-6">
          <ProfileCard />
          <AddressesCard />
        </div>
        <OrdersCard />
      </div>
    </div>
  );
}
