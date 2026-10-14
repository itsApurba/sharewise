const relative = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

const UNITS = [
  ["year", 365 * 24 * 3600],
  ["month", 30 * 24 * 3600],
  ["week", 7 * 24 * 3600],
  ["day", 24 * 3600],
  ["hour", 3600],
  ["minute", 60],
];

/** "3 days ago", "just now". */
export const timeAgo = (iso) => {
  if (!iso) return undefined;
  const seconds = (new Date(iso).getTime() - Date.now()) / 1000;
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit);
  }
  return "just now";
};

/** "Sat, Oct 17", in `timeZone` (the user's IANA zone) when given. */
export const shortDate = (iso, timeZone) => {
  const options = { weekday: "short", month: "short", day: "numeric" };
  try {
    return new Date(iso).toLocaleDateString(undefined, { ...options, timeZone });
  } catch {
    return new Date(iso).toLocaleDateString(undefined, options);
  }
};

/** "tomorrow", "in 3 days", "in 1 month". */
export const intervalLabel = (days) => {
  if (days <= 1) return "tomorrow";
  if (days < 14) return `in ${days} days`;
  if (days < 60) return `in about ${Math.round(days / 7)} weeks`;
  return `in about ${Math.round(days / 30)} months`;
};

/** One sentence on when an answered card comes back. Due dates are midnights in the user's zone. */
export const nextReviewSentence = (review, timeZone) => {
  const when = `${intervalLabel(review.interval)} (${shortDate(review.dueAt, timeZone)})`;
  if (review.mastered) return `Mastered. It checks in again ${when}.`;
  if (review.repetitions === 0) return `It comes back ${when}, so it sticks this time.`;
  return `It comes back ${when}. Each right answer spaces it further out.`;
};
