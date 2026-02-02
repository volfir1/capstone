import mongoose from 'mongoose'

const ReviewSchema = new mongoose.Schema({
  caseId: { type: String, required: true, index: true },
  // Denormalized readable fields to help locate review documents quickly
  caseTitle: { type: String, index: true },
  clientName: { type: String, index: true },
  reviewerId: { type: String },
  reviewerRole: { type: String },
  step: { type: Number },
  content: { type: mongoose.Schema.Types.Mixed },
  // Review stage for two-layer approval: 'supervising_lawyer' -> 'director' -> 'completed' OR 'returned_to_intern'
  reviewStage: { type: String, enum: ['supervising_lawyer', 'director', 'completed', 'returned_to_intern'], default: 'supervising_lawyer', index: true },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true })

// Indexes for quick lookup
ReviewSchema.index({ caseId: 1 })
ReviewSchema.index({ caseTitle: 1 })
ReviewSchema.index({ clientName: 1 })

export default mongoose.model('Review', ReviewSchema)
