const mongoose = require("mongoose");
const logger = require("./logger");
const { mongo } = require("./vars");

// Never log the URI: it carries the database password.
mongoose.connection.on("error", (err) => {
  logger.error(`Database error: ${err.message}`);
});

let connecting = null;

/**
 * Connects once per process and reuses the connection, so warm serverless
 * invocations skip the handshake. A failed attempt is forgotten so the next
 * call retries.
 */
exports.connect = () => {
  if (!connecting) {
    if (!mongo.uri) return Promise.reject(new Error("MONGO_URI (or MONGODB_URI) is not set"));
    connecting = mongoose
      .connect(mongo.uri)
      .then(() => {
        logger.info("Database connected");
        return mongoose.connection;
      })
      .catch((err) => {
        connecting = null;
        throw err;
      });
  }
  return connecting;
};
