import { useHydrated } from "@tanstack/react-router";
import { getMode, type ApiMode } from "@/lib/api/config";

/** Mode is only known in the browser (it reads the saved backend URL); null during SSR. */
export function useApiMode(): ApiMode | null {
  const hydrated = useHydrated();
  return hydrated ? getMode() : null;
}
