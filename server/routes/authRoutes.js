import express from "express"
import { register, verifyUser, checkEmailExists, registerAttorney, verifyAttorney } from "../controller/authController.js"

const router = express.Router()

router.post('/register', register)
router.post('/register-attorney', registerAttorney)
router.post('/verify-attorney', verifyAttorney)
router.put('/verify-user', verifyUser)
router.post('/check-email', checkEmailExists)

export default router