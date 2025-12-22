import express from 'express'
import { createFinalize, listFinalized } from '../controller/finalizeController.js'

const router = express.Router()

router.post('/', createFinalize)
router.get('/', listFinalized)

export default router
