import express from "express"
import { register, verifyUser, checkEmailExists, registerAttorney, verifyAttorney, getAllAttorneys, activateAttorney, createClientAccount, getEmailFromUsername, verifyClientAccount, getAccountContext } from "../controller/authController.js"
import { authenticateFirebaseToken, requireProfilePin, requireRole } from '../firebase/authMiddleware.js'

const router = express.Router()

// ── Public routes (no auth — needed for signup/login flow) ──
router.post('/register', register)
router.post('/register-attorney', registerAttorney)
router.post('/verify-attorney', verifyAttorney)
router.put('/verify-user', verifyUser)
router.post('/check-email', checkEmailExists)
router.post('/get-email-from-username', getEmailFromUsername)
router.get('/context', authenticateFirebaseToken, getAccountContext)

// ── Admin routes (require auth + admin roles) ──
router.get('/all-attorneys', authenticateFirebaseToken, requireProfilePin, requireRole('director', 'secretary', 'supervising_lawyer'), getAllAttorneys)
router.put('/activate-attorney/:attorneyId', authenticateFirebaseToken, requireProfilePin, requireRole('director', 'secretary'), activateAttorney)
router.post('/create-client-account', authenticateFirebaseToken, requireProfilePin, requireRole('director', 'secretary', 'intern', 'supervising_lawyer'), createClientAccount)
router.post('/verify-client-account', authenticateFirebaseToken, requireProfilePin, requireRole('director', 'secretary', 'intern', 'supervising_lawyer'), verifyClientAccount)

export default router
