import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILE_PIN_STORAGE_PREFIX = 'active_staff_profile_pin:';

const getPinStorageKey = (firebaseUid, profileId) =>
  `${PROFILE_PIN_STORAGE_PREFIX}${firebaseUid}:${profileId}`;

export const getStoredProfilePinToken = async (firebaseUid, profileId) => {
  if (!firebaseUid || !profileId) return '';
  return (await AsyncStorage.getItem(getPinStorageKey(firebaseUid, profileId))) || '';
};

export const setStoredProfilePinToken = async (firebaseUid, profileId, token) => {
  if (!firebaseUid || !profileId) return;

  const key = getPinStorageKey(firebaseUid, profileId);
  if (!token) {
    await AsyncStorage.removeItem(key);
    return;
  }

  await AsyncStorage.setItem(key, String(token));
};

export const clearStoredProfilePinToken = async (firebaseUid, profileId) => {
  if (!firebaseUid || !profileId) return;
  await AsyncStorage.removeItem(getPinStorageKey(firebaseUid, profileId));
};

export const clearStoredProfilePinTokensForUser = async (firebaseUid) => {
  if (!firebaseUid) return;

  const prefix = `${PROFILE_PIN_STORAGE_PREFIX}${firebaseUid}:`;
  const keys = await AsyncStorage.getAllKeys();
  const pinKeys = keys.filter((key) => key.startsWith(prefix));

  if (pinKeys.length > 0) {
    await AsyncStorage.multiRemove(pinKeys);
  }
};

export const clearAllStoredProfilePinTokens = async () => {
  const keys = await AsyncStorage.getAllKeys();
  const pinKeys = keys.filter((key) => key.startsWith(PROFILE_PIN_STORAGE_PREFIX));

  if (pinKeys.length > 0) {
    await AsyncStorage.multiRemove(pinKeys);
  }
};
