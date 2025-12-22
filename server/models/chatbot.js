import mongoose from "mongoose";

const chatbotSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    conversationHistory: [
      {
        role: {
          type: String,
          enum: ["user", "model"],
          required: true,
        },
        message: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const ChatBot = mongoose.model("ChatBot", chatbotSchema);
export default ChatBot;
