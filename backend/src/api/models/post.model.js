const mongoose = require("mongoose");


const PostSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  content: { type: String, required: true, minlength: 1, maxlength: 300 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  likes: { type: Number, default: 0,  },
});

postSchema.pre("save", function (next) {
  this.updated_at = Date.now();
  next();
});

const Post = mongoose.model("Post", postSchema);

module.exports = Post;