const mongoose = require("mongoose");

// The viewer's first answer to a lesson's quiz; once it exists the lesson shows them the answer.
const QuizAttemptSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson", required: true, index: true },
    correct: { type: Boolean, required: true },
  },
  { timestamps: true }
);

QuizAttemptSchema.index({ user: 1, lesson: 1 }, { unique: true });

module.exports = mongoose.model("QuizAttempt", QuizAttemptSchema);
