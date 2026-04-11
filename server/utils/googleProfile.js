import mongoose from 'mongoose';

import Account from '../models/account.js';
import User from '../models/user.js';

const GOOGLE_PROFILE_SELECT =
  '_id accountId email firstName lastName role google.connected google.connectedEmail google.primaryCalendarId +google.refreshToken +google.accessToken';
const GOOGLE_ACCOUNT_SELECT =
  'email firebaseUid google.connected google.primaryCalendarId +google.refreshToken +google.accessToken';

const normalizeClientUrl = (value = '') => {
  const raw = String(value || '').trim();
  if (!raw) return '';

  try {
    const parsed = new URL(raw);
    if (!['http:', 'https:'].includes(parsed.protocol)) return '';
    return parsed.origin;
  } catch (_) {
    return '';
  }
};

export const encodeGoogleOAuthState = ({ accountId, profileId, clientUrl = '' }) =>
  Buffer.from(
    JSON.stringify({
      accountId: String(accountId || '').trim(),
      profileId: String(profileId || '').trim(),
      clientUrl: normalizeClientUrl(clientUrl),
    }),
    'utf8'
  ).toString('base64url');

export const decodeGoogleOAuthState = (state) => {
  if (!state) return null;

  try {
    const parsed = JSON.parse(Buffer.from(String(state), 'base64url').toString('utf8'));
    return {
      accountId: String(parsed?.accountId || '').trim(),
      profileId: String(parsed?.profileId || '').trim(),
      clientUrl: normalizeClientUrl(parsed?.clientUrl || ''),
    };
  } catch (error) {
    return null;
  }
};

export const getGoogleProfileById = async (profileId, { accountId = null } = {}) => {
  if (!profileId || !mongoose.Types.ObjectId.isValid(profileId)) return null;

  return User.findOne({
    _id: profileId,
    ...(accountId ? { accountId } : {}),
  }).select(GOOGLE_PROFILE_SELECT);
};

export const getActiveGoogleProfileFromRequest = async (req) => {
  const activeProfileId = req.activeProfile?._id?.toString?.() || '';
  const accountId = req.account?._id || null;
  if (!activeProfileId) return null;
  return getGoogleProfileById(activeProfileId, { accountId });
};

export const resolveGoogleCalendarOwnerForEvent = async (req, event = null) => {
  const ownerProfileId = event?.googleCalendarProfileId?.toString?.() || '';
  const accountId = req.account?._id || null;

  if (ownerProfileId) {
    const ownerProfile = await getGoogleProfileById(ownerProfileId, { accountId });
    if (ownerProfile) {
      return {
        kind: 'profile',
        profile: ownerProfile,
        refreshToken: ownerProfile.google?.refreshToken || '',
        primaryCalendarId: ownerProfile.google?.primaryCalendarId || 'primary',
      };
    }

    return null;
  }

  const activeProfile = await getActiveGoogleProfileFromRequest(req);
  if (activeProfile?.google?.refreshToken) {
    return {
      kind: 'profile',
      profile: activeProfile,
      refreshToken: activeProfile.google.refreshToken,
      primaryCalendarId: activeProfile.google.primaryCalendarId || 'primary',
    };
  }

  const firebaseUid = req.account?.firebaseUid || '';
  if (!firebaseUid) return null;

  const account = await Account.findOne({ firebaseUid }).select(GOOGLE_ACCOUNT_SELECT);
  if (!account?.google?.refreshToken) return null;

  return {
    kind: 'account',
    account,
    refreshToken: account.google.refreshToken,
    primaryCalendarId: account.google.primaryCalendarId || 'primary',
  };
};
