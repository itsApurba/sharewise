import { useQuery } from "@tanstack/react-query";
import client from "../api/client";

/**
 * `{ timezone, total, activeDays, days: [{ date, count }] }`: reviews per day for the heatmap.
 * Keyed under ["profile"] so answering a review (which invalidates profiles) refreshes it.
 */
export const useActivity = (handle, days = 84) =>
  useQuery({
    queryKey: ["profile", handle, "activity", days],
    queryFn: async () => (await client.get(`/users/${encodeURIComponent(handle)}/activity`, { params: { days } })).data,
    enabled: !!handle,
  });
