import express from "express"
import { register, verifyUser, checkEmailExists } from "../controller/authController.js"

const router = express.Router()

router.post('/register', register)
router.put('/verify-user', verifyUser)
router.post('/check-email', checkEmailExists)

export default router