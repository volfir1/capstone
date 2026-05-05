import mongoose from 'mongoose';
import Account from '../models/account.js';
import User from '../models/user.js';

export const STAFF_ROLES = ['secretary', 'intern', 'director', 'supervising_lawyer'];
export const PROFILE_HEADER_NAME = 'x-profile-id';

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();
const cleanName = (value) => String(value || '').trim();
const normalizeRole = (value) => String(value || '').trim().toLowerCase();
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const buildExactCaseInsensitiveRegex = (value) => new RegExp(`^${escapeRegex(cleanName(value))}$`, 'i');

export const normalizeOptionalDate = (value, fieldName = 'date') => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${fieldName} must be a valid date`);
  }

  return date;
};

const copyLegacyAccountState = async (account) => {
  const legacyProfiles = await User.find({ firebaseUid: account.firebaseUid })
    .select('+google.refreshToken +google.accessToken pushTokens').sort({ createdAt: 1 })
    .lean();

  if (!legacyProfiles.length) {
    return;
  }

  let changed = false;

  if ((!account.pushTokens || account.pushTokens.length === 0)) {
    const mergedTokens = [...new Set(legacyProfiles.flatMap((profile) => profile.pushTokens || []))];
    if (mergedTokens.length) {
      account.pushTokens = mergedTokens;
      changed = true;
    }
  }

  if (!account.google?.connected) {
    const sourceProfile = legacyProfiles.find((profile) => profile.google?.connected);
    if (sourceProfile?.google) {
      account.google = {
        connected: !!sourceProfile.google.connected,
        connectedEmail: sourceProfile.google.connectedEmail || '',
        refreshToken: sourceProfile.google.refreshToken || '',
        accessToken: sourceProfile.google.accessToken || '',
        tokenExpiry: sourceProfile.google.tokenExpiry || null,
        primaryCalendarId: sourceProfile.google.primaryCalendarId || 'primary',
      };
      changed = true;
    }
  }

  if (account.google?.connected && !legacyProfiles.some((profile) => profile.google?.connected) && legacyProfiles[0]?._id) {
    await User.findByIdAndUpdate(legacyProfiles[0]._id, {
      $set: {
        'google.connected': true,
        'google.connectedEmail': account.google.connectedEmail || '',
        'google.refreshToken': account.google.refreshToken || '',
        'google.accessToken': account.google.accessToken || '',
        'google.tokenExpiry': account.google.tokenExpiry || null,
        'google.primaryCalendarId': account.google.primaryCalendarId || 'primary',
      },
    }).catch((error) => {
      console.warn('Could not migrate legacy account Google state to profile:', error.message);
    });
  }

  if (changed) {
    await account.save();
  }
};

export const ensureAccountForDecodedToken = async (decodedToken) => {
  if (!decodedToken?.uid) {
    throw new Error('Firebase token is missing a uid');
  }

  const email = normalizeEmail(decodedToken.email);
  const isVerified = !!decodedToken.email_verified;

  console.log(" Step 1: finding account for uid:", decodedToken.uid);
  
  let account = await Account.findOne({
    $or: [{ firebaseUid: decodedToken.uid }, ...(email ? [{ email }] : [])],
  }).select('+google.refreshToken +google.accessToken');

  console.log(" Step 2: account found:", account?._id || "null - will create");

  if (!account) {
    console.log(" Step 3: creating new account...");
    account = await Account.create({ email, firebaseUid: decodedToken.uid, isVerified });
    console.log(" Step 4: account created:", account._id);
    account = await Account.findById(account._id).select('+google.refreshToken +google.accessToken');
  }

  console.log(" Step 5: updating User records...");
  await User.updateMany(
    { firebaseUid: decodedToken.uid, $or: [{ accountId: { $exists: false } }, { accountId: null }] },
    { $set: { accountId: account._id, email: account.email, isVerified } }
  );

  console.log(" Step 6: copyLegacyAccountState...");
  await copyLegacyAccountState(account);
  
  console.log(" Step 7: done!");
  return account;
};

export const listProfilesForAccount = async (
  accountId,
  { includeDisabled = true, includeArchived = false } = {}
) => {
  const query = { accountId };
  if (!includeDisabled) {
    query.disabled = { $ne: true };
  }
  if (!includeArchived) {
    query.archivedAt = null;
  }

  return User.find(query).sort({ createdAt: 1, firstName: 1, lastName: 1 });
};

export const resolveActiveProfileForAccount = async (
  accountId,
  requestedProfileId,
  { allowFallback = false, includeDisabled = false, includeArchived = false } = {}
) => {
  const query = { accountId };
  if (!includeDisabled) {
    query.disabled = { $ne: true };
  }
  if (!includeArchived) {
    query.archivedAt = null;
  }

  if (requestedProfileId && mongoose.Types.ObjectId.isValid(requestedProfileId)) {
    const requested = await User.findOne({
      ...query,
      _id: requestedProfileId,
    });

    if (requested) {
      return requested;
    }
  }

  if (!allowFallback) {
    return null;
  }

  return User.findOne(query).sort({ createdAt: 1, firstName: 1, lastName: 1 });
};

export const serializeAccount = (account) => ({
  id: account?._id?.toString?.() || '',
  email: account?.email || '',
  firebaseUid: account?.firebaseUid || '',
  isVerified: !!account?.isVerified,
  createdAt: account?.createdAt || null,
  google: {
    connected: !!account?.google?.connected,
  },
  lastSelectedProfileId: account?.lastSelectedProfileId?.toString?.() || '',
});

export const serializeProfile = (profile, account = null) => ({
  id: profile?._id?.toString?.() || '',
  accountId:
    profile?.accountId?.toString?.() ||
    profile?.accountId ||
    account?._id?.toString?.() ||
    '',
  email: account?.email || profile?.email || '',
  firebaseUid: account?.firebaseUid || profile?.firebaseUid || '',
  firstName: profile?.firstName || '',
  lastName: profile?.lastName || '',
  username: profile?.username || '',
  role: profile?.role || '',
  isVerified: account?.isVerified ?? !!profile?.isVerified,
  createdAt: profile?.createdAt || null,
  startDate: profile?.startDate || null,
  endDate: profile?.endDate || null,
  archivedAt: profile?.archivedAt || null,
  archivedByProfileId:
    profile?.archivedByProfileId?.toString?.() ||
    profile?.archivedByProfileId ||
    '',
  restoredAt: profile?.restoredAt || null,
  restoredByProfileId:
    profile?.restoredByProfileId?.toString?.() ||
    profile?.restoredByProfileId ||
    '',
  profileImage: profile?.profileImage || '',
  signatureUrl: profile?.signatureUrl || '',
  disabled: !!profile?.disabled,
  pinEnabled: !!profile?.pinEnabled,
  pinResetRequired: !!profile?.pinResetRequired,
  pinLockedUntil: profile?.pinLockedUntil || null,
  google: {
    connected: !!profile?.google?.connected,
    connectedEmail: profile?.google?.connectedEmail || '',
    primaryCalendarId: profile?.google?.primaryCalendarId || 'primary',
  },
});

export const isStaffRole = (role) => STAFF_ROLES.includes(role);

export const assertUniqueStaffProfile = async (accountId, payload, excludeProfileId = null) => {
  const firstName = cleanName(payload?.firstName);
  const lastName = cleanName(payload?.lastName);
  const role = normalizeRole(payload?.role);

  if (!firstName || !lastName || !role) {
    return;
  }

  const query = {
    accountId,
    firstName: buildExactCaseInsensitiveRegex(firstName),
    lastName: buildExactCaseInsensitiveRegex(lastName),
    role,
    archivedAt: null,
  };

  if (excludeProfileId && mongoose.Types.ObjectId.isValid(excludeProfileId)) {
    query._id = { $ne: excludeProfileId };
  }

  const existingProfile = await User.findOne(query).select('_id disabled');
  if (existingProfile) {
    throw new Error('A profile with the same name and role already exists for this account.');
  }
};

export const createStaffProfileForAccount = async (account, payload) => {
  const firstName = cleanName(payload?.firstName);
  const lastName = cleanName(payload?.lastName);
  const role = normalizeRole(payload?.role);
  const username = cleanName(payload?.username);
  const startDate = normalizeOptionalDate(payload?.startDate, 'Start Date');
  const endDate = normalizeOptionalDate(payload?.endDate, 'End Date');

  if (!firstName || !lastName || !role) {
    throw new Error('firstName, lastName, and role are required');
  }

  if (startDate && endDate && startDate.getTime() > endDate.getTime()) {
    throw new Error('Start Date cannot be after End Date');
  }

  if (!isStaffRole(role)) {
    throw new Error(`Role must be one of: ${STAFF_ROLES.join(', ')}`);
  }

  await assertUniqueStaffProfile(account._id, { firstName, lastName, role });

  const profile = await User.create({
    accountId: account._id,
    email: account.email,
    firebaseUid: account.firebaseUid,
    firstName,
    lastName,
    role,
    username,
    startDate,
    endDate,
    isVerified: !!account.isVerified,
    disabled: false,
  });

  if (!account.lastSelectedProfileId) {
    account.lastSelectedProfileId = profile._id;
    await account.save();
  }

  return profile;
};

export const getRequestedProfileId = (req) => {
  const headerValue = req.headers?.[PROFILE_HEADER_NAME];
  return typeof headerValue === 'string' ? headerValue.trim() : '';
};

export const updateLastSelectedProfile = async (accountId, profileId) => {
  if (!mongoose.Types.ObjectId.isValid(accountId) || !mongoose.Types.ObjectId.isValid(profileId)) {
    return;
  }

  await Account.findByIdAndUpdate(accountId, { lastSelectedProfileId: profileId }).catch(() => { });
};

export const dedupeFirebaseRecipients = (profiles) => {
  const seen = new Set();
  const recipients = [];

  for (const profile of profiles) {
    const uid = profile?.firebaseUid;
    if (!uid || seen.has(uid)) {
      continue;
    }
    seen.add(uid);
    recipients.push(uid);
  }

  return recipients;
};

export const ensureMultiProfileIndexes = async () => {
  const legacyUniqueIndexes = ['email_1', 'firebaseUid_1', 'username_1'];

  try {
    const existingIndexes = await User.collection.indexes();
    for (const index of existingIndexes) {
      if (index.unique && legacyUniqueIndexes.includes(index.name)) {
        try {
          await User.collection.dropIndex(index.name);
          console.log(`Dropped legacy unique User index: ${index.name}`);
        } catch (error) {
          console.warn(`Could not drop legacy User index ${index.name}:`, error.message);
        }
      }
    }
  } catch (error) {
    console.warn('Could not inspect User indexes:', error.message);
  }

  await Promise.allSettled([Account.createIndexes(), User.createIndexes()]);
};
