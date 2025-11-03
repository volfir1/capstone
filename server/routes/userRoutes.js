import express from 'express'
import { getProfile, fetchUsers } from '../controller/userController.js'

const router = express.Router()

router.get('/profile', getProfile)
router.get('/fetchusers', fetchUsers)

export default router