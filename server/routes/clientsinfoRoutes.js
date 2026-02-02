import express from 'express'
import { createClientsInfo, listClientsInfo, getClientsInfoById, updateClientsInfo, createPublicAppointment } from '../controller/clientsinfoController.js'

const router = express.Router()

// POST /api/clientsinfo
router.post('/', createClientsInfo)

// Public: POST /api/clientsinfo/public-appointment
router.post('/public-appointment', createPublicAppointment)

// GET /api/clientsinfo (list all or filtered)
router.get('/', listClientsInfo)

// GET /api/clientsinfo/:id (get single by ID)
router.get('/:id', getClientsInfoById)

// PUT /api/clientsinfo/:id
router.put('/:id', updateClientsInfo)

export default router
