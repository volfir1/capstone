import mongoose from 'mongoose';

const timeEntrySchema = new mongoose.Schema({
  internId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  internName: {
    type: String,
    required: true,
  },
  timeIn: {
    type: Date,
    required: true,
  },
  timeOut: {
    type: Date,
  },
  duration: {
    type: Number, // in seconds
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  reviewedAt: {
    type: Date,
  },
  notes: {
    type: String,
  },
}, {
  timestamps: true,
});

const TimeEntry = mongoose.model('TimeEntry', timeEntrySchema);

export default TimeEntry;
