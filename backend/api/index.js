// Vercel function entry: vercel.json rewrites /api/* here and the Express app keeps its /api
// routes. Locally, src/index.js listens instead. No process.exit here: a function that exits
// takes the instance down, so configuration and database problems become a 503 with a log line.
const { missingConfig } = require("../src/config/vars");
const logger = require("../src/config/logger");
const app = require("../src/config/express");
const db = require("../src/config/mongoose");

const unavailable = (res, message) => {
  res.statusCode = 503;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ error: { code: "SERVICE_UNAVAILABLE", message } }));
};

module.exports = async (req, res) => {
  const missing = missingConfig();
  if (missing.length) {
    logger.error(`Missing required environment variables: ${missing.join(", ")}`);
    return unavailable(res, "Server is not configured");
  }
  try {
    await db.connect();
  } catch (err) {
    logger.error(`Failed to connect to the database: ${err.message}`);
    return unavailable(res, "Database unavailable");
  }
  return app(req, res);
};
