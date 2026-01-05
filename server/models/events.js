import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    eventDate: {
      type: Date,
      required: true,
    },
    eventType: {
      type: String,
      enum: ['appointment', 'hearing', 'consultation', 'deadline', 'other'],
      default: 'other',
    },
    location: {
      type: String,
      trim: true,
    },
    clientName: {
      type: String,
      trim: true,
    },
    assignedTo: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled', 'rescheduled'],
      default: 'scheduled',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
    },
    createdBy: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Event = mongoose.model('Event', eventSchema);

export default Event;