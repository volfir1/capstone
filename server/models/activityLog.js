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
      enum: ['login', 'logout', 'case_created', 'case_updated', 'case_assigned', 'review_submitted', 'finalize_decision'],
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
// Auto-delete logs older than 7 days
activityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

export default ActivityLog;
