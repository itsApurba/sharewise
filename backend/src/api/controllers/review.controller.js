const Lesson = require("../models/lesson.model");
const QuizAttempt = require("../models/quizAttempt.model");
const Review = require("../models/review.model");
const ReviewLog = require("../models/reviewLog.model");
const clock = require("../../lib/clock");
const { badRequest, conflict, notFound } = require("../../lib/errors");
const { objectIdParam, pagination } = require("../../lib/validate");
const { gradeQuiz, revealAnswer } = require("../services/quiz");
const { AUTHOR_FIELDS, reviewView, reviewViews } = require("../services/serialize");
const { GRADES, isDue, schedule } = require("../services/srs");

const withLesson = { path: "lesson", populate: { path: "author", select: AUTHOR_FIELDS } };

async function listCards(req, res, filter, sort) {
  const paging = pagination(req.query);
  const rows = await Review.find({ user: req.user._id, ...filter })
    .sort(sort)
    .skip(paging.skip)
    .limit(paging.limit + 1)
    .populate(withLesson)
    .lean();
  const items = await reviewViews(rows.slice(0, paging.limit).filter((c) => c.lesson), req.user._id);
  res.json({ items, page: paging.page, limit: paging.limit, hasMore: rows.length > paging.limit });
}

/** GET /reviews — every card the user remembers, soonest due first. */
exports.listReviews = (req, res) => listCards(req, res, {}, { dueAt: 1, _id: 1 });

/** GET /reviews/due — cards due now, most overdue first. */
exports.dueReviews = async (req, res) => {
  const now = clock.now();
  const total = await Review.countDocuments({ user: req.user._id, dueAt: { $lte: now } });
  res.set("X-Due-Count", String(total));
  return listCards(req, res, { dueAt: { $lte: now } }, { dueAt: 1, _id: 1 });
};

/** Resolves the body to a grade: an explicit `grade`, or a quiz answer graded here. */
function resolveGrade(lesson, body) {
  const answered = body.choice !== undefined || body.answer !== undefined;
  if (answered && body.grade !== undefined) throw badRequest("Send either grade or a quiz answer, not both", { grade: "Send either grade or a quiz answer" });
  if (answered) {
    if (!lesson.quiz) throw badRequest("This lesson has no quiz; send grade instead", { grade: "grade must be got or forgot" });
    const correct = gradeQuiz(lesson.quiz, body);
    return { grade: correct ? "got" : "forgot", correct };
  }
  if (!GRADES.includes(body.grade)) throw badRequest("Validation failed", { grade: "grade must be got or forgot" });
  return { grade: body.grade, correct: null };
}

exports.answerReview = async (req, res) => {
  const id = objectIdParam(req.params.id, "Review");
  const card = await Review.findOne({ _id: id, user: req.user._id });
  if (!card) throw notFound("Review");
  const lesson = await Lesson.findById(card.lesson);
  if (!lesson) throw notFound("Lesson");
  const { grade, correct } = resolveGrade(lesson, req.body || {});

  const now = clock.now();
  if (!isDue(card, now)) throw conflict("NOT_DUE", `This review is not due until ${card.dueAt.toISOString()}`);
  const next = schedule(card, grade, now, req.user.timezone);
  // Matching the old dueAt makes a double submit answer once; the loser sees NOT_DUE.
  const updated = await Review.findOneAndUpdate({ _id: card._id, dueAt: card.dueAt }, { $set: next }, { returnDocument: "after" });
  if (!updated) throw conflict("NOT_DUE", "This review was already answered");

  await ReviewLog.create({ user: req.user._id, lesson: lesson._id, grade, interval: next.interval, reviewedAt: now });
  if (correct !== null) {
    await QuizAttempt.updateOne(
      { user: req.user._id, lesson: lesson._id },
      { $setOnInsert: { user: req.user._id, lesson: lesson._id, correct } },
      { upsert: true }
    );
  }
  res.json({
    review: reviewView(updated),
    result: { grade, correct, correctAnswer: lesson.quiz ? revealAnswer(lesson.quiz) : null },
  });
};
