import mongoose from 'mongoose'

const SignatureSchema = new mongoose.Schema({
  ownerUid: { type: String, required: true, index: true },
  purpose: { type: String, default: 'profile_signature' },
  documentHash: { type: String, required: true },
  digitalSignature: { type: String, required: true },
  signatureUrl: { type: String, default: '' },
  signatureAlgorithm: { type: String, default: 'RSA-SHA256' },
  keyVersion: { type: Number, default: 1 },
  signedAt: { type: Date, default: Date.now },
}, { timestamps: true })

export default mongoose.model('Signature', SignatureSchema)
