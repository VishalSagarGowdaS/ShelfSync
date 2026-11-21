import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { Activity, ArrowLeft, Boxes, LayoutDashboard, Menu, Package, ShoppingBag } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { Logo } from "@/components/layout/Logo";
import { ModeBanner } from "@/components/layout/ModeBanner";
import { useAuth } from "@/hooks/use-auth";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — ShopSphere" },
      { name: "description", content: "ShopSphere administration: sales analytics, products, orders, inventory and integrations." },
      { property: "og:title", content: "Admin — ShopSphere" },
      { property: "og:description", content: "ShopSphere admin dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

const links = [
  { to: "/admin" as const, label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/products" as const, label: "Products", icon: Package, exact: false },
  { to: "/admin/orders" as const, label: "Orders", icon: ShoppingBag, exact: false },
  { to: "/admin/inventory" as const, label: "Inventory", icon: Boxes, exact: false },
  { to: "/admin/integrations" as const, label: "Integrations", icon: Activity, exact: false },
];

function Nav() {
  const { user } = useAuth();
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="p-5"><Logo inverted /></div>
      <nav className="flex-1 space-y-1 px-3" aria-label="Admin">
        {links.map(({ to, label, icon: Icon, exact }) => (
          <Link key={to} to={to} activeOptions={{ exact }} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition hover:bg-sidebar-accent" activeProps={{ className: "bg-sidebar-primary text-sidebar-primary-foreground shadow-glow hover:bg-sidebar-primary" }}>
            <Icon className="size-4" /> {label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-sidebar-border p-4 text-sm">
        <p className="truncate font-semibold text-sidebar-accent-foreground">{user?.fullName}</p>
        <p className="truncate text-xs">{user?.email}</p>
        <Link to="/" className="mt-3 flex items-center gap-2 text-xs font-semibold hover:text-sidebar-accent-foreground"><ArrowLeft className="size-3.5" /> Back to store</Link>
      </div>
    </div>
  );
}

function AdminLayout() {
  return (
    <div className="min-h-screen bg-background">
      <ModeBanner />
      <RequireAuth admin>
        <div className="flex">
          <aside className="sticky top-0 hidden h-screen w-64 shrink-0 lg:block"><Nav /></aside>
          <div className="min-w-0 flex-1">
            <div className="flex h-14 items-center gap-3 border-b bg-card px-4 lg:hidden">
              <Sheet>
                <SheetTrigger asChild><button aria-label="Open admin menu" className="grid size-9 place-items-center rounded-lg hover:bg-accent"><Menu className="size-5" /></button></SheetTrigger>
                <SheetContent side="left" className="w-64 border-0 p-0"><SheetTitle className="sr-only">Admin menu</SheetTitle><Nav /></SheetContent>
              </Sheet>
              <span className="font-bold">Admin</span>
            </div>
            <main className="p-4 sm:p-6 lg:p-8 animate-page-in"><Outlet /></main>
          </div>
        </div>
      </RequireAuth>
    </div>
  );
}
