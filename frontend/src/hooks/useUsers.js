import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import client from "../api/client";

const PAGE_SIZE = 20;

const nextPage = (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined);

const pagedQuery = (path) => async ({ pageParam }) =>
  (await client.get(path, { params: { page: pageParam, limit: PAGE_SIZE } })).data;

/** `{ user, counts, stats, viewer }` for a handle. */
export const useProfile = (handle) =>
  useQuery({
    queryKey: ["profile", handle],
    queryFn: async () => (await client.get(`/users/${encodeURIComponent(handle)}`)).data,
    enabled: !!handle,
    retry: (count, error) => error.response?.status !== 404 && count < 2,
  });

/** A user's lessons, newest first, in pages. */
export const useUserLessons = (handle) =>
  useInfiniteQuery({
    queryKey: ["profile", handle, "lessons"],
    queryFn: pagedQuery(`/users/${encodeURIComponent(handle)}/lessons`),
    initialPageParam: 1,
    getNextPageParam: nextPage,
    enabled: !!handle,
  });

export const useFollowers = (handle) =>
  useInfiniteQuery({
    queryKey: ["followers", handle],
    queryFn: pagedQuery(`/users/${encodeURIComponent(handle)}/followers`),
    initialPageParam: 1,
    getNextPageParam: nextPage,
    enabled: !!handle,
  });

export const useFollowing = (handle) =>
  useInfiniteQuery({
    queryKey: ["following", handle],
    queryFn: pagedQuery(`/users/${encodeURIComponent(handle)}/following`),
    initialPageParam: 1,
    getNextPageParam: nextPage,
    enabled: !!handle,
  });

/** Follows change both people's counts and lists, and which lessons the feed mixes in. */
const invalidateFollowData = (queryClient) =>
  ["profile", "followers", "following", "feed"].forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));

/** `mutate(handle)`. */
export const useFollow = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (handle) => (await client.post(`/users/${encodeURIComponent(handle)}/follow`)).data,
    onSuccess: () => invalidateFollowData(queryClient),
  });
};

/** `mutate(handle)`. */
export const useUnfollow = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (handle) => {
      await client.delete(`/users/${encodeURIComponent(handle)}/follow`);
    },
    onSuccess: () => invalidateFollowData(queryClient),
  });
};
