const express = require('express')
const { createUser } = require('../controllers/user.controller')


const router = express.Router()


router.get('/', (req, res) => res.send('users'))

router.post('/', createUser)

module.exports = router