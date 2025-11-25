import express from "express";
import {
  sendMessage,
  getMessagesByCase,
  markMessagesAsRead,
  getChatList,
  getAssignedAttorney,
} from "../controller/chatController.js";

const router = express.Router();

// Send a message
router.post("/send", sendMessage);

// Get messages for a case
router.get("/case/:caseId", getMessagesByCase);

// Mark messages as read
router.put("/read/:caseId", markMessagesAsRead);

// Get chat list (for attorney)
router.get("/list", getChatList);

// Get assigned attorney for a case (for user)
router.get("/attorney/:caseId", getAssignedAttorney);

export default router;
