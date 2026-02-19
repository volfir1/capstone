import ActivityLog from '../models/activityLog.js';
import User from '../models/user.js';
import Attorney from '../models/attorney.js';
import admin from 'firebase-admin';
import { createNotification } from './notificationController.js';

const ADMIN_ROLES = ['secretary', 'intern', 'attorney', 'pao_lawyer', 'legal_volunteer', 'supervising_lawyer', 'director'];

// ── Helper: resolve firebaseUid from the Authorization header ──
const getUidFromHeader = async (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  try {
    const decoded = await admin.auth().verifyIdToken(authHeader.split(' ')[1]);
    return decoded.uid;
  } catch {
    return null;
  }
};

// ── POST /activity-logs — record a login or logout event ──
export const createActivityLog = async (req, res) => {
  try {
    const uid = await getUidFromHeader(req);
    if (!uid) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { action, userEmail, userName, userRole } = req.body;

    if (!action || !['login', 'logout'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid action. Must be "login" or "logout".' });
    }

    const log = await ActivityLog.create({
      firebaseUid: uid,
      action,
      userEmail: userEmail || '',
      userName: userName || '',
      userRole: userRole || '',
      ipAddress: req.ip || req.connection?.remoteAddress || '',
      userAgent: req.headers['user-agent'] || '',
    });

    // ── Notify all admin-role users about login/logout ──
    const displayName = userName || userEmail || 'A user';
    const roleLabel = (userRole || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'User';
    const actionLabel = action === 'login' ? 'logged in' : 'logged out';
    const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    // Find all admin-role users (exclude the person who just logged in/out)
    const [adminUsers, adminAttorneys] = await Promise.all([
      User.find({ role: { $in: ADMIN_ROLES }, firebaseUid: { $ne: uid } }).select('firebaseUid role').lean(),
      Attorney.find({ firebaseUid: { $ne: uid } }).select('firebaseUid role').lean(),
    ]);

    const recipientUids = new Set();
    adminUsers.forEach(u => { if (u.firebaseUid) recipientUids.add(u.firebaseUid); });
    adminAttorneys.forEach(a => { if (a.firebaseUid) recipientUids.add(a.firebaseUid); });

    console.log(`[ActivityLog] ${action} by ${displayName} (${userRole}) — notifying ${recipientUids.size} admin(s)`);

    const notifPromises = [];
    for (const recipientId of recipientUids) {
      notifPromises.push(
        createNotification({
          recipientId,
          title: action === 'login' ? 'User Logged In' : 'User Logged Out',
          message: `${displayName} (${roleLabel}) ${actionLabel} at ${now}.`,
          type: 'general',
          referenceId: log._id.toString(),
        })
      );
    }
    await Promise.all(notifPromises);

    res.status(201).json({ success: true, data: log });
  } catch (error) {
    console.error('Create activity log error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET /activity-logs — list activity logs (admin only) ──
export const getActivityLogs = async (req, res) => {
  try {
    const uid = await getUidFromHeader(req);
    if (!uid) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const { action, period } = req.query;

    // Build filter
    const filter = {};
    if (action && ['login', 'logout'].includes(action)) {
      filter.action = action;
    }

    // Period filter
    if (period) {
      const now = new Date();
      let startDate;
      switch (period) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          break;
      }
      if (startDate) {
        filter.createdAt = { $gte: startDate };
      }
    }

    const [logs, total] = await Promise.all([
      ActivityLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ActivityLog.countDocuments(filter),
    ]);

    // Get online status: users who logged in but haven't logged out since
    const onlineAgg = await ActivityLog.aggregate([
      { $sort: { createdAt: -1 } },
      { $group: { _id: '$firebaseUid', lastAction: { $first: '$action' }, userName: { $first: '$userName' }, userRole: { $first: '$userRole' }, lastSeen: { $first: '$createdAt' } } },
      { $match: { lastAction: 'login' } },
    ]);

    res.json({
      success: true,
      data: logs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      onlineUsers: onlineAgg,
    });
  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET /activity-logs/online — get currently online users ──
export const getOnlineUsers = async (req, res) => {
  try {
    const uid = await getUidFromHeader(req);
    if (!uid) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const onlineAgg = await ActivityLog.aggregate([
      { $sort: { createdAt: -1 } },
      { $group: { _id: '$firebaseUid', lastAction: { $first: '$action' }, userName: { $first: '$userName' }, userEmail: { $first: '$userEmail' }, userRole: { $first: '$userRole' }, lastSeen: { $first: '$createdAt' } } },
      { $match: { lastAction: 'login' } },
      { $sort: { lastSeen: -1 } },
    ]);

    res.json({ success: true, data: onlineAgg });
  } catch (error) {
    console.error('Get online users error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
