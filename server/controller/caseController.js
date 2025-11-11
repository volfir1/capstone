import Case from "../models/case.js";
import User from "../models/user.js";
import Attorney from "../models/attorney.js";
import admin from "firebase-admin";

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
      message: error.message || "Failed to submit case",
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
      message: error.message || "Failed to retrieve cases",
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
      message: error.message || "Failed to retrieve case",
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
      message: error.message || "Failed to retrieve cases",
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
      message: error.message || "Failed to retrieve attorneys",
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

    res.status(200).json({
      success: true,
      data: updatedCase,
      message: "Attorney assigned successfully",
    });
  } catch (error) {
    console.error("Assign attorney error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to assign attorney",
    });
  }
};

// Get dashboard stats (Admin)
export const getDashboardStats = async (req, res) => {
  try {
    const totalCases = await Case.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalAttorneys = await Attorney.countDocuments({ isVerified: true });
    const unassignedCases = await Case.countDocuments({ attorneyId: null });

    res.status(200).json({
      success: true,
      data: {
        totalCases,
        totalUsers,
        totalAttorneys,
        unassignedCases,
      },
      message: "Dashboard stats retrieved successfully",
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve dashboard stats",
    });
  }
};
