import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  // uid: { type: String, required: true, unique: true }, 
  email: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  isVerified: {type: Boolean,  default: false},
  role: {type: String,
    enum: ["user", "secretary", "intern", "director", "supervising_lawyer"],
    default: "user"},
  username: { type: String, required: true, unique: true },
  firebaseUid: {type: String, required: true, unique: true},
  profileImage: { type: String, default: '' },
  signatureUrl: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  pushTokens: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  // Google Calendar connection info (optional)
  google: {
    connected: { type: Boolean, default: false },
    refreshToken: { type: String, default: '', select: false },
    accessToken: { type: String, default: '', select: false },
    tokenExpiry: { type: Date },
    primaryCalendarId: { type: String, default: 'primary' },
  },

});

const User = mongoose.model("User", userSchema);

export default User;
