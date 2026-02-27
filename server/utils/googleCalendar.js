import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirect = process.env.GOOGLE_REDIRECT_URI; // e.g. https://your-server.com/api/google/callback

  if (!clientId || !clientSecret || !redirect) {
    throw new Error('Google OAuth client credentials are not configured in environment variables');
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirect);
}

export function generateAuthUrl(state, loginHint) {
  const oauth2Client = getOAuth2Client();
  const opts = {
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
    state,
  };
  if (loginHint) opts.login_hint = loginHint;
  const url = oauth2Client.generateAuthUrl(opts);
  return url;
}

export async function getTokensFromCode(code) {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

export async function createEventWithRefreshToken(refreshToken, calendarId = 'primary', event = {}) {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  // Ensure an end time exists when only start is provided. Default duration: 30 minutes.
  try {
    if (event && event.start && !event.end) {
      const startDT = event.start.dateTime || event.start.date;
      if (startDT) {
        const startDate = new Date(startDT);
        if (!Number.isNaN(startDate.getTime())) {
          const endDate = new Date(startDate.getTime() + 30 * 60000);
          event.end = { dateTime: endDate.toISOString(), timeZone: event.start.timeZone || 'Asia/Manila' };
        }
      }
    }
  } catch (e) {
    // If parsing fails, proceed without modifying the event and let Google API return an error.
    console.warn('Failed to auto-populate event.end from start:', e?.message || e);
  }

  const res = await calendar.events.insert({
    calendarId,
    requestBody: event,
  });

  return res.data;
}

export async function createEventWithAccessToken(accessToken, calendarId = 'primary', event = {}) {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  // Ensure an end time exists when only start is provided. Default duration: 30 minutes.
  try {
    if (event && event.start && !event.end) {
      const startDT = event.start.dateTime || event.start.date;
      if (startDT) {
        const startDate = new Date(startDT);
        if (!Number.isNaN(startDate.getTime())) {
          const endDate = new Date(startDate.getTime() + 30 * 60000);
          event.end = { dateTime: endDate.toISOString(), timeZone: event.start.timeZone || 'Asia/Manila' };
        }
      }
    }
  } catch (e) {
    console.warn('Failed to auto-populate event.end from start:', e?.message || e);
  }

  const res = await calendar.events.insert({
    calendarId,
    requestBody: event,
  });

  return res.data;
}

export async function updateEventWithRefreshToken(refreshToken, calendarId = 'primary', eventId, event = {}) {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const res = await calendar.events.update({
    calendarId,
    eventId,
    requestBody: event,
  });

  return res.data;
}

export async function deleteEventWithRefreshToken(refreshToken, calendarId = 'primary', eventId) {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  await calendar.events.delete({
    calendarId,
    eventId,
  });

  return true;
}
