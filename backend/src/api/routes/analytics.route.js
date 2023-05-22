const express = require('express')
const { totalUsers, topActiveUsers } = require('../controllers/user.controller')
const { totalPosts, topLikedPosts } = require('../controllers/post.controller')

const router = express.Router()


router.get('/users', totalUsers )
router.get('/users/top-active', topActiveUsers )

router.get('/posts', totalPosts)
router.get('/posts/top-liked', topLikedPosts)


module.exports = router