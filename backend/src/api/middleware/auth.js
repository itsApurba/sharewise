const User = require("../models/user.model");
const { unauthorized } = require("../../lib/errors");
const { isObjectId } = require("../../lib/validate");
const { verifyToken } = require("../services/tokens");

/** Resolves `Authorization: Bearer <token>` to a user; undefined when no header, null when invalid. */
async function userFromHeader(req) {
  const header = req.get("authorization");
  if (!header) return undefined;
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  const id = verifyToken(token);
  if (!id || !isObjectId(id)) return null;
  return User.findById(id);
}

/** Requires a valid token and sets `req.user`. */
async function requireAuth(req, res, next) {
  const user = await userFromHeader(req);
  if (!user) throw unauthorized(user === undefined ? "Authentication required" : "Invalid or expired token");
  req.user = user;
  next();
}

/** Sets `req.user` when a valid token is sent; a missing token is fine, a bad one is a 401. */
async function optionalAuth(req, res, next) {
  const user = await userFromHeader(req);
  if (user === null) throw unauthorized("Invalid or expired token");
  req.user = user || null;
  next();
}

module.exports = { requireAuth, optionalAuth };
