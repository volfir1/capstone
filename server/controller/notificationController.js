import Notification from '../models/notification.js';
import User from '../models/user.js';
import Attorney from '../models/attorney.js';
import admin from 'firebase-admin';

import { safeErrorMessage } from '../utils/errorResponse.js';
// ── Helper: resolve firebaseUid from the Authorization header ──
const getUidFromHeader = async (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const decoded = await admin.auth().verifyIdToken(authHeader.split(' ')[1]);
  return decoded.uid;
};

// ── Helper: send FCM push notification to a user's registered devices ──
const sendPushToUser = async (recipientFirebaseUid, title, body, data = {}) => {
  try {
    const user = await User.findOne({ firebaseUid: recipientFirebaseUid }).select('pushTokens').lean();
    if (!user?.pushTokens?.length) return;

    const payload = {
      notification: { title, body },
      data: { ...data, title, body },
    };

    const results = await Promise.allSettled(
      user.pushTokens.map(token =>
        admin.messaging().send({ ...payload, token })
      )
    );

    // Remove any invalid/expired tokens
    const invalidTokens = [];
    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        const code = r.reason?.code || r.reason?.errorInfo?.code || '';
        if (
          code === 'messaging/registration-token-not-registered' ||
          code === 'messaging/invalid-registration-token' ||
          code === 'messaging/invalid-argument'
        ) {
          invalidTokens.push(user.pushTokens[i]);
        }
      }
    });

    if (invalidTokens.length) {
      await User.updateOne(
        { firebaseUid: recipientFirebaseUid },
        { $pull: { pushTokens: { $in: invalidTokens } } }
      );
    }
  } catch (err) {
    console.error('FCM push error (non-fatal):', err.message);
  }
};

// ── Helper: create a notification (used by other controllers) ──
export const createNotification = async ({ recipientId, title, message, type = 'general', referenceId = null }) => {
  try {
    if (!recipientId || !title || !message) return null;
    const notification = await Notification.create({ recipientId, title, message, type, referenceId });

    // Send FCM push notification (fire-and-forget)
    sendPushToUser(recipientId, title, message, { type, referenceId: referenceId || '' });

    return notification;
  } catch (error) {
    console.error('Create notification error:', error.message);
    return null; // Never let notification failures break main flows
  }
};

// ── GET /notifications — list notifications for the logged-in user ──
export const getNotifications = async (req, res) => {
  try {
    const uid = await getUidFromHeader(req);
    if (!uid) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ recipientId: uid })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments({ recipientId: uid }),
      Notification.countDocuments({ recipientId: uid, read: false }),
    ]);

    res.json({
      success: true,
      data: notifications,
      unreadCount,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: safeErrorMessage(error)});
  }
};

// ── GET /notifications/unread-count ──
export const getUnreadCount = async (req, res) => {
  try {
    const uid = await getUidFromHeader(req);
    if (!uid) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const unreadCount = await Notification.countDocuments({ recipientId: uid, read: false });
    res.json({ success: true, unreadCount });
  } catch (error) {
    res.status(500).json({ success: false, message: safeErrorMessage(error)});
  }
};

// ── PUT /notifications/:id/read — mark one as read ──
export const markAsRead = async (req, res) => {
  try {
    const uid = await getUidFromHeader(req);
    if (!uid) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipientId: uid },
      { read: true },
      { new: true }
    );

    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
    res.json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: safeErrorMessage(error)});
  }
};

// ── PUT /notifications/read-all — mark all as read ──
export const markAllAsRead = async (req, res) => {
  try {
    const uid = await getUidFromHeader(req);
    if (!uid) return res.status(401).json({ success: false, message: 'Unauthorized' });

    await Notification.updateMany({ recipientId: uid, read: false }, { read: true });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: safeErrorMessage(error)});
  }
};

// ── DELETE /notifications — delete all notifications for user ──
export const deleteAllNotifications = async (req, res) => {
  try {
    const uid = await getUidFromHeader(req);
    if (!uid) return res.status(401).json({ success: false, message: 'Unauthorized' });

    await Notification.deleteMany({ recipientId: uid });
    res.json({ success: true, message: 'All notifications deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: safeErrorMessage(error)});
  }
};

// ── DELETE /notifications/:id ──
export const deleteNotification = async (req, res) => {
  try {
    const uid = await getUidFromHeader(req);
    if (!uid) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const deleted = await Notification.findOneAndDelete({ _id: req.params.id, recipientId: uid });
    if (!deleted) return res.status(404).json({ success: false, message: 'Notification not found' });
    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: safeErrorMessage(error)});
  }
};
