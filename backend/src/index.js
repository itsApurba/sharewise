const { port, env, missingConfig } = require("./config/vars");

const missing = env === "test" ? [] : missingConfig();
if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(", ")}`);
  process.exit(1);
}

const logger = require("./config/logger");
const app = require("./config/express");
const mongoose = require('./config/mongoose')


mongoose.connect()

// Express 5 hands listen errors (such as a port in use) to this callback instead of throwing.
app.listen(port, (err) => {
  if (err) {
    logger.error(`Failed to start server on port ${port}: ${err.message}`);
    process.exit(1);
  }
  logger.info(`server started on port ${port} (${env})`);
});

module.exports = app;