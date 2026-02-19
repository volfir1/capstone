import mongoose from 'mongoose'

const ClientsInfoSchema = new mongoose.Schema({
  // User reference - links appointment to specific user
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  firebaseUid: { type: String, index: true },
  
  // denormalized top-level fields for quick lookup
  fullName: { type: String, index: true },
  caseNumber: { type: String, index: true },
  appointedDate: { type: Date, index: true },
  appointmentTime: { type: String },
  source: {
    type: String,
    enum: ['public-appointment', 'client-form', 'internal'],
    default: 'client-form',
    index: true,
  },
  status: { 
    type: String, 
    enum: ['auto-scheduled', 'confirmed', 'legal-advice', 'court-case', 'rejected'],
    default: 'auto-scheduled',
    index: true 
  },

  // Calendar recording (system + Google template link)
  calendarRecorded: { type: Boolean, default: false, index: true },
  calendarEventId: { type: String },
  calendarRecordedAt: { type: Date },
  calendarRecordedBy: { type: String },

  // Personal Details fields
  name: { type: String },
  age: { type: Number },
  birthday: { type: String },
  sex: { type: String },
  civilStatus: { type: String },
  citizenship: { type: String },
  contactNumber: { type: String },
  cellphoneNumber: { type: String },
  telephoneNumber: { type: String },
  email: { type: String },
  presentAddress: { type: String },
  permanentAddress: { type: String },
  spouseName: { type: String },
  throughRelator: { type: String },
  relatorName: { type: String },
  relationshipToClient: { type: String },
  relatorContactNumber: { type: String },

  // Financial Details fields
  currentSourceOfIncome: { type: String },
  monthlyIncome: { type: Number },
  natureOfWork: { type: String },
  employerName: { type: String },
  employerAddress: { type: String },
  employerTelephone: { type: String },
  spouseSourceOfIncome: { type: String },
  spouseMonthlyIncome: { type: Number },
  spouseEmployerAddress: { type: String },
  totalCombinedIncome: { type: Number },
  dependents: { type: Number },

  // Case Details fields
  partyRepresented: { type: String },
  venue: { type: String },
  presentStage: { type: String },
  caseNature: { type: String },
  natureOfCase: { type: String },
  courtDivision: { type: String },
  courtAddress: { type: String },
  courtPhoneNumber: { type: String },
  presidingOfficer: { type: String },
  caseDescription: { type: String },
  adverseParty: { type: String },
  adversePartyAddress: { type: String },
  adversePartyCounsel: { type: String },
  adversePartyCounselAddress: { type: String },
  adversePartyCounselPhone: { type: String },
  legalMatter: { type: String },
  location: { type: String },
  appointmentType: { type: String },
  urgencyLevel: { type: String },

  // full structured payload (kept for backward compatibility)
  personal: { type: mongoose.Schema.Types.Mixed },
  financial: { type: mongoose.Schema.Types.Mixed },
  caseDetails: { type: mongoose.Schema.Types.Mixed },
  review: { type: mongoose.Schema.Types.Mixed },

}, { timestamps: true })

export default mongoose.model('ClientsInfo', ClientsInfoSchema)
