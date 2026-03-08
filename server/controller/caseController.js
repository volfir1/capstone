import Case from "../models/case.js";
import User from "../models/user.js";
import Attorney from "../models/attorney.js";
import Review from "../models/review.js";
import Finalize from "../models/finalize.js";
import CaseRecord from "../models/caserecord.js";
import admin from "firebase-admin";
import { createNotification } from "./notificationController.js";

import { safeErrorMessage } from '../utils/errorResponse.js';
// Submit a new case
export const submitCase = async (req, res) => {
  try {
    const { caseTitle, caseType, shortDescription, detailedDescription } = req.body;

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

    // Find user in MongoDB
    const user = await User.findOne({ email: userEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Validate required fields
    if (!caseTitle || !caseType || !shortDescription || !detailedDescription) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: caseTitle, caseType, shortDescription, detailedDescription",
      });
    }

    // Create case
    const newCase = await Case.create({
      userId: user._id,
      caseTitle,
      caseType,
      shortDescription,
      detailedDescription,
      attorneyId: null, // Will be assigned by admin later
    });

    res.status(201).json({
      success: true,
      data: {
        id: newCase._id,
        caseNumber: newCase.caseNumber,
        caseTitle: newCase.caseTitle,
        caseType: newCase.caseType,
        shortDescription: newCase.shortDescription,
        detailedDescription: newCase.detailedDescription,
        userId: newCase.userId,
        attorneyId: newCase.attorneyId,
        createdAt: newCase.createdAt,
      },
      message: "Case submitted successfully",
    });
  } catch (error) {
    console.error("Submit case error:", error);
    res.status(500).json({
      success: false,
      message: safeErrorMessage(error, "Failed to submit case"),
    });
  }
};

// Get all cases for a user
export const getUserCases = async (req, res) => {
  try {
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

    // Find user in MongoDB
    const user = await User.findOne({ email: userEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get all cases for this user
    const cases = await Case.find({ userId: user._id })
      .populate("attorneyId", "firstName lastName email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: cases,
      message: "Cases retrieved successfully",
    });
  } catch (error) {
    console.error("Get user cases error:", error);
    res.status(500).json({
      success: false,
      message: safeErrorMessage(error, "Failed to retrieve cases"),
    });
  }
};

// Get a single case by ID
export const getCaseById = async (req, res) => {
  try {
    const { caseId } = req.params;

    const caseData = await Case.findById(caseId)
      .populate("userId", "firstName lastName email")
      .populate("attorneyId", "firstName lastName email");

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: "Case not found",
      });
    }

    res.status(200).json({
      success: true,
      data: caseData,
      message: "Case retrieved successfully",
    });
  } catch (error) {
    console.error("Get case by ID error:", error);
    res.status(500).json({
      success: false,
      message: safeErrorMessage(error, "Failed to retrieve case"),
    });
  }
};

// Get all cases (Admin)
export const getAllCases = async (req, res) => {
  try {
    const cases = await Case.find()
      .populate("userId", "firstName lastName email")
      .populate("attorneyId", "firstName lastName email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: cases,
      message: "All cases retrieved successfully",
    });
  } catch (error) {
    console.error("Get all cases error:", error);
    res.status(500).json({
      success: false,
      message: safeErrorMessage(error, "Failed to retrieve cases"),
    });
  }
};

// Get all attorneys (Admin)
export const getAllAttorneys = async (req, res) => {
  try {
    const attorneys = await Attorney.find({ isVerified: true, accountStatus: "active" })
      .select("firstName lastName email specializations role")
      .sort({ firstName: 1 });

    res.status(200).json({
      success: true,
      data: attorneys,
      message: "Attorneys retrieved successfully",
    });
  } catch (error) {
    console.error("Get all attorneys error:", error);
    res.status(500).json({
      success: false,
      message: safeErrorMessage(error, "Failed to retrieve attorneys"),
    });
  }
};

// Assign attorney to case (Admin)
export const assignAttorney = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { attorneyId } = req.body;

    if (!attorneyId) {
      return res.status(400).json({
        success: false,
        message: "Attorney ID is required",
      });
    }

    // Check if case exists
    const caseData = await Case.findById(caseId);
    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: "Case not found",
      });
    }

    // Check if attorney exists
    const attorney = await Attorney.findById(attorneyId);
    if (!attorney) {
      return res.status(404).json({
        success: false,
        message: "Attorney not found",
      });
    }

    // Update case with attorney
    caseData.attorneyId = attorneyId;
    await caseData.save();

    // Populate the updated case
    const updatedCase = await Case.findById(caseId)
      .populate("userId", "firstName lastName email")
      .populate("attorneyId", "firstName lastName email");

    // ── Notifications ──
    const user = await User.findById(caseData.userId);
    if (user?.firebaseUid) {
      createNotification({
        recipientId: user.firebaseUid,
        title: 'Attorney Assigned',
        message: `Atty. ${attorney.firstName} ${attorney.lastName} has been assigned to your case "${caseData.caseTitle}".`,
        type: 'case_assigned',
        referenceId: caseId,
      });
    }
    if (attorney?.firebaseUid) {
      createNotification({
        recipientId: attorney.firebaseUid,
        title: 'New Case Assigned',
        message: `You have been assigned to case "${caseData.caseTitle}" (${caseData.caseNumber}).`,
        type: 'new_case',
        referenceId: caseId,
      });
    }

    res.status(200).json({
      success: true,
      data: updatedCase,
      message: "Attorney assigned successfully",
    });
  } catch (error) {
    console.error("Assign attorney error:", error);
    res.status(500).json({
      success: false,
      message: safeErrorMessage(error, "Failed to assign attorney"),
    });
  }
};

// Get dashboard stats (Admin)
export const getDashboardStats = async (req, res) => {
  try {
    // Core counts
    const totalCases = await Case.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalAttorneys = await Attorney.countDocuments({ isVerified: true });
    const unassignedCases = await Case.countDocuments({ attorneyId: null });
    const assignedCases = totalCases - unassignedCases;

    // User role breakdown
    const userRoleCounts = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);
    const roleBreakdown = {};
    userRoleCounts.forEach(r => { roleBreakdown[r._id || 'unknown'] = r.count; });

    // Case type breakdown
    const caseTypeCounts = await Case.aggregate([
      { $group: { _id: '$caseType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Service type breakdown from finalized accepted records
    // Matches FinalizedCases.jsx classification:
    //   Legal Advice:  content.interviewInfo.forLegalAdvice is truthy
    //   Legal Drafting: content.interviewInfo.caseType === 'legal-document'
    //   Court Representation: everything else (split by CaseRecord existence)
    const acceptedFinalized = await Finalize.find({ decision: 'accepted' }).lean();
    let legalAdviceCount = 0;
    let legalDraftingCount = 0;
    let courtWithRecordCount = 0;
    let courtWithoutRecordCount = 0;

    for (const f of acceptedFinalized) {
      const flag = f.content?.interviewInfo?.forLegalAdvice;
      const caseType = f.content?.interviewInfo?.caseType;
      const isLA = flag === true || flag === 'true' || flag === 1 || flag === '1' || caseType === 'legal-advice';
      const isDoc = caseType === 'legal-document';

      if (isLA) legalAdviceCount++;
      else if (isDoc) legalDraftingCount++;
      else {
        const hasRecord = await CaseRecord.exists({ finalizeId: f._id });
        if (hasRecord) courtWithRecordCount++;
        else courtWithoutRecordCount++;
      }
    }

    // Review stage counts
    const reviewStageCounts = await Review.aggregate([
      { $group: { _id: '$reviewStage', count: { $sum: 1 } } }
    ]);
    const reviewBreakdown = {};
    reviewStageCounts.forEach(r => { reviewBreakdown[r._id || 'unknown'] = r.count; });
    const totalReviews = await Review.countDocuments();
    const pendingReviews = (reviewBreakdown['supervising_lawyer'] || 0) + (reviewBreakdown['director'] || 0);

    // Finalized decision breakdown
    const finalizeDecisionCounts = await Finalize.aggregate([
      { $group: { _id: '$decision', count: { $sum: 1 } } }
    ]);
    const finalizeBreakdown = {};
    finalizeDecisionCounts.forEach(r => { finalizeBreakdown[r._id || 'unknown'] = r.count; });
    const totalFinalized = await Finalize.countDocuments();

    res.status(200).json({
      success: true,
      data: {
        totalCases,
        totalUsers,
        totalAttorneys,
        unassignedCases,
        assignedCases,
        roleBreakdown,
        caseTypeBreakdown: caseTypeCounts.map(c => ({ type: c._id, count: c.count })),
        serviceBreakdown: {
          legalAdvice: legalAdviceCount,
          legalDrafting: legalDraftingCount,
          courtWithRecord: courtWithRecordCount,
          courtWithoutRecord: courtWithoutRecordCount,
        },
        totalReviews,
        pendingReviews,
        reviewBreakdown,
        totalFinalized,
        finalizeBreakdown,
      },
      message: "Dashboard stats retrieved successfully",
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({
      success: false,
      message: safeErrorMessage(error, "Failed to retrieve dashboard stats"),
    });
  }
};

// Get all cases assigned to an attorney
export const getAttorneyCases = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No authentication token provided",
      });
    }

    const idToken = authHeader.split(" ")[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const attorneyEmail = decodedToken.email;

    // Find attorney in MongoDB
    const attorney = await Attorney.findOne({ email: attorneyEmail });

    if (!attorney) {
      return res.status(404).json({
        success: false,
        message: "Attorney not found",
      });
    }

    // Get all cases assigned to this attorney
    const cases = await Case.find({ attorneyId: attorney._id })
      .populate("userId", "firstName lastName email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: cases,
      message: "Attorney cases retrieved successfully",
    });
  } catch (error) {
    console.error("Get attorney cases error:", error);
    res.status(500).json({
      success: false,
      message: safeErrorMessage(error, "Failed to retrieve attorney cases"),
    });
  }
};

// Admin: Create case for a user (for finalized cases)
export const createCaseForUser = async (req, res) => {
  try {
    const { userId, caseTitle, caseType, shortDescription, detailedDescription } = req.body;

    // Validate required fields
    if (!userId || !caseTitle || !caseType || !shortDescription || !detailedDescription) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: userId, caseTitle, caseType, shortDescription, detailedDescription",
      });
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Create case
    const newCase = await Case.create({
      userId: user._id,
      caseTitle,
      caseType,
      shortDescription,
      detailedDescription,
      attorneyId: null,
    });

    res.status(201).json({
      success: true,
      data: {
        id: newCase._id,
        caseNumber: newCase.caseNumber,
        caseTitle: newCase.caseTitle,
        caseType: newCase.caseType,
        shortDescription: newCase.shortDescription,
        detailedDescription: newCase.detailedDescription,
        userId: newCase.userId,
        attorneyId: newCase.attorneyId,
        createdAt: newCase.createdAt,
      },
      message: "Case created successfully",
    });
  } catch (error) {
    console.error("Create case for user error:", error);
    res.status(500).json({
      success: false,
      message: safeErrorMessage(error, "Failed to create case"),
    });
  }
};
