const Follow = require("../models/follow.model");
const Lesson = require("../models/lesson.model");
const User = require("../models/user.model");
const clock = require("../../lib/clock");
const { assertValid, badRequest, notFound } = require("../../lib/errors");
const { pagination, pageOf } = require("../../lib/validate");
const { deleteUser } = require("../services/cascade");
const { AUTHOR_FIELDS, lessonViews, me, publicUser, userSummary } = require("../services/serialize");
const { userStats } = require("../services/stats");
const { profileFields } = require("./auth.controller");

async function byHandle(handle) {
  const user = typeof handle === "string" ? await User.findOne({ handle: handle.toLowerCase() }) : null;
  if (!user) throw notFound("User");
  return user;
}

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

exports.listUsers = async (req, res) => {
  const paging = pagination(req.query);
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const pattern = new RegExp(escapeRegex(q), "i");
  const filter = q ? { $or: [{ name: pattern }, { handle: pattern }] } : {};
  const rows = await User.find(filter).sort({ handle: 1 }).skip(paging.skip).limit(paging.limit + 1);
  res.json(pageOf(rows, paging, publicUser));
};

exports.updateMe = async (req, res) => {
  const body = req.body || {};
  const fields = {};
  if (body.email !== undefined) fields.email = "Email cannot be changed";
  if (body.password !== undefined) fields.password = "Password cannot be changed here";
  const changes = profileFields(body, fields, { partial: true });
  if (!Object.keys(changes).length && !Object.keys(fields).length) fields.body = "Send at least one of name, handle, bio, timezone";
  assertValid(fields);
  req.user.set(changes);
  await req.user.save(); // schema rules give a 400 with fields, a taken handle a 409
  res.json({ user: me(req.user) });
};

exports.deleteMe = async (req, res) => {
  await deleteUser(req.user._id);
  res.status(204).end();
};

exports.getProfile = async (req, res) => {
  const user = await byHandle(req.params.handle);
  const viewer = req.user;
  const [lessons, followers, following, stats, isFollowing] = await Promise.all([
    Lesson.countDocuments({ author: user._id }),
    Follow.countDocuments({ followee: user._id }),
    Follow.countDocuments({ follower: user._id }),
    userStats(user, clock.now()),
    viewer ? Follow.exists({ follower: viewer._id, followee: user._id }) : null,
  ]);
  res.json({
    user: publicUser(user),
    counts: { lessons, followers, following },
    stats: { currentStreak: stats.currentStreak, bestStreak: stats.bestStreak, mastered: stats.mastered },
    viewer: viewer ? { isSelf: String(viewer._id) === String(user._id), isFollowing: Boolean(isFollowing) } : null,
  });
};

exports.getUserLessons = async (req, res) => {
  const user = await byHandle(req.params.handle);
  const paging = pagination(req.query);
  const rows = await Lesson.find({ author: user._id })
    .sort({ createdAt: -1, _id: -1 })
    .skip(paging.skip)
    .limit(paging.limit + 1)
    .populate("author", AUTHOR_FIELDS)
    .lean();
  const items = await lessonViews(rows.slice(0, paging.limit), req.user?._id || null);
  res.json({ items, page: paging.page, limit: paging.limit, hasMore: rows.length > paging.limit });
};

async function followList(req, res, { match, other }) {
  const user = await byHandle(req.params.handle);
  const paging = pagination(req.query);
  const rows = await Follow.find({ [match]: user._id })
    .sort({ createdAt: -1, _id: -1 })
    .skip(paging.skip)
    .limit(paging.limit + 1)
    .populate(other, "name handle bio createdAt")
    .lean();
  const page = pageOf(rows, paging, (r) => r[other]);
  res.json({ ...page, items: page.items.filter(Boolean).map(publicUser) });
}

exports.getFollowers = (req, res) => followList(req, res, { match: "followee", other: "follower" });
exports.getFollowing = (req, res) => followList(req, res, { match: "follower", other: "followee" });

exports.follow = async (req, res) => {
  const target = await byHandle(req.params.handle);
  if (String(target._id) === String(req.user._id)) throw badRequest("You cannot follow yourself", { handle: "You cannot follow yourself" });
  const result = await Follow.updateOne(
    { follower: req.user._id, followee: target._id },
    { $setOnInsert: { follower: req.user._id, followee: target._id } },
    { upsert: true }
  );
  const followers = await Follow.countDocuments({ followee: target._id });
  res.status(result.upsertedCount ? 201 : 200).json({ user: userSummary(target), isFollowing: true, followers });
};

exports.unfollow = async (req, res) => {
  const target = await byHandle(req.params.handle);
  await Follow.deleteOne({ follower: req.user._id, followee: target._id });
  res.status(204).end();
};
