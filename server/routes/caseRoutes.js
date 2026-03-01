import express from "express";
import { 
  submitCase, 
  getUserCases, 
  getCaseById, 
  getAllCases, 
  getAllAttorneys, 
  assignAttorney,
  getDashboardStats,
  getAttorneyCases,
  createCaseForUser
} from "../controller/caseController.js";
import { authenticateFirebaseToken } from '../firebase/authMiddleware.js';

const router = express.Router();

// All case routes require authentication
router.use(authenticateFirebaseToken);

// Submit a new case
router.post("/submit", submitCase);

// Get all cases for logged-in user
router.get("/user-cases", getUserCases);

// Get all cases for logged-in attorney
router.get("/attorney-cases", getAttorneyCases);

// Get a specific case by ID
router.get("/:caseId", getCaseById);

// Admin routes
router.get("/admin/all-cases", getAllCases);
router.get("/admin/attorneys", getAllAttorneys);
router.get("/admin/stats", getDashboardStats);
router.put("/admin/assign/:caseId", assignAttorney);
router.post("/admin/create-case", createCaseForUser);

export default router;
