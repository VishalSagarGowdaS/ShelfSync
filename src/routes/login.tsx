import { useState } from "react";
import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { FlaskConical, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useApiMode } from "@/hooks/use-mode";
import { errorMessage } from "@/lib/api";
import { EMAIL_RE } from "@/lib/validation";

export const Route = createFileRoute("/login")({
  validateSearch: (raw: Record<string, unknown>): { redirect?: string } =>
    typeof raw["redirect"] === "string" && raw["redirect"].startsWith("/") ? { redirect: raw["redirect"] } : {},
  head: () => ({
    meta: [
      { title: "Sign in — ShopSphere" },
      { name: "description", content: "Sign in to your ShopSphere account to view your cart, orders and wishlist." },
      { property: "og:title", content: "Sign in — ShopSphere" },
      { property: "og:description", content: "Sign in to ShopSphere." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { redirect } = Route.useSearch();
  const { login } = useAuth();
  const mode = useApiMode();
  const navigate = useNavigate();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const doLogin = async (e: string, p: string) => {
    setError(null);
    if (!EMAIL_RE.test(e)) return setError("Enter a valid email address");
    if (!p) return setError("Enter your password");
    setBusy(true);
    try {
      const user = await login(e, p);
      toast.success(`Welcome back, ${user.fullName.split(" ")[0]}!`);
      if (redirect) router.history.replace(redirect);
      else void navigate({ to: user.role === "ADMIN" ? "/admin" : "/", replace: true });
    } catch (err) {
      setError(errorMessage(err, "Could not sign in"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to continue shopping">
      <form onSubmit={(ev) => { ev.preventDefault(); void doLogin(email.trim(), password); }} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive">{error}</p>}
        <Button type="submit" variant="brand" size="xl" className="w-full" disabled={busy}>
          {busy && <Loader2 className="animate-spin" />} Sign in
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to ShopSphere? <Link to="/register" className="font-semibold text-electric hover:underline">Create an account</Link>
      </p>
      {mode === "demo" && (
        <div className="mt-6 rounded-2xl border border-dashed bg-warning-soft p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-warning-foreground"><FlaskConical className="size-4" /> Demo accounts</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <Button variant="outline" size="sm" disabled={busy} onClick={() => doLogin("customer@shopsphere.demo", "Customer@123")}>Customer (Priya)</Button>
            <Button variant="outline" size="sm" disabled={busy} onClick={() => doLogin("rahul@shopsphere.demo", "Customer@123")}>Customer (Rahul)</Button>
            <Button variant="outline" size="sm" disabled={busy} onClick={() => doLogin("admin@shopsphere.demo", "Admin@123")}>Administrator</Button>
          </div>
        </div>
      )}
    </AuthShell>
  );
}
