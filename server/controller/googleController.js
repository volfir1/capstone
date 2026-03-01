import User from '../models/user.js';
import { generateAuthUrl, getTokensFromCode, createEventWithRefreshToken, createEventWithAccessToken, updateEventWithRefreshToken, deleteEventWithRefreshToken } from '../utils/googleCalendar.js';
import Event from '../models/events.js';
import ClientsInfo from '../models/clientsinfo.js';
import { createNotification } from './notificationController.js';
import { getIO } from '../socket.js';

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

    // Show a success page that works for both website and mobile browsers.
    // Website users are auto-redirected; mobile users see the success message and can close the tab.
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    return res.send(`<!DOCTYPE html>
<html><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Google Calendar Connected</title>
<meta http-equiv="refresh" content="3;url=${clientUrl}/admin/clientformstatus?google=connected">
<style>body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#FAF8F3;text-align:center;padding:20px}div{max-width:400px}.icon{font-size:64px;margin-bottom:16px}h2{color:#2C2C2C;margin:0 0 8px}p{color:#666;margin:4px 0;font-size:14px}</style>
</head><body><div>
<div class="icon">&#9989;</div>
<h2>Google Calendar Connected!</h2>
<p>You can now close this window and return to the app.</p>
<p style="margin-top:16px;font-size:12px;color:#999">Website users will be redirected automatically&hellip;</p>
</div></body></html>`);
  } catch (err) {
    console.error('oauthCallback error', err);
    return res.send(`<!DOCTYPE html>
<html><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Connection Failed</title>
<style>body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#FAF8F3;text-align:center;padding:20px}div{max-width:400px}.icon{font-size:64px;margin-bottom:16px}h2{color:#2C2C2C;margin:0 0 8px}p{color:#666;margin:4px 0;font-size:14px}</style>
</head><body><div>
<div class="icon">&#10060;</div>
<h2>Connection Failed</h2>
<p>Google Calendar connection failed. Please go back to the app and try again.</p>
</div></body></html>`);
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
      const errStr = (causeMessage + ' ' + (gErr?.message || '')).toLowerCase();

      if (errStr.includes('invalid_grant') || errStr.includes('token has been expired or revoked')) {
        // Clear stale tokens so the user can reconnect cleanly
        try {
          await User.findOneAndUpdate({ firebaseUid }, {
            'google.connected': false,
            'google.refreshToken': null,
            'google.accessToken': null,
            'google.tokenExpiry': null,
          });
        } catch (_) { /* best-effort */ }
        return res.status(401).json({ error: 'google_reconnect_required', message: 'Google Calendar connection expired. Please reconnect your Google account.' });
      }

      if (errStr.includes('insufficient authentication scopes')) {
        return res.status(403).json({ error: 'insufficient_scopes', message: 'Google access token missing calendar scopes. Re-consent required.' });
      }

      if (errStr.includes('has not been used in project') || errStr.includes('disabled')) {
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
      eventDate: event.start?.dateTime || event.start?.date || meta?.eventDate,
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

    // 5) If the accepted appointment is for TODAY, notify secretaries and interns
    const eventDate = new Date(savedEvent.eventDate);
    const today = new Date();
    const isToday = eventDate.getFullYear() === today.getFullYear() &&
      eventDate.getMonth() === today.getMonth() &&
      eventDate.getDate() === today.getDate();

    if (isToday) {
      try {
        const clientName = savedEvent.clientName || 'A client';
        const io = getIO();
        // Notify all secretaries and interns
        const staffUsers = await User.find({ role: { $in: ['secretary', 'intern'] } }).select('firebaseUid').lean();
        for (const staff of staffUsers) {
          if (staff.firebaseUid) {
            const notification = await createNotification({
              recipientId: staff.firebaseUid,
              title: 'Interview Scheduled Today',
              message: `${clientName} has an interview today: "${savedEvent.title}".`,
              type: 'appointment_created',
              referenceId: savedEvent._id.toString(),
            });
            if (io && notification) {
              io.to(staff.firebaseUid).emit('new-notification', notification);
            }
          }
        }
      } catch (notifErr) {
        console.warn('Failed to send today-interview notifications:', notifErr.message);
      }
    }

    res.json({ success: true, event: savedEvent, google: createdGoogleEvent });
  } catch (err) {
    console.error('createEventAndRecord error', err);
    res.status(500).json({ error: err.message });
  }
};

// Reschedule an accepted appointment: update local event, clientsinfo, and Google Calendar
export const rescheduleEvent = async (req, res) => {
  try {
    const { firebaseUid, eventId, appointmentId, newDate, newTime } = req.body;

    if (!firebaseUid || !eventId || !newDate) {
      return res.status(400).json({ error: 'firebaseUid, eventId, and newDate are required' });
    }

    const user = await User.findOne({ firebaseUid });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // 1) Find the local event
    const localEvent = await Event.findById(eventId);
    if (!localEvent) return res.status(404).json({ error: 'Event not found' });

    const oldDate = localEvent.eventDate;
    const newEventDate = new Date(newDate);

    // 2) Update Google Calendar if linked
    const googleEventId = localEvent.externalIds?.google;
    if (googleEventId && user.google?.refreshToken) {
      try {
        // Delete old Google event and create new one
        try {
          await deleteEventWithRefreshToken(
            user.google.refreshToken,
            user.google.primaryCalendarId || 'primary',
            googleEventId
          );
        } catch (delErr) {
          console.warn('Failed to delete old Google Calendar event:', delErr.message);
        }

        // Create new Google event with updated time
        const endDate = new Date(newEventDate.getTime() + 3600000); // 1 hour duration

        // Build a local datetime string (without UTC offset) for Asia/Manila timezone
        const pad = (n) => String(n).padStart(2, '0');
        const formatLocal = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;

        // Parse the time from the request to set correct hours on the date
        const rescheduleDateObj = new Date(newDate);
        if (newTime) {
          const tm = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(newTime);
          if (tm) {
            let rh = parseInt(tm[1]);
            const rap = tm[3].toUpperCase();
            if (rap === 'PM' && rh !== 12) rh += 12;
            if (rap === 'AM' && rh === 12) rh = 0;
            rescheduleDateObj.setHours(rh, parseInt(tm[2]), 0, 0);
          }
        }
        const reschEndDate = new Date(rescheduleDateObj.getTime() + 3600000);

        const newGoogleEvent = await createEventWithRefreshToken(
          user.google.refreshToken,
          user.google.primaryCalendarId || 'primary',
          {
            summary: localEvent.title,
            description: localEvent.description || '',
            start: { dateTime: formatLocal(rescheduleDateObj), timeZone: 'Asia/Manila' },
            end: { dateTime: formatLocal(reschEndDate), timeZone: 'Asia/Manila' },
            location: localEvent.location || '',
          }
        );

        // Update the external Google ID on the local event
        localEvent.externalIds = { google: newGoogleEvent?.id || '' };
      } catch (gErr) {
        console.error('Google Calendar reschedule error:', gErr.message);
        const errStr = (gErr?.cause?.message || gErr?.message || '').toLowerCase();
        if (errStr.includes('invalid_grant') || errStr.includes('token has been expired or revoked')) {
          try {
            await User.findOneAndUpdate({ firebaseUid }, {
              'google.connected': false,
              'google.refreshToken': null,
              'google.accessToken': null,
              'google.tokenExpiry': null,
            });
          } catch (_) { /* best-effort */ }
          return res.status(401).json({ error: 'google_reconnect_required', message: 'Google Calendar connection expired. Please reconnect your Google account.' });
        }
        // Continue even if Google Calendar update fails for other errors
      }
    }

    // 3) Update local event
    localEvent.eventDate = newEventDate;
    localEvent.status = 'rescheduled';
    if (newTime) localEvent.appointmentTime = newTime;
    await localEvent.save();

    // 4) Update ClientsInfo if linked
    if (appointmentId) {
      try {
        const updatePayload = { appointedDate: newEventDate };
        if (newTime) {
          // Convert display time like "09:00 AM" to "09:00" for storage
          const timeMatch = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(newTime);
          if (timeMatch) {
            let h = parseInt(timeMatch[1]);
            const m = timeMatch[2];
            const ampm = timeMatch[3].toUpperCase();
            if (ampm === 'PM' && h !== 12) h += 12;
            if (ampm === 'AM' && h === 12) h = 0;
            updatePayload.appointmentTime = `${String(h).padStart(2, '0')}:${m}`;
          } else {
            updatePayload.appointmentTime = newTime;
          }
        }
        await ClientsInfo.findByIdAndUpdate(appointmentId, updatePayload);
      } catch (e) {
        console.warn('Failed to update ClientsInfo during reschedule:', e.message);
      }
    }

    // 5) Send notifications about reschedule
    const io = getIO();
    const oldDateStr = new Date(oldDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const newDateStr = newEventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const clientName = localEvent.clientName || 'A client';

    // Notify client
    if (appointmentId) {
      const clientInfo = await ClientsInfo.findById(appointmentId).select('firebaseUid').lean();
      if (clientInfo?.firebaseUid) {
        const notification = await createNotification({
          recipientId: clientInfo.firebaseUid,
          title: 'Appointment Rescheduled',
          message: `Your appointment "${localEvent.title}" has been rescheduled from ${oldDateStr} to ${newDateStr}${newTime ? ` at ${newTime}` : ''}.`,
          type: 'appointment_updated',
          referenceId: eventId,
        });
        if (io && notification) io.to(clientInfo.firebaseUid).emit('new-notification', notification);
      }
    }

    res.json({ success: true, event: localEvent });
  } catch (err) {
    console.error('rescheduleEvent error:', err);
    res.status(500).json({ error: err.message });
  }
};
