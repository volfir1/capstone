import mongoose from "mongoose";

const attorneySchema = new mongoose.Schema({
  // Basic Information
  email: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  middleName: { type: String },
  lastName: { type: String, required: true },
  suffix: { type: String }, // Jr., Sr., III, etc.
  username: { type: String, required: true, unique: true },
  firebaseUid: { type: String, required: true, unique: true },
  
  // Professional Information
  role: { 
    type: String, 
    enum: ["attorney", "pao_lawyer", "legal_volunteer"], 
    default: "attorney" 
  },
  
  // Philippine Bar Information
  prcLicenseNumber: { 
    type: String, 
    required: true, 
    unique: true // PRC (Professional Regulation Commission) License Number
  },
  ibrNumber: { 
    type: String, 
    required: true, 
    unique: true // Integrated Bar of the Philippines Roll Number
  },
  barAdmissionDate: { type: Date, required: true },
  
  // Verification Status
  isVerified: { type: Boolean, default: false },
  isBarMemberActive: { type: Boolean, default: true },
  
  // Contact Information
  phoneNumber: { type: String, required: true },
  officeAddress: {
    street: String,
    barangay: String,
    city: { type: String, required: true },
    province: { type: String, required: true },
    region: { type: String, required: true },
    zipCode: String
  },
  
  // Professional Details
  lawFirm: { type: String },
  isPAOLawyer: { type: Boolean, default: false },
  paoOffice: { type: String }, // If PAO lawyer, which office
  
  // Specializations (Philippine law context)
  specializations: [{
    type: String,
    enum: [
      "Criminal Law",
      "Civil Law",
      "Family Law",
      "Labor Law",
      "Commercial Law",
      "Tax Law",
      "Immigration Law",
      "Land and Property Law",
      "Human Rights",
      "Environmental Law",
      "Agrarian Law",
      "Administrative Law",
      "Corporate Law",
      "Intellectual Property",
      "Other"
    ]
  }],
  
  // Language Capabilities
  languages: [{
    type: String,
    enum: [
      "English",
      "Filipino/Tagalog",
      "Cebuano",
      "Ilocano",
      "Hiligaynon",
      "Waray",
      "Kapampangan",
      "Bikol",
      "Pangasinan",
      "Other"
    ]
  }],
  
  // Service Areas (Provinces/Cities they serve)
  serviceAreas: [{
    province: String,
    cities: [String]
  }],
  
  // Availability
  isAvailable: { type: Boolean, default: true },
  consultationMode: [{
    type: String,
    enum: ["online", "in-person", "both"]
  }],
  
  // Statistics
//   casesHandled: { type: Number, default: 0 },
//   rating: { type: Number, default: 0, min: 0, max: 5 },
//   totalReviews: { type: Number, default: 0 },
  
//   // Document Verification
//   verificationDocuments: [{
//     documentType: {
//       type: String,
//       enum: ["prc_license", "ibr_certificate", "valid_id", "other"]
//     },
//     documentUrl: String,
//     uploadedAt: { type: Date, default: Date.now }
//   }],
  
  // Professional Background
  biography: { type: String },
  education: [{
    degree: String,
    school: String,
    yearGraduated: Number
  }],
  
  // Account Status
  accountStatus: {
    type: String,
    enum: ["pending", "active", "suspended", "inactive"],
    default: "pending"
  },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Index for search optimization
attorneySchema.index({ city: 1, specializations: 1, isAvailable: 1 });
attorneySchema.index({ languages: 1 });
attorneySchema.index({ isPAOLawyer: 1 });

// Update timestamp on save
attorneySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Attorney = mongoose.model("Attorney", attorneySchema);

export default Attorney;