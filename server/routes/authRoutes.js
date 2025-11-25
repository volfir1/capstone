import express from "express"
import { register, verifyUser, checkEmailExists, registerAttorney, verifyAttorney, getAllAttorneys, activateAttorney } from "../controller/authController.js"

const router = express.Router()

router.post('/register', register)
router.post('/register-attorney', registerAttorney)
router.post('/verify-attorney', verifyAttorney)
router.put('/verify-user', verifyUser)
router.post('/check-email', checkEmailExists)

// Admin routes
router.get('/all-attorneys', getAllAttorneys)
router.put('/activate-attorney/:attorneyId', activateAttorney)

export default router