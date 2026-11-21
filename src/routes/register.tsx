import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { errorMessage } from "@/lib/api";
import { EMAIL_RE, PHONE_RE, validatePassword } from "@/lib/validation";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create account — ShopSphere" },
      { name: "description", content: "Create your free ShopSphere account to save your cart, track orders and build a wishlist." },
      { property: "og:title", content: "Create account — ShopSphere" },
      { property: "og:description", content: "Join ShopSphere." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RegisterPage,
});

type Errors = Partial<Record<"fullName" | "email" | "phone" | "password" | "confirm", string>>;

function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [f, setF] = useState({ fullName: "", email: "", phone: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Errors = {};
    if (f.fullName.trim().length < 2) errs.fullName = "Enter your full name";
    if (!EMAIL_RE.test(f.email.trim())) errs.email = "Enter a valid email address";
    if (f.phone && !PHONE_RE.test(f.phone.trim())) errs.phone = "Enter a valid 10-digit mobile number";
    const pw = validatePassword(f.password);
    if (pw) errs.password = pw;
    if (f.password !== f.confirm) errs.confirm = "Passwords don't match";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    setFormError(null);
    try {
      await register({ fullName: f.fullName.trim(), email: f.email.trim(), password: f.password, ...(f.phone.trim() ? { phone: f.phone.trim() } : {}) });
      toast.success("Account created — welcome to ShopSphere!");
      void navigate({ to: "/" });
    } catch (err) {
      setFormError(errorMessage(err, "Could not create your account"));
    } finally {
      setBusy(false);
    }
  };

  const field = (k: keyof typeof f, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div className="space-y-1.5">
      <Label htmlFor={k}>{label}</Label>
      <Input id={k} value={f[k]} onChange={(e) => setF((x) => ({ ...x, [k]: e.target.value }))} aria-invalid={!!errors[k]} {...props} />
      {errors[k] && <p className="text-xs font-medium text-destructive">{errors[k]}</p>}
    </div>
  );

  return (
    <AuthShell title="Create your account" subtitle="It takes less than a minute">
      <form onSubmit={submit} className="space-y-4" noValidate>
        {field("fullName", "Full name", { autoComplete: "name" })}
        {field("email", "Email", { type: "email", autoComplete: "email" })}
        {field("phone", "Mobile number (optional)", { inputMode: "tel", autoComplete: "tel" })}
        {field("password", "Password", { type: "password", autoComplete: "new-password" })}
        {field("confirm", "Confirm password", { type: "password", autoComplete: "new-password" })}
        {formError && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive">{formError}</p>}
        <Button type="submit" variant="brand" size="xl" className="w-full" disabled={busy}>
          {busy && <Loader2 className="animate-spin" />} Create account
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account? <Link to="/login" search={{}} className="font-semibold text-electric hover:underline">Sign in</Link>
      </p>
    </AuthShell>
  );
}
