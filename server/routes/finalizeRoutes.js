import express from 'express'
import { createFinalize, listFinalized, updateFinalized, getFinalizeByCaseId } from '../controller/finalizeController.js'

const router = express.Router()

router.post('/', createFinalize)
router.get('/', listFinalized)
router.get('/case/:caseId', getFinalizeByCaseId)
router.put('/:id', updateFinalized)

export default router
