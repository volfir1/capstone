import mongoose from 'mongoose'
import Counter from './counter.js'
import { allocateFinalizeCaseNumber } from '../utils/finalizeCaseNumber.js'

const FinalizeSchema = new mongoose.Schema({
  caseId: { type: String, unique: true, index: true },
  caseNumber: { type: String, unique: true, sparse: true },
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
  // Client account tracking
  clientAccountCreated: { type: Boolean, default: false, index: true },
  clientUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  // Assignment fields
  assignedTo: {
    id: { type: String },
    name: { type: String },
    email: { type: String },
    role: { type: String },
  },
  assignedBy: {
    id: { type: String },
    name: { type: String },
    email: { type: String },
    role: { type: String },
  },
  assignedNote: { type: String },
  assignedAt: { type: Date },
  assignedCompleted: { type: Boolean, default: false },
  assignedCompletedAt: { type: Date },
}, { timestamps: true })

// Pre-save hook to auto-generate identifiers if not provided
FinalizeSchema.pre('save', async function(next) {
  if (this.isNew && !this.caseId) {
    try {
      const currentYear = new Date().getFullYear();
      const yearShort = currentYear.toString().slice(-2);

      const counter = await Counter.findOneAndUpdate(
        { _id: `finalize-${currentYear}`, year: currentYear },
        { $inc: { sequence: 1 } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      const sequenceNumber = String(counter.sequence || 1).padStart(4, '0');
      this.caseId = `case-${yearShort}-${sequenceNumber}`;

      console.log('Generated caseId:', this.caseId)
    } catch (err) {
      console.error('Error generating caseId:', err)
      return next(err)
    }
  }

  if (this.isNew && !this.caseNumber) {
    try {
      const caseCounter = await allocateFinalizeCaseNumber(this);
      this.caseNumber = caseCounter.caseNumber;
      console.log('Generated caseNumber:', this.caseNumber);
    } catch (err) {
      console.error('Error generating caseNumber:', err);
      return next(err);
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
