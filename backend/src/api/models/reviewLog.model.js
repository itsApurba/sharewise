const mongoose = require("mongoose");

// One row per answered review; streaks and weekly counts are computed from these.
// Rows outlive the card and the lesson so a user's history survives deletions by others.
const ReviewLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  lesson: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson", required: true },
  grade: { type: String, enum: ["got", "forgot"], required: true },
  interval: { type: Number, required: true },
  reviewedAt: { type: Date, required: true },
});

ReviewLogSchema.index({ user: 1, reviewedAt: -1 });

module.exports = mongoose.model("ReviewLog", ReviewLogSchema);
