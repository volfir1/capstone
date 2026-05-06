import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';

import { auth } from '../firebaseApp/firebase';
import { doSignOut } from '../firebaseApp/auth';
import { getUserData } from '../features/auth/user';
import { verifyUser } from '../features/auth/auth';
import { createProfile, getAccountContext } from '../features/auth/account';
import {
  getProfilePinStatus,
  setupProfilePin as setupProfilePinRequest,
  verifyProfilePin as verifyProfilePinRequest,
} from '../features/auth/profilePin';
import {
  clearAllStoredActiveProfileIds,
  clearStoredActiveProfileId,
  getStoredActiveProfileId,
  setStoredActiveProfileId,
} from '../features/auth/profileSession';
import {
  clearAllStoredProfilePinTokens,
  clearStoredProfilePinTokensForUser,
  setStoredProfilePinToken,
} from '../features/auth/profilePinSession';
import { getStoredToken } from 'utils/secureStore';
import { registerForPushNotifications, unregisterPushNotifications } from '../utils/pushNotifications';

const AuthContext = createContext();

const ADMIN_ROLES = new Set(['secretary', 'supervising_lawyer', 'director', 'intern']);

const EMPTY_PIN_STATUS = {
  hasPin: false,
  verified: false,
  requiresSetup: false,
  requiresUnlock: false,
  pinResetRequired: false,
  lockedUntil: null,
  isLocked: false,
  remainingAttempts: 0,
  maxAttempts: 0,
  sessionExpiresAt: null,
};

const PIN_STATUS_ERROR_CODES = new Set([
  'profile-pin-setup-required',
  'profile-pin-required',
  'profile-pin-locked',
]);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [accountData, setAccountData] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [activeProfileId, setActiveProfileIdState] = useState('');
  const [requiresProfileSelection, setRequiresProfileSelection] = useState(false);
  const [pinStatus, setPinStatus] = useState(EMPTY_PIN_STATUS);
  const [pinStatusLoading, setPinStatusLoading] = useState(false);

  const currentUidRef = useRef(null);
  const isLoggingOutRef = useRef(false);
  const pushTokenRef = useRef(null);

  const normalizePinStatus = (status) => ({ ...EMPTY_PIN_STATUS, ...(status || {}) });

  const resolvePinStatusFromError = (error) => {
    const code = error?.response?.data?.code;
    if (!PIN_STATUS_ERROR_CODES.has(code)) {
      return null;
    }

    return normalizePinStatus(error?.response?.data?.data);
  };

  const clearProfileSessionKeys = async (uid) => {
    if (!uid) return;

    await clearStoredActiveProfileId(uid);
    await clearStoredProfilePinTokensForUser(uid);
  };

  const syncUnlockedProfileSession = async () => {
    const backendUserData = await getUserData();
    setUserData(backendUserData || null);
    setRequiresProfileSelection(false);

    if (backendUserData) {
      registerForPushNotifications().then((token) => {
        if (token) {
          pushTokenRef.current = token;
        }
      });
    }

    return backendUserData;
  };

  const syncPinStateForSelectedProfile = async () => {
    setPinStatusLoading(true);

    try {
      const currentPinStatus = normalizePinStatus(await getProfilePinStatus());
      setPinStatus(currentPinStatus);

      if (currentPinStatus.verified) {
        await syncUnlockedProfileSession();
        return currentPinStatus;
      }

      setUserData(null);
      return currentPinStatus;
    } catch (error) {
      const fallbackPinStatus = resolvePinStatusFromError(error);
      if (!fallbackPinStatus) {
        throw error;
      }

      setPinStatus(fallbackPinStatus);
      setUserData(null);
      return fallbackPinStatus;
    } finally {
      setPinStatusLoading(false);
    }
  };

  const refreshProfiles = useCallback(async (preferredProfileId = '') => {
    if (!currentUser?.uid) return null;

    const resolvedProfileId = preferredProfileId || (await getStoredActiveProfileId(currentUser.uid));
    const context = await getAccountContext(resolvedProfileId);
    const availableProfiles = Array.isArray(context?.profiles) ? context.profiles : [];
    setAccountData(context?.account || null);
    setProfiles(availableProfiles);
    return context;
  }, [currentUser?.uid]);

  const applyVerifiedPinSession = async (pinResult = {}) => {
    const targetProfileId = pinResult?.profile?.id || activeProfileId;
    const resolvedPinToken = String(pinResult?.pinToken || '').trim();

    if (currentUser?.uid && targetProfileId && resolvedPinToken) {
      await setStoredProfilePinToken(currentUser.uid, targetProfileId, resolvedPinToken);
    }

    setPinStatus(normalizePinStatus(pinResult));

    if (pinResult?.profile?.id) {
      setProfiles((currentProfiles) =>
        currentProfiles.map((profile) =>
          profile.id === pinResult.profile.id ? { ...profile, ...pinResult.profile } : profile
        )
      );
    }

    const backendUserData = await syncUnlockedProfileSession();
    await refreshProfiles(targetProfileId);
    return backendUserData;
  };

  const syncAccountState = async (firebaseUser, preferredProfileId = '') => {
    await firebaseUser.reload();

    try {
      await firebaseUser.getIdToken(true);
    } catch (error) {
      console.warn('Failed to refresh Firebase ID token after reload', error);
    }

    if (!firebaseUser.emailVerified) {
      setAccountData(null);
      setProfiles([]);
      setActiveProfileIdState('');
      setUserData(null);
      setPinStatus(EMPTY_PIN_STATUS);
      setPinStatusLoading(false);
      setRequiresProfileSelection(false);
      return;
    }

    try {
      await verifyUser();
    } catch (error) {
      console.error('Backend verification sync failed:', error);
    }

    const storedProfileId = preferredProfileId || (await getStoredActiveProfileId(firebaseUser.uid));
    const accountContext = await getAccountContext(storedProfileId);
    const availableProfiles = Array.isArray(accountContext?.profiles) ? accountContext.profiles : [];

    setAccountData(accountContext?.account || null);
    setProfiles(availableProfiles);

    const selectableProfiles = availableProfiles.filter((profile) => !profile.disabled);
    const resolvedProfileId =
      storedProfileId && selectableProfiles.some((profile) => profile.id === storedProfileId)
        ? storedProfileId
        : '';

    if (!resolvedProfileId) {
      await clearStoredActiveProfileId(firebaseUser.uid);
      await clearStoredProfilePinTokensForUser(firebaseUser.uid);
      setActiveProfileIdState('');
      setUserData(null);
      setPinStatus(EMPTY_PIN_STATUS);
      setPinStatusLoading(false);
      setRequiresProfileSelection(true);
      return;
    }

    await setStoredActiveProfileId(firebaseUser.uid, resolvedProfileId);
    setActiveProfileIdState(resolvedProfileId);
    setRequiresProfileSelection(false);

    try {
      await syncPinStateForSelectedProfile();
    } catch (error) {
      console.error('Failed to load active profile state:', error);
      await clearStoredActiveProfileId(firebaseUser.uid);
      await clearStoredProfilePinTokensForUser(firebaseUser.uid);
      setActiveProfileIdState('');
      setUserData(null);
      setPinStatus(EMPTY_PIN_STATUS);
      setPinStatusLoading(false);
      setRequiresProfileSelection(true);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (isLoggingOutRef.current) {
        return;
      }

      setLoading(true);

      if (user) {
        currentUidRef.current = user.uid;
        setCurrentUser({ ...user });
        setUserLoggedIn(true);

        try {
          await syncAccountState(user);
        } catch (error) {
          console.error('Auth state error:', error);
          setAccountData(null);
          setProfiles([]);
          setActiveProfileIdState('');
          setUserData(null);
          setPinStatus(EMPTY_PIN_STATUS);
          setPinStatusLoading(false);
          setRequiresProfileSelection(false);
        } finally {
          setLoading(false);
        }

        return;
      }

      const lastUid = currentUidRef.current;
      if (lastUid) {
        await clearProfileSessionKeys(lastUid);
        currentUidRef.current = null;
      } else {
        await clearAllStoredActiveProfileIds();
        await clearAllStoredProfilePinTokens();
      }

      setCurrentUser(null);
      setUserLoggedIn(false);
      setAccountData(null);
      setProfiles([]);
      setActiveProfileIdState('');
      setUserData(null);
      setPinStatus(EMPTY_PIN_STATUS);
      setPinStatusLoading(false);
      setRequiresProfileSelection(false);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshUserData = async () => {
    if (!currentUser || !activeProfileId || !normalizePinStatus(pinStatus).verified) return null;

    const backendUserData = await getUserData();
    setUserData(backendUserData || null);
    return backendUserData;
  };

  const selectProfile = async (profileId) => {
    if (!currentUser?.uid || !profileId) return null;

    await clearStoredProfilePinTokensForUser(currentUser.uid);
    setPinStatusLoading(true);
    await setStoredActiveProfileId(currentUser.uid, profileId);
    setActiveProfileIdState(profileId);
    setPinStatus(EMPTY_PIN_STATUS);
    setUserData(null);
    setRequiresProfileSelection(false);

    try {
      await refreshProfiles(profileId);
      return await syncPinStateForSelectedProfile();
    } catch (error) {
      console.error('Failed to select profile:', error);
      await clearStoredActiveProfileId(currentUser.uid);
      await clearStoredProfilePinTokensForUser(currentUser.uid);
      setActiveProfileIdState('');
      setUserData(null);
      setPinStatus(EMPTY_PIN_STATUS);
      setPinStatusLoading(false);
      setRequiresProfileSelection(true);
      throw error;
    }
  };

  const createProfileAndSelect = async (payload) => {
    if (!currentUser?.uid) return null;

    const createdProfile = await createProfile(payload);
    await selectProfile(createdProfile.id);
    return createdProfile;
  };

  const clearSelectedProfile = async () => {
    if (!currentUser?.uid) return;

    await clearStoredActiveProfileId(currentUser.uid);
    await clearStoredProfilePinTokensForUser(currentUser.uid);
    setActiveProfileIdState('');
    setUserData(null);
    setPinStatus(EMPTY_PIN_STATUS);
    setPinStatusLoading(false);
    setRequiresProfileSelection(true);
  };

  const markActiveProfilePinReset = async () => {
    if (!currentUser?.uid || !activeProfileId) return;

    await clearStoredProfilePinTokensForUser(currentUser.uid);
    setUserData(null);
    setPinStatus({
      ...EMPTY_PIN_STATUS,
      requiresSetup: true,
      pinResetRequired: true,
    });
    setPinStatusLoading(false);
    setRequiresProfileSelection(false);
  };

  const setupActiveProfilePin = async (pin) => {
    if (!currentUser?.uid || !activeProfileId) return null;

    try {
      const pinResult = await setupProfilePinRequest(pin);
      return await applyVerifiedPinSession(pinResult);
    } catch (error) {
      if (error?.response?.data?.data) {
        setPinStatus(normalizePinStatus(error.response.data.data));
      }
      throw error;
    }
  };

  const verifyActiveProfilePin = async (pin) => {
    if (!currentUser?.uid || !activeProfileId) return null;

    try {
      const pinResult = await verifyProfilePinRequest(pin);
      return await applyVerifiedPinSession(pinResult);
    } catch (error) {
      if (error?.response?.data?.data) {
        setPinStatus(normalizePinStatus(error.response.data.data));
      }
      throw error;
    }
  };

  const logout = async () => {
    if (isLoggingOutRef.current) return;

    isLoggingOutRef.current = true;
    setLoading(true);

    try {
      if (pushTokenRef.current) {
        await unregisterPushNotifications(pushTokenRef.current);
        pushTokenRef.current = null;
      }

      if (auth.currentUser) {
        await doSignOut();
      } else {
        await clearAllStoredActiveProfileIds();
        await clearAllStoredProfilePinTokens();
      }

      const lastUid = currentUidRef.current;
      if (lastUid) {
        await clearProfileSessionKeys(lastUid);
      }

      currentUidRef.current = null;
      setCurrentUser(null);
      setUserLoggedIn(false);
      setAccountData(null);
      setProfiles([]);
      setActiveProfileIdState('');
      setUserData(null);
      setPinStatus(EMPTY_PIN_STATUS);
      setPinStatusLoading(false);
      setRequiresProfileSelection(false);
    } finally {
      setLoading(false);
      isLoggingOutRef.current = false;
    }
  };

  const getAuthErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No account found with this email.';
      case 'auth/wrong-password':
        return 'Incorrect password.';
      case 'auth/invalid-email':
        return 'Invalid email address.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters.';
      default:
        return 'An error occurred. Please try again.';
    }
  };

  const value = {
    currentUser,
    userLoggedIn,
    loading,
    isLoading: loading,
    userData,
    accountData,
    profiles,
    activeProfileId,
    requiresProfileSelection,
    pinStatus,
    pinStatusLoading,
    requiresPinSetup:
      !!activeProfileId && !requiresProfileSelection && !!normalizePinStatus(pinStatus).requiresSetup,
    requiresPinVerification:
      !!activeProfileId && !requiresProfileSelection && !!normalizePinStatus(pinStatus).requiresUnlock,
    hasProfiles: profiles.length > 0,
    isAdmin: ADMIN_ROLES.has(userData?.role),
    isVerified: !!currentUser?.emailVerified || !!accountData?.isVerified,
    refreshUserData,
    refreshProfiles,
    selectProfile,
    createProfileAndSelect,
    clearSelectedProfile,
    markActiveProfilePinReset,
    setupActiveProfilePin,
    verifyActiveProfilePin,
    logout,
    getAuthErrorMessage,
    getStoredToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
