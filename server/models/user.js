import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: "Account", index: true, default: null },
  email: { type: String, required: true, index: true },
  // Renamed for intern profiles (optional for backward compatibility)
  givenName: { type: String, default: '' },
  familyName: { type: String, default: '' },
  maternalName: { type: String, default: '' },
  // Keep old fields for backward compatibility
  firstName: { type: String, default: '' },
  lastName: { type: String, default: '' },
  isVerified: { type: Boolean, default: false },
  role: {
    type: String,
    enum: ["user", "secretary", "intern", "director", "supervising_lawyer"],
    default: "user"
  },
  username: { type: String, default: "" },
  firebaseUid: { type: String, required: true, index: true },
  profileImage: { type: String, default: '' },
  signatureUrl: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  startDate: { type: Date, default: null },
  endDate: { type: Date, default: null },
  archivedAt: { type: Date, default: null },
  archivedByProfileId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  restoredAt: { type: Date, default: null },
  restoredByProfileId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  pinEnabled: { type: Boolean, default: false },
  pinHash: { type: String, default: '', select: false },
  pinResetRequired: { type: Boolean, default: false },
  pinFailedAttempts: { type: Number, default: 0 },
  pinLockedUntil: { type: Date, default: null },
  pinLastChangedAt: { type: Date, default: null },
  pushTokens: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  // Google Calendar connection info (optional)
  google: {
    connected: { type: Boolean, default: false },
    connectedEmail: { type: String, default: '' },
    refreshToken: { type: String, default: '', select: false },
    accessToken: { type: String, default: '', select: false },
    tokenExpiry: { type: Date },
    primaryCalendarId: { type: String, default: 'primary' },
  },
  // Intern-specific personal information
  metroManilaAddress: { type: String, default: '' },
  provincialAddress: { type: String, default: '' },
  dateOfBirth: { type: Date, default: null },
  placeOfBirth: { type: String, default: '' },
  nationality: { type: String, default: '' },
  sex: { type: String, default: '' },
  civilStatus: { type: String, default: '' },
  telephoneNo: { type: String, default: '' },
  religiousAffiliations: { type: String, default: '' },
  fathersName: { type: String, default: '' },
  mothersName: { type: String, default: '' },
  wifesName: { type: String, default: '' },
  husbandsName: { type: String, default: '' },
  gradeSchool: { type: String, default: '' },
  highSchool: { type: String, default: '' },
  college: { type: String, default: '' },
  course: { type: String, default: '' },
  honorsReceived: { type: String, default: '' },
  affiliation: { type: String, default: '' },
  schoolLastAttended: { type: String, default: '' },
  employer: { type: String, default: '' },

});

userSchema.index({ role: 1, disabled: 1 });
userSchema.index({ role: 1, archivedAt: 1 });
userSchema.index({ accountId: 1, createdAt: 1 });
userSchema.index({ accountId: 1, role: 1, archivedAt: 1 });
userSchema.index({ firebaseUid: 1, role: 1 });

const User = mongoose.model("User", userSchema);

export default User;
