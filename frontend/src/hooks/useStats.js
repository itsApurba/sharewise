import { useQuery } from "@tanstack/react-query";
import client from "../api/client";

export const useMyStats = ({ enabled = true } = {}) =>
  useQuery({
    queryKey: ["stats", "me"],
    queryFn: async () => (await client.get("/analytics/me")).data.stats,
    enabled,
  });
