import mongoose from 'mongoose'
import Counter from './counter.js'

const FinalizeSchema = new mongoose.Schema({
  caseId: { type: String, unique: true, index: true },
  caseTitle: { type: String, index: true },
  clientName: { type: String, index: true },
  linkedCaseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case' }, // Reference to the Case document for chat
  category: { 
    type: String, 
    enum: [
      'Civil Case',
      'Criminal Case',
      'Family Law',
      'Labor and Employment',
      'Land and Property Disputes',
      'Contract Disputes',
      'Personal Injury',
      'Debt Collection',
      'Inheritance and Estate',
      'Business and Commercial Law',
      'Consumer Protection',
      'Tax Law',
      'Immigration',
      'Intellectual Property',
      'Environmental Law',
      'Administrative Law',
      'Human Rights Violation',
      'Cybercrime',
      'Election Law',
      'Other'
    ],
    default: 'Other',
    index: true 
  },
  finalizedBy: { type: String },
  finalizedRole: { type: String },
  decision: { type: String, enum: ['accepted', 'rejected', 'pending'], index: true },
  content: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true })

// Pre-save hook to auto-generate caseId if not provided
FinalizeSchema.pre('save', async function(next) {
  if (this.isNew && !this.caseId) {
    try {
      const currentYear = new Date().getFullYear()
      const yearShort = currentYear.toString().slice(-2) // Get last 2 digits (e.g., 26 for 2026)
      
      // Find and increment counter for this year
      const counter = await Counter.findOneAndUpdate(
        { _id: `finalize-${currentYear}`, year: currentYear },
        { $inc: { sequence: 1 } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      )
      
      // Format: case-26-0045 (4 digits padded with zeros)
      const sequenceNumber = counter.sequence.toString().padStart(4, '0')
      this.caseId = `case-${yearShort}-${sequenceNumber}`
      
      console.log('Generated caseId:', this.caseId)
    } catch (err) {
      console.error('Error generating caseId:', err)
      return next(err)
    }
  }
  next()
})

FinalizeSchema.index({ caseId: 1 })
FinalizeSchema.index({ caseTitle: 1 })
FinalizeSchema.index({ clientName: 1 })
FinalizeSchema.index({ decision: 1 })
FinalizeSchema.index({ category: 1 })

export default mongoose.model('Finalize', FinalizeSchema)
