const express = require("express");
const lessons = require("../controllers/lesson.controller");
const { requireAuth, optionalAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/explore", optionalAuth, lessons.explore);
router.get("/tags", lessons.tags);
router.post("/", requireAuth, lessons.createLesson);
router.get("/:id", optionalAuth, lessons.getLesson);
router.patch("/:id", requireAuth, lessons.updateLesson);
router.delete("/:id", requireAuth, lessons.deleteLesson);
router.post("/:id/remember", requireAuth, lessons.remember);
router.delete("/:id/remember", requireAuth, lessons.forget);
router.post("/:id/quiz/answer", optionalAuth, lessons.answerQuiz);

module.exports = router;
