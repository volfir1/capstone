import mongoose from 'mongoose';

const accountSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    firebaseUid: { type: String, required: true, unique: true, index: true },
    isVerified: { type: Boolean, default: false },
    pushTokens: [{ type: String }],
    google: {
      connected: { type: Boolean, default: false },
      connectedEmail: { type: String, default: '' },
      refreshToken: { type: String, default: '', select: false },
      accessToken: { type: String, default: '', select: false },
      tokenExpiry: { type: Date },
      primaryCalendarId: { type: String, default: 'primary' },
    },
    lastSelectedProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Account = mongoose.model('Account', accountSchema);

export default Account;
