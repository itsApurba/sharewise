const httpStatus = require("http-status");
const Post = require("../models/post.model");
const logger = require("../../config/logger");

exports.createPost = async (req, res) => {
  try {
    const post = new Post(req.body);
    const savedPost = await post.save();
    res.status(httpStatus.CREATED);
    res.json(savedPost);
  } catch (error) {
    logger.error(error);
    res.send(error);
  }
};

exports.getPost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).send("Post not found");
        res.send(post);
    } catch (error) {
        logger.error(error);
        res.send(error)
    }
};

exports.updatePost = async (req, res) => {
    const content = req.body.content
  const updatedPost = await Post.findByIdAndUpdate(req.params.id,{content: content} , { new: true });
  if (!updatedPost) return res.status(404).send("Post not found");
  res.send(updatedPost);
};

exports.deletePost = async (req, res) => {
  const deletedPost = await Post.findByIdAndDelete(req.params.id);
  if (!deletedPost) return res.status(404).send("Post not found");
  res.send(deletedPost);
};

exports.likePost = async (req, res) => {
  const updatedPost = await Post.findByIdAndUpdate(req.params.id, { $inc: { likes: 1 } }, { new: true });
  if (!updatedPost) return res.status(404).send("Post not found");
  res.send(updatedPost);
};

exports.unlikePost = async (req, res) => {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).send("Post not found");
    post.likes = Math.max(post.likes - 1, 0);
    await post.save();
    res.send(post);
}

exports.totalPosts = async (req, res) => {
  const postCount = await Post.countDocuments();
  res.send({ total_posts: postCount });
};


exports.topLikedPosts = async (req, res) => {
  const topPosts = await Post.find().sort({ likes: -1 }).limit(5);
  res.send(topPosts);
};