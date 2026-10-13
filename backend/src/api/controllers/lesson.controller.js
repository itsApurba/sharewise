const Lesson = require("../models/lesson.model");
const QuizAttempt = require("../models/quizAttempt.model");
const Review = require("../models/review.model");
const clock = require("../../lib/clock");
const { forbidden, notFound } = require("../../lib/errors");
const { objectIdParam, pagination } = require("../../lib/validate");
const { deleteLessons } = require("../services/cascade");
const { parseLessonInput } = require("../services/lessonInput");
const { gradeQuiz, revealAnswer } = require("../services/quiz");
const { AUTHOR_FIELDS, lessonView, lessonViews, reviewView } = require("../services/serialize");
const { newCard } = require("../services/srs");

async function findLesson(id) {
  const lesson = await Lesson.findById(objectIdParam(id, "Lesson")).populate("author", AUTHOR_FIELDS);
  if (!lesson) throw notFound("Lesson");
  return lesson;
}

function assertAuthor(lesson, user) {
  if (String(lesson.author._id) !== String(user._id)) throw forbidden("Only the author can change this lesson");
}

/** GET /lessons/explore — newest lessons for everyone, optionally by `?tag=`. */
exports.explore = async (req, res) => {
  const paging = pagination(req.query);
  const filter = {};
  if (typeof req.query.tag === "string" && req.query.tag.trim()) filter.tags = req.query.tag.trim().replace(/^#/, "").toLowerCase();
  const rows = await Lesson.find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .skip(paging.skip)
    .limit(paging.limit + 1)
    .populate("author", AUTHOR_FIELDS)
    .lean();
  const items = await lessonViews(rows.slice(0, paging.limit), req.user?._id || null);
  res.json({ items, page: paging.page, limit: paging.limit, hasMore: rows.length > paging.limit });
};

/** GET /lessons/tags — every tag with its lesson count, most used first. */
exports.tags = async (req, res) => {
  const rows = await Lesson.aggregate([
    { $unwind: "$tags" },
    { $group: { _id: "$tags", lessons: { $sum: 1 } } },
    { $sort: { lessons: -1, _id: 1 } },
  ]);
  res.json({ items: rows.map((r) => ({ tag: r._id, lessons: r.lessons })) });
};

exports.getLesson = async (req, res) => {
  const lesson = await findLesson(req.params.id);
  res.json({ lesson: await lessonView(lesson, req.user?._id || null) });
};

exports.createLesson = async (req, res) => {
  const input = parseLessonInput(req.body);
  const lesson = await Lesson.create({ ...input, author: req.user._id });
  await lesson.populate("author", AUTHOR_FIELDS);
  res.status(201).json({ lesson: await lessonView(lesson, req.user._id) });
};

exports.updateLesson = async (req, res) => {
  const lesson = await findLesson(req.params.id);
  assertAuthor(lesson, req.user);
  const changes = parseLessonInput(req.body, { partial: true });
  lesson.set(changes);
  await lesson.save();
  // Earlier answers were to a different question; let everyone answer the new one.
  if ("quiz" in changes) await QuizAttempt.deleteMany({ lesson: lesson._id });
  res.json({ lesson: await lessonView(lesson, req.user._id) });
};

exports.deleteLesson = async (req, res) => {
  const lesson = await findLesson(req.params.id);
  assertAuthor(lesson, req.user);
  await deleteLessons([lesson._id]);
  res.status(204).end();
};

exports.remember = async (req, res) => {
  const lesson = await findLesson(req.params.id);
  if (String(lesson.author._id) === String(req.user._id)) throw forbidden("You cannot remember your own lesson");
  let card = await Review.findOne({ user: req.user._id, lesson: lesson._id });
  let status = 200;
  if (!card) {
    try {
      card = await Review.create({ user: req.user._id, lesson: lesson._id, ...newCard(clock.now(), req.user.timezone) });
      status = 201;
    } catch (error) {
      if (error.code !== 11000) throw error;
      card = await Review.findOne({ user: req.user._id, lesson: lesson._id }); // a concurrent request won
    }
  }
  const rememberCount = await Review.countDocuments({ lesson: lesson._id });
  res.status(status).json({ review: reviewView(card), rememberCount });
};

exports.forget = async (req, res) => {
  const lesson = await findLesson(req.params.id);
  await Review.deleteOne({ user: req.user._id, lesson: lesson._id });
  res.status(204).end();
};

/** POST /lessons/:id/quiz/answer — check an answer; recorded (first attempt only) for logged-in non-authors. */
exports.answerQuiz = async (req, res) => {
  const lesson = await findLesson(req.params.id);
  if (!lesson.quiz) throw notFound("Quiz");
  const correct = gradeQuiz(lesson.quiz, req.body || {});
  if (req.user && String(lesson.author._id) !== String(req.user._id)) {
    await QuizAttempt.updateOne(
      { user: req.user._id, lesson: lesson._id },
      { $setOnInsert: { user: req.user._id, lesson: lesson._id, correct } },
      { upsert: true }
    );
  }
  res.json({ correct, correctAnswer: revealAnswer(lesson.quiz) });
};
