const clock = require("../../lib/clock");
const { pagination } = require("../../lib/validate");
const { feedFor } = require("../services/feed");

exports.getFeed = async (req, res) => {
  res.json(await feedFor(req.user, clock.now(), pagination(req.query)));
};
