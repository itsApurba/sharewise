const path = require('path')

// Values already in the environment win over the .env file.
require("dotenv").config({ path: path.join(__dirname, "../../.env"), quiet: true });

// MONGODB_URI is the name Vercel's MongoDB Atlas integration injects; MONGO_URI wins if both are set.
const mongoUri = () => process.env.MONGO_URI || process.env.MONGODB_URI;

/** Names of the required environment variables that are unset or empty. */
const missingConfig = () => [
  ...(mongoUri() ? [] : ["MONGO_URI (or MONGODB_URI)"]),
  ...(process.env.JWT_SECRET ? [] : ["JWT_SECRET"]),
];

/** Comma-separated allowed origins; unset allows every origin. */
const corsOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);

module.exports = {
  missingConfig,
  env: process.env.NODE_ENV,
  port: process.env.PORT,
  jwtSecret: process.env.JWT_SECRET,
  // Session tokens last a week unless JWT_EXPIRATION_MINUTES says otherwise.
  jwtExpirationMinutes: Number(process.env.JWT_EXPIRATION_MINUTES) || 7 * 24 * 60,
  mongo: {
    uri: mongoUri(),
  },
  corsOrigins,
  logs: process.env.NODE_ENV === "production" ? "combined" : "dev",
};
