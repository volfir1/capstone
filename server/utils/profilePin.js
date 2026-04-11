import crypto from 'crypto';

export const PROFILE_PIN_HEADER_NAME = 'x-profile-pin-token';
export const PROFILE_PIN_MAX_ATTEMPTS = 5;
export const PROFILE_PIN_LOCK_MINUTES = 15;
export const PROFILE_PIN_SESSION_HOURS = 12;
export const PROFILE_PIN_REGEX = /^\d{4,6}$/;

const getTokenSecret = () =>
  process.env.PROFILE_PIN_TOKEN_SECRET ||
  process.env.SESSION_SECRET ||
  process.env.FIREBASE_PRIVATE_KEY ||
  `${process.env.FIREBASE_CLIENT_EMAIL || 'capstone'}:${process.env.FIREBASE_PROJECT_ID || 'local'}`;

const signEncodedPayload = (encodedPayload) =>
  crypto
    .createHmac('sha256', getTokenSecret())
    .update(encodedPayload)
    .digest('base64url');

const getPinChangedTimestamp = (profile) => {
  if (!profile?.pinLastChangedAt) {
    return 0;
  }

  const timestamp = new Date(profile.pinLastChangedAt).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
};

export const validateProfilePin = (pin) => {
  const normalizedPin = String(pin || '').trim();
  if (!PROFILE_PIN_REGEX.test(normalizedPin)) {
    throw new Error('PIN must be 4 to 6 digits.');
  }

  return normalizedPin;
};

export const hashProfilePin = (pin) => {
  const normalizedPin = validateProfilePin(pin);
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(normalizedPin, salt, 64).toString('hex');
  return `${salt}:${derivedKey}`;
};

export const verifyProfilePinHash = (pin, storedHash) => {
  const normalizedPin = String(pin || '').trim();
  const [salt, expectedHash] = String(storedHash || '').split(':');

  if (!normalizedPin || !salt || !expectedHash) {
    return false;
  }

  const derivedKey = crypto.scryptSync(normalizedPin, salt, 64).toString('hex');
  const expectedBuffer = Buffer.from(expectedHash, 'hex');
  const actualBuffer = Buffer.from(derivedKey, 'hex');

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
};

export const createProfilePinSessionToken = ({ accountId, profile }) => {
  const payload = {
    accountId: String(accountId || ''),
    profileId: String(profile?._id || ''),
    pinChangedAt: getPinChangedTimestamp(profile),
    exp: Date.now() + PROFILE_PIN_SESSION_HOURS * 60 * 60 * 1000,
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = signEncodedPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
};

export const verifyProfilePinSessionToken = (token, { accountId, profile }) => {
  const rawToken = String(token || '').trim();
  if (!rawToken) {
    return { valid: false, reason: 'missing' };
  }

  const [encodedPayload, providedSignature] = rawToken.split('.');
  if (!encodedPayload || !providedSignature) {
    return { valid: false, reason: 'malformed' };
  }

  const expectedSignature = signEncodedPayload(encodedPayload);
  const expectedBuffer = Buffer.from(expectedSignature);
  const providedBuffer = Buffer.from(providedSignature);

  if (expectedBuffer.length !== providedBuffer.length) {
    return { valid: false, reason: 'signature-length' };
  }

  if (!crypto.timingSafeEqual(expectedBuffer, providedBuffer)) {
    return { valid: false, reason: 'signature' };
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    const now = Date.now();

    if (!payload?.exp || payload.exp <= now) {
      return { valid: false, reason: 'expired' };
    }

    if (String(payload.accountId || '') !== String(accountId || '')) {
      return { valid: false, reason: 'account-mismatch' };
    }

    if (String(payload.profileId || '') !== String(profile?._id || '')) {
      return { valid: false, reason: 'profile-mismatch' };
    }

    if (Number(payload.pinChangedAt || 0) !== getPinChangedTimestamp(profile)) {
      return { valid: false, reason: 'pin-version' };
    }

    return { valid: true, payload };
  } catch (error) {
    return { valid: false, reason: 'payload' };
  }
};

export const getRequestedProfilePinToken = (req) => {
  const headerValue = req.headers?.[PROFILE_PIN_HEADER_NAME];
  return typeof headerValue === 'string' ? headerValue.trim() : '';
};

export const describeProfilePinState = ({ accountId, profile, token }) => {
  const hasPin = !!profile?.pinEnabled && !!profile?.pinLastChangedAt;
  const pinResetRequired = !!profile?.pinResetRequired;
  const lockedUntil = profile?.pinLockedUntil ? new Date(profile.pinLockedUntil) : null;
  const isLocked = !!lockedUntil && lockedUntil.getTime() > Date.now();
  const attemptsUsed =
    lockedUntil && !isLocked
      ? 0
      : Number(profile?.pinFailedAttempts || 0);
  const requiresSetup = !hasPin || pinResetRequired;
  const verification = hasPin && !requiresSetup
    ? verifyProfilePinSessionToken(token, { accountId, profile })
    : { valid: false, reason: requiresSetup ? 'setup-required' : 'missing' };
  const verified = !!verification.valid;
  const remainingAttempts = Math.max(0, PROFILE_PIN_MAX_ATTEMPTS - attemptsUsed);

  return {
    hasPin,
    verified,
    requiresSetup,
    requiresUnlock: hasPin && !requiresSetup && !verified,
    pinResetRequired,
    lockedUntil: lockedUntil ? lockedUntil.toISOString() : null,
    isLocked,
    remainingAttempts,
    maxAttempts: PROFILE_PIN_MAX_ATTEMPTS,
    sessionExpiresAt: verified ? new Date(verification.payload.exp).toISOString() : null,
  };
};
