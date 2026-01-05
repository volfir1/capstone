import mongoose from 'mongoose'

const ClientsInfoSchema = new mongoose.Schema({
  // denormalized top-level fields for quick lookup
  fullName: { type: String, index: true },
  caseNumber: { type: String, index: true },
  appointedDate: { type: Date, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

  // full structured payload
  personal: { type: mongoose.Schema.Types.Mixed },
  financial: { type: mongoose.Schema.Types.Mixed },
  caseDetails: { type: mongoose.Schema.Types.Mixed },
  review: { type: mongoose.Schema.Types.Mixed },

}, { timestamps: true })

ClientsInfoSchema.index({ fullName: 1 })
ClientsInfoSchema.index({ caseNumber: 1 })
ClientsInfoSchema.index({ appointedDate: 1 })

export default mongoose.model('ClientsInfo', ClientsInfoSchema)
