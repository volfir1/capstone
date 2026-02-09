import express from 'express'
import { getProfile, fetchUsers, updateUserRole, toggleUserStatus, sendPasswordResetEmail, updateProfileImage } from '../controller/userController.js'

const router = express.Router()

// Log when router is loaded
console.log('userRoutes.js loaded');

// Test route
router.get('/test', (req, res) => {
  console.log('Test route hit!');
  res.json({ success: true, message: 'User routes are working!' });
});

router.get('/profile', getProfile)
router.put('/profile/image', updateProfileImage)
router.get('/fetchusers', fetchUsers)

// User management routes (admin only)
router.put('/:userId/role', updateUserRole)
router.put('/:userId/status', toggleUserStatus)
router.post('/send-password-reset', sendPasswordResetEmail)

console.log('userRoutes registered: /profile, /fetchusers, /test, /:userId/role, /:userId/status, /send-password-reset');

export default router