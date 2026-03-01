import express from 'express'
import {
  upsertCaseRecord,
  getCaseRecord,
  listCaseRecords,
  updateCaseRecord,
  deleteCaseRecord,
  getCaseRecordByFinalizeId
} from '../controller/caseRecordController.js'
import { authenticateFirebaseToken } from '../firebase/authMiddleware.js'

const router = express.Router()

// All case record routes require authentication
router.use(authenticateFirebaseToken)

// Create or Update Case Record (by finalizeId)
router.put('/finalize/:finalizeId', upsertCaseRecord)

// Get Case Record by caseId (legacy)
router.get('/case/:caseId', getCaseRecord)

// Get Case Record by finalizeId
router.get('/finalize/:finalizeId', getCaseRecordByFinalizeId)

// Get All Case Records
router.get('/', listCaseRecords)

// Update Case Record by id
router.put('/:id', updateCaseRecord)

// Delete Case Record
router.delete('/:id', deleteCaseRecord)

export default router
