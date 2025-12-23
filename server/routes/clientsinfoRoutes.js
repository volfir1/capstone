import express from 'express'
import { createClientsInfo, listClientsInfo, updateClientsInfo } from '../controller/clientsinfoController.js'

const router = express.Router()

// POST /api/clientsinfo
router.post('/', createClientsInfo)

// GET /api/clientsinfo
router.get('/', listClientsInfo)

// PUT /api/clientsinfo/:id
router.put('/:id', updateClientsInfo)

export default router
