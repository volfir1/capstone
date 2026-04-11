import { google } from 'googleapis';

const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/userinfo.email',
];

const isProduction = () => process.env.NODE_ENV === 'production';

const isLocalhostUrl = (value = '') =>
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(String(value || '').trim());

function resolveOAuthCredentials() {
  const prodClientId = String(process.env.GOOGLE_CLIENT_ID || '').trim();
  const prodClientSecret = String(process.env.GOOGLE_CLIENT_SECRET || '').trim();

  if (!isProduction()) {
    const localClientId = String(process.env.GOOGLE_CLIENT_ID_LOCAL || '').trim();
    const localClientSecret = String(process.env.GOOGLE_CLIENT_SECRET_LOCAL || '').trim();
    if (localClientId && localClientSecret) {
      return {
        clientId: localClientId,
        clientSecret: localClientSecret,
      };
    }
  }

  return {
    clientId: prodClientId,
    clientSecret: prodClientSecret,
  };
}

function resolveRedirectUri() {
  const prodRedirect = String(process.env.GOOGLE_REDIRECT_URI || '').trim();
  const localRedirect = String(process.env.GOOGLE_REDIRECT_URI_LOCAL || '').trim();

  if (isProduction()) {
    return prodRedirect;
  }

  if (localRedirect) {
    return localRedirect;
  }

  if (isLocalhostUrl(prodRedirect)) {
    return prodRedirect;
  }

  const port = String(process.env.PORT || '5000').trim();
  return `http://localhost:${port}/api/google/callback`;
}

function getOAuth2Client() {
  const { clientId, clientSecret } = resolveOAuthCredentials();
  const redirect = resolveRedirectUri(); // e.g. https://your-server.com/api/google/callback

  if (!clientId || !clientSecret || !redirect) {
    throw new Error('Google OAuth client credentials are not configured in environment variables');
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirect);
}

export function generateAuthUrl(state, options = {}) {
  const oauth2Client = getOAuth2Client();
  const { loginHint = '', prompt = 'consent select_account' } = options;
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt,
    scope: SCOPES,
    state,
    ...(loginHint ? { login_hint: loginHint } : {}),
  });
  return url;
}

export async function getTokensFromCode(code) {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

export async function getGoogleAccountEmailFromAccessToken(accessToken) {
  if (!accessToken) return '';

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });

  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
  const res = await oauth2.userinfo.get();
  return res?.data?.email || '';
}

// Fetch the timezone of the user's calendar so we can send events in their local time
async function getCalendarTimeZone(calendar, calendarId = 'primary') {
  try {
    const res = await calendar.calendars.get({ calendarId });
    return res.data.timeZone || null;
  } catch (e) {
    console.warn('Could not fetch calendar timezone:', e.message);
    return null;
  }
}

// Override event start/end timeZone to match the user's calendar timezone
// so a bare datetime like "T14:30:00" is always interpreted as 2:30 PM in *their* calendar
function patchEventTimezone(event, calendarTz) {
  if (!calendarTz) return event;
  const patched = { ...event };
  if (patched.start) patched.start = { ...patched.start, timeZone: calendarTz };
  if (patched.end) patched.end = { ...patched.end, timeZone: calendarTz };
  return patched;
}

export async function createEventWithRefreshToken(refreshToken, calendarId = 'primary', event = {}) {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  // Use the calendar's own timezone so the displayed time matches the intended time
  const calTz = await getCalendarTimeZone(calendar, calendarId);
  const patchedEvent = patchEventTimezone(event, calTz);

  const res = await calendar.events.insert({
    calendarId,
    requestBody: patchedEvent,
  });

  return res.data;
}

export async function createEventWithAccessToken(accessToken, calendarId = 'primary', event = {}) {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const calTz = await getCalendarTimeZone(calendar, calendarId);
  const patchedEvent = patchEventTimezone(event, calTz);

  const res = await calendar.events.insert({
    calendarId,
    requestBody: patchedEvent,
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
