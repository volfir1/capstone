import mongoose from 'mongoose';
import admin from 'firebase-admin';

import Notification from '../models/notification.js';
import Account from '../models/account.js';
import User from '../models/user.js';
import { emitToProfileRoom } from '../socket.js';
import { safeErrorMessage } from '../utils/errorResponse.js';

const normalizeRecipientId = (value) => String(value || '').trim();
const getActiveNotificationRecipientId = (req) =>
  String(req.activeProfile?._id || '').trim();

const resolvePushTargetUid = async (recipientId) => {
  const normalizedRecipientId = normalizeRecipientId(recipientId);
  if (!normalizedRecipientId) return '';

  if (mongoose.Types.ObjectId.isValid(normalizedRecipientId)) {
    const profile = await User.findById(normalizedRecipientId)
      .select('firebaseUid accountId')
      .lean();

    if (profile?.firebaseUid) {
      return profile.firebaseUid;
    }

    if (profile?.accountId) {
      const account = await Account.findById(profile.accountId).select('firebaseUid').lean();
      return account?.firebaseUid || '';
    }
  }

  return normalizedRecipientId;
};

// —— Helper: send FCM push notification to an account's registered devices ——
const sendPushToUser = async (recipientFirebaseUid, title, body, data = {}) => {
  try {
    const account = await Account.findOne({ firebaseUid: recipientFirebaseUid })
      .select('pushTokens')
      .lean();
    if (!account?.pushTokens?.length) return;

    const payload = {
      notification: { title, body },
      data: { ...data, title, body },
    };

    const results = await Promise.allSettled(
      account.pushTokens.map((token) =>
        admin.messaging().send({ ...payload, token })
      )
    );

    // Remove any invalid/expired tokens
    const invalidTokens = [];
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const code = result.reason?.code || result.reason?.errorInfo?.code || '';
        if (
          code === 'messaging/registration-token-not-registered' ||
          code === 'messaging/invalid-registration-token' ||
          code === 'messaging/invalid-argument'
        ) {
          invalidTokens.push(account.pushTokens[index]);
        }
      }
    });

    if (invalidTokens.length) {
      await Account.updateOne(
        { firebaseUid: recipientFirebaseUid },
        { $pull: { pushTokens: { $in: invalidTokens } } }
      );
    }
  } catch (err) {
    console.error('FCM push error (non-fatal):', err.message);
  }
};

export const listActiveProfilesByRoles = async (roles, { accountId = null } = {}) => {
  const normalizedRoles = (Array.isArray(roles) ? roles : [roles])
    .map((role) => String(role || '').trim())
    .filter(Boolean);

  if (!normalizedRoles.length) return [];

  const query = {
    role: { $in: normalizedRoles },
    disabled: { $ne: true },
  };

  if (accountId) {
    query.accountId = accountId;
  }

  return User.find(query)
    .select('_id accountId firstName lastName email firebaseUid role disabled')
    .sort({ createdAt: 1, firstName: 1, lastName: 1 })
    .lean();
};

export const emitSocketEventToProfile = (profileId, eventName, payload) => {
  const normalizedProfileId = normalizeRecipientId(profileId);
  if (!normalizedProfileId || !eventName) return;
  emitToProfileRoom(normalizedProfileId, eventName, payload);
};

export const emitNotificationToProfile = (profileId, notification) => {
  const normalizedProfileId = normalizeRecipientId(profileId);
  if (!normalizedProfileId || !notification) return;
  emitSocketEventToProfile(normalizedProfileId, 'new-notification', notification);
};

// —— Helper: create a notification (used by other controllers) ——
export const createNotification = async ({
  recipientId,
  title,
  message,
  type = 'general',
  referenceId = null,
}) => {
  try {
    const normalizedRecipientId = normalizeRecipientId(recipientId);
    if (!normalizedRecipientId || !title || !message) return null;

    const notification = await Notification.create({
      recipientId: normalizedRecipientId,
      title,
      message,
      type,
      referenceId,
    });

    const pushTargetUid = await resolvePushTargetUid(normalizedRecipientId);
    if (pushTargetUid) {
      sendPushToUser(pushTargetUid, title, message, {
        type,
        referenceId: referenceId || '',
      });
    }

    return notification;
  } catch (error) {
    console.error('Create notification error:', error.message);
    return null; // Never let notification failures break main flows
  }
};

// —— GET /notifications — list notifications for the active profile ——
export const getNotifications = async (req, res) => {
  try {
    const recipientId = getActiveNotificationRecipientId(req);
    if (!recipientId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const query = { recipientId };

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(query),
      Notification.countDocuments({ ...query, read: false }),
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
    res.status(500).json({ success: false, message: safeErrorMessage(error) });
  }
};

// —— GET /notifications/unread-count ——
export const getUnreadCount = async (req, res) => {
  try {
    const recipientId = getActiveNotificationRecipientId(req);
    if (!recipientId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const unreadCount = await Notification.countDocuments({
      recipientId,
      read: false,
    });
    res.json({ success: true, unreadCount });
  } catch (error) {
    res.status(500).json({ success: false, message: safeErrorMessage(error) });
  }
};

// —— PUT /notifications/:id/read — mark one as read ——
export const markAsRead = async (req, res) => {
  try {
    const recipientId = getActiveNotificationRecipientId(req);
    if (!recipientId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipientId },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: safeErrorMessage(error) });
  }
};

// —— PUT /notifications/read-all — mark all as read ——
export const markAllAsRead = async (req, res) => {
  try {
    const recipientId = getActiveNotificationRecipientId(req);
    if (!recipientId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    await Notification.updateMany({ recipientId, read: false }, { read: true });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: safeErrorMessage(error) });
  }
};

// —— DELETE /notifications — delete all notifications for profile ——
export const deleteAllNotifications = async (req, res) => {
  try {
    const recipientId = getActiveNotificationRecipientId(req);
    if (!recipientId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    await Notification.deleteMany({ recipientId });
    res.json({ success: true, message: 'All notifications deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: safeErrorMessage(error) });
  }
};

// —— DELETE /notifications/:id ——
export const deleteNotification = async (req, res) => {
  try {
    const recipientId = getActiveNotificationRecipientId(req);
    if (!recipientId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const deleted = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipientId,
    });

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: safeErrorMessage(error) });
  }
};
