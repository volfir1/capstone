import express from 'express';
import {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getEventsByDateRange,
} from '../controller/eventController.js';
import { authenticateFirebaseToken, requireProfilePin } from '../firebase/authMiddleware.js';

const router = express.Router();

// Apply Firebase authentication middleware to all routes.
router.use(authenticateFirebaseToken);
router.use(requireProfilePin);

// Event routes
router.post('/', createEvent);
router.get('/', getEvents);
router.get('/date-range', getEventsByDateRange);
router.get('/:id', getEventById);
router.put('/:id', updateEvent);
router.delete('/:id', deleteEvent);

export default router;
