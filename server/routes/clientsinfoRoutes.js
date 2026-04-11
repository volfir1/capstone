import express from 'express'
import { createClientsInfo, listClientsInfo, getClientsInfoById, updateClientsInfo, deleteClientsInfo, createPublicAppointment, getAnalytics } from '../controller/clientsinfoController.js'
import { authenticateFirebaseToken, requireProfilePin } from '../firebase/authMiddleware.js'

const router = express.Router()

// ── Public routes (no auth) ──

// Public: POST /api/clientsinfo/public-appointment
router.post('/public-appointment', createPublicAppointment)

// Public: GET /api/clientsinfo/public-schedules
router.get('/public-schedules', (req, res, next) => {
  // Add a small cache-control header for efficiency
  res.setHeader('Cache-Control', 'public, max-age=60');
  import('../controller/clientsinfoController.js').then(m => m.listPublicSchedules(req, res, next));
});

// ── Protected routes (auth required) ──
router.use(authenticateFirebaseToken)
router.use(requireProfilePin)

// POST /api/clientsinfo
router.post('/', createClientsInfo)

// GET /api/clientsinfo/analytics
router.get('/analytics', getAnalytics)

// GET /api/clientsinfo (list all or filtered)
router.get('/', listClientsInfo)

// GET /api/clientsinfo/:id (get single by ID)
router.get('/:id', getClientsInfoById)

// PUT /api/clientsinfo/:id
router.put('/:id', updateClientsInfo)

// DELETE /api/clientsinfo/:id
router.delete('/:id', deleteClientsInfo)

export default router
