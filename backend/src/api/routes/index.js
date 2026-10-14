const express = require("express");
const authRoutes = require("./auth.route");
const userRoutes = require("./user.route");
const lessonRoutes = require("./lesson.route");
const reviewRoutes = require("./review.route");
const feedRoutes = require("./feed.route");
const analyticsRoutes = require("./analytics.route");
const deckRoutes = require("./deck.route");

const router = express.Router();

router.get("/", (req, res) => res.json({ ok: true }));

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/lessons", lessonRoutes);
router.use("/reviews", reviewRoutes);
router.use("/feed", feedRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/decks", deckRoutes);

module.exports = router;
