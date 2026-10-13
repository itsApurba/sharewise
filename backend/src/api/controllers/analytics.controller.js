const Lesson = require("../models/lesson.model");
const Review = require("../models/review.model");
const ReviewLog = require("../models/reviewLog.model");
const User = require("../models/user.model");
const clock = require("../../lib/clock");
const { badRequest } = require("../../lib/errors");
const { AUTHOR_FIELDS, lessonViews, publicUser } = require("../services/serialize");
const { MASTERED_DAYS } = require("../services/srs");
const { userStats } = require("../services/stats");

/** `?limit=` for leaderboards: 1-20, default 5. */
function boardLimit(query) {
  if (query.limit === undefined) return 5;
  const limit = Number(query.limit);
  if (!Number.isInteger(limit) || limit < 1 || limit > 20) throw badRequest("Invalid limit", { limit: "Limit must be an integer from 1 to 20" });
  return limit;
}

/** GET /analytics/lessons/most-remembered — lessons by how many people remember them. */
exports.mostRemembered = async (req, res) => {
  const limit = boardLimit(req.query);
  const rows = await Review.aggregate([
    { $group: { _id: "$lesson", remembers: { $sum: 1 } } },
    { $sort: { remembers: -1, _id: 1 } },
    { $limit: limit },
  ]);
  const lessons = await Lesson.find({ _id: { $in: rows.map((r) => r._id) } })
    .populate("author", AUTHOR_FIELDS)
    .lean();
  const byId = new Map(lessons.map((l) => [String(l._id), l]));
  const ordered = rows.map((r) => byId.get(String(r._id))).filter(Boolean);
  res.json({ items: await lessonViews(ordered, req.user?._id || null) });
};

/** GET /analytics/teachers/top — authors by distinct people who remember any of their lessons. */
exports.topTeachers = async (req, res) => {
  const limit = boardLimit(req.query);
  const rows = await Review.aggregate([
    { $lookup: { from: "lessons", localField: "lesson", foreignField: "_id", as: "lesson" } },
    { $unwind: "$lesson" },
    { $group: { _id: "$lesson.author", learners: { $addToSet: "$user" }, remembers: { $sum: 1 } } },
    { $project: { learners: { $size: "$learners" }, remembers: 1 } },
    { $sort: { learners: -1, remembers: -1, _id: 1 } },
    { $limit: limit },
  ]);
  const ids = rows.map((r) => r._id);
  const [users, lessonCounts] = await Promise.all([
    User.find({ _id: { $in: ids } }),
    Lesson.aggregate([{ $match: { author: { $in: ids } } }, { $group: { _id: "$author", n: { $sum: 1 } } }]),
  ]);
  const userBy = new Map(users.map((u) => [String(u._id), u]));
  const lessonsBy = new Map(lessonCounts.map((r) => [String(r._id), r.n]));
  const items = rows
    .filter((r) => userBy.has(String(r._id)))
    .map((r) => ({ user: publicUser(userBy.get(String(r._id))), learners: r.learners, remembers: r.remembers, lessons: lessonsBy.get(String(r._id)) || 0 }));
  res.json({ items });
};

/** GET /analytics/me — the caller's streaks and retention numbers. */
exports.myStats = async (req, res) => {
  res.json({ stats: await userStats(req.user, clock.now()) });
};

/** GET /analytics/community — site-wide totals. */
exports.community = async (req, res) => {
  const [users, lessons, remembers, reviewsDone, mastered] = await Promise.all([
    User.estimatedDocumentCount(),
    Lesson.estimatedDocumentCount(),
    Review.estimatedDocumentCount(),
    ReviewLog.estimatedDocumentCount(),
    Review.countDocuments({ interval: { $gte: MASTERED_DAYS } }),
  ]);
  res.json({ users, lessons, remembers, reviewsDone, mastered });
};
