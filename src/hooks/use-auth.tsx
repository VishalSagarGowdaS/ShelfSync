import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useHydrated } from "@tanstack/react-router";
import { api } from "@/lib/api";
import { setToken } from "@/lib/api/config";
import type { User } from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (input: { fullName: string; email: string; password: string; phone?: string }) => Promise<User>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const hydrated = useHydrated();
  const qc = useQueryClient();
  const meQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => api().me(),
    enabled: hydrated,
    staleTime: 60_000,
    retry: false,
  });

  const afterAuth = useCallback(
    async (user: User) => {
      qc.setQueryData(["auth", "me"], user);
      await qc.invalidateQueries({ predicate: (q) => q.queryKey[0] !== "auth" });
      return user;
    },
    [qc],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user: meQuery.data ?? null,
      isLoading: !hydrated || meQuery.isLoading,
      isAdmin: meQuery.data?.role === "ADMIN",
      login: async (email, password) => {
        const r = await api().login({ email, password });
        setToken(r.token);
        return afterAuth(r.user);
      },
      register: async (input) => {
        const r = await api().register(input);
        setToken(r.token);
        return afterAuth(r.user);
      },
      logout: async () => {
        try {
          await api().logout();
        } finally {
          setToken(null);
          qc.setQueryData(["auth", "me"], null);
          qc.removeQueries({ predicate: (q) => q.queryKey[0] !== "auth" && q.queryKey[0] !== "catalog" });
        }
      },
      refresh: async () => {
        await qc.invalidateQueries({ queryKey: ["auth", "me"] });
      },
    }),
    [meQuery.data, meQuery.isLoading, hydrated, afterAuth, qc],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
