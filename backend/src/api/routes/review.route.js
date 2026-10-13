const express = require("express");
const reviews = require("../controllers/review.controller");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);
router.get("/", reviews.listReviews);
router.get("/due", reviews.dueReviews);
router.post("/:id/answer", reviews.answerReview);

module.exports = router;
