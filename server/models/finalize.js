import mongoose from 'mongoose'

const FinalizeSchema = new mongoose.Schema({
  caseId: { type: String, required: true, index: true },
  caseTitle: { type: String, index: true },
  clientName: { type: String, index: true },
  finalizedBy: { type: String },
  finalizedRole: { type: String },
  content: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true })

FinalizeSchema.index({ caseId: 1 })
FinalizeSchema.index({ caseTitle: 1 })
FinalizeSchema.index({ clientName: 1 })

export default mongoose.model('Finalize', FinalizeSchema)
