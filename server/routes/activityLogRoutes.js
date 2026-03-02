import express from 'express';
import {
  createActivityLog,
  getActivityLogs,
  getOnlineUsers,
} from '../controller/activityLogController.js';
import { authenticateFirebaseToken } from '../firebase/authMiddleware.js';

const router = express.Router();

// All activity log routes require authentication
router.use(authenticateFirebaseToken);

router.post('/', createActivityLog);
router.get('/', getActivityLogs);
router.get('/online', getOnlineUsers);

export default router;
