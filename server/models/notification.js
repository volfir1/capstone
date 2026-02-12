import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    // Who receives this notification
    recipientId: {
      type: String, // firebaseUid
      required: true,
      index: true,
    },
    // Notification content
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    // Categorization
    type: {
      type: String,
      enum: [
        'case_assigned',        // Attorney assigned to user's case
        'new_case',             // Attorney receives a new case
        'appointment_created',  // New appointment/event scheduled
        'appointment_updated',  // Appointment rescheduled/cancelled
        'case_accepted',        // Case finalized & accepted
        'case_rejected',        // Case finalized & rejected
        'review_pending',       // Review needs attention
        'account_verified',     // Account verification
        'general',
      ],
      default: 'general',
    },
    // Optional reference to related entity
    referenceId: {
      type: String,
      default: null,
    },
    // Read status
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

// Compound index for efficient queries
notificationSchema.index({ recipientId: 1, read: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
