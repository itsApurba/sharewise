const path = require('path')

// Values already in the environment win over the .env file.
require("dotenv").config({ path: path.join(__dirname, "../../.env"), quiet: true });

const required = ["MONGO_URI", "JWT_SECRET"];

/** Names of the required environment variables that are unset or empty. */
const missingConfig = () => required.filter((name) => !process.env[name]);

module.exports = {
  missingConfig,
  env: process.env.NODE_ENV,
  port: process.env.PORT,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpirationInterval: process.env.JWT_EXPIRATION_MINUTES,
  mongo: {
    uri: process.env.MONGO_URI,
  },
  logs: process.env.NODE_ENV === "production" ? "combined" : "dev",
};
