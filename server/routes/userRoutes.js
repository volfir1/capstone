import express from 'express'
import { getProfile, fetchUsers, updateUserRole, toggleUserStatus, sendPasswordResetEmail, updateProfileImage, getUserById, updateSignature, uploadSignature } from '../controller/userController.js'
import { authenticateFirebaseToken } from '../firebase/authMiddleware.js'

const router = express.Router()

// All user routes require authentication
router.use(authenticateFirebaseToken)

// Log when router is loaded
console.log('userRoutes.js loaded');

// Test route
router.get('/test', (req, res) => {
  console.log('Test route hit!');
  res.json({ success: true, message: 'User routes are working!' });
});

router.get('/profile', getProfile)
router.put('/profile/image', updateProfileImage)
router.put('/profile/signature', updateSignature)
router.post('/profile/signature/upload', uploadSignature)
router.get('/fetchusers', fetchUsers)
router.get('/:userId', getUserById)

// User management routes (admin only)
router.put('/:userId/role', updateUserRole)
router.put('/:userId/status', toggleUserStatus)
router.post('/send-password-reset', sendPasswordResetEmail)

console.log('userRoutes registered: /profile, /fetchusers, /test, /:userId/role, /:userId/status, /send-password-reset');

export default router