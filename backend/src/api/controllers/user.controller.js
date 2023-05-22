const httpStatus = require('http-status')
const User = require('../models/user.model');
const logger = require('../../config/logger');
const Post = require('../models/post.model');

exports.createUser = async (req, res) => {
     try {
       const user = new User(req.body);
       const savedUser = await user.save();
       res.status(httpStatus.CREATED);
       res.json(savedUser);
     } catch (error) {
       logger.error(error);
       res.status(httpStatus.INTERNAL_SERVER_ERROR).send('Internal server error')
     }
}
exports.getUser = async (req, res) => {
  const id = req.params.id;
  try {
    const user = await User.findById(id);
    res.send(user);
  } catch (error) {
    console.log(error)
  }
};

exports.updateUser = async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    if (!updatedUser) return res.status(404).send("User not found");
    res.send(updatedUser);
  } catch (error) {
    res.send(error);
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) return res.status(404).send('User not found');
    res.send(`${deletedUser.name} has been deleted`);
  } catch (error) {
    res.send(error);
  }
}


exports.totalUsers = async (req, res) => {
  const userCount = await User.countDocuments();
  res.send({ total_users: userCount });
};

exports.topActiveUsers = async (req, res) => {
  const topUsers = await Post.aggregate([
    { $group: { _id: "$user_id", post_count: { $sum: 1 } } },
    { $sort: { post_count: -1 } },
    { $limit: 5 },
    { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
    { $unwind: "$user" },
    { $project: { _id: 0, user_id: "$_id", name: "$user.name", post_count: 1 } },
  ]);
  res.send(topUsers);
}; 