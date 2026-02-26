import express from 'express'
import {
  createCaseAssignment,
  getMyAssignments,
  getAssignedByMe,
  completeCaseAssignment,
  undoCaseAssignment,
  deleteCaseAssignment,
  getAdminStaff,
} from '../controller/caseAssignmentController.js'

const router = express.Router()

router.post('/', createCaseAssignment)
router.get('/mine', getMyAssignments)
router.get('/assigned-by-me', getAssignedByMe)
router.get('/admin-staff', getAdminStaff)
router.put('/:id/complete', completeCaseAssignment)
router.put('/:id/undo', undoCaseAssignment)
router.delete('/:id', deleteCaseAssignment)

export default router
