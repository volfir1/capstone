import express from 'express'
import { createFinalize, listFinalized, updateFinalized, getFinalizeByCaseId, getFinalizeById, getFinalizedByUserId, completeFinalize, deleteFinalized } from '../controller/finalizeController.js'

const router = express.Router()

router.post('/', createFinalize)
router.get('/', listFinalized)
router.get('/case/:caseId', getFinalizeByCaseId)
router.get('/detail/:id', getFinalizeById)
router.get('/user/:userId', getFinalizedByUserId)
router.put('/:id', updateFinalized)
router.post('/:id/complete', completeFinalize)
router.delete('/:id', deleteFinalized)

export default router
