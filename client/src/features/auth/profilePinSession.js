const PROFILE_PIN_STORAGE_PREFIX = "active_staff_profile_pin:";

const getPinStorageKey = (firebaseUid, profileId) =>
  `${PROFILE_PIN_STORAGE_PREFIX}${firebaseUid}:${profileId}`;

export const getStoredProfilePinToken = (firebaseUid, profileId) => {
  if (!firebaseUid || !profileId) return "";
  return sessionStorage.getItem(getPinStorageKey(firebaseUid, profileId)) || "";
};

export const setStoredProfilePinToken = (firebaseUid, profileId, token) => {
  if (!firebaseUid || !profileId) return;

  const key = getPinStorageKey(firebaseUid, profileId);
  if (!token) {
    sessionStorage.removeItem(key);
    return;
  }

  sessionStorage.setItem(key, token);
};

export const clearStoredProfilePinToken = (firebaseUid, profileId) => {
  if (!firebaseUid || !profileId) return;
  sessionStorage.removeItem(getPinStorageKey(firebaseUid, profileId));
};

export const clearStoredProfilePinTokensForUser = (firebaseUid) => {
  if (!firebaseUid) return;

  const prefix = `${PROFILE_PIN_STORAGE_PREFIX}${firebaseUid}:`;
  const keysToRemove = [];

  for (let index = 0; index < sessionStorage.length; index += 1) {
    const key = sessionStorage.key(index);
    if (key?.startsWith(prefix)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => sessionStorage.removeItem(key));
};

export const clearAllStoredProfilePinTokens = () => {
  const keysToRemove = [];

  for (let index = 0; index < sessionStorage.length; index += 1) {
    const key = sessionStorage.key(index);
    if (key?.startsWith(PROFILE_PIN_STORAGE_PREFIX)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => sessionStorage.removeItem(key));
};
