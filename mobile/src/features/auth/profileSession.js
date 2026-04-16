import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILE_STORAGE_PREFIX = 'active_staff_profile:';

const getProfileStorageKey = (firebaseUid) => `${PROFILE_STORAGE_PREFIX}${firebaseUid}`;

export const getStoredActiveProfileId = async (firebaseUid) => {
  if (!firebaseUid) return '';
  const key = getProfileStorageKey(firebaseUid);
  return (await AsyncStorage.getItem(key)) || '';
};

export const setStoredActiveProfileId = async (firebaseUid, profileId) => {
  if (!firebaseUid) return;

  const key = getProfileStorageKey(firebaseUid);
  if (!profileId) {
    await AsyncStorage.removeItem(key);
    return;
  }

  await AsyncStorage.setItem(key, String(profileId));
};

export const clearStoredActiveProfileId = async (firebaseUid) => {
  if (!firebaseUid) return;
  await AsyncStorage.removeItem(getProfileStorageKey(firebaseUid));
};

export const clearAllStoredActiveProfileIds = async () => {
  const keys = await AsyncStorage.getAllKeys();
  const profileKeys = keys.filter((key) => key.startsWith(PROFILE_STORAGE_PREFIX));
  if (profileKeys.length > 0) {
    await AsyncStorage.multiRemove(profileKeys);
  }
};
