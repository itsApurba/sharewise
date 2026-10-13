/**
 * The home feed: new lessons (followed authors plus discovery) with due reviews
 * interleaved. The mixing rule is documented in API.md ("Feed mixing rule").
 */
const Follow = require("../models/follow.model");
const Lesson = require("../models/lesson.model");
const Review = require("../models/review.model");
const { AUTHOR_FIELDS, lessonViews, reviewViews } = require("./serialize");

/** Upper bound on each candidate stream, so a feed request stays cheap. */
const STREAM_CAP = 500;

/** Takes `a` and `b` in the repeating pattern `aRun` from a, then `bRun` from b; leftovers follow. */
function interleave(a, b, aRun, bRun) {
  const out = [];
  let i = 0;
  let j = 0;
  while (i < a.length || j < b.length) {
    for (let k = 0; k < aRun && i < a.length; k += 1) out.push(a[i++]);
    for (let k = 0; k < bRun && j < b.length; k += 1) out.push(b[j++]);
  }
  return out;
}

/**
 * The full feed order. Lessons: 2 from followed authors, then 1 discovery, repeating.
 * Then 1 due review, then 2 lessons, repeating, starting with a review.
 * Whatever stream runs out first, the rest of the other follows in order.
 */
function mixFeed({ followed, discovery, reviews }) {
  const lessons = interleave(followed, discovery, 2, 1).map((ref) => ({ type: "lesson", ref }));
  return interleave(
    reviews.map((ref) => ({ type: "review", ref })),
    lessons,
    1,
    2
  );
}

async function feedFor(viewer, now, { page, limit, skip }) {
  const [followees, rememberedLessons] = await Promise.all([
    Follow.find({ follower: viewer._id }).distinct("followee"),
    Review.find({ user: viewer._id }).distinct("lesson"),
  ]);
  const newest = { createdAt: -1, _id: -1 };
  const [followed, discovery, due] = await Promise.all([
    Lesson.find({ author: { $in: followees }, _id: { $nin: rememberedLessons } }, "_id").sort(newest).limit(STREAM_CAP).lean(),
    Lesson.find({ author: { $nin: [...followees, viewer._id] }, _id: { $nin: rememberedLessons } }, "_id").sort(newest).limit(STREAM_CAP).lean(),
    Review.find({ user: viewer._id, dueAt: { $lte: now } }, "_id").sort({ dueAt: 1, _id: 1 }).limit(STREAM_CAP).lean(),
  ]);

  const sequence = mixFeed({ followed: followed.map((l) => l._id), discovery: discovery.map((l) => l._id), reviews: due.map((r) => r._id) });
  const slice = sequence.slice(skip, skip + limit);

  const lessonIds = slice.filter((s) => s.type === "lesson").map((s) => s.ref);
  const reviewIds = slice.filter((s) => s.type === "review").map((s) => s.ref);
  const [lessons, cards] = await Promise.all([
    Lesson.find({ _id: { $in: lessonIds } }).populate("author", AUTHOR_FIELDS).lean(),
    Review.find({ _id: { $in: reviewIds } }).populate({ path: "lesson", populate: { path: "author", select: AUTHOR_FIELDS } }).lean(),
  ]);
  const liveCards = cards.filter((c) => c.lesson);
  const [lessonOut, reviewOut] = await Promise.all([lessonViews(lessons, viewer._id), reviewViews(liveCards, viewer._id)]);
  const byId = new Map([...lessonOut.map((l) => [`lesson:${l.id}`, l]), ...reviewOut.map((r) => [`review:${r.id}`, r])]);

  const items = slice
    .map((s) => {
      const value = byId.get(`${s.type}:${s.ref}`);
      if (!value) return null;
      return s.type === "lesson" ? { type: "lesson", lesson: value } : { type: "review", review: value };
    })
    .filter(Boolean);

  return { items, page, limit, hasMore: sequence.length > skip + limit, dueCount: due.length };
}

module.exports = { mixFeed, interleave, feedFor, STREAM_CAP };
