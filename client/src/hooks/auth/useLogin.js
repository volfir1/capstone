import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import { GoogleAuthProvider } from "firebase/auth";

import { useAuth } from "@/context/authContext";
import apiClient from "@config/api/apiClient";
import {
  doSignInWithGoogle,
  doSigninWithEmailAndPassword,
  doSignOut,
} from "@/firebase/auth";
import {
  failNotif,
  successNotif,
  verificationNotif,
} from "@utils/notification";
import { clearAllStoredActiveProfileIds } from "@/features/auth/profileSession";
import { clearAllStoredProfilePinTokens } from "@/features/auth/profilePinSession";

export const useLogin = () => {
  const {
    userLoggedIn,
    userData,
    accountData,
    loading,
    requiresProfileSelection,
    requiresPinSetup,
    requiresPinVerification,
  } = useAuth();
  const navigate = useNavigate();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [hasNavigated, setHasNavigated] = useState(false);

  const notificationShown = useRef(false);
  const verificationNotified = useRef(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    mode: "onBlur",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (!userLoggedIn || loading || hasNavigated) {
      return;
    }

    if (accountData && !accountData.isVerified) {
      if (!verificationNotified.current) {
        verificationNotif();
        verificationNotified.current = true;
      }
      doSignOut();
      setIsSigningIn(false);
      setHasNavigated(false);
      notificationShown.current = false;
      return;
    }

    if (requiresProfileSelection) {
      if (!notificationShown.current) {
        successNotif();
        notificationShown.current = true;
      }
      setHasNavigated(true);
      setIsSigningIn(false);
      navigate("/auth/profiles", { replace: true });
      return;
    }

    if (requiresPinSetup || requiresPinVerification) {
      if (!notificationShown.current) {
        successNotif();
        notificationShown.current = true;
      }
      setHasNavigated(true);
      setIsSigningIn(false);
      navigate("/auth/profile-pin", { replace: true });
      return;
    }

    if (userData) {
      if (!notificationShown.current) {
        successNotif();
        notificationShown.current = true;
      }

      setHasNavigated(true);
      NProgress.start();
      NProgress.set(0.4);

      const timer = setTimeout(() => {
        NProgress.set(0.8);
        navigate("/admin", { replace: true });
        NProgress.done();
        setIsSigningIn(false);
        notificationShown.current = false;
        verificationNotified.current = false;
      }, 1500);

      return () => {
        clearTimeout(timer);
        NProgress.done();
      };
    }

    if (!userData && !requiresProfileSelection && !requiresPinSetup && !requiresPinVerification) {
      setIsSigningIn(false);
      if (!errorMessage) {
        setErrorMessage("We couldn't load the staff profiles for this account yet.");
      }
    }

    return undefined;
  }, [
    userLoggedIn,
    userData,
    accountData,
    loading,
    requiresProfileSelection,
    requiresPinSetup,
    requiresPinVerification,
    hasNavigated,
    navigate,
    errorMessage,
  ]);

  const resetLoginState = () => {
    clearAllStoredActiveProfileIds();
    clearAllStoredProfilePinTokens();
    setIsSigningIn(true);
    setErrorMessage("");
    setHasNavigated(false);
    notificationShown.current = false;
    verificationNotified.current = false;
  };

  const handleEmailSignIn = async (data) => {
    if (isSigningIn) return;

    resetLoginState();

    try {
      let emailToUse = data.email;

      if (!data.email.includes("@")) {
        const response = await apiClient.post("/auth/get-email-from-username", {
          username: data.email,
        });

        if (response.data.success) {
          emailToUse = response.data.email;
        } else {
          throw new Error("Username not found");
        }
      }

      const signInResult = await doSigninWithEmailAndPassword(emailToUse, data.password);
      const signedUser = signInResult?.user;

      if (signedUser && !signedUser.emailVerified) {
        if (!verificationNotified.current) {
          verificationNotif();
          verificationNotified.current = true;
        }
        await doSignOut();
        setIsSigningIn(false);
      }
    } catch (error) {
      console.error("Sign in error:", error);
      setErrorMessage(error.message || "Sign in failed");
      setIsSigningIn(false);
      failNotif();
    }
  };

  const handleGoogleSignIn = async (event) => {
    event.preventDefault();
    if (isSigningIn) return;

    resetLoginState();

    try {
      const TIMEOUT_MS = 2000;
      const result = await Promise.race([
        doSignInWithGoogle(),
        new Promise((resolve) => setTimeout(() => resolve({ __timeout: true }), TIMEOUT_MS)),
      ]);

      if (result && result.__timeout) {
        setIsSigningIn(false);
        return;
      }

      try {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const accessToken = credential?.accessToken;
        if (accessToken) {
          sessionStorage.setItem("googleAccessToken", accessToken);
        }
      } catch (credentialError) {
        console.warn("Failed to extract Google credential from result", credentialError);
      }

      const signedUser = result?.user;
      if (signedUser && !signedUser.emailVerified) {
        if (!verificationNotified.current) {
          verificationNotif();
          verificationNotified.current = true;
        }
        await doSignOut();
        setIsSigningIn(false);
      }
    } catch (error) {
      console.error("Google sign-in error:", error);
      const code = error?.code || "";
      const isPopupCancelled =
        code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request";

      if (isPopupCancelled) {
        setErrorMessage("");
        setIsSigningIn(false);
        return;
      }

      setErrorMessage(error.message || "Google sign-in failed");
      setIsSigningIn(false);
      failNotif();
    }
  };

  return {
    register,
    handleSubmit,
    errors,
    isSigningIn,
    errorMessage,
    handleEmailSignIn,
    handleGoogleSignIn,
  };
};
