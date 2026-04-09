import express from 'express'
import { getProfile, getProfiles, createProfile, updateProfile, fetchUsers, updateManagedProfile, deleteManagedProfile, updateUserRole, toggleUserStatus, sendPasswordResetEmail, updateProfileImage, uploadProfileImageFile, profileImageMiddleware, getUserById, updateSignature, uploadSignature, registerPushToken, unregisterPushToken, getProfilePinStatus, setupProfilePin, verifyProfilePin, resetManagedProfilePin } from '../controller/userController.js'
import { authenticateFirebaseToken, requireProfilePin } from '../firebase/authMiddleware.js'

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

router.get('/profiles', getProfiles)
router.get('/profile/pin/status', getProfilePinStatus)
router.post('/profile/pin/setup', setupProfilePin)
router.post('/profile/pin/verify', verifyProfilePin)

router.use(requireProfilePin)

router.post('/profiles', createProfile)
router.get('/profile', getProfile)
router.put('/profile', updateProfile)
router.put('/profile/image', updateProfileImage)
router.post('/profile/image/upload', profileImageMiddleware, uploadProfileImageFile)
router.put('/profile/signature', updateSignature)
router.post('/profile/signature/upload', uploadSignature)
router.get('/fetchusers', fetchUsers)
router.post('/:userId/pin/reset', resetManagedProfilePin)
router.put('/:userId/pin/reset', resetManagedProfilePin)
router.get('/:userId', getUserById)
router.put('/:userId', updateManagedProfile)
router.delete('/:userId', deleteManagedProfile)

// User management routes (admin only)
router.put('/:userId/role', updateUserRole)
router.put('/:userId/status', toggleUserStatus)
router.post('/send-password-reset', sendPasswordResetEmail)

// Push notification token management
router.post('/push-token', registerPushToken)
router.delete('/push-token', unregisterPushToken)

console.log('userRoutes registered: /profiles, /profile, /fetchusers, /:userId/pin/reset, /test, /:userId/role, /:userId/status, /send-password-reset');

export default router
