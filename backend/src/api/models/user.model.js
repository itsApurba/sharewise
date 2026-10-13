const mongoose = require("mongoose");
const { isValidTimeZone } = require("../../lib/time");

const HANDLE = /^[a-z0-9_]{3,20}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BIO_MAX = 200;

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required"], trim: true, maxlength: [50, "Name must be at most 50 characters"] },
    handle: {
      type: String,
      required: [true, "Handle is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [HANDLE, "Handle must be 3-20 characters: lowercase letters, digits or _"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      immutable: true,
      match: [EMAIL, "Email must be a valid address"],
    },
    passwordHash: { type: String, required: true, select: false },
    bio: { type: String, trim: true, default: "", maxlength: [BIO_MAX, `Bio must be at most ${BIO_MAX} characters`] },
    timezone: {
      type: String,
      default: "UTC",
      validate: { validator: isValidTimeZone, message: "Timezone must be an IANA name such as Europe/Berlin" },
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", UserSchema);

module.exports = User;
module.exports.HANDLE = HANDLE;
module.exports.BIO_MAX = BIO_MAX;
