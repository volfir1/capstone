import express from 'express';
import { getAuthUrl, oauthCallback, createEvent, createEventAndRecord, rescheduleEvent, checkGoogleStatus } from '../controller/googleController.js';
import { authenticateFirebaseToken } from '../firebase/authMiddleware.js';

const router = express.Router();

// Google OAuth2 callback must be public (Google redirects here)
router.get('/callback', oauthCallback);

// All other Google routes require authentication
router.use(authenticateFirebaseToken);

// Live-check Google Calendar connection status
router.get('/status', checkGoogleStatus);

// Request an auth URL for the current user (body: { firebaseUid })
router.post('/connect', getAuthUrl);

// Create event for user (body: { firebaseUid, event })
// Create event for user (body: { firebaseUid, event })
router.post('/events', createEvent);
// Atomic: create Google event, then create system event and update appointment record
router.post('/events/atomic', createEventAndRecord);
// Reschedule an accepted appointment (body: { firebaseUid, eventId, appointmentId, newDate, newTime })
router.post('/events/reschedule', rescheduleEvent);

export default router;
