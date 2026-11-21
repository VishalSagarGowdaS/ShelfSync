import { useEffect, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { EmptyState, PageLoader } from "@/components/states";
import { Button } from "@/components/ui/button";

/** Client-side route guard. The backend independently enforces auth on every protected endpoint. */
export function RequireAuth({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const href = useRouterState({ select: (s) => s.location.href });

  useEffect(() => {
    if (!isLoading && !user) void navigate({ to: "/login", search: { redirect: href }, replace: true });
  }, [isLoading, user, navigate, href]);

  if (isLoading || !user) return <PageLoader label="Checking your session…" />;
  if (admin && user.role !== "ADMIN")
    return (
      <div className="container-shop py-16">
        <EmptyState
          icon={<ShieldAlert className="size-8" />}
          title="Administrators only"
          description="Your account doesn't have access to the admin dashboard."
          action={<Button asChild><Link to="/">Back to shopping</Link></Button>}
        />
      </div>
    );
  return <>{children}</>;
}
