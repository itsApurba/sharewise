const express = require("express");
const decks = require("../controllers/deck.controller");
const { requireAuth, optionalAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/popular", optionalAuth, decks.popular);
router.post("/", requireAuth, decks.createDeck);
router.get("/:id", optionalAuth, decks.getDeck);
router.patch("/:id", requireAuth, decks.updateDeck);
router.delete("/:id", requireAuth, decks.deleteDeck);
router.post("/:id/lessons", requireAuth, decks.addLesson);
router.delete("/:id/lessons/:lessonId", requireAuth, decks.removeLesson);
router.post("/:id/remember", requireAuth, decks.rememberAll);

module.exports = router;
