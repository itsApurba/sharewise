/**
 * Deletions that must not leave orphans behind (the old API left posts of deleted users).
 */
const Deck = require("../models/deck.model");
const Follow = require("../models/follow.model");
const Lesson = require("../models/lesson.model");
const QuizAttempt = require("../models/quizAttempt.model");
const Review = require("../models/review.model");
const ReviewLog = require("../models/reviewLog.model");
const User = require("../models/user.model");

/** Deletes lessons plus every user's cards and quiz attempts on them, and takes them out of decks. Review history (logs) is kept. */
async function deleteLessons(lessonIds) {
  if (!lessonIds.length) return;
  await Promise.all([
    Review.deleteMany({ lesson: { $in: lessonIds } }),
    QuizAttempt.deleteMany({ lesson: { $in: lessonIds } }),
    Deck.updateMany({ lessons: { $in: lessonIds } }, { $pull: { lessons: { $in: lessonIds } } }),
  ]);
  await Lesson.deleteMany({ _id: { $in: lessonIds } });
}

/** Deletes a user with their lessons (and others' cards on them), their decks, cards, history, attempts and follows. */
async function deleteUser(userId) {
  const lessonIds = await Lesson.find({ author: userId }).distinct("_id");
  await deleteLessons(lessonIds);
  await Promise.all([
    Review.deleteMany({ user: userId }),
    ReviewLog.deleteMany({ user: userId }),
    QuizAttempt.deleteMany({ user: userId }),
    Deck.deleteMany({ owner: userId }),
    Follow.deleteMany({ $or: [{ follower: userId }, { followee: userId }] }),
  ]);
  await User.deleteOne({ _id: userId });
}

module.exports = { deleteLessons, deleteUser };
