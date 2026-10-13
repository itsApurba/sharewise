/**
 * The central error handler. Express 5 forwards rejected async handlers here, so
 * controllers just throw; every error leaves as `{ error: { code, message, fields? } }`.
 */
const mongoose = require("mongoose");
const logger = require("../../config/logger");
const { HttpError } = require("../../lib/errors");
const { mongooseFields } = require("../../lib/validate");

function notFoundRoute(req, res) {
  res.status(404).json({ error: { code: "NOT_FOUND", message: `No route for ${req.method} ${req.path}` } });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let status = 500;
  let body = { code: "INTERNAL", message: "Something went wrong on our side" };

  if (err instanceof HttpError) {
    status = err.status;
    body = { code: err.code, message: err.message, ...(err.fields ? { fields: err.fields } : {}) };
  } else if (err.type === "entity.parse.failed") {
    status = 400;
    body = { code: "BAD_JSON", message: "Request body is not valid JSON" };
  } else if (err.type === "entity.too.large") {
    status = 413;
    body = { code: "TOO_LARGE", message: "Request body is too large" };
  } else if (err instanceof mongoose.Error.ValidationError) {
    status = 400;
    body = { code: "VALIDATION", message: "Validation failed", fields: mongooseFields(err) };
  } else if (err instanceof mongoose.Error.CastError) {
    status = 400;
    body = { code: "VALIDATION", message: "Validation failed", fields: { [err.path]: `${err.path} has the wrong type` } };
  } else if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || err.keyValue || {})[0] || "value";
    status = 409;
    body = { code: "DUPLICATE", message: `That ${field} is already taken`, fields: { [field]: `That ${field} is already taken` } };
  }

  if (status >= 500) logger.error(err.stack || String(err));
  res.status(status).json({ error: body });
}

module.exports = { errorHandler, notFoundRoute };
