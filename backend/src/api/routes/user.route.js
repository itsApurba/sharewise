const express = require('express')
const { createUser, getUser, updateUser, deleteUser, getAllUsers } = require('../controllers/user.controller')


const router = express.Router()


router.get('/', getAllUsers)

router.post('/', createUser)

router.get('/:id', getUser)

router.put('/:id', updateUser)

router.delete('/:id', deleteUser)

module.exports = router