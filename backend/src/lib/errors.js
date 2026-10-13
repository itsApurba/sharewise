/**
 * Errors that the central error handler (api/middleware/error.js) turns into
 * `{ error: { code, message, fields? } }` responses with the matching status.
 */
class HttpError extends Error {
  constructor(status, code, message, fields) {
    super(message);
    this.status = status;
    this.code = code;
    if (fields) this.fields = fields;
  }
}

const badRequest = (message, fields) => new HttpError(400, "VALIDATION", message, fields);
const unauthorized = (message = "Authentication required") => new HttpError(401, "UNAUTHORIZED", message);
const forbidden = (message = "You are not allowed to do that") => new HttpError(403, "FORBIDDEN", message);
const notFound = (what = "Resource") => new HttpError(404, "NOT_FOUND", `${what} not found`);
const conflict = (code, message, fields) => new HttpError(409, code, message, fields);

/** Throws a 400 listing every field message when `fields` is non-empty. */
function assertValid(fields) {
  if (Object.keys(fields).length) throw badRequest("Validation failed", fields);
}

module.exports = { HttpError, badRequest, unauthorized, forbidden, notFound, conflict, assertValid };
