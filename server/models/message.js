import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Case",
    required: true,
    index: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: "senderModel",
  },
  senderModel: {
    type: String,
    required: true,
    enum: ["User", "Attorney"],
  },
  senderRole: {
    type: String,
    enum: ["user", "attorney", "intern", "secretary"],
    default: function() {
      return this.senderModel === "User" ? "user" : "attorney";
    },
    index: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for efficient querying
messageSchema.index({ caseId: 1, createdAt: -1 });
messageSchema.index({ caseId: 1, senderRole: 1, createdAt: -1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;
