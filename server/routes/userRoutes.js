import express from 'express'
import { getProfile, fetchUsers, updateUserRole, toggleUserStatus, sendPasswordResetEmail, updateProfileImage, getUserById, updateSignature, uploadSignature, getDecryptedSignature, verifySignatureIntegrity } from '../controller/userController.js'
import { authenticateFirebaseToken } from '../firebase/authMiddleware.js'

const router = express.Router()

// All user routes require authentication
router.use(authenticateFirebaseToken)

router.get('/profile', getProfile)
router.put('/profile/image', updateProfileImage)
router.put('/profile/signature', updateSignature)
router.post('/profile/signature/upload', uploadSignature)
router.get('/signature/decrypt/:userId', getDecryptedSignature)
router.get('/signature/verify/:userId', verifySignatureIntegrity)
router.get('/fetchusers', fetchUsers)
router.get('/:userId', getUserById)

// User management routes (admin only)
router.put('/:userId/role', updateUserRole)
router.put('/:userId/status', toggleUserStatus)
router.post('/send-password-reset', sendPasswordResetEmail)

export default router