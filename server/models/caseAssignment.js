import mongoose from 'mongoose'

const CaseAssignmentSchema = new mongoose.Schema({
  // Reference to the finalized case
  finalizeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Finalize', required: true },
  caseId: { type: String, index: true }, // The finalize caseId string (e.g. case-26-0045)
  caseTitle: { type: String },
  clientName: { type: String },
  category: { type: String },
  caseType: { type: String },  // e.g. 'court-representation', 'legal-advice', 'legal-document'

  // Who was assigned
  assignedTo: {
    id: { type: String, required: true },
    name: { type: String },
    email: { type: String },
    role: { type: String },
    firebaseUid: { type: String },
  },

  // Who assigned (must be director or secretary)
  assignedBy: {
    id: { type: String, required: true },
    name: { type: String },
    email: { type: String },
    role: { type: String },
  },

  // Assignment details
  deadline: { type: Date, required: true },
  message: { type: String, required: true },

  // Completion tracking (Google Classroom-like "mark as done")
  status: {
    type: String,
    enum: ['pending', 'done'],
    default: 'pending',
    index: true,
  },
  completedAt: { type: Date },
}, { timestamps: true })

CaseAssignmentSchema.index({ 'assignedTo.id': 1, status: 1 })
CaseAssignmentSchema.index({ 'assignedTo.firebaseUid': 1, status: 1 })
CaseAssignmentSchema.index({ 'assignedBy.id': 1 })
CaseAssignmentSchema.index({ finalizeId: 1 })

export default mongoose.model('CaseAssignment', CaseAssignmentSchema)
