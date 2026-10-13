const mongoose = require("mongoose");

// A lesson is the evolved post: a bite-size note with optional code, link, tags and quiz.
const QuizSchema = new mongoose.Schema(
  {
    prompt: { type: String, required: true },
    kind: { type: String, enum: ["text", "choice"], required: true },
    answer: { type: String },
    choices: { type: [String], default: undefined },
    correctIndex: { type: Number },
  },
  { _id: false }
);

const LessonSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    code: {
      type: new mongoose.Schema({ language: String, source: String }, { _id: false }),
      default: null,
    },
    link: { type: String, default: null },
    tags: { type: [String], default: [], index: true },
    quiz: { type: QuizSchema, default: null },
  },
  { timestamps: true }
);

LessonSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Lesson", LessonSchema);
