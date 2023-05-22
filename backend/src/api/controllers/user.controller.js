const httpStatus = require('http-status')
const User = require('../models/user.model');
const logger = require('../../config/logger');

exports.createUser = async (req, res, next) => {
     try {
       const user = new User(req.body);
       const savedUser = await user.save();
       res.status(httpStatus.CREATED);
       res.json(savedUser);
     } catch (error) {
       logger.error(error);
     }
}
