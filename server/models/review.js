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
  // Immutable snapshots for court-representation review movements.
  workflowHistory: [{
    action: { type: String },
    fromStage: { type: String },
    toStage: { type: String },
    actor: { id: String, name: String, role: String },
    snapshot: { type: mongoose.Schema.Types.Mixed },
    occurredAt: { type: Date, default: Date.now },
  }],
  // Review stage for two-layer approval: 'draft' -> 'supervising_lawyer' -> 'director' -> 'completed' OR 'returned_to_intern'
  reviewStage: { type: String, enum: ['draft', 'supervising_lawyer', 'director', 'completed', 'returned_to_intern'], default: 'supervising_lawyer', index: true },
}, { timestamps: true })

export default mongoose.model('Review', ReviewSchema)
