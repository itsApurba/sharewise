const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { env, logs, corsOrigins } = require("./vars");
const compress = require("compression");
const routes = require("../api/routes");
const { errorHandler, notFoundRoute } = require("../api/middleware/error");

const app = express();

if (env !== "test") app.use(morgan(logs));

app.use(express.json({ limit: "100kb" }));

app.use(compress());
// Auth uses bearer tokens, not cookies, so any origin may call the API unless CORS_ORIGIN narrows it.
app.use(cors({ exposedHeaders: ["X-Due-Count"], ...(corsOrigins.length && { origin: corsOrigins }) }));

app.use("/api", routes);

app.use(notFoundRoute);
app.use(errorHandler);

module.exports = app;
