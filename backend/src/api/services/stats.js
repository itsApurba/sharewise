/**
 * Personal retention stats. Days are calendar days in the user's `timezone`
 * (rules in API.md, "Streaks and time zones").
 */
const Review = require("../models/review.model");
const ReviewLog = require("../models/reviewLog.model");
const { MASTERED_DAYS } = require("./srs");
const { localDayKey, shiftDayKey, startOfLocalDay } = require("../../lib/time");

/**
 * Current and best streak from the set of "YYYY-MM-DD" days with at least one review.
 * The current streak counts back from today, or from yesterday when today has no
 * review yet (the streak is still alive until today ends).
 */
function streaks(dayKeys, todayKey) {
  const days = new Set(dayKeys);
  let best = 0;
  for (const day of days) {
    if (days.has(shiftDayKey(day, -1))) continue;
    let length = 1;
    while (days.has(shiftDayKey(day, length))) length += 1;
    best = Math.max(best, length);
  }
  let cursor = days.has(todayKey) ? todayKey : shiftDayKey(todayKey, -1);
  let current = 0;
  while (days.has(cursor)) {
    current += 1;
    cursor = shiftDayKey(cursor, -1);
  }
  return { current, best };
}

/** The local days on which the user answered at least one review. */
async function reviewDays(userId, timeZone) {
  const rows = await ReviewLog.aggregate([
    { $match: { user: userId } },
    { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$reviewedAt", timezone: timeZone } } } },
  ]);
  return rows.map((r) => r._id);
}

async function userStats(user, now) {
  const timeZone = user.timezone || "UTC";
  const [days, mastered, dueToday, remembered, reviewsThisWeek] = await Promise.all([
    reviewDays(user._id, timeZone),
    Review.countDocuments({ user: user._id, interval: { $gte: MASTERED_DAYS } }),
    Review.countDocuments({ user: user._id, dueAt: { $lte: now } }),
    Review.countDocuments({ user: user._id }),
    ReviewLog.countDocuments({ user: user._id, reviewedAt: { $gte: startOfLocalDay(now, timeZone, -6), $lte: now } }),
  ]);
  const streak = streaks(days, localDayKey(now, timeZone));
  return {
    currentStreak: streak.current,
    bestStreak: streak.best,
    reviewedToday: days.includes(localDayKey(now, timeZone)),
    mastered,
    remembered,
    dueToday,
    reviewsThisWeek,
    timezone: timeZone,
  };
}

module.exports = { streaks, userStats };
