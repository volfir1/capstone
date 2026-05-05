import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: "Account", index: true, default: null },
  email: { type: String, required: true, index: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
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

});

userSchema.index({ role: 1, disabled: 1 });
userSchema.index({ role: 1, archivedAt: 1 });
userSchema.index({ accountId: 1, createdAt: 1 });
userSchema.index({ accountId: 1, role: 1, archivedAt: 1 });
userSchema.index({ firebaseUid: 1, role: 1 });

const User = mongoose.model("User", userSchema);

export default User;
