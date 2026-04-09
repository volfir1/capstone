import User from '../models/user.js';
import Event from '../models/events.js';
import ClientsInfo from '../models/clientsinfo.js';
import {
  createEventWithAccessToken,
  createEventWithRefreshToken,
  deleteEventWithRefreshToken,
  generateAuthUrl,
  getGoogleAccountEmailFromAccessToken,
  getTokensFromCode,
} from '../utils/googleCalendar.js';
import {
  createNotification,
  emitNotificationToProfile,
  listActiveProfilesByRoles,
} from './notificationController.js';
import {
  decodeGoogleOAuthState,
  encodeGoogleOAuthState,
  getActiveGoogleProfileFromRequest,
  resolveGoogleCalendarOwnerForEvent,
} from '../utils/googleProfile.js';

const GOOGLE_NOT_CONNECTED_ERROR = 'profile_google_not_connected';
const GOOGLE_NOT_CONNECTED_MESSAGE =
  'Connect Google Calendar for this profile before scheduling appointments.';

const isProduction = () => process.env.NODE_ENV === 'production';

const isLocalhostUrl = (value = '') =>
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(String(value || '').trim());

const resolveClientAppUrl = () => {
  const prodClientUrl = String(process.env.CLIENT_URL || '').trim();
  const localClientUrl = String(process.env.CLIENT_URL_LOCAL || '').trim();

  if (isProduction()) {
    return prodClientUrl || 'http://localhost:5173';
  }

  if (localClientUrl) {
    return localClientUrl;
  }

  if (isLocalhostUrl(prodClientUrl)) {
    return prodClientUrl;
  }

  return 'http://localhost:5173';
};

const clearProfileGoogleConnection = async (profile) => {
  if (!profile) return;

  profile.google = profile.google || {};
  profile.google.connected = false;
  profile.google.connectedEmail = '';
  profile.google.refreshToken = '';
  profile.google.accessToken = '';
  profile.google.tokenExpiry = null;
  profile.google.primaryCalendarId = 'primary';
  await profile.save();
};

const getProfileConnectionOrError = async (req, res) => {
  const activeProfile = await getActiveGoogleProfileFromRequest(req);
  if (!activeProfile) {
    res.status(409).json({
      error: 'profile-selection-required',
      message: 'Select a profile first.',
    });
    return null;
  }

  if (!activeProfile.google?.connected || !activeProfile.google?.refreshToken) {
    res.status(400).json({
      error: GOOGLE_NOT_CONNECTED_ERROR,
      message: GOOGLE_NOT_CONNECTED_MESSAGE,
    });
    return null;
  }

  return activeProfile;
};

export const getAuthUrl = async (req, res) => {
  try {
    const account = req.account;
    const activeProfile = req.activeProfile;
    const requestOrigin = String(req.get('origin') || '').trim();

    if (!account || !activeProfile?._id) {
      return res.status(409).json({
        error: 'profile-selection-required',
        message: 'Select a profile first.',
      });
    }

    const state = encodeGoogleOAuthState({
      accountId: account._id,
      profileId: activeProfile._id,
      clientUrl: requestOrigin,
    });

    const url = generateAuthUrl(state, {
      loginHint: activeProfile.google?.connectedEmail || account.email || '',
    });

    res.json({ url });
  } catch (err) {
    console.error('getAuthUrl error', err);
    res.status(500).json({ error: err.message });
  }
};

export const oauthCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code || !state) return res.status(400).send('Missing code or state');

    const decodedState = decodeGoogleOAuthState(state);
    if (!decodedState?.profileId || !decodedState?.accountId) {
      return res.status(400).send('Invalid Google Calendar connection state');
    }

    const [tokens, profile] = await Promise.all([
      getTokensFromCode(code),
      User.findOne({
        _id: decodedState.profileId,
        accountId: decodedState.accountId,
      }).select('+google.refreshToken +google.accessToken'),
    ]);

    if (!profile) {
      console.warn('oauthCallback profile not found for state', {
        accountId: decodedState.accountId,
        profileId: decodedState.profileId,
      });
      return res
        .status(404)
        .send('Profile not found for provided state. OAuth callback may be hitting a different backend environment.');
    }

    let connectedEmail = '';
    try {
      connectedEmail = await getGoogleAccountEmailFromAccessToken(tokens.access_token);
    } catch (emailError) {
      console.warn('Could not fetch Google account email:', emailError.message);
    }

    profile.google = profile.google || {};
    if (tokens.refresh_token) profile.google.refreshToken = tokens.refresh_token;
    if (tokens.access_token) profile.google.accessToken = tokens.access_token;
    if (tokens.expiry_date) profile.google.tokenExpiry = new Date(tokens.expiry_date);
    profile.google.connected = true;
    profile.google.connectedEmail = connectedEmail || profile.google.connectedEmail || '';
    profile.google.primaryCalendarId = profile.google.primaryCalendarId || 'primary';

    await profile.save();

    const clientUrl = decodedState.clientUrl || resolveClientAppUrl();
    return res.send(`<!DOCTYPE html>
<html><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Google Calendar Connected</title>
<meta http-equiv="refresh" content="3;url=${clientUrl}/admin/clientformstatus?google=connected">
<style>body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#FAF8F3;text-align:center;padding:20px}div{max-width:400px}.icon{font-size:64px;margin-bottom:16px}h2{color:#2C2C2C;margin:0 0 8px}p{color:#666;margin:4px 0;font-size:14px}</style>
</head><body><div>
<div class="icon">&#9989;</div>
<h2>Google Calendar Connected!</h2>
<p>This calendar is now linked to the selected staff profile.</p>
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

export const disconnectGoogleCalendar = async (req, res) => {
  try {
    const activeProfile = await getActiveGoogleProfileFromRequest(req);
    if (!activeProfile) {
      return res.status(409).json({
        error: 'profile-selection-required',
        message: 'Select a profile first.',
      });
    }

    await clearProfileGoogleConnection(activeProfile);

    res.json({
      success: true,
      data: {
        connected: false,
        connectedEmail: '',
        primaryCalendarId: 'primary',
      },
      message: 'Google Calendar disconnected for this profile.',
    });
  } catch (err) {
    console.error('disconnectGoogleCalendar error', err);
    res.status(500).json({ error: err.message });
  }
};

export const createEvent = async (req, res) => {
  try {
    const { event, accessToken } = req.body;
    console.log('google.createEvent request body:', { eventSummary: event?.summary });

    if (!event) {
      console.warn('google.createEvent missing event payload');
      return res.status(400).json({ error: 'event required' });
    }

    const googleProfile = await getProfileConnectionOrError(req, res);
    if (!googleProfile) return;

    let created;
    if (accessToken) {
      console.log('google.createEvent using provided accessToken');
      created = await createEventWithAccessToken(
        accessToken,
        googleProfile.google?.primaryCalendarId || 'primary',
        event
      );
    } else {
      created = await createEventWithRefreshToken(
        googleProfile.google.refreshToken,
        googleProfile.google.primaryCalendarId || 'primary',
        event
      );
    }

    res.json({ success: true, event: created });
  } catch (err) {
    console.error('createEvent error', err);
    res.status(500).json({ error: err.message });
  }
};

export const createEventAndRecord = async (req, res) => {
  try {
    const { event, meta, accessToken } = req.body;
    console.log('google.createEventAndRecord', {
      metaSummary: meta ? { appointmentId: meta.appointmentId, title: meta.title } : null,
    });

    if (!event) return res.status(400).json({ error: 'event required' });

    const googleProfile = await getProfileConnectionOrError(req, res);
    if (!googleProfile) return;

    // 1) Create event in the selected profile's Google Calendar
    let createdGoogleEvent;
    try {
      if (accessToken) {
        console.log('createEventAndRecord using provided accessToken');
        createdGoogleEvent = await createEventWithAccessToken(
          accessToken,
          googleProfile.google?.primaryCalendarId || 'primary',
          event
        );
      } else {
        createdGoogleEvent = await createEventWithRefreshToken(
          googleProfile.google.refreshToken,
          googleProfile.google.primaryCalendarId || 'primary',
          event
        );
      }
    } catch (gErr) {
      console.error('createEventAndRecord google api error', gErr?.message || gErr);
      const causeMessage = gErr?.cause?.message || gErr?.message || '';
      const errStr = (causeMessage + ' ' + (gErr?.message || '')).toLowerCase();

      if (errStr.includes('invalid_grant') || errStr.includes('token has been expired or revoked')) {
        try {
          await clearProfileGoogleConnection(googleProfile);
        } catch (_) {
          // best-effort
        }
        return res.status(401).json({
          error: 'google_reconnect_required',
          message: 'This profile Google Calendar connection expired. Please reconnect it.',
        });
      }

      if (errStr.includes('insufficient authentication scopes')) {
        return res.status(403).json({
          error: 'insufficient_scopes',
          message: 'Google access token missing calendar scopes. Re-consent required.',
        });
      }

      if (errStr.includes('has not been used in project') || errStr.includes('disabled')) {
        return res.status(422).json({
          error: 'api_not_enabled',
          message: 'Google Calendar API not enabled for the project that issued this token.',
        });
      }

      return res.status(500).json({
        error: 'google_api_error',
        message: gErr.message,
        details: gErr.cause || gErr.response?.data,
      });
    }

    // 2) Create system event in local DB
    const createdBy = req.activeProfile
      ? `${req.activeProfile.firstName || ''} ${req.activeProfile.lastName || ''}`.trim() ||
        req.activeProfile.email
      : googleProfile.email;
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
      googleCalendarProfileId: googleProfile._id,
      googleCalendarEmail: googleProfile.google?.connectedEmail || '',
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
      let person = await User.findOne({
        email: q,
        ...(req.account?._id ? { accountId: req.account._id } : {}),
      })
        .select('_id')
        .lean();
      if (person?._id) {
        const notification = await createNotification({
          recipientId: person._id.toString(),
          title: 'New Appointment Scheduled',
          message: `${savedEvent.title} on ${new Date(savedEvent.eventDate).toLocaleDateString()}`,
          type: 'appointment_created',
          referenceId: savedEvent._id.toString(),
        });
        if (notification) {
          emitNotificationToProfile(person._id.toString(), notification);
        }
      }
    }

    // 5) If the accepted appointment is for TODAY, notify secretaries and interns
    const eventDate = new Date(savedEvent.eventDate);
    const today = new Date();
    const isToday =
      eventDate.getFullYear() === today.getFullYear() &&
      eventDate.getMonth() === today.getMonth() &&
      eventDate.getDate() === today.getDate();

    if (isToday) {
      try {
        const clientName = savedEvent.clientName || 'A client';
        const staffUsers = await listActiveProfilesByRoles(['secretary', 'intern'], {
          accountId: req.account?._id || null,
        });
        for (const staffProfile of staffUsers) {
          const notification = await createNotification({
            recipientId: staffProfile._id.toString(),
            title: 'Interview Scheduled Today',
            message: `${clientName} has an interview today: "${savedEvent.title}".`,
            type: 'appointment_created',
            referenceId: savedEvent._id.toString(),
          });
          if (notification) {
            emitNotificationToProfile(staffProfile._id.toString(), notification);
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
    const { eventId, appointmentId, newDate, newTime } = req.body;

    if (!eventId || !newDate) {
      return res.status(400).json({ error: 'eventId and newDate are required' });
    }

    // 1) Find the local event
    const localEvent = await Event.findById(eventId);
    if (!localEvent) return res.status(404).json({ error: 'Event not found' });

    const oldDate = localEvent.eventDate;
    const newEventDate = new Date(newDate);

    // 2) Update Google Calendar if linked
    const googleEventId = localEvent.externalIds?.google;
    if (googleEventId) {
      const ownerConnection = await resolveGoogleCalendarOwnerForEvent(req, localEvent);

      if (!ownerConnection?.refreshToken) {
        return res.status(400).json({
          error: GOOGLE_NOT_CONNECTED_ERROR,
          message:
            'This appointment is linked to a Google Calendar that is no longer connected. Reconnect the owning profile first.',
        });
      }

      try {
        try {
          await deleteEventWithRefreshToken(
            ownerConnection.refreshToken,
            ownerConnection.primaryCalendarId || 'primary',
            googleEventId
          );
        } catch (delErr) {
          console.warn('Failed to delete old Google Calendar event:', delErr.message);
        }

        const pad = (n) => String(n).padStart(2, '0');
        const formatLocal = (d) =>
          `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;

        const rescheduleDateObj = new Date(newDate);
        if (newTime) {
          const tm = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(newTime);
          if (tm) {
            let rh = parseInt(tm[1], 10);
            const rap = tm[3].toUpperCase();
            if (rap === 'PM' && rh !== 12) rh += 12;
            if (rap === 'AM' && rh === 12) rh = 0;
            rescheduleDateObj.setHours(rh, parseInt(tm[2], 10), 0, 0);
          }
        }
        const reschEndDate = new Date(rescheduleDateObj.getTime() + 3600000);

        const newGoogleEvent = await createEventWithRefreshToken(
          ownerConnection.refreshToken,
          ownerConnection.primaryCalendarId || 'primary',
          {
            summary: localEvent.title,
            description: localEvent.description || '',
            start: { dateTime: formatLocal(rescheduleDateObj), timeZone: 'Asia/Manila' },
            end: { dateTime: formatLocal(reschEndDate), timeZone: 'Asia/Manila' },
            location: localEvent.location || '',
          }
        );

        localEvent.externalIds = { google: newGoogleEvent?.id || '' };
        if (ownerConnection.kind === 'profile' && ownerConnection.profile?._id) {
          localEvent.googleCalendarProfileId = ownerConnection.profile._id;
          localEvent.googleCalendarEmail = ownerConnection.profile.google?.connectedEmail || '';
        }
      } catch (gErr) {
        console.error('Google Calendar reschedule error:', gErr.message);
        const errStr = (gErr?.cause?.message || gErr?.message || '').toLowerCase();
        if (errStr.includes('invalid_grant') || errStr.includes('token has been expired or revoked')) {
          if (ownerConnection.kind === 'profile' && ownerConnection.profile) {
            try {
              await clearProfileGoogleConnection(ownerConnection.profile);
            } catch (_) {
              // best-effort
            }
          }
          return res.status(401).json({
            error: 'google_reconnect_required',
            message:
              'The Google Calendar connection for the profile that owns this event has expired. Please reconnect it.',
          });
        }
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
          const timeMatch = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(newTime);
          if (timeMatch) {
            let h = parseInt(timeMatch[1], 10);
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

    const oldDateStr = new Date(oldDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const newDateStr = newEventDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    if (appointmentId) {
      const clientInfo = await ClientsInfo.findById(appointmentId).select('firebaseUid').lean();
      if (clientInfo?.firebaseUid) {
        await createNotification({
          recipientId: clientInfo.firebaseUid,
          title: 'Appointment Rescheduled',
          message: `Your appointment "${localEvent.title}" has been rescheduled from ${oldDateStr} to ${newDateStr}${newTime ? ` at ${newTime}` : ''}.`,
          type: 'appointment_updated',
          referenceId: eventId,
        });
      }
    }

    res.json({ success: true, event: localEvent });
  } catch (err) {
    console.error('rescheduleEvent error:', err);
    res.status(500).json({ error: err.message });
  }
};
