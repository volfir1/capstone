import express from 'express';
import {
  createActivityLog,
  getActivityLogs,
  getOnlineUsers,
} from '../controller/activityLogController.js';

const router = express.Router();

router.post('/', createActivityLog);
router.get('/', getActivityLogs);
router.get('/online', getOnlineUsers);

export default router;
