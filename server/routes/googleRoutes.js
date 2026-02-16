import express from 'express';
import { getAuthUrl, oauthCallback, createEvent, createEventAndRecord } from '../controller/googleController.js';

const router = express.Router();

// Request an auth URL for the current user (body: { firebaseUid })
router.post('/connect', getAuthUrl);

// Google OAuth2 callback (GET)
router.get('/callback', oauthCallback);

// Create event for user (body: { firebaseUid, event })
// Create event for user (body: { firebaseUid, event })
router.post('/events', createEvent);
// Atomic: create Google event, then create system event and update appointment record
router.post('/events/atomic', createEventAndRecord);

export default router;
