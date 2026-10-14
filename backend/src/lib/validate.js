const mongoose = require("mongoose");
const { badRequest, notFound } = require("./errors");

const isObjectId = (value) => typeof value === "string" && mongoose.isValidObjectId(value) && /^[a-f0-9]{24}$/i.test(value);

/** Returns the route id, or throws a 404 for a malformed one (no such resource can exist). */
function objectIdParam(value, what) {
  if (!isObjectId(value)) throw notFound(what);
  return value;
}

/** Parses `?page=&limit=` (page >= 1, 1 <= limit <= 50, default 20). */
function pagination(query) {
  const fields = {};
  const page = query.page === undefined ? 1 : Number(query.page);
  const limit = query.limit === undefined ? 20 : Number(query.limit);
  if (!Number.isInteger(page) || page < 1) fields.page = "Page must be a positive integer";
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) fields.limit = "Limit must be an integer from 1 to 50";
  if (Object.keys(fields).length) throw badRequest("Invalid pagination", fields);
  return { page, limit, skip: (page - 1) * limit };
}

/** `{ items, page, limit, hasMore }` from a query that fetched `limit + 1` rows. */
function pageOf(rows, { page, limit }, map = (x) => x) {
  return { items: rows.slice(0, limit).map(map), page, limit, hasMore: rows.length > limit };
}

/** The trimmed string, or undefined when `value` is not a string. */
const str = (value) => (typeof value === "string" ? value.trim() : undefined);

/** Maps a Mongoose ValidationError to field messages. */
function mongooseFields(error) {
  const fields = {};
  for (const [path, err] of Object.entries(error.errors || {})) {
    fields[path] = err.kind === "Number" || err.name === "CastError" ? `${path} has the wrong type` : err.message;
  }
  return fields;
}

module.exports = { isObjectId, objectIdParam, pagination, pageOf, str, mongooseFields };
