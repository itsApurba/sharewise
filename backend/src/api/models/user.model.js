const mongoose = require("mongoose");


const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, minlength: 1, maxlength: 50 },
  email: { type: String, required: true, unique: true, match: /^\S+@\S+\.\S+$/ },
  bio: { type: String, required: false, maxlength: 200 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

UserSchema.pre("save", function (next) {
  this.updated_at = Date.now();
  next();
});


const User = mongoose.model("User", UserSchema);

module.exports = User;