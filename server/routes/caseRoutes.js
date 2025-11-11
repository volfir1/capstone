import express from "express";
import { 
  submitCase, 
  getUserCases, 
  getCaseById, 
  getAllCases, 
  getAllAttorneys, 
  assignAttorney,
  getDashboardStats 
} from "../controller/caseController.js";

const router = express.Router();

// Submit a new case
router.post("/submit", submitCase);

// Get all cases for logged-in user
router.get("/user-cases", getUserCases);

// Get a specific case by ID
router.get("/:caseId", getCaseById);

// Admin routes
router.get("/admin/all-cases", getAllCases);
router.get("/admin/attorneys", getAllAttorneys);
router.get("/admin/stats", getDashboardStats);
router.put("/admin/assign/:caseId", assignAttorney);

export default router;
