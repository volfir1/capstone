import User from '../models/user.js';
import { generateAuthUrl, getTokensFromCode, createEventWithRefreshToken, createEventWithAccessToken } from '../utils/googleCalendar.js';
import Event from '../models/events.js';
import ClientsInfo from '../models/clientsinfo.js';
import { createNotification } from './notificationController.js';

export const getAuthUrl = async (req, res) => {
  try {
    const { firebaseUid } = req.body;
    if (!firebaseUid) return res.status(400).json({ error: 'firebaseUid required in body' });

    // Use firebaseUid as state so we can link in callback
    const url = generateAuthUrl(firebaseUid);
    res.json({ url });
  } catch (err) {
    console.error('getAuthUrl error', err);
    res.status(500).json({ error: err.message });
  }
};

export const oauthCallback = async (req, res) => {
  try {
    const { code, state } = req.query; // state should be firebaseUid
    if (!code || !state) return res.status(400).send('Missing code or state');

    const tokens = await getTokensFromCode(code);

    const user = await User.findOne({ firebaseUid: state });
    if (!user) return res.status(404).send('User not found for provided state');

    user.google = user.google || {};
    if (tokens.refresh_token) user.google.refreshToken = tokens.refresh_token;
    if (tokens.access_token) user.google.accessToken = tokens.access_token;
    if (tokens.expiry_date) user.google.tokenExpiry = new Date(tokens.expiry_date);
    user.google.connected = true;
    user.google.primaryCalendarId = user.google.primaryCalendarId || 'primary';

    await user.save();

    // Redirect back to client appointments page with success — client should display connected status
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    // Appointments page route in the client is /admin/clientformstatus
    return res.redirect(`${clientUrl}/admin/clientformstatus?google=connected`);
  } catch (err) {
    console.error('oauthCallback error', err);
    res.status(500).send('Google OAuth callback failed');
  }
};

export const createEvent = async (req, res) => {
  try {
    const { firebaseUid, event, accessToken } = req.body;
    console.log('google.createEvent request body:', { firebaseUid, eventSummary: event?.summary });

    if (!firebaseUid || !event) {
      console.warn('google.createEvent missing params', { firebaseUidPresent: !!firebaseUid, eventPresent: !!event });
      return res.status(400).json({ error: 'firebaseUid and event required' });
    }

    const user = await User.findOne({ firebaseUid });
    if (!user) {
      console.warn('google.createEvent user not found for firebaseUid', firebaseUid);
      return res.status(404).json({ error: 'User not found for provided firebaseUid' });
    }

    console.log('google.createEvent user.google:', user.google ? {
      connected: user.google.connected,
      hasRefreshToken: !!user.google.refreshToken,
      primaryCalendarId: user.google.primaryCalendarId,
    } : null);

    // Prefer an access token provided by the client (from Firebase Google sign-in). Fallback to stored refresh token.
    let created;
    if (accessToken) {
      console.log('google.createEvent using provided accessToken');
      created = await createEventWithAccessToken(accessToken, user.google?.primaryCalendarId || 'primary', event);
    } else {
      if (!user.google || !user.google.connected || !user.google.refreshToken) {
        return res.status(400).json({ error: 'User has not connected Google Calendar', details: 'missing google refresh token or not connected' });
      }

      created = await createEventWithRefreshToken(user.google.refreshToken, user.google.primaryCalendarId || 'primary', event);
    }

    // Optionally save the last event id or update user state
    res.json({ success: true, event: created });
  } catch (err) {
    console.error('createEvent error', err);
    res.status(500).json({ error: err.message });
  }
};

export const createEventAndRecord = async (req, res) => {
  try {
    const { firebaseUid, event, meta, accessToken } = req.body;
    console.log('google.createEventAndRecord', { firebaseUid, metaSummary: meta ? { appointmentId: meta.appointmentId, title: meta.title } : null });

    if (!firebaseUid || !event) return res.status(400).json({ error: 'firebaseUid and event required' });

    const user = await User.findOne({ firebaseUid });
    // If accessToken provided by client, use it. Otherwise require stored refresh token.
    if (!accessToken && (!user || !user.google || !user.google.connected || !user.google.refreshToken)) {
      return res.status(400).json({ error: 'User has not connected Google Calendar' });
    }

    // 1) Create event in user's Google Calendar
    let createdGoogleEvent;
    try {
      if (accessToken) {
        console.log('createEventAndRecord using provided accessToken');
        createdGoogleEvent = await createEventWithAccessToken(accessToken, user?.google?.primaryCalendarId || 'primary', event);
      } else {
        createdGoogleEvent = await createEventWithRefreshToken(user.google.refreshToken, user.google.primaryCalendarId || 'primary', event);
      }
    } catch (gErr) {
      console.error('createEventAndRecord google api error', gErr?.message || gErr);
      // Map common Google API issues to actionable responses for the client
      const causeMessage = gErr?.cause?.message || gErr?.message || '';

      if (causeMessage.toLowerCase().includes('insufficient authentication scopes')) {
        return res.status(403).json({ error: 'insufficient_scopes', message: 'Google access token missing calendar scopes. Re-consent required.' });
      }

      if (causeMessage.toLowerCase().includes('has not been used in project') || causeMessage.toLowerCase().includes('disabled')) {
        return res.status(422).json({ error: 'api_not_enabled', message: 'Google Calendar API not enabled for the project that issued this token.' });
      }

      // Generic Google API error
      return res.status(500).json({ error: 'google_api_error', message: gErr.message, details: gErr.cause || gErr.response?.data });
    }

    // 2) Create system event in local DB
    const createdBy = user.email || user.username || firebaseUid;
    const newEvent = new Event({
      title: meta?.title || event.summary || 'Appointment',
      description: meta?.description || event.description || '',
      eventDate: meta?.eventDate || event.start?.dateTime || event.start?.date,
      eventType: meta?.eventType || 'appointment',
      location: meta?.location || event.location || '',
      clientName: meta?.clientName || '',
      assignedTo: meta?.assignedTo || '',
      status: meta?.status || 'scheduled',
      priority: meta?.priority || 'Medium',
      createdBy,
      externalIds: { google: createdGoogleEvent?.id },
    });

    const savedEvent = await newEvent.save();

    // 3) Optionally update ClientsInfo if appointmentId provided
    if (meta?.appointmentId) {
      try {
        await ClientsInfo.findByIdAndUpdate(meta.appointmentId, {
          calendarRecorded: true,
          calendarEventId: savedEvent._id.toString(),
          calendarRecordedAt: new Date(),
          calendarRecordedBy: createdBy,
        });
      } catch (e) {
        console.warn('Failed to update ClientsInfo after creating event', e.message);
      }
    }

    // 4) Send notifications similar to eventController
    if (savedEvent.assignedTo) {
      const q = savedEvent.assignedTo.trim();
      let person = await User.findOne({ email: q }).select('firebaseUid').lean();
      if (person?.firebaseUid) {
        createNotification({ recipientId: person.firebaseUid, title: 'New Appointment Scheduled', message: `${savedEvent.title} on ${new Date(savedEvent.eventDate).toLocaleDateString()}`, type: 'appointment_created', referenceId: savedEvent._id.toString() });
      }
    }

    res.json({ success: true, event: savedEvent, google: createdGoogleEvent });
  } catch (err) {
    console.error('createEventAndRecord error', err);
    res.status(500).json({ error: err.message });
  }
};
