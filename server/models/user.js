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
  // Cryptographic signature fields
  signatureCrypto: {
    encrypted: { type: String, default: '' },   // AES-256-GCM ciphertext (base64)
    iv: { type: String, default: '' },           // AES initialization vector (base64)
    authTag: { type: String, default: '' },      // GCM authentication tag (base64)
    hash: { type: String, default: '' },         // SHA-256 hash of original image
    proof: { type: String, default: '' },        // RSA digital signature of hash
    encryptedAt: { type: Date },                 // when the signature was last encrypted
  },
  disabled: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  // Google Calendar connection info (optional)
  google: {
    connected: { type: Boolean, default: false },
    refreshToken: { type: String, default: '' },
    accessToken: { type: String, default: '' },
    tokenExpiry: { type: Date },
    primaryCalendarId: { type: String, default: 'primary' },
  },

});

const User = mongoose.model("User", userSchema);

export default User;
