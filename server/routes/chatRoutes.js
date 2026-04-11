import express from "express";
import {
  sendMessage,
  getMessagesByCase,
  markMessagesAsRead,
  getChatList,
  getAssignedAttorney,
} from "../controller/chatController.js";
import { authenticateFirebaseToken, requireProfilePin } from '../firebase/authMiddleware.js';

const router = express.Router();

// All chat routes require authentication
router.use(authenticateFirebaseToken);
router.use(requireProfilePin);

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
