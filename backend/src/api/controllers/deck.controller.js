const Deck = require("../models/deck.model");
const Lesson = require("../models/lesson.model");
const Review = require("../models/review.model");
const User = require("../models/user.model");
const clock = require("../../lib/clock");
const { badRequest, forbidden, notFound } = require("../../lib/errors");
const { isObjectId, objectIdParam, pagination } = require("../../lib/validate");
const { LIMITS, parseDeckInput } = require("../services/deckInput");
const { OWNER_FIELDS, deckView, deckViews, popularDecks } = require("../services/decks");
const { AUTHOR_FIELDS, lessonViews } = require("../services/serialize");
const { newCard } = require("../services/srs");

async function findDeck(id) {
  const deck = await Deck.findById(objectIdParam(id, "Deck")).populate("owner", OWNER_FIELDS);
  if (!deck) throw notFound("Deck");
  return deck;
}

function assertOwner(deck, user) {
  if (String(deck.owner?._id) !== String(user._id)) throw forbidden("Only the deck's owner can change it");
}

/** The deck's live lessons in deck order, serialized for the viewer. */
async function deckLessons(deck, viewerId) {
  const rows = await Lesson.find({ _id: { $in: deck.lessons } })
    .populate("author", AUTHOR_FIELDS)
    .lean();
  const byId = new Map(rows.map((l) => [String(l._id), l]));
  return lessonViews(deck.lessons.map((id) => byId.get(String(id))).filter(Boolean), viewerId);
}

/** `?limit=` for the popular row: 1-20, default 6. */
function rowLimit(query) {
  if (query.limit === undefined) return 6;
  const limit = Number(query.limit);
  if (!Number.isInteger(limit) || limit < 1 || limit > 20) throw badRequest("Invalid limit", { limit: "Limit must be an integer from 1 to 20" });
  return limit;
}

/** GET /decks/popular — decks by how many remembers their lessons have. */
exports.popular = async (req, res) => {
  res.json({ items: await popularDecks(rowLimit(req.query), req.user?._id || null) });
};

/** GET /users/:handle/decks — a user's decks, newest first. */
exports.userDecks = async (req, res) => {
  const user = typeof req.params.handle === "string" ? await User.findOne({ handle: req.params.handle.toLowerCase() }) : null;
  if (!user) throw notFound("User");
  const paging = pagination(req.query);
  const rows = await Deck.find({ owner: user._id })
    .sort({ createdAt: -1, _id: -1 })
    .skip(paging.skip)
    .limit(paging.limit + 1)
    .populate("owner", OWNER_FIELDS)
    .lean();
  const items = await deckViews(rows.slice(0, paging.limit), req.user?._id || null);
  res.json({ items, page: paging.page, limit: paging.limit, hasMore: rows.length > paging.limit });
};

exports.createDeck = async (req, res) => {
  const input = parseDeckInput(req.body);
  const deck = await Deck.create({ ...input, owner: req.user._id });
  await deck.populate("owner", OWNER_FIELDS);
  res.status(201).json({ deck: await deckView(deck, req.user._id) });
};

exports.getDeck = async (req, res) => {
  const deck = await findDeck(req.params.id);
  const viewerId = req.user?._id || null;
  const [view, lessons] = await Promise.all([deckView(deck, viewerId), deckLessons(deck, viewerId)]);
  res.json({ deck: view, lessons });
};

exports.updateDeck = async (req, res) => {
  const deck = await findDeck(req.params.id);
  assertOwner(deck, req.user);
  deck.set(parseDeckInput(req.body, { partial: true }));
  await deck.save();
  res.json({ deck: await deckView(deck, req.user._id) });
};

exports.deleteDeck = async (req, res) => {
  const deck = await findDeck(req.params.id);
  assertOwner(deck, req.user);
  await Deck.deleteOne({ _id: deck._id });
  res.status(204).end();
};

/** POST /decks/:id/lessons { lessonId } — appends a lesson; adding one already there changes nothing. */
exports.addLesson = async (req, res) => {
  const deck = await findDeck(req.params.id);
  assertOwner(deck, req.user);
  if (!isObjectId(req.body?.lessonId)) throw badRequest("Validation failed", { lessonId: "lessonId must be a lesson id" });
  const lessonId = req.body.lessonId.toLowerCase(); // ids are hex, so case must not make a second copy
  if (!(await Lesson.exists({ _id: lessonId }))) throw notFound("Lesson");
  let status = 200;
  if (!deck.lessons.some((id) => String(id) === lessonId)) {
    // Drop references to deleted lessons first so they do not count toward the limit.
    const live = await Lesson.find({ _id: { $in: deck.lessons } }).distinct("_id");
    const keep = new Set(live.map(String));
    if (keep.size >= LIMITS.lessons) throw badRequest(`A deck holds at most ${LIMITS.lessons} lessons`, { lessonId: `A deck holds at most ${LIMITS.lessons} lessons` });
    deck.lessons = [...deck.lessons.filter((id) => keep.has(String(id))), lessonId];
    await deck.save();
    status = 201;
  }
  res.status(status).json({ deck: await deckView(deck, req.user._id) });
};

/** DELETE /decks/:id/lessons/:lessonId — removes a lesson from the deck (not the lesson itself). */
exports.removeLesson = async (req, res) => {
  const deck = await findDeck(req.params.id);
  assertOwner(deck, req.user);
  const lessonId = objectIdParam(req.params.lessonId, "Lesson");
  await Deck.updateOne({ _id: deck._id }, { $pull: { lessons: lessonId } });
  res.status(204).end();
};

/** POST /decks/:id/remember — remembers every deck lesson the viewer can and does not yet. */
exports.rememberAll = async (req, res) => {
  const deck = await findDeck(req.params.id);
  const lessons = await Lesson.find({ _id: { $in: deck.lessons } }, "author").lean();
  const have = new Set((await Review.find({ user: req.user._id, lesson: { $in: lessons.map((l) => l._id) } }, "lesson").lean()).map((c) => String(c.lesson)));
  const todo = lessons.filter((l) => String(l.author) !== String(req.user._id) && !have.has(String(l._id)));
  const card = newCard(clock.now(), req.user.timezone);
  let remembered = todo.length;
  if (todo.length) {
    try {
      await Review.insertMany(
        todo.map((l) => ({ user: req.user._id, lesson: l._id, ...card })),
        { ordered: false }
      );
    } catch (error) {
      // Duplicates mean a concurrent request remembered those first; anything else is a real failure.
      const errors = error.writeErrors ? [].concat(error.writeErrors) : [error];
      if (!errors.every((e) => (e.code ?? e.err?.code) === 11000)) throw error;
      remembered = todo.length - errors.length;
    }
  }
  res.status(remembered ? 201 : 200).json({ remembered, skipped: lessons.length - remembered, deck: await deckView(deck, req.user._id) });
};
