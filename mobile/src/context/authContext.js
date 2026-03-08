import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { onAuthStateChanged, signOut, updateProfile } from "firebase/auth";
import axios from 'axios';
import { auth } from "../firebaseApp/firebase";
import {
  doCreateUserWithEmailAndPassword,
  doSigninWithEmailAndPassword,
  doSignOut,
  doSendEmailVerification,
} from "../firebaseApp/auth";
import { storeToken, getStoredToken, clearToken } from "utils/secureStore";
import { getUserData } from "../features/auth/user";
import { verifyUser } from "../features/auth/auth";
import { registerForPushNotifications, unregisterPushNotifications } from "../utils/pushNotifications";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const isLoggingOutRef = useRef(false);
  const [initializing, setInitializing] = useState(true);
  const [userData, setUserData] = useState(null);
  const pushTokenRef = useRef(null);

  // Monitor auth state changes - THIS IS KEY!
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, initializeUser);
    return unsubscribe;
  }, []);

  // This function runs EVERY TIME auth state changes (login, logout, etc.)
  async function initializeUser(user) {
  // If we're in the middle of an explicit logout, ignore auth state changes
  if (isLoggingOutRef.current) return;

    if (user) {
      setCurrentUser({ ...user });
      setUserLoggedIn(true);

      try {
        await user.reload();

        const token = await user.getIdToken()
        await storeToken(token)
        console.log("Token obtained and stored")

        if (user.emailVerified) {
          console.log(
            "User is verified in Firebase, syncing verification with backend..."
          );

          try {
            await verifyUser(); 
            console.log("Backend verification status updated");
          } catch (verifyError) {
            console.log("Failed to update backend verification:", verifyError);
          }

        
          try {
            const backendUserData = await getUserData();
            // getUserData() returns { data: { ... }, success: true }
            setUserData(backendUserData.data);
            console.log("User data loaded:", backendUserData.data);

            // Register for push notifications after successful login
            registerForPushNotifications().then(token => {
              if (token) pushTokenRef.current = token;
            });
          } catch (userError) {
            console.error("Failed to fetch user data:", userError);

           
            if (userError.response?.status === 404) {
              console.log("User not found in MongoDB, creating new user if possible...");

              const displayName = (user.displayName || "").trim();
              if (!displayName) {
                console.log("Display name empty; skipping auto-register (likely attorney account created elsewhere)");
                setUserData(null);
                return;
              }

              const nameParts = displayName.split(" ");
              const firstName = nameParts[0] || "";
              const lastName = nameParts.slice(1).join(" ") || "";
              const username = user.email;

              if (!firstName || !username) {
                console.log("Missing firstName or email; skipping auto-register");
                setUserData(null);
                return;
              }

              try {
                const { registerUser } = await import(
                  "../features/auth/register"
                );
                await registerUser(firstName, lastName, user.email, username);

                const newUserData = await getUserData();
                setUserData(newUserData.data);
                console.log("New user created and loaded:", newUserData.data);
              } catch (registerError) {
                console.log("Registration attempt failed (this may be expected):", registerError.response?.status);
                if (
                  registerError.response?.data?.message ===
                  "User already exists"
                ) {
                  try {
                    const retryUserData = await getUserData();
                    setUserData(retryUserData.data);
                    console.log("User data loaded on retry:", retryUserData.data);
                  } catch (retryError) {
                    console.error(
                      "Failed to fetch user data on retry:",
                      retryError
                    );
                    setUserData(null);
                  }
                } else {
                  setUserData(null);
                }
              }
            } else {
              console.log("Non-404 error, skipping user creation");
              setUserData(null);
            }
          }
        } else {
          console.log("User is not verified yet — skipping backend sync");
          setUserData(null);
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        setUserData(null);
      }
    } else {
      // Clear secure storage and any auth headers when there's no user
      try {
        await clearToken();
      } catch (e) {
        console.warn('Failed clearing token during initializeUser:', e);
      }

      
      try {
        delete axios.defaults.headers.common.Authorization;
      } catch (e) {
    
      }

      setCurrentUser(null);
      setUserLoggedIn(false);
      setUserData(null);
    }

    if (initializing) setInitializing(false);
    setIsLoading(false);
  }

  const login = async (email, password) => {
    try {
      setIsLoading(true);
      const userCredential = await doSigninWithEmailAndPassword(
        email,
        password
      );
      return userCredential;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Rest of your functions stay the same...
  const register = async (userData) => {
    try {
      setIsLoading(true);
      const { email, password, firstName, lastName, username } = userData;

      console.log("Step 1: Creating Firebase user with:", {
        email,
        password: "hidden",
      });
      const userCredential = await doCreateUserWithEmailAndPassword(
        email,
        password
      );

      await updateProfile(userCredential.user, {
        displayName: `${firstName} ${lastName}`,
      });

      console.log("Step 2: Sending verification email...");
      await doSendEmailVerification();

      console.log("Step 3: Registering user with values:", {
        firstName,
        lastName,
        username: username || email,
      });

      const { registerUser } = await import("../features/auth/register");
      await registerUser(firstName, lastName, username || email);

      await signOut(auth);
      return userCredential;
    } catch (error) {
      console.error("Register error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const googleSignIn = async () => {
    try {
      setIsLoading(true);
      throw new Error("Google Sign-In not implemented yet");
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
  // Prevent concurrent logouts
  console.trace('logout called');
  if (isLoggingOutRef.current) {
    console.log('Logout already in progress — ignoring duplicate call');
    return;
  }
  setIsLoggingOut(true);
  isLoggingOutRef.current = true;
  setIsLoading(true);

  try {
      // Unregister push token before signing out
      if (pushTokenRef.current) {
        await unregisterPushNotifications(pushTokenRef.current);
        pushTokenRef.current = null;
      }

      // Use doSignOut which handles Google and Firebase sign-out
      // but avoid throwing if there's no authenticated user
      if (auth.currentUser) {
        await doSignOut();
      } else {
        console.log('No Firebase user found, skipping signOut()');
      }

      // Clear stored token
      try {
        await clearToken();
      } catch (e) {
        console.warn('Failed to clear token on logout:', e);
      }

      // Remove any axios default auth header
      try {
        delete axios.defaults.headers.common.Authorization;
      } catch (e) {
        /* ignore */
      }

      // Clear local state
      setCurrentUser(null);
      setUserLoggedIn(false);
      setUserData(null);

  console.log('User logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    } finally {
      setIsLoading(false);
      setIsLoggingOut(false);
      isLoggingOutRef.current = false;
    }
  };

  const getAuthErrorMessage = (errorCode) => {
    switch (errorCode) {
      case "auth/user-not-found":
        return "No account found with this email.";
      case "auth/wrong-password":
        return "Incorrect password.";
      case "auth/invalid-email":
        return "Invalid email address.";
      case "auth/email-already-in-use":
        return "An account with this email already exists.";
      case "auth/weak-password":
        return "Password should be at least 6 characters.";
      default:
        return "An error occurred. Please try again.";
    }
  };

  const value = {
    user: currentUser,
    isLoading,
    initializing,
    login,
    register,
    googleSignIn,
    logout,
    getAuthErrorMessage,
    currentUser,
    userLoggedIn,
    userData,
    isVerified: userData?.isVerified || false,
    getStoredToken
  };

  return (
    <AuthContext.Provider value={value}>
      {!initializing && children}
    </AuthContext.Provider>
  );
};
