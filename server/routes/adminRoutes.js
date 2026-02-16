import express from 'express';
import { updateAdminProfile } from '../controller/adminController.js';

const router = express.Router();

// Update admin profile
router.put('/profile', updateAdminProfile);

export default router;
