import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import client from "../api/client";

const PAGE_SIZE = 20;

const nextPage = (last) => (last.hasMore ? last.page + 1 : undefined);

/** Every deck query: ["decks", …] lists and ["deck", id] pages. */
const invalidateDecks = (queryClient) =>
  Promise.all([["decks"], ["deck"]].map((queryKey) => queryClient.invalidateQueries({ queryKey })));

/** Remember all changes the same lesson, review and stats data a single remember does. */
const invalidateRememberData = (queryClient) =>
  Promise.all(
    [["decks"], ["deck"], ["feed"], ["explore"], ["reviews"], ["profile"], ["stats"], ["lesson"], ["me"]].map((queryKey) =>
      queryClient.invalidateQueries({ queryKey })
    )
  );

/** `{ deck, lessons }` for a deck id. */
export const useDeck = (id) =>
  useQuery({
    queryKey: ["deck", id],
    queryFn: async () => (await client.get(`/decks/${id}`)).data,
    enabled: Boolean(id),
    retry: (count, error) => error.response?.status !== 404 && count < 2,
  });

/** Decks with the most remembers, for the Explore row. */
export const usePopularDecks = (limit = 8) =>
  useQuery({
    queryKey: ["decks", "popular", limit],
    queryFn: async () => (await client.get("/decks/popular", { params: { limit } })).data.items,
  });

/** A user's decks, newest first, in pages. */
export const useUserDecks = (handle) =>
  useInfiniteQuery({
    queryKey: ["decks", "user", handle],
    queryFn: async ({ pageParam }) =>
      (await client.get(`/users/${encodeURIComponent(handle)}/decks`, { params: { page: pageParam, limit: PAGE_SIZE } })).data,
    initialPageParam: 1,
    getNextPageParam: nextPage,
    enabled: Boolean(handle),
  });

/** `mutate({ title, description, emoji, color })` → the new Deck. */
export const useCreateDeck = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input) => (await client.post("/decks", input)).data.deck,
    onSuccess: () => invalidateDecks(queryClient),
  });
};

/** `mutate({ id, ...changes })` → the updated Deck. */
export const useUpdateDeck = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...changes }) => (await client.patch(`/decks/${id}`, changes)).data.deck,
    onSuccess: () => invalidateDecks(queryClient),
  });
};

/** `mutate(id)`. */
export const useDeleteDeck = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      await client.delete(`/decks/${id}`);
      return id;
    },
    onSuccess: (id) => {
      queryClient.removeQueries({ queryKey: ["deck", id] });
      return invalidateDecks(queryClient);
    },
  });
};

/** `mutate({ deckId, lessonId })` → the updated Deck. */
export const useAddToDeck = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ deckId, lessonId }) => (await client.post(`/decks/${deckId}/lessons`, { lessonId })).data.deck,
    onSuccess: () => invalidateDecks(queryClient),
  });
};

/** `mutate({ deckId, lessonId })`. */
export const useRemoveFromDeck = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ deckId, lessonId }) => client.delete(`/decks/${deckId}/lessons/${lessonId}`),
    onSuccess: () => invalidateDecks(queryClient),
  });
};

/** `mutate(deckId)` → `{ remembered, skipped, deck }`. */
export const useRememberDeck = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (deckId) => (await client.post(`/decks/${deckId}/remember`)).data,
    onSuccess: () => invalidateRememberData(queryClient),
  });
};
