const express = require("express");
const users = require("../controllers/user.controller");
const decks = require("../controllers/deck.controller");
const { requireAuth, optionalAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", users.listUsers);
router.patch("/me", requireAuth, users.updateMe);
router.delete("/me", requireAuth, users.deleteMe);

router.get("/:handle", optionalAuth, users.getProfile);
router.get("/:handle/lessons", optionalAuth, users.getUserLessons);
router.get("/:handle/decks", optionalAuth, decks.userDecks);
router.get("/:handle/followers", users.getFollowers);
router.get("/:handle/following", users.getFollowing);
router.post("/:handle/follow", requireAuth, users.follow);
router.delete("/:handle/follow", requireAuth, users.unfollow);

module.exports = router;
