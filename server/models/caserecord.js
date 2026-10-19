import mongoose from 'mongoose'

const CaseRecordSchema = new mongoose.Schema({
  finalizeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Finalize', required: true, unique: true, index: true },
  caseId: { type: String, index: true },

  // Case Information
  title: { type: String },
  nature: { type: String },

  // Client Information
  clientName: { type: String },
  contactNumber: { type: String },
  cellphoneNumber: { type: String },
  presentAddress: { type: String },
  presentAddressTelephone: { type: String },
  permanentAddress: { type: String },
  permanentAddressTelephone: { type: String },

  // Relator / Representative
  throughRelator: { type: String, default: 'no' },
  relatorName: { type: String },
  relationshipToClient: { type: String },
  relatorEmail: { type: String },
  relatorPhone: { type: String },
  relatorAddress: { type: String },

  // Court & Venue Details (array of tribunal entries)
  courtVenueDetails: [{
    tribunal: { type: String },
    venue: { type: String },
    branch: { type: String },
    judge: { type: String },
    docketNumber: { type: String },
    email: { type: String },
    contactNumber: { type: String }
  }],

  // Parties and Counsel Details (array of groups)
  partiesAndCounselDetails: [{
    groupName: { type: String },
    parties: [{
      partyName: { type: String },
      participation: { type: String },
      mailingAddress: { type: String },
      emailAddress: { type: String },
      contactNumber: { type: String }
    }],
    counsels: [{
      counselName: { type: String },
      participation: { type: String },
      mailingAddress: { type: String },
      emailAddress: { type: String },
      contactNumber: { type: String }
    }]
  }],

  // Evidence (array of evidence lists)
  evidence: [{
    _id: { type: String },
    name: { type: String },
    annexes: [{
      _id: { type: String },
      annex: { type: String },
      annexSeries: { type: String },
      exhibit: { type: String },
      exhibitSeries: { type: String },
      document: { type: String },
      documentUrl: { type: String },
      driveFileId: { type: String },
      witness: { type: String },
      original: { type: String },
      notes: { type: String },
      seriesRows: [{
        _id: { type: String },
        annexSeries: { type: String },
        exhibitSeries: { type: String },
        document: { type: String },
        documentUrl: { type: String },
        driveFileId: { type: String },
        witness: { type: String },
        original: { type: String },
        notes: { type: String },
        cloudinaryUrl: { type: String },
        cloudinaryPublicId: { type: String },
        cloudinaryResourceType: { type: String },
        isServerFile: { type: Boolean },
        fileName: { type: String },
        fileType: { type: String },
        fileSize: { type: Number }
      }],
      cloudinaryUrl: { type: String },
      cloudinaryPublicId: { type: String },
      cloudinaryResourceType: { type: String },
      isServerFile: { type: Boolean },
      fileName: { type: String },
      fileType: { type: String },
      fileSize: { type: Number }
    }]
  }],

  // Legacy fields (kept for backward compatibility)
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
  parties: { type: String },
  caseHistory: { type: String }, // Deprecated - no longer used in UI

  // Notes
  remarks: { type: String },

  // History Records (structured history with dates, files, etc.)
  historyRecords: [{
    id: { type: String },
    date: { type: String },
    dateReceived: { type: String },
    remarks: { type: String },
    file: { type: String }, // Base64 encoded file data
    fileName: { type: String },
    fileType: { type: String }
  }],

  // Drafts (draft documents/files)
  drafts: [{
    id: { type: String },
    fileName: { type: String },
    fileType: { type: String },
    fileSize: { type: Number },
    filename: { type: String }, // Server filename
    cloudinaryUrl: { type: String }, // Cloudinary secure URL
    cloudinaryPublicId: { type: String }, // Cloudinary public ID for deletion
    cloudinaryResourceType: { type: String }, // Cloudinary resource type
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: { type: String }
  }],

  // Metadata
  createdBy: { type: String },
  lastModifiedBy: { type: String },
}, { timestamps: true })

CaseRecordSchema.index({ finalizeId: 1 })
CaseRecordSchema.index({ caseId: 1 })

export default mongoose.model('CaseRecord', CaseRecordSchema)
