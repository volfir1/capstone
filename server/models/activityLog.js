import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema(
  {
    firebaseUid: {
      type: String,
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: ['login', 'logout'],
      required: true,
    },
    userEmail: {
      type: String,
      default: '',
    },
    userName: {
      type: String,
      default: '',
    },
    userRole: {
      type: String,
      default: '',
    },
    ipAddress: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Compound index for efficient querying
activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

export default ActivityLog;
