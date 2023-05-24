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


exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find();
    res.send(posts);
  } catch (error) {
    logger.error(error);
    res.send(error);
  }
}

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
  try {
    const deletedPost = await Post.findByIdAndDelete(req.params.id);
    if (!deletedPost) return res.status(404).send("Post not found");
    res.send(deletedPost);
  } catch (error) {
    res.status(httpStatus.BAD_REQUEST).send(error)
  }
};

exports.likePost = async (req, res) => {
  try {
    const updatedPost = await Post.findByIdAndUpdate(req.params.id, { $inc: { likes: 1 } }, { new: true });
    if (!updatedPost) return res.status(httpStatus.NOT_FOUND).send("Post not found");
    res.send(updatedPost);
  } catch (error) {
    res.send(error)
  }
};

exports.unlikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).send("Post not found");
    if (post.likes == 0) return res.send(httpStatus.NOT_ACCEPTABLE);

    post.likes = Math.max(post.likes - 1, 0);
    await post.save();
    res.send(post);
  } catch (error) {
    res.send(error)
  }
}

exports.totalPosts = async (req, res) => {
  try {
    const postCount = await Post.countDocuments();
    res.send({ total_posts: postCount });
  } catch (error) {
    res.send(error)
  }
};

exports.topLikedPosts = async (req, res) => {
  try {
    const topPosts = await Post.find().sort({ likes: -1 }).limit(5);
    res.send(topPosts);
  } catch (error) {
    res.send(error)
  }
};