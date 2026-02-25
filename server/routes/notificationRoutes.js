import express from 'express';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
} from '../controller/notificationController.js';

const router = express.Router();

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/read-all', markAllAsRead);
router.delete('/clear-all', deleteAllNotifications);
router.put('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

export default router;
