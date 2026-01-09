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

    // Determine if sender is user or attorney/admin
    let senderId, senderModel, senderRole;
    
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
      senderRole = "user";
    } else {
      // Check if sender is admin (attorney, intern, secretary)
      const adminUser = await User.findOne({ email: userEmail, role: { $in: ['attorney', 'intern', 'secretary'] } });
      if (adminUser) {
        // Admin users can message any accepted/finalized case
        senderId = adminUser._id;
        senderModel = "Attorney"; // Keep as Attorney for compatibility
        senderRole = adminUser.role; // attorney, intern, or secretary
      } else {
        const attorney = await Attorney.findOne({ email: userEmail });
        if (!attorney) {
          return res.status(404).json({
            success: false,
            message: "User or authorized person not found",
          });
        }
        // Attorney can message any case (for finalized cases)
        senderId = attorney._id;
        senderModel = "Attorney";
        senderRole = "attorney";
      }
    }

    // Create message with role
    const newMessage = await Message.create({
      caseId,
      senderId,
      senderModel,
      senderRole,
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

    let messageFilter = { caseId };
    let currentUserRole = null;

    // Check if user is client
    if (user && caseData.userId.toString() === user._id.toString()) {
      // Client can see all messages (we'll group by role on frontend)
      currentUserRole = "user";
    } else if (user && ['attorney', 'intern', 'secretary'].includes(user.role)) {
      // Admin users can view all accepted/finalized cases
      // They only see messages in their role thread
      currentUserRole = user.role;
      messageFilter.senderRole = { $in: [user.role, 'user'] }; // Only messages from their role or client
    } else if (attorney) {
      // Attorney can view any case (for finalized cases viewing)
      currentUserRole = "attorney";
      messageFilter.senderRole = { $in: ['attorney', 'user'] };
    } else {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view messages for this case",
      });
    }

    // Get messages with role filter
    const messages = await Message.find(messageFilter)
      .populate("senderId", "firstName lastName email role")
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
    let currentUserRole = null;

    if (!currentUserId) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Determine current user's role
    if (user && ['attorney', 'intern', 'secretary'].includes(user.role)) {
      currentUserRole = user.role;
    } else if (attorney) {
      currentUserRole = "attorney";
    }

    // Build filter for marking messages as read
    const readFilter = { 
      caseId, 
      senderId: { $ne: currentUserId },
      isRead: false 
    };

    // If admin user, only mark messages in their role thread
    if (currentUserRole && currentUserRole !== 'user') {
      readFilter.senderRole = { $in: [currentUserRole, 'user'] };
    }

    // Mark messages as read
    await Message.updateMany(readFilter, { isRead: true });

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

    // Check if user is admin (attorney, intern, secretary from User model)
    const adminUser = await User.findOne({ 
      email: userEmail, 
      role: { $in: ['attorney', 'intern', 'secretary'] } 
    });
    
    const attorney = !adminUser ? await Attorney.findOne({ email: userEmail }) : null;
    
    if (!adminUser && !attorney) {
      return res.status(404).json({
        success: false,
        message: "Authorized user not found",
      });
    }

    const currentUserId = adminUser?._id || attorney?._id;
    const currentUserRole = adminUser?.role || "attorney";

    // Get all accepted cases (admin can chat with any accepted case)
    const cases = await Case.find({ 
      $or: [
        { attorneyId: attorney?._id },
        { status: 'Accepted' } // Admin users can access any accepted case
      ]
    })
      .populate("userId", "firstName lastName email")
      .sort({ updatedAt: -1 });

    // For each case, get the last message and unread count for this role's thread
    const chatsWithLastMessage = await Promise.all(
      cases.map(async (caseItem) => {
        // Only get messages in this role's thread
        const lastMessage = await Message.findOne({ 
          caseId: caseItem._id,
          senderRole: { $in: [currentUserRole, 'user'] }
        })
          .sort({ createdAt: -1 })
          .populate("senderId", "firstName lastName role");

        const unreadCount = await Message.countDocuments({
          caseId: caseItem._id,
          senderId: { $ne: currentUserId },
          senderRole: { $in: [currentUserRole, 'user'] },
          isRead: false,
        });

        // Include all accepted cases, even without messages (to allow initiating conversations)
        return {
          case: caseItem,
          lastMessage: lastMessage || null,
          unreadCount,
          roleThread: currentUserRole,
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
