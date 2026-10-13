/**
 * Response shapes (documented in API.md). Nothing here ever emits passwordHash,
 * and a quiz answer is only emitted to the author or to a viewer who answered it.
 */
const Review = require("../models/review.model");
const QuizAttempt = require("../models/quizAttempt.model");
const { isMastered } = require("./srs");
const { revealAnswer } = require("./quiz");

const AUTHOR_FIELDS = "name handle";

const userSummary = (user) => (user ? { id: String(user._id), name: user.name, handle: user.handle } : { id: null, name: "Deleted user", handle: null });

const publicUser = (user) => ({ ...userSummary(user), bio: user.bio || "", createdAt: user.createdAt });

const me = (user) => ({ ...publicUser(user), email: user.email, timezone: user.timezone });

/** Remember counts keyed by lesson id. */
async function rememberCounts(lessonIds) {
  if (!lessonIds.length) return new Map();
  const rows = await Review.aggregate([{ $match: { lesson: { $in: lessonIds } } }, { $group: { _id: "$lesson", n: { $sum: 1 } } }]);
  return new Map(rows.map((r) => [String(r._id), r.n]));
}

function quizView(quiz, reveal) {
  if (!quiz) return null;
  const view = { prompt: quiz.prompt, kind: quiz.kind };
  if (quiz.kind === "choice") view.choices = [...quiz.choices];
  return reveal ? { ...view, ...revealAnswer(quiz) } : view;
}

/**
 * Serializes lessons (with `author` populated) for `viewerId` (null when logged out).
 * `hideAnswers` hides every quiz answer, as review cards do.
 */
async function lessonViews(lessons, viewerId, { hideAnswers = false } = {}) {
  const ids = lessons.map((l) => l._id);
  const [counts, cards, attempts] = await Promise.all([
    rememberCounts(ids),
    viewerId ? Review.find({ user: viewerId, lesson: { $in: ids } }, "lesson").lean() : [],
    viewerId ? QuizAttempt.find({ user: viewerId, lesson: { $in: ids } }, "lesson correct").lean() : [],
  ]);
  const cardBy = new Map(cards.map((c) => [String(c.lesson), c]));
  const attemptBy = new Map(attempts.map((a) => [String(a.lesson), a]));

  return lessons.map((lesson) => {
    const id = String(lesson._id);
    const authorId = lesson.author?._id ? String(lesson.author._id) : String(lesson.author);
    const isAuthor = Boolean(viewerId) && authorId === String(viewerId);
    const attempt = attemptBy.get(id);
    const card = cardBy.get(id);
    return {
      id,
      title: lesson.title,
      body: lesson.body,
      code: lesson.code?.source ? { language: lesson.code.language, source: lesson.code.source } : null,
      link: lesson.link || null,
      tags: [...(lesson.tags || [])],
      quiz: quizView(lesson.quiz, !hideAnswers && (isAuthor || Boolean(attempt))),
      author: userSummary(lesson.author?._id ? lesson.author : null),
      rememberCount: counts.get(id) || 0,
      createdAt: lesson.createdAt,
      updatedAt: lesson.updatedAt,
      viewer: viewerId
        ? {
            isAuthor,
            remembered: Boolean(card),
            reviewId: card ? String(card._id) : null,
            quizAnswered: Boolean(attempt),
            quizCorrect: attempt ? attempt.correct : null,
          }
        : null,
    };
  });
}

async function lessonView(lesson, viewerId, opts) {
  return (await lessonViews([lesson], viewerId, opts))[0];
}

/** A review card; `lesson` is the already-serialized lesson (answers hidden). */
function reviewView(card, lesson) {
  return {
    id: String(card._id),
    lessonId: String(card.lesson?._id || card.lesson),
    ease: card.ease,
    interval: card.interval,
    repetitions: card.repetitions,
    lapses: card.lapses || 0,
    dueAt: card.dueAt,
    lastReviewedAt: card.lastReviewedAt || null,
    mastered: isMastered(card),
    createdAt: card.createdAt,
    ...(lesson === undefined ? {} : { lesson }),
  };
}

/** Serializes cards whose `lesson` is populated with its author, hiding quiz answers. */
async function reviewViews(cards, viewerId) {
  const lessons = await lessonViews(
    cards.map((c) => c.lesson),
    viewerId,
    { hideAnswers: true }
  );
  return cards.map((card, i) => reviewView(card, lessons[i]));
}

module.exports = { AUTHOR_FIELDS, userSummary, publicUser, me, lessonViews, lessonView, reviewView, reviewViews, rememberCounts };
