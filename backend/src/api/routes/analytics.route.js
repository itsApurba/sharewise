const express = require("express");
const analytics = require("../controllers/analytics.controller");
const { requireAuth, optionalAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/lessons/most-remembered", optionalAuth, analytics.mostRemembered);
router.get("/teachers/top", analytics.topTeachers);
router.get("/me", requireAuth, analytics.myStats);
router.get("/community", analytics.community);

module.exports = router;
