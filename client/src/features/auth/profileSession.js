const PROFILE_STORAGE_PREFIX = "active_staff_profile:";

const getProfileStorageKey = (firebaseUid) => `${PROFILE_STORAGE_PREFIX}${firebaseUid}`;
const storages = [sessionStorage, localStorage];

const removeProfileKeyFromAllStores = (firebaseUid) => {
  if (!firebaseUid) return;

  const key = getProfileStorageKey(firebaseUid);
  storages.forEach((storage) => storage.removeItem(key));
};

export const getStoredActiveProfileId = (firebaseUid) => {
  if (!firebaseUid) return "";

  const key = getProfileStorageKey(firebaseUid);
  const sessionValue = sessionStorage.getItem(key) || "";

  if (sessionValue) {
    return sessionValue;
  }

  // Clean up legacy persistent profile selections so each new login starts clean.
  localStorage.removeItem(key);
  return "";
};

export const setStoredActiveProfileId = (firebaseUid, profileId) => {
  if (!firebaseUid) return;

  if (!profileId) {
    removeProfileKeyFromAllStores(firebaseUid);
    return;
  }

  const key = getProfileStorageKey(firebaseUid);
  localStorage.removeItem(key);
  sessionStorage.setItem(key, profileId);
};

export const clearStoredActiveProfileId = (firebaseUid) => {
  removeProfileKeyFromAllStores(firebaseUid);
};

export const clearAllStoredActiveProfileIds = () => {
  storages.forEach((storage) => {
    const keysToRemove = [];

    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);

      if (key?.startsWith(PROFILE_STORAGE_PREFIX)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => storage.removeItem(key));
  });
};
