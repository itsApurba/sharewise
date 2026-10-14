import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import client from "../api/client";

/** The signed-in user's due cards, most overdue first, plus the total due (X-Due-Count). */
export const useDueReviews = ({ enabled = true } = {}) =>
  useQuery({
    queryKey: ["reviews", "due"],
    queryFn: async () => {
      const res = await client.get("/reviews/due", { params: { limit: 50 } });
      const total = Number(res.headers["x-due-count"]);
      return { items: res.data.items, total: Number.isFinite(total) ? total : res.data.items.length };
    },
    enabled,
    // Cards come due at local midnight, so check back now and then.
    refetchInterval: 5 * 60_000,
  });

/**
 * Answer a due card: `{ id, grade: "got" | "forgot" }`, `{ id, choice }` or `{ id, answer }`.
 * Pass `keepFeed: true` to leave ["feed"] stale until the caller invalidates it, so an
 * answered card can show its result before it leaves the feed.
 */
export const useAnswerReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    // eslint-disable-next-line no-unused-vars
    mutationFn: async ({ id, keepFeed, ...body }) => (await client.post(`/reviews/${id}/answer`, body)).data,
    onSuccess: (_, { keepFeed }) =>
      Promise.all(
        [["reviews"], ...(keepFeed ? [] : [["feed"]]), ["stats", "me"], ["me"], ["profile"], ["stats", "top-lessons"]].map((queryKey) =>
          queryClient.invalidateQueries({ queryKey })
        )
      ),
  });
};
