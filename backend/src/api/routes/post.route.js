const express = require("express");
const { createPost, getPost, updatePost, deletePost, likePost, unlikePost } = require("../controllers/post.controller");

const router = express.Router();

router.post("/", createPost);

router.get("/:id", getPost);

router.put("/:id", updatePost);

router.delete("/:id", deletePost);

router.post("/:id/like", likePost);

router.post("/:id/unlike", unlikePost);

module.exports = router;
