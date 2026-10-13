const bcrypt = require("bcryptjs");
const User = require("../models/user.model");
const { assertValid, unauthorized } = require("../../lib/errors");
const { str } = require("../../lib/validate");
const { canonicalTimeZone } = require("../../lib/time");
const { me } = require("../services/serialize");
const { issueToken } = require("../services/tokens");

const PASSWORD = [8, 72]; // bcrypt ignores bytes past 72
const BCRYPT_ROUNDS = 10;

/**
 * The profile fields (name, handle, bio, timezone) shared by sign-up and PATCH /users/me.
 * Type errors go into `fields`; schema rules (lengths, handle format) are checked by the model.
 */
function profileFields(body, fields, { partial }) {
  const out = {};
  for (const key of ["name", "handle", "bio", "timezone"]) {
    if (body[key] === undefined) {
      if (!partial) out[key] = undefined;
      continue;
    }
    if (typeof body[key] !== "string") fields[key] = `${key} must be a string`;
    else out[key] = str(body[key]);
  }
  if (out.handle) out.handle = out.handle.toLowerCase();
  if (out.timezone !== undefined) {
    const timezone = canonicalTimeZone(out.timezone);
    if (timezone) out.timezone = timezone;
    else fields.timezone = "Timezone must be an IANA name such as Europe/Berlin";
  }
  return out;
}

exports.profileFields = profileFields;

exports.signup = async (req, res) => {
  const body = req.body || {};
  const fields = {};
  const profile = profileFields(body, fields, { partial: false });
  for (const key of ["bio", "timezone"]) if (!profile[key]) delete profile[key];
  if (body.email !== undefined && typeof body.email !== "string") fields.email = "email must be a string";
  const email = typeof body.email === "string" ? body.email : undefined;
  const { password } = body;
  if (typeof password !== "string" || password.length < PASSWORD[0] || password.length > PASSWORD[1]) {
    fields.password = `Password must be ${PASSWORD[0]}-${PASSWORD[1]} characters`;
  }
  const user = new User({ ...profile, email, passwordHash: "pending" });
  const invalid = await user.validate().catch((error) => error);
  for (const [path, err] of Object.entries(invalid?.errors || {})) fields[path] ??= err.message;
  assertValid(fields);

  user.passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  await user.save(); // a taken email or handle becomes a 409 in the error handler
  res.status(201).json({ token: issueToken(user), user: me(user) });
};

exports.login = async (req, res) => {
  const body = req.body || {};
  const fields = {};
  if (typeof body.email !== "string" || !body.email.trim()) fields.email = "Email is required";
  if (typeof body.password !== "string" || !body.password) fields.password = "Password is required";
  assertValid(fields);

  const user = await User.findOne({ email: body.email.trim().toLowerCase() }).select("+passwordHash");
  if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) throw unauthorized("Invalid email or password");
  res.json({ token: issueToken(user), user: me(user) });
};

exports.me = async (req, res) => {
  res.json({ user: me(req.user) });
};
