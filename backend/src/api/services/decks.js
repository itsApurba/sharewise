/**
 * The Deck response shape (documented in API.md) and the deck popularity rule.
 */
const Deck = require("../models/deck.model");
const Lesson = require("../models/lesson.model");
const Review = require("../models/review.model");
const { rememberCounts, userSummary } = require("./serialize");

const OWNER_FIELDS = "name handle";

/** Serializes decks (with `owner` populated) for `viewerId` (null when logged out). Deleted lessons are left out. */
async function deckViews(decks, viewerId) {
  const lessons = await Lesson.find({ _id: { $in: decks.flatMap((d) => d.lessons) } }, "author").lean();
  const ids = lessons.map((l) => l._id);
  const [counts, cards] = await Promise.all([
    rememberCounts(ids),
    viewerId ? Review.find({ user: viewerId, lesson: { $in: ids } }, "lesson").lean() : [],
  ]);
  const authorBy = new Map(lessons.map((l) => [String(l._id), String(l.author)]));
  const remembered = new Set(cards.map((c) => String(c.lesson)));

  return decks.map((deck) => {
    const lessonIds = deck.lessons.map(String).filter((id) => authorBy.has(id));
    const ownerId = deck.owner?._id ? String(deck.owner._id) : String(deck.owner);
    const view = {
      id: String(deck._id),
      title: deck.title,
      description: deck.description || "",
      emoji: deck.emoji,
      color: deck.color,
      owner: userSummary(deck.owner?._id ? deck.owner : null),
      lessonIds,
      lessonCount: lessonIds.length,
      rememberCount: lessonIds.reduce((sum, id) => sum + (counts.get(id) || 0), 0),
      createdAt: deck.createdAt,
      updatedAt: deck.updatedAt,
      viewer: null,
    };
    if (viewerId) {
      const viewer = String(viewerId);
      const mine = lessonIds.filter((id) => remembered.has(id)).length;
      view.viewer = {
        isOwner: ownerId === viewer,
        remembered: mine,
        toRemember: lessonIds.filter((id) => !remembered.has(id) && authorBy.get(id) !== viewer).length,
      };
    }
    return view;
  });
}

async function deckView(deck, viewerId) {
  return (await deckViews([deck], viewerId))[0];
}

/** Decks with at least one lesson, by rememberCount (ties: more lessons, then newer). */
async function popularDecks(limit, viewerId) {
  const decks = await Deck.find({ "lessons.0": { $exists: true } })
    .populate("owner", OWNER_FIELDS)
    .lean();
  const views = await deckViews(decks, viewerId);
  return views
    .filter((d) => d.lessonCount > 0)
    .sort((a, b) => b.rememberCount - a.rememberCount || b.lessonCount - a.lessonCount || (a.id < b.id ? 1 : -1))
    .slice(0, limit);
}

module.exports = { OWNER_FIELDS, deckViews, deckView, popularDecks };
