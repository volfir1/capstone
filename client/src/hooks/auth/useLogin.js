import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { useAuth } from "@/context/authContext";
import apiClient from "@config/api/apiClient";
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import {
  doSigninWithEmailAndPassword,
  doSignInWithGoogle,
  doSignOut,
} from "@/firebase/auth";
import { GoogleAuthProvider } from 'firebase/auth';
import {
  successNotif,
  failNotif,
  verificationNotif,
  pendingRoleNotif,
  welcomeNotif,
} from "@utils/notification";

export const useLogin = () => {
  const { userLoggedIn, userData, loading } = useAuth();
  const navigate = useNavigate();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [hasNavigated, setHasNavigated] = useState(false);
  const notificationShown = useRef(false); // Add this ref
  const verificationNotified = useRef(false);
  const pendingNotified = useRef(false);
  
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

  // Handle navigation after successful login
  useEffect(() => {
    console.log('useEffect triggered:', { userLoggedIn, hasUserData: !!userData, loading, hasNavigated });

    // Handle the case where Firebase reports a logged-in user but backend user data
    // is missing after loading finishes — treat as unverified and stop the loading state.
    if (userLoggedIn && !loading && !userData && !hasNavigated) {
      console.log('Detected logged-in but no backend userData after loading — treating as unverified');
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

    if (userLoggedIn && userData && !hasNavigated) {
      console.log('Inside navigation logic');
      
      if (!userData.isVerified) {
        console.log('User not verified');
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
        verificationNotified.current = false; // allow verification notif again on a fresh attempt
        pendingNotified.current = false; // allow pending notif again on a fresh attempt
      // If user's role is the default `user`, treat as pending and prevent access
      if (userData.role === 'user') {
        console.log('User role is `user` (pending) — notifying and signing out');
        if (!pendingNotified.current) {
          pendingRoleNotif();
          pendingNotified.current = true;
        }
        doSignOut();
        setIsSigningIn(false);
        setHasNavigated(false);
        notificationShown.current = false;
        return;
      }

      // Only show notification once
      if (!notificationShown.current) {
        console.log('Starting 3 second delay...');
        successNotif();
        notificationShown.current = true; // Mark as shown
      }
      
      setHasNavigated(true);
      
      // Start the progress bar
      NProgress.start();
      NProgress.set(0.3);

      const timer = setTimeout(() => {
        console.log('3 seconds passed, navigating now...');
        NProgress.set(0.7);
        welcomeNotif(userData.firstName);

        // Redirect all authenticated users to /admin
        console.log('Navigating to /admin (global redirect)');
        navigate("/admin", { replace: true });

        NProgress.done();
        setIsSigningIn(false);
        notificationShown.current = false; // Reset for next login
        verificationNotified.current = false;
        pendingNotified.current = false;
      }, 3000);

      return () => {
        console.log('Cleanup: clearing timer');
        clearTimeout(timer);
        NProgress.done();
      };
    }
  }, [userLoggedIn, userData, navigate]);

  // Email/Password Sign In
  const handleEmailSignIn = async (data) => {
    if (isSigningIn) return;

    setIsSigningIn(true);
    setErrorMessage("");
    setHasNavigated(false);
    notificationShown.current = false; // Reset on new login attempt
    verificationNotified.current = false;
    pendingNotified.current = false;
    verificationNotified.current = false;

    try {
      let emailToUse = data.email;
      console.log('Login attempt with input:', data.email);

      // Check if the input is a username (doesn't contain @)
      if (!data.email.includes('@')) {
        console.log('Input is username, fetching email...');
        try {
          const response = await apiClient.post('/auth/get-email-from-username', {
            username: data.email,
          });

          console.log('Username lookup response:', response.data);

          if (response.data.success) {
            emailToUse = response.data.email;
            console.log('Using email:', emailToUse);
          } else {
            throw new Error('Username not found');
          }
        } catch (error) {
          console.error('Username lookup error:', error);
          setErrorMessage('Username not found. Please check your credentials.');
          setIsSigningIn(false);
          failNotif();
          return;
        }
      }

      console.log('Attempting Firebase sign in with email:', emailToUse);
      await doSigninWithEmailAndPassword(emailToUse, data.password);
      console.log('Firebase sign in successful');
    } catch (error) {
      console.error('Sign in error:', error);
      setErrorMessage(error.message);
      setIsSigningIn(false);
      failNotif();
    }
  };

  // Google Sign In
  const handleGoogleSignIn = async (e) => {
    e.preventDefault();
    if (isSigningIn) return;

    setIsSigningIn(true);
    setErrorMessage("");
    setHasNavigated(false);
    notificationShown.current = false; // Reset on new login attempt
    verificationNotified.current = false; // allow verification notif again on a fresh attempt
    pendingNotified.current = false; // allow pending notif again on a fresh attempt
    verificationNotified.current = false; // allow verification notif again on a fresh attempt

    try {
      const TIMEOUT_MS = 2000; // shorten waiting time for popup cancellation
      const result = await Promise.race([
        doSignInWithGoogle(),
        new Promise((resolve) => setTimeout(() => resolve({ __timeout: true }), TIMEOUT_MS)),
      ]);

      if (result && result.__timeout) {
        // Likely the user closed the popup or the flow is taking too long — reset loading state.
        setErrorMessage("");
        setIsSigningIn(false);
        return;
      }

      // Attempt to extract the OAuth access token from the popup result and cache it locally
      try {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const accessToken = credential?.accessToken;
        if (accessToken) {
          localStorage.setItem('googleAccessToken', accessToken);
        }
      } catch (credErr) {
        // ignore if credential extraction fails
        console.warn('Failed to extract Google credential from result', credErr);
      }
    } catch (err) {
      console.error("Google sign-in error:", err);
      // If the user closed the popup or cancelled the OAuth flow, treat it as a cancellation
      // and simply reset the loading state without showing an error notification.
      const code = err?.code || "";
      const isPopupCancelled = code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request";

      if (isPopupCancelled) {
        setErrorMessage("");
        setIsSigningIn(false);
        return;
      }

      setErrorMessage(err.message || "Google sign-in failed");
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