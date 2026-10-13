import { useQuery } from "@tanstack/react-query";
import client, { getToken } from "../api/client";

/** The signed-in user (Me), or null when logged out. */
export const useMe = () =>
  useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      if (!getToken()) return null;
      try {
        const { data } = await client.get("/auth/me");
        return data.user;
      } catch (error) {
        if (error.response?.status === 401) return null;
        throw error;
      }
    },
    retry: false,
    staleTime: 60_000,
  });
