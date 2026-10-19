const express = require("express");
const crypto = require("node:crypto");
const { requireAuth } = require("../middleware/auth");
const { restoreDemo, isDemoEmail } = require("../services/demoRestore");
const { badRequest, forbidden, unauthorized } = require("../../lib/errors");
const router = express.Router();
router.use((req, res, next) => { res.set("Cache-Control", "no-store"); next(); });

// Visiting the UI is read-only. Only an explicit authenticated POST mutates.
router.post("/", requireAuth, async (req, res) => {
  if (!isDemoEmail(req.user.email)) throw forbidden("Only a seeded demo account may restore the demo community");
  if (Object.keys(req.body || {}).length || Object.keys(req.query).length) throw badRequest("Restoration does not accept a user or other options");
  res.json(await restoreDemo({ actor: req.user }));
});

// The hourly GitHub Actions job sends Authorization: Bearer CRON_SECRET.
// Fail closed when unconfigured; session tokens cannot invoke this endpoint.
router.get("/hourly", async (req, res) => {
  const secret = process.env.CRON_SECRET;
  const expected = Buffer.from(`Bearer ${secret || ""}`);
  const actual = Buffer.from(req.get("authorization") || "");
  if (!secret || actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) throw unauthorized();
  res.json(await restoreDemo({ hourly: true }));
});
module.exports = router;
