import express from "express";
import {
  sendMessage,
  getChatHistory,
  clearChatHistory,
} from "../controller/chatbotController.js";

const router = express.Router();

// Public route - no authentication required
router.post("/message", sendMessage);

// Protected routes (optional - for logged-in users to get history)
router.get("/history", getChatHistory);
router.delete("/history", clearChatHistory);

export default router;