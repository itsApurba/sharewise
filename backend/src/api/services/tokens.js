const jwt = require("jwt-simple");
const { jwtSecret, jwtExpirationMinutes } = require("../../config/vars");

// Token lifetimes use the wall clock, not lib/clock: they are not part of scheduling.
function issueToken(user) {
  const iat = Math.floor(Date.now() / 1000);
  return jwt.encode({ sub: String(user._id), iat, exp: iat + jwtExpirationMinutes * 60 }, jwtSecret, "HS256");
}

/** The user id in a valid, unexpired token, or null. */
function verifyToken(token) {
  try {
    const payload = jwt.decode(token, jwtSecret, false, "HS256");
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

module.exports = { issueToken, verifyToken };
