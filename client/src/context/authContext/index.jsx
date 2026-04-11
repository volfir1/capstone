import React, { useContext, useEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "../../firebase/firebase";
import { getUserData } from "@/features/auth/user";
import { verifyUser } from "@/features/auth/auth";
import { createProfile, getAccountContext } from "@/features/auth/account";
import {
  getProfilePinStatus,
  setupProfilePin as setupProfilePinRequest,
  verifyProfilePin as verifyProfilePinRequest,
} from "@/features/auth/profilePin";
import {
  clearStoredActiveProfileId,
  getStoredActiveProfileId,
  setStoredActiveProfileId,
} from "@/features/auth/profileSession";
import {
  clearStoredProfilePinTokensForUser,
  setStoredProfilePinToken,
} from "@/features/auth/profilePinSession";
import apiClient from "@config/api/apiClient";
import { registerUser as registerSocketUser, disconnectSocket } from "@/config/socket";
import { welcomeNotif } from "@utils/notification";

const AuthContext = React.createContext();
const ADMIN_ROLES = new Set(["secretary", "supervising_lawyer", "director", "intern"]);
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
  "profile-pin-setup-required",
  "profile-pin-required",
  "profile-pin-locked",
]);
const WELCOME_PENDING_PREFIX = "welcome_pending_profile:";

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}

const clearProfileSessionKeys = (uid) => {
  if (!uid) return;

  clearStoredActiveProfileId(uid);
  clearStoredProfilePinTokensForUser(uid);
  const prefixes = [`login_logged_${uid}_`, `${WELCOME_PENDING_PREFIX}${uid}`];
  const keysToRemove = [];

  for (let index = 0; index < sessionStorage.length; index += 1) {
    const key = sessionStorage.key(index);
    if (prefixes.some((prefix) => key?.startsWith(prefix))) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => sessionStorage.removeItem(key));
};

const getPendingWelcomeKey = (uid) => `${WELCOME_PENDING_PREFIX}${uid}`;

const queueWelcomeToast = (uid, profileId) => {
  if (!uid || !profileId) return;
  sessionStorage.setItem(getPendingWelcomeKey(uid), profileId);
};

const clearQueuedWelcomeToast = (uid) => {
  if (!uid) return;
  sessionStorage.removeItem(getPendingWelcomeKey(uid));
};

export default function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [accountData, setAccountData] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [activeProfileId, setActiveProfileIdState] = useState("");
  const [requiresProfileSelection, setRequiresProfileSelection] = useState(false);
  const [pinStatus, setPinStatus] = useState(EMPTY_PIN_STATUS);
  const currentUidRef = useRef(null);
  const normalizePinStatus = (status) => ({ ...EMPTY_PIN_STATUS, ...(status || {}) });
  const resolvePinStatusFromError = (error) => {
    const code = error?.response?.data?.code;
    if (!PIN_STATUS_ERROR_CODES.has(code)) {
      return null;
    }

    return normalizePinStatus(error?.response?.data?.data);
  };

  const logProfileSession = async (firebaseUser, profile) => {
    if (!firebaseUser?.uid || !profile?.id) return;

    const sessionKey = `login_logged_${firebaseUser.uid}_${profile.id}`;
    if (sessionStorage.getItem(sessionKey)) return;

    sessionStorage.setItem(sessionKey, "true");

    const userName = `${profile.firstName || ""} ${profile.lastName || ""}`.trim() || firebaseUser.email;

    apiClient
      .post("/activity-logs", {
        action: "login",
        userEmail: firebaseUser.email || "",
        userName,
        userRole: profile.role || "",
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
      })
      .catch((error) => console.error("Activity log error:", error));
  };

  const flushWelcomeToast = (firebaseUser, profile) => {
    if (!firebaseUser?.uid || !profile?.id) return;

    const pendingProfileId = sessionStorage.getItem(getPendingWelcomeKey(firebaseUser.uid));
    if (pendingProfileId !== profile.id) return;

    clearQueuedWelcomeToast(firebaseUser.uid);
    welcomeNotif(profile.firstName || profile.lastName || "there");
  };

  const syncUnlockedProfileSession = async (firebaseUser) => {
    const backendUserData = await getUserData();
    setUserData(backendUserData);
    setRequiresProfileSelection(false);
    flushWelcomeToast(firebaseUser, backendUserData);
    await logProfileSession(firebaseUser, backendUserData);
    return backendUserData;
  };

  const syncPinStateForSelectedProfile = async (firebaseUser) => {
    try {
      const currentPinStatus = normalizePinStatus(await getProfilePinStatus());
      setPinStatus(currentPinStatus);

      if (currentPinStatus.verified) {
        await syncUnlockedProfileSession(firebaseUser);
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
    }
  };

  const applyVerifiedPinSession = async (firebaseUser, pinResult = {}) => {
    const targetProfileId = pinResult?.profile?.id || activeProfileId;
    const resolvedPinToken = String(pinResult?.pinToken || "").trim();
    if (firebaseUser?.uid && targetProfileId && resolvedPinToken) {
      setStoredProfilePinToken(firebaseUser.uid, targetProfileId, resolvedPinToken);
    }

    setPinStatus(normalizePinStatus(pinResult));

    if (pinResult?.profile?.id) {
      setProfiles((currentProfiles) =>
        currentProfiles.map((profile) =>
          profile.id === pinResult.profile.id ? { ...profile, ...pinResult.profile } : profile
        )
      );
    }

    const backendUserData = await syncUnlockedProfileSession(firebaseUser);
    await refreshProfiles(targetProfileId);
    return backendUserData;
  };

  const syncAccountState = async (firebaseUser, preferredProfileId = "") => {
    await firebaseUser.reload();

    if (!firebaseUser.emailVerified) {
      setAccountData(null);
      setProfiles([]);
      setActiveProfileIdState("");
      setUserData(null);
      setPinStatus(EMPTY_PIN_STATUS);
      setRequiresProfileSelection(false);
      return;
    }

    try {
      await verifyUser();
    } catch (error) {
      console.error("Backend verification sync failed:", error);
    }

    const storedProfileId = preferredProfileId || getStoredActiveProfileId(firebaseUser.uid);
    const accountContext = await getAccountContext(storedProfileId);
    const availableProfiles = Array.isArray(accountContext?.profiles) ? accountContext.profiles : [];

    setAccountData(accountContext?.account || null);
    setProfiles(availableProfiles);

    const selectableProfiles = availableProfiles.filter((profile) => !profile.disabled);
    const resolvedProfileId =
      storedProfileId && selectableProfiles.some((profile) => profile.id === storedProfileId)
        ? storedProfileId
        : "";

    if (!resolvedProfileId) {
      clearStoredActiveProfileId(firebaseUser.uid);
      clearStoredProfilePinTokensForUser(firebaseUser.uid);
      setActiveProfileIdState("");
      setUserData(null);
      setPinStatus(EMPTY_PIN_STATUS);
      setRequiresProfileSelection(true);
      return;
    }

    setStoredActiveProfileId(firebaseUser.uid, resolvedProfileId);
    setActiveProfileIdState(resolvedProfileId);
    setRequiresProfileSelection(false);

    try {
      await syncPinStateForSelectedProfile(firebaseUser);
    } catch (error) {
      console.error("Failed to load active profile state:", error);
      clearStoredActiveProfileId(firebaseUser.uid);
      clearStoredProfilePinTokensForUser(firebaseUser.uid);
      setActiveProfileIdState("");
      setUserData(null);
      setPinStatus(EMPTY_PIN_STATUS);
      setRequiresProfileSelection(true);
      return;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);

      if (user) {
        currentUidRef.current = user.uid;
        setCurrentUser({ ...user });
        setUserLoggedIn(true);

        try {
          await syncAccountState(user);
        } catch (error) {
          console.error("Auth state error:", error);
          setAccountData(null);
          setProfiles([]);
          setActiveProfileIdState("");
          setUserData(null);
          setPinStatus(EMPTY_PIN_STATUS);
          setRequiresProfileSelection(false);
        } finally {
          setLoading(false);
        }

        return;
      }

      const lastUid = currentUidRef.current;
      if (lastUid) {
        clearProfileSessionKeys(lastUid);
        currentUidRef.current = null;
      }

      setCurrentUser(null);
      setUserLoggedIn(false);
      setAccountData(null);
      setProfiles([]);
      setActiveProfileIdState("");
      setUserData(null);
      setPinStatus(EMPTY_PIN_STATUS);
      setRequiresProfileSelection(false);
      disconnectSocket();

      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userName");
      localStorage.removeItem("role");

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser?.uid) {
      return;
    }

    if (activeProfileId && normalizePinStatus(pinStatus).verified) {
      registerSocketUser(currentUser.uid, activeProfileId);
      return;
    }

    registerSocketUser(currentUser.uid, "");
  }, [currentUser?.uid, activeProfileId, pinStatus?.verified]);

  const refreshUserData = async () => {
    if (!currentUser || !activeProfileId || !pinStatus.verified) return null;

    try {
      const backendUserData = await getUserData();
      setUserData(backendUserData);
      return backendUserData;
    } catch (error) {
      console.error("Failed to refresh user data:", error);
      throw error;
    }
  };

  const refreshProfiles = async (preferredProfileId = "") => {
    if (!currentUser) return null;

    const context = await getAccountContext(preferredProfileId || getStoredActiveProfileId(currentUser.uid));
    const availableProfiles = Array.isArray(context?.profiles) ? context.profiles : [];
    setAccountData(context?.account || null);
    setProfiles(availableProfiles);
    return context;
  };

  const selectProfile = async (profileId) => {
    if (!currentUser?.uid || !profileId) return null;

    clearStoredProfilePinTokensForUser(currentUser.uid);
    setStoredActiveProfileId(currentUser.uid, profileId);
    queueWelcomeToast(currentUser.uid, profileId);
    setActiveProfileIdState(profileId);
    setPinStatus(EMPTY_PIN_STATUS);
    setUserData(null);
    setRequiresProfileSelection(false);

    try {
      await refreshProfiles(profileId);
      return await syncPinStateForSelectedProfile(currentUser);
    } catch (error) {
      console.error("Failed to select profile:", error);
      clearStoredActiveProfileId(currentUser.uid);
      clearStoredProfilePinTokensForUser(currentUser.uid);
      clearQueuedWelcomeToast(currentUser.uid);
      setActiveProfileIdState("");
      setUserData(null);
      setPinStatus(EMPTY_PIN_STATUS);
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

  const clearSelectedProfile = () => {
    if (!currentUser?.uid) return;

    clearStoredActiveProfileId(currentUser.uid);
    clearStoredProfilePinTokensForUser(currentUser.uid);
    clearQueuedWelcomeToast(currentUser.uid);
    setActiveProfileIdState("");
    setUserData(null);
    setPinStatus(EMPTY_PIN_STATUS);
    setRequiresProfileSelection(true);
  };

  const markActiveProfilePinReset = () => {
    if (!currentUser?.uid || !activeProfileId) return;

    clearStoredProfilePinTokensForUser(currentUser.uid);
    setUserData(null);
    setPinStatus({
      ...EMPTY_PIN_STATUS,
      requiresSetup: true,
      pinResetRequired: true,
    });
    setRequiresProfileSelection(false);
  };

  const setupActiveProfilePin = async (pin) => {
    if (!currentUser?.uid || !activeProfileId) return null;

    try {
      const pinResult = await setupProfilePinRequest(pin);
      return applyVerifiedPinSession(currentUser, pinResult);
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
      return applyVerifiedPinSession(currentUser, pinResult);
    } catch (error) {
      if (error?.response?.data?.data) {
        setPinStatus(normalizePinStatus(error.response.data.data));
      }
      throw error;
    }
  };

  const value = {
    currentUser,
    userLoggedIn,
    loading,
    userData,
    accountData,
    profiles,
    activeProfileId,
    requiresProfileSelection,
    pinStatus,
    requiresPinSetup:
      !!activeProfileId && !requiresProfileSelection && !!normalizePinStatus(pinStatus).requiresSetup,
    requiresPinVerification:
      !!activeProfileId && !requiresProfileSelection && !!normalizePinStatus(pinStatus).requiresUnlock,
    hasProfiles: profiles.length > 0,
    isAdmin: ADMIN_ROLES.has(userData?.role),
    isVerified: accountData?.isVerified || false,
    refreshUserData,
    refreshProfiles,
    selectProfile,
    createProfileAndSelect,
    clearSelectedProfile,
    markActiveProfilePinReset,
    setupActiveProfilePin,
    verifyActiveProfilePin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
