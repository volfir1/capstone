import express from "express"
import { register, verifyUser, checkEmailExists, registerAttorney, verifyAttorney, getAllAttorneys, activateAttorney, createClientAccount, getEmailFromUsername, verifyClientAccount } from "../controller/authController.js"

const router = express.Router()

router.post('/register', register)
router.post('/register-attorney', registerAttorney)
router.post('/verify-attorney', verifyAttorney)
router.put('/verify-user', verifyUser)
router.post('/check-email', checkEmailExists)
router.post('/get-email-from-username', getEmailFromUsername)

// Admin routes
router.get('/all-attorneys', getAllAttorneys)
router.put('/activate-attorney/:attorneyId', activateAttorney)
router.post('/create-client-account', createClientAccount)
router.post('/verify-client-account', verifyClientAccount)

export default router