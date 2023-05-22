const httpStatus = require('http-status')
const User = require('../models/user.model');
const logger = require('../../config/logger');

exports.createUser = async (req, res) => {
     try {
       const user = new User(req.body);
       const savedUser = await user.save();
       res.status(httpStatus.CREATED);
       res.json(savedUser);
     } catch (error) {
       logger.error(error);
     }
}
exports.getUser = async (req, res) => {
  try {
    const id = req.params.id;
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