import mongoose from "mongoose";

const caseSchema = new mongoose.Schema({
  // User Information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  
  // Attorney Assignment (will be assigned by admin later)
  attorneyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Attorney",
    default: null,
  },
  
  // Case Basic Information
  caseNumber: {
    type: String,
    unique: true,
  },
  caseTitle: {
    type: String,
    required: true,
  },
  caseType: {
    type: String,
    required: true,
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
      "Other",
    ],
  },
  shortDescription: {
    type: String,
    required: true,
  },
  detailedDescription: {
    type: String,
    required: true,
  },
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Generate unique case number
caseSchema.pre("save", async function (next) {
  if (this.isNew && !this.caseNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model("Case").countDocuments();
    this.caseNumber = `CASE-${year}-${String(count + 1).padStart(5, "0")}`;
  }
  this.updatedAt = Date.now();
  next();
});

// Indexes for better query performance
caseSchema.index({ userId: 1 });
caseSchema.index({ attorneyId: 1 });
caseSchema.index({ caseNumber: 1 });

const Case = mongoose.model("Case", caseSchema);

export default Case;
