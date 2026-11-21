import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, LayoutDashboard, LogOut, Menu, Package, ShoppingCart, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "./Logo";
import { SearchBar } from "./SearchBar";
import { ModeBanner } from "./ModeBanner";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { useWishlist } from "@/hooks/use-wishlist";
import { NAV_CATEGORIES } from "@/lib/categories";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

function CountBadge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span className="absolute -right-1.5 -top-1.5 grid min-w-5 place-items-center rounded-full bg-gradient-brand px-1 text-[10px] font-bold leading-5 text-electric-foreground ring-2 ring-card">
      {count > 99 ? "99+" : count}
    </span>
  );
}

const navLinkClass =
  "whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-primary";

export function SiteHeader() {
  const { user, isAdmin, logout } = useAuth();
  const { data: cart } = useCart();
  const { data: wishlist } = useWishlist();
  const navigate = useNavigate();

  const onLogout = async () => {
    await logout();
    toast.success("You have been signed out");
    void navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/85">
      <ModeBanner />
      <div className="container-shop flex h-16 items-center gap-3 lg:gap-6">
        <Sheet>
          <SheetTrigger asChild>
            <button className="grid size-10 place-items-center rounded-lg hover:bg-accent lg:hidden" aria-label="Open menu">
              <Menu className="size-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80">
            <SheetHeader>
              <SheetTitle className="text-left">
                <Logo />
              </SheetTitle>
            </SheetHeader>
            <nav className="mt-6 flex flex-col gap-1 px-4" aria-label="Mobile">
              <Link to="/" className={navLinkClass} activeOptions={{ exact: true }} activeProps={{ className: "bg-accent text-primary" }}>
                Home
              </Link>
              {NAV_CATEGORIES.map((c) => (
                <Link key={c.slug} to="/category/$slug" params={{ slug: c.slug }} className={navLinkClass} activeProps={{ className: "bg-accent text-primary" }}>
                  {c.label}
                </Link>
              ))}
              <Link to="/deals" className={navLinkClass}>Today's Deals</Link>
              <div className="my-3 border-t" />
              {user ? (
                <>
                  <Link to="/account" className={navLinkClass}>My account</Link>
                  <Link to="/wishlist" className={navLinkClass}>Wishlist</Link>
                  {isAdmin && <Link to="/admin" className={navLinkClass}>Admin dashboard</Link>}
                  <button onClick={onLogout} className={`${navLinkClass} text-left`}>Sign out</button>
                </>
              ) : (
                <>
                  <Link to="/login" search={{}} className={navLinkClass}>Sign in</Link>
                  <Link to="/register" className={navLinkClass}>Create account</Link>
                </>
              )}
            </nav>
          </SheetContent>
        </Sheet>

        <Logo />

        <SearchBar className="hidden flex-1 md:block" />

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-accent" aria-label="Account">
                <UserIcon className="size-5" />
                <span className="hidden text-left leading-tight xl:block">
                  <span className="block text-[11px] text-muted-foreground">{user ? "Hello," : "Hello, sign in"}</span>
                  <span className="block max-w-28 truncate text-sm font-semibold">{user ? user.fullName.split(" ")[0] : "Account"}</span>
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {user ? (
                <>
                  <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => navigate({ to: "/account" })}>
                    <UserIcon /> My account
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => navigate({ to: "/account", hash: "orders" })}>
                    <Package /> My orders
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem onSelect={() => navigate({ to: "/admin" })}>
                      <LayoutDashboard /> Admin dashboard
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={onLogout}>
                    <LogOut /> Sign out
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem onSelect={() => navigate({ to: "/login", search: {} })}>Sign in</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => navigate({ to: "/register" })}>Create account</DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Link to="/wishlist" className="relative grid size-10 place-items-center rounded-lg hover:bg-accent" aria-label={`Wishlist${wishlist?.length ? `, ${wishlist.length} items` : ""}`}>
            <Heart className="size-5" />
            <CountBadge count={wishlist?.length ?? 0} />
          </Link>

          <Link to="/cart" className="relative flex items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-accent" aria-label={`Cart, ${cart?.itemCount ?? 0} items`}>
            <span className="relative">
              <ShoppingCart className="size-5" />
              <CountBadge count={cart?.itemCount ?? 0} />
            </span>
            <span className="hidden text-sm font-semibold xl:block">Cart</span>
          </Link>
        </div>
      </div>

      <div className="container-shop pb-3 md:hidden">
        <SearchBar />
      </div>

      <nav className="hidden border-t lg:block" aria-label="Categories">
        <div className="container-shop no-scrollbar flex h-11 items-center gap-1 overflow-x-auto">
          <Link to="/" className={navLinkClass} activeOptions={{ exact: true }} activeProps={{ className: "bg-accent text-primary" }}>
            Home
          </Link>
          {NAV_CATEGORIES.map((c) => (
            <Link key={c.slug} to="/category/$slug" params={{ slug: c.slug }} className={navLinkClass} activeProps={{ className: "bg-accent text-primary" }}>
              {c.label}
            </Link>
          ))}
          <Link to="/deals" className={`${navLinkClass} ml-auto font-semibold text-deal hover:text-deal`}>
            Today's Deals
          </Link>
        </div>
      </nav>
    </header>
  );
}
