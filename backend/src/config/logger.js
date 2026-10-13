const winston = require("winston");

const env = process.env.NODE_ENV;

// Logs go to the console (Vercel and most hosts collect stdout). Tests stay quiet.
const logger = winston.createLogger({
  level: "info",
  silent: env === "test",
  format: env === "production" ? winston.format.json() : winston.format.simple(),
  transports: [new winston.transports.Console()],
});

module.exports = logger;
