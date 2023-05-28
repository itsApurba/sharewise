const express = require('express')
const userRoutes = require('./user.route')
const postRoutes = require('./post.route')
const analyticsRoutes = require('./analytics.route')

const router = express.Router()


router.get('/', (req, res) => res.send('OK'));


router.use('/users', userRoutes)
router.use('/posts', postRoutes)

router.use('/analytics', analyticsRoutes);


module.exports = router;