import express from 'express';
import {
  clockIn,
  clockOut,
  getActiveTimeEntry,
  createTimeEntry,
  getTimeEntriesByIntern,
  getAllTimeEntries,
  approveTimeEntry,
  rejectTimeEntry,
  getInterns,
} from '../controller/timeEntryController.js';
import { authenticateFirebaseToken } from '../firebase/authMiddleware.js';

const router = express.Router();

// Clock in/out endpoints
router.post('/clock-in', authenticateFirebaseToken, clockIn);
router.post('/clock-out', authenticateFirebaseToken, clockOut);
router.get('/active/:internId', authenticateFirebaseToken, getActiveTimeEntry);

// Legacy/manual entry
router.post('/', authenticateFirebaseToken, createTimeEntry);
router.get('/intern/:internId', authenticateFirebaseToken, getTimeEntriesByIntern);
router.get('/', authenticateFirebaseToken, getAllTimeEntries);
router.put('/:id/approve', authenticateFirebaseToken, approveTimeEntry);
router.put('/:id/reject', authenticateFirebaseToken, rejectTimeEntry);

// Separate route for getting interns list (to avoid conflict with /intern/:internId)
router.get('/interns-list', authenticateFirebaseToken, getInterns);

export default router;
