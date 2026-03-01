import express from 'express'
import { createClientsInfo, listClientsInfo, getClientsInfoById, updateClientsInfo, deleteClientsInfo, createPublicAppointment, getAnalytics } from '../controller/clientsinfoController.js'
import { authenticateFirebaseToken } from '../firebase/authMiddleware.js'

const router = express.Router()

// ── Public routes (no auth) ──
router.post('/public-appointment', createPublicAppointment)
router.get('/public-schedules', (req, res, next) => {
  res.setHeader('Cache-Control', 'public, max-age=60');
  import('../controller/clientsinfoController.js').then(m => m.listPublicSchedules(req, res, next));
});

// ── Protected routes (auth required) ──
router.use(authenticateFirebaseToken)

router.post('/', createClientsInfo)
router.get('/analytics', getAnalytics)
router.get('/', listClientsInfo)
router.get('/:id', getClientsInfoById)
router.put('/:id', updateClientsInfo)
router.delete('/:id', deleteClientsInfo)

export default router
