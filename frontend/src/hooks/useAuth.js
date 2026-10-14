import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import client, { getToken, setToken } from "../api/client";

/**
 * Forgets everything cached for the previous session and sets `me`.
 * The ["me"] query itself is kept (only its data changes) so the route guard,
 * which observes it, sees the change instead of waiting on a removed query.
 */
export const resetSession = (queryClient, user) => {
  queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== "me" });
  queryClient.setQueryData(["me"], user);
};

/** The signed-in user (Me), or null when logged out. */
export const useMe = () =>
  useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      if (!getToken()) return null;
      try {
        const res = await client.get("/auth/me");
        return res.data.user;
      } catch (error) {
        if (error.response?.status === 401) return null;
        throw error;
      }
    },
    retry: false,
    staleTime: 60_000,
    gcTime: Infinity,
  });

const useSession = (path) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body) => (await client.post(path, body)).data,
    onSuccess: ({ token, user }) => {
      // A new session must not see the previous user's cached data.
      setToken(token);
      resetSession(queryClient, user);
    },
  });
};

/** `mutate({ email, password })`. */
export const useLogin = () => useSession("/auth/login");

/** `mutate({ name, handle, email, password, bio?, timezone? })`. */
export const useSignup = () => useSession("/auth/signup");

export const useLogout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      setToken(null);
    },
    onSuccess: () => {
      resetSession(queryClient, null);
    },
  });
};

/** `mutate({ name?, handle?, bio?, timezone? })`. */
export const useUpdateMe = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (changes) => (await client.patch("/users/me", changes)).data.user,
    onSuccess: (user) => {
      queryClient.setQueryData(["me"], user);
      // Name, handle and time zone show up on profiles, lesson authors, lists and streak days.
      ["profile", "followers", "following", "feed", "explore", "lesson", "reviews", "stats"].forEach((key) =>
        queryClient.invalidateQueries({ queryKey: [key] })
      );
    },
  });
};

/** Deletes the signed-in account and ends the session. */
export const useDeleteMe = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await client.delete("/users/me");
      setToken(null);
    },
    onSuccess: () => {
      resetSession(queryClient, null);
    },
  });
};
