import express from 'express';
import { getAuthUrl, oauthCallback, createEvent, createEventAndRecord, rescheduleEvent, disconnectGoogleCalendar } from '../controller/googleController.js';
import { authenticateFirebaseToken, requireProfilePin } from '../firebase/authMiddleware.js';

const router = express.Router();

// ── Public: Google OAuth2 callback (GET) ──
router.get('/callback', oauthCallback);

// ── Protected routes (auth required) ──
router.use(authenticateFirebaseToken);
router.use(requireProfilePin);

// Request an auth URL for the currently selected profile
router.post('/connect', getAuthUrl);
router.post('/disconnect', disconnectGoogleCalendar);

// Create an event for the currently selected profile
router.post('/events', createEvent);
// Atomic: create Google event, then create system event and update appointment record
router.post('/events/atomic', createEventAndRecord);
// Reschedule an accepted appointment for the calendar that owns the linked Google event
router.post('/events/reschedule', rescheduleEvent);

export default router;
