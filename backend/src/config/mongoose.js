const mongoose = require("mongoose");
const logger = require("./logger");
const { mongo } = require("./vars");

mongoose.connection.on("error", (err) => {
  logger.error(`Database error ${err}.`);
  process.exit(-1);
});

exports.connect = async () => {
  await mongoose.connect(mongo.uri);
  logger.info("Database connected");
  return mongoose.connection;
};
