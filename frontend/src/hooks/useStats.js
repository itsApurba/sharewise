import { useQuery } from "@tanstack/react-query";
import client from "../api/client";

export const useMyStats = () =>
  useQuery({
    queryKey: ["stats", "me"],
    queryFn: async () => (await client.get("/analytics/me")).data.stats,
  });

export const useTopTeachers = () =>
  useQuery({
    queryKey: ["stats", "top-teachers"],
    queryFn: async () => (await client.get("/analytics/teachers/top")).data.items,
  });
