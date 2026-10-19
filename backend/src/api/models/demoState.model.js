const mongoose = require("mongoose");

// One private manifest: immutable demo IDs, credential backups for missing users,
// and the fingerprint of the last completed fixture restoration.
const schema = new mongoose.Schema({
  _id: String,
  manifest: { type: mongoose.Schema.Types.Mixed, required: true },
  fingerprint: String,
  restoredAt: Date,
  checkedAt: Date,
  revision: { type: Number, default: 0 },
});
module.exports = mongoose.model("DemoState", schema);
