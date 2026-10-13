import { useQuery } from "@tanstack/react-query";
import client, { getToken } from "../api/client";

/** The signed-in user, or null when logged out. */
export const useMe = () =>
  useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      if (!getToken()) return null;
      const { data } = await client.get("/auth/me");
      return data.user;
    },
    retry: false,
  });
