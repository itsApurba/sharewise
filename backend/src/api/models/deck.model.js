const mongoose = require("mongoose");

// A named, ordered collection of lessons (anyone's) that one user curates.
const DeckSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    emoji: { type: String, required: true },
    color: { type: String, required: true },
    lessons: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Lesson" }], default: [], index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Deck", DeckSchema);
