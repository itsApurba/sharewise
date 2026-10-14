import { useQuery } from "@tanstack/react-query";
import client from "../api/client";

/** The signed-in user's streaks, mastered and due counts (`GET /analytics/me`). */
export const useMyStats = ({ enabled = true } = {}) =>
  useQuery({
    queryKey: ["stats", "me"],
    queryFn: async () => (await client.get("/analytics/me")).data.stats,
    enabled,
  });

/** Lessons remembered by the most people. */
export const useTopLessons = (limit = 5) =>
  useQuery({
    queryKey: ["stats", "top-lessons"],
    queryFn: async () => (await client.get("/analytics/lessons/most-remembered", { params: { limit } })).data.items,
  });

/** Authors ranked by how many distinct people remember their lessons. */
export const useTopTeachers = (limit = 5) =>
  useQuery({
    queryKey: ["stats", "top-teachers"],
    queryFn: async () => (await client.get("/analytics/teachers/top", { params: { limit } })).data.items,
  });

/** Community-wide totals. */
export const useCommunityStats = () =>
  useQuery({
    queryKey: ["stats", "community"],
    queryFn: async () => (await client.get("/analytics/community")).data,
  });
