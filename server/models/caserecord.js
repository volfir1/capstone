import mongoose from 'mongoose'

const CaseRecordSchema = new mongoose.Schema({
  finalizeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Finalize', required: true, unique: true, index: true },
  caseId: { type: String, index: true },
  
  // Case Information
  title: { type: String },
  nature: { type: String },
  tribunal: { type: String },
  branch: { type: String },
  presidingJudge: { type: String },
  telEmail: { type: String },
  contactDetails: { type: String },
  counsels: { type: String },
  publicProsecutor: { type: String },
  opposingCounsel: { type: String },
  clientAddress: { type: String },
  others: { type: String },
  
  // Parties
  parties: { type: String },
  
  // Case History & Notes
  caseHistory: { type: String },
  remarks: { type: String },
  
  // Metadata
  createdBy: { type: String },
  lastModifiedBy: { type: String },
}, { timestamps: true })

CaseRecordSchema.index({ finalizeId: 1 })
CaseRecordSchema.index({ caseId: 1 })

export default mongoose.model('CaseRecord', CaseRecordSchema)
