import express from 'express'
import { createFinalize, listFinalized, updateFinalized } from '../controller/finalizeController.js'

const router = express.Router()

router.post('/', createFinalize)
router.get('/', listFinalized)
router.put('/:id', updateFinalized)

export default router
