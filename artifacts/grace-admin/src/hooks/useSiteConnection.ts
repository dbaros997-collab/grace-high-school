import { useQuery } from "@tanstack/react-query";
import { getApiRoot } from "@workspace/api-client-react";

type ReadyzBody = {
  status?: string;
  database?: string;
  hint?: string;
};

export function useSiteConnection() {
  return useQuery({
    queryKey: ["site-readyz", getApiRoot()],
    queryFn: async (): Promise<ReadyzBody & { ok: boolean }> => {
      const res = await fetch(`${getApiRoot()}/readyz`, { cache: "no-store" });
      let body: ReadyzBody = {};
      try {
        body = (await res.json()) as ReadyzBody;
      } catch {
        body = {};
      }
      return { ...body, ok: res.ok };
    },
    refetchInterval: 30_000,
    retry: 2,
  });
}
