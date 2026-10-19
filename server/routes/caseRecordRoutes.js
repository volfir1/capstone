import express from 'express'
import {
  upsertCaseRecord,
  getCaseRecord,
  listCaseRecords,
  updateCaseRecord,
  deleteCaseRecord,
  getCaseRecordByFinalizeId,
  getBulkCaseRecordsByFinalizeIds,
  getEvidenceByFinalizeId,
  uploadDraft,
  listDrafts,
  deleteDraft
} from '../controller/caseRecordController.js'
import { authenticateFirebaseToken, requireProfilePin } from '../firebase/authMiddleware.js'
import upload from '../config/multerConfig.js'

const router = express.Router()

// All case record routes require authentication
router.use(authenticateFirebaseToken)
router.use(requireProfilePin)

// Bulk-check which finalizeIds have a case record — must be BEFORE the /:finalizeId param route
router.post('/finalize/bulk', getBulkCaseRecordsByFinalizeIds)

// Get Evidence only by finalizeId (for performance) - must be BEFORE the general /finalize/:finalizeId route
router.get('/finalize/:finalizeId/evidence', getEvidenceByFinalizeId)

// Drafts routes
router.post('/finalize/:finalizeId/drafts', uploadDraft)
router.get('/finalize/:finalizeId/drafts', listDrafts)
router.delete('/finalize/:finalizeId/drafts/:draftId', deleteDraft)

// Create or Update Case Record (by finalizeId) - this is the main route used by the frontend
router.put('/finalize/:finalizeId', upsertCaseRecord)

// Get Case Record by finalizeId
router.get('/finalize/:finalizeId', getCaseRecordByFinalizeId)

// Get Case Record by caseId (legacy)
router.get('/case/:caseId', getCaseRecord)

// Get All Case Records
router.get('/', listCaseRecords)

// Update Case Record by id (legacy)
router.put('/:id', updateCaseRecord)

// Delete Case Record
router.delete('/:id', deleteCaseRecord)

export default router
