import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import client from "../api/client";

const PAGE_SIZE = 10;

const nextPage = (last) => (last.hasMore ? last.page + 1 : undefined);

/** Every query whose lessons or counts change when a lesson, remember or quiz answer changes. */
const invalidateLessonData = (queryClient, id) =>
  Promise.all(
    [["feed"], ["explore"], ["tags"], ["reviews"], ["profile"], ["stats"], ["decks"], ["deck"], ...(id ? [["lesson", id]] : [])].map((queryKey) =>
      queryClient.invalidateQueries({ queryKey })
    )
  );

/** The signed-in feed: lesson and due-review items, paged. */
export const useFeed = ({ enabled = true } = {}) =>
  useInfiniteQuery({
    queryKey: ["feed"],
    queryFn: async ({ pageParam }) => (await client.get("/feed", { params: { page: pageParam, limit: PAGE_SIZE } })).data,
    initialPageParam: 1,
    getNextPageParam: nextPage,
    enabled,
  });

/** Everyone's lessons, newest first, optionally for one tag. */
export const useExplore = (tag) =>
  useInfiniteQuery({
    queryKey: ["explore", tag ?? null],
    queryFn: async ({ pageParam }) =>
      (await client.get("/lessons/explore", { params: { page: pageParam, limit: PAGE_SIZE, ...(tag ? { tag } : {}) } })).data,
    initialPageParam: 1,
    getNextPageParam: nextPage,
  });

/** Tags in use, most used first. */
export const useTags = () =>
  useQuery({
    queryKey: ["tags"],
    queryFn: async () => (await client.get("/lessons/tags")).data.items,
    staleTime: 60_000,
  });

export const useLesson = (id) =>
  useQuery({
    queryKey: ["lesson", id],
    queryFn: async () => (await client.get(`/lessons/${id}`)).data.lesson,
    enabled: Boolean(id),
    retry: (count, error) => error.response?.status !== 404 && count < 2,
  });

export const useCreateLesson = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input) => (await client.post("/lessons", input)).data.lesson,
    onSuccess: () => invalidateLessonData(queryClient),
  });
};

export const useUpdateLesson = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...changes }) => (await client.patch(`/lessons/${id}`, changes)).data.lesson,
    onSuccess: (lesson) => {
      queryClient.setQueryData(["lesson", lesson.id], lesson);
      return invalidateLessonData(queryClient, lesson.id);
    },
  });
};

export const useDeleteLesson = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      await client.delete(`/lessons/${id}`);
      return id;
    },
    onSuccess: (id) => {
      queryClient.removeQueries({ queryKey: ["lesson", id] });
      return invalidateLessonData(queryClient);
    },
  });
};

export const useRemember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await client.post(`/lessons/${id}/remember`)).data,
    onSuccess: (_, id) => Promise.all([invalidateLessonData(queryClient, id), queryClient.invalidateQueries({ queryKey: ["me"] })]),
  });
};

export const useUnremember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => client.delete(`/lessons/${id}/remember`),
    onSuccess: (_, id) => Promise.all([invalidateLessonData(queryClient, id), queryClient.invalidateQueries({ queryKey: ["me"] })]),
  });
};

/** Check a quiz answer outside the review queue: `{ id, choice }` or `{ id, answer }`. */
export const useAnswerQuiz = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }) => (await client.post(`/lessons/${id}/quiz/answer`, body)).data,
    onSuccess: (_, { id }) =>
      Promise.all([["lesson", id], ["feed"], ["explore"], ["profile"]].map((queryKey) => queryClient.invalidateQueries({ queryKey }))),
  });
};
