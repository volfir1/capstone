import Message from "../models/message.js";
import Case from "../models/case.js";
import User from "../models/user.js";
import Attorney from "../models/attorney.js";
import admin from "firebase-admin";

// Send a message
export const sendMessage = async (req, res) => {
  try {
    const { caseId, message } = req.body;

    if (!caseId || !message) {
      return res.status(400).json({
        success: false,
        message: "Case ID and message are required",
      });
    }

    // Get sender from Firebase token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No authentication token provided",
      });
    }

    const idToken = authHeader.split(" ")[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userEmail = decodedToken.email;

    // Check if case exists
    const caseData = await Case.findById(caseId);
    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: "Case not found",
      });
    }

    // Determine if sender is user or attorney
    let senderId, senderModel;
    
    const user = await User.findOne({ email: userEmail });
    if (user) {
      // Verify user owns this case
      if (caseData.userId.toString() !== user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to send messages for this case",
        });
      }
      senderId = user._id;
      senderModel = "User";
    } else {
      const attorney = await Attorney.findOne({ email: userEmail });
      if (!attorney) {
        return res.status(404).json({
          success: false,
          message: "User or Attorney not found",
        });
      }
      // Verify attorney is assigned to this case
      if (!caseData.attorneyId || caseData.attorneyId.toString() !== attorney._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "You are not assigned to this case",
        });
      }
      senderId = attorney._id;
      senderModel = "Attorney";
    }

    // Create message
    const newMessage = await Message.create({
      caseId,
      senderId,
      senderModel,
      message,
    });

    // Populate sender info
    await newMessage.populate(senderModel === "User" ? 
      { path: "senderId", select: "firstName lastName email" } :
      { path: "senderId", select: "firstName lastName email" }
    );

    res.status(201).json({
      success: true,
      data: newMessage,
      message: "Message sent successfully",
    });
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to send message",
    });
  }
};

// Get messages for a case
export const getMessagesByCase = async (req, res) => {
  try {
    const { caseId } = req.params;

    // Get sender from Firebase token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No authentication token provided",
      });
    }

    const idToken = authHeader.split(" ")[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userEmail = decodedToken.email;

    // Check if case exists
    const caseData = await Case.findById(caseId);
    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: "Case not found",
      });
    }

    // Verify user has access to this case
    const user = await User.findOne({ email: userEmail });
    const attorney = await Attorney.findOne({ email: userEmail });

    const isAuthorized = 
      (user && caseData.userId.toString() === user._id.toString()) ||
      (attorney && caseData.attorneyId && caseData.attorneyId.toString() === attorney._id.toString());

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view messages for this case",
      });
    }

    // Get messages
    const messages = await Message.find({ caseId })
      .populate("senderId", "firstName lastName email")
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      data: messages,
      message: "Messages retrieved successfully",
    });
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve messages",
    });
  }
};

// Mark messages as read
export const markMessagesAsRead = async (req, res) => {
  try {
    const { caseId } = req.params;

    // Get sender from Firebase token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No authentication token provided",
      });
    }

    const idToken = authHeader.split(" ")[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userEmail = decodedToken.email;

    const user = await User.findOne({ email: userEmail });
    const attorney = await Attorney.findOne({ email: userEmail });

    const currentUserId = user?._id || attorney?._id;

    if (!currentUserId) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Mark all messages in this case as read (except messages sent by current user)
    await Message.updateMany(
      { 
        caseId, 
        senderId: { $ne: currentUserId },
        isRead: false 
      },
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      message: "Messages marked as read",
    });
  } catch (error) {
    console.error("Mark messages as read error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to mark messages as read",
    });
  }
};

// Get chat list (cases with messages for attorney)
export const getChatList = async (req, res) => {
  try {
    // Get sender from Firebase token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No authentication token provided",
      });
    }

    const idToken = authHeader.split(" ")[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userEmail = decodedToken.email;

    const attorney = await Attorney.findOne({ email: userEmail });
    if (!attorney) {
      return res.status(404).json({
        success: false,
        message: "Attorney not found",
      });
    }

    // Get all cases assigned to this attorney
    const cases = await Case.find({ attorneyId: attorney._id })
      .populate("userId", "firstName lastName email")
      .sort({ updatedAt: -1 });

    // For each case, get the last message and unread count
    const chatsWithLastMessage = await Promise.all(
      cases.map(async (caseItem) => {
        const lastMessage = await Message.findOne({ caseId: caseItem._id })
          .sort({ createdAt: -1 })
          .populate("senderId", "firstName lastName");

        const unreadCount = await Message.countDocuments({
          caseId: caseItem._id,
          senderId: { $ne: attorney._id },
          isRead: false,
        });

        return {
          case: caseItem,
          lastMessage,
          unreadCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: chatsWithLastMessage,
      message: "Chat list retrieved successfully",
    });
  } catch (error) {
    console.error("Get chat list error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve chat list",
    });
  }
};

// Get user's assigned attorney info for a case
export const getAssignedAttorney = async (req, res) => {
  try {
    const { caseId } = req.params;

    // Get user from Firebase token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No authentication token provided",
      });
    }

    const idToken = authHeader.split(" ")[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userEmail = decodedToken.email;

    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get case and verify ownership
    const caseData = await Case.findById(caseId)
      .populate("attorneyId", "firstName lastName email phoneNumber specializations");

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: "Case not found",
      });
    }

    if (caseData.userId.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this case",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        case: caseData,
        attorney: caseData.attorneyId,
      },
      message: "Attorney information retrieved successfully",
    });
  } catch (error) {
    console.error("Get assigned attorney error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve attorney information",
    });
  }
};
