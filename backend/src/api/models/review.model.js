const mongoose = require("mongoose");

// One card per (user, lesson) the user chose to remember; srs.js owns the scheduling fields.
const ReviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson", required: true, index: true },
    ease: { type: Number, required: true },
    interval: { type: Number, required: true },
    repetitions: { type: Number, required: true },
    lapses: { type: Number, default: 0 },
    dueAt: { type: Date, required: true },
    lastReviewedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

ReviewSchema.index({ user: 1, lesson: 1 }, { unique: true });
ReviewSchema.index({ user: 1, dueAt: 1 });

module.exports = mongoose.model("Review", ReviewSchema);
