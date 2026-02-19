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

export function generateAuthUrl(state) {
  const oauth2Client = getOAuth2Client();
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
    state,
  });
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

  const res = await calendar.events.insert({
    calendarId,
    requestBody: event,
  });

  return res.data;
}
