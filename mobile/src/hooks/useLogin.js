import { useState, useEffect, useRef } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { useForm } from "react-hook-form";
import { useAuth } from "context/authContext";
import {
  doSigninWithEmailAndPassword,
  doSignInWithGoogle,
  doSignOut,
} from "@firebaseApp/auth";
import apiClient from "../api/apiClient";
import { clearAllStoredActiveProfileIds } from "../features/auth/profileSession";
import { clearAllStoredProfilePinTokens } from "../features/auth/profilePinSession";

const ADMIN_ROLES = new Set(['secretary', 'supervising_lawyer', 'director', 'intern']);

export const useNativeLogin = () => {
  const router = useRouter();
  const {
    getAuthErrorMessage,
    userData,
    userLoggedIn,
    loading,
    pinStatusLoading,
    accountData,
    requiresProfileSelection,
    requiresPinSetup,
    requiresPinVerification,
  } = useAuth();
  const hasNavigated = useRef(false);

  // Form state
  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm();

  // UI state
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!userLoggedIn || loading || pinStatusLoading || hasNavigated.current) {
      return;
    }

    if (accountData && !accountData.isVerified) {
      Alert.alert(
        'Email Not Verified',
        'Please verify your email before logging in. Check your inbox for the verification link.'
      );
      doSignOut();
      setIsSigningIn(false);
      return;
    }

    if (requiresProfileSelection) {
      hasNavigated.current = true;
      setIsSigningIn(false);
      router.replace('/auth/profiles');
      return;
    }

    if (requiresPinSetup || requiresPinVerification) {
      hasNavigated.current = true;
      setIsSigningIn(false);
      router.replace('/auth/profile-pin');
      return;
    }

    if (userData) {
      if (!ADMIN_ROLES.has(userData.role)) {
        Alert.alert(
          'Account Pending',
          'Your account is pending approval. An administrator will review and assign your role. Please check back later.',
          [{ text: 'OK', onPress: () => doSignOut() }]
        );
        return;
      }

      hasNavigated.current = true;
      setIsSigningIn(false);
      router.replace('/admin');
      return;
    }

    if (!userData && !requiresProfileSelection && !requiresPinSetup && !requiresPinVerification) {
      setIsSigningIn(false);
      if (!errorMessage) {
        setErrorMessage("We couldn't load the staff profiles for this account yet.");
      }
    }
  }, [
    userLoggedIn,
    userData,
    loading,
    pinStatusLoading,
    accountData,
    requiresProfileSelection,
    requiresPinSetup,
    requiresPinVerification,
    errorMessage,
    router,
  ]);

  const resetLoginState = async () => {
    await clearAllStoredActiveProfileIds();
    await clearAllStoredProfilePinTokens();
    setIsSigningIn(true);
    setErrorMessage('');
    hasNavigated.current = false;
  };

  const handleEmailLogin = async (data) => {
    if (isSigningIn) return;

    try {
      await resetLoginState();

      let emailToUse = data.email;

      if (!data.email.includes('@')) {
        try {
          const response = await apiClient.post('/auth/get-email-from-username', {
            username: data.email,
          });
          if (response.data.success) {
            emailToUse = response.data.email;
          } else {
            throw new Error('Username not found');
          }
        } catch (error) {
          setErrorMessage('Username not found. Please check your credentials.');
          setIsSigningIn(false);
          return;
        }
      }

      const userCredential = await doSigninWithEmailAndPassword(emailToUse, data.password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        Alert.alert(
          'Email Not Verified',
          'Please verify your email before logging in. Check your inbox for the verification link.'
        );
        await doSignOut();
        setIsSigningIn(false);
        return;
      }

      // Navigation continues in useEffect after auth context refresh.
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error.code) || error.message);
      setIsSigningIn(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (isSigningIn) return;

    try {
      await resetLoginState();

      const result = await doSignInWithGoogle();
      const signedUser = result?.user;

      if (signedUser && !signedUser.emailVerified) {
        Alert.alert(
          'Email Not Verified',
          'Please verify your email before logging in. Check your inbox for the verification link.'
        );
        await doSignOut();
        setIsSigningIn(false);
        return;
      }
    } catch (error) {
      let msg = "An error occurred during Google Sign-In";
      if (error.message?.includes("cancelled") || error.code === "12501") {
        msg = "";
      } else if (error.code === "auth/network-request-failed") {
        msg = "Network error. Please check your connection.";
      } else if (error.code === "DEVELOPER_ERROR") {
        msg = "Configuration error. Please contact support.";
      }
      if (msg) setErrorMessage(msg);
      setIsSigningIn(false);
    }
  };

  return {
    control,
    errors,
    handleSubmit,
    loading: isSigningIn,
    errorMessage,
    handleEmailLogin,
    handleGoogleSignIn,
  };
};