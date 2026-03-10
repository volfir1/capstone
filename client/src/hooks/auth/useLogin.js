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
  const notificationShown = useRef(false);
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

  useEffect(() => {
    console.log('useEffect triggered:', { userLoggedIn, hasUserData: !!userData, loading, hasNavigated });

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

      verificationNotified.current = false;
      pendingNotified.current = false;

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

      if (!notificationShown.current) {
        console.log('Starting 3 second delay...');
        successNotif();
        notificationShown.current = true;
      }
      
      setHasNavigated(true);
      
      NProgress.start();
      NProgress.set(0.3);

      const timer = setTimeout(() => {
        console.log('3 seconds passed, navigating now...');
        NProgress.set(0.7);
        welcomeNotif(userData.firstName);

        console.log('Navigating to /admin (global redirect)');
        navigate("/admin", { replace: true });

        NProgress.done();
        setIsSigningIn(false);
        notificationShown.current = false;
        verificationNotified.current = false;
        pendingNotified.current = false;
      }, 3000);

      return () => {
        console.log('Cleanup: clearing timer');
        clearTimeout(timer);
        NProgress.done();
      };
    }
  }, [userLoggedIn, userData, loading, navigate]);

  // Email/Password Sign In
  const handleEmailSignIn = async (data) => {
    if (isSigningIn) return;

    setIsSigningIn(true);
    setErrorMessage("");
    setHasNavigated(false);
    notificationShown.current = false;
    verificationNotified.current = false;
    pendingNotified.current = false;

    try {
      let emailToUse = data.email;
      console.log('Login attempt with input:', data.email);

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
      const signInResult = await doSigninWithEmailAndPassword(emailToUse, data.password);
      console.log('Firebase sign in successful', signInResult?.user?.email);

      try {
        const signedUser = signInResult?.user;
        if (signedUser && !signedUser.emailVerified) {
          console.log('Email not verified (immediate check) - notifying and signing out');
          if (!verificationNotified.current) {
            verificationNotif();
            verificationNotified.current = true;
          }
          await doSignOut();
          setIsSigningIn(false);
          return;
        }
      } catch (vErr) {
        console.warn('Error checking emailVerified on sign in result', vErr);
      }

      try {
        const profileResp = await apiClient.get('/user/profile');
        const profile = profileResp?.data?.data;
        if (profile && profile.role === 'user') {
          console.log('Backend role is `user` (pending) - notifying and signing out');
          if (!pendingNotified.current) {
            pendingRoleNotif();
            pendingNotified.current = true;
          }
          await doSignOut();
          setIsSigningIn(false);
          return;
        }
      } catch (profileErr) {
        console.warn('Immediate profile fetch failed; will wait for authContext to load userData', profileErr?.message || profileErr);
      }

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
    notificationShown.current = false;
    verificationNotified.current = false;
    pendingNotified.current = false;

    try {
      const TIMEOUT_MS = 2000;
      const result = await Promise.race([
        doSignInWithGoogle(),
        new Promise((resolve) => setTimeout(() => resolve({ __timeout: true }), TIMEOUT_MS)),
      ]);

      if (result && result.__timeout) {
        setErrorMessage("");
        setIsSigningIn(false);
        return;
      }

      try {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const accessToken = credential?.accessToken;
        if (accessToken) {
          sessionStorage.setItem('googleAccessToken', accessToken);
        }
      } catch (credErr) {
        console.warn('Failed to extract Google credential from result', credErr);
      }

      try {
        const signedUser = result?.user;
        if (signedUser && !signedUser.emailVerified) {
          console.log('Google account email not verified (immediate check) - notifying and signing out');
          if (!verificationNotified.current) {
            verificationNotif();
            verificationNotified.current = true;
          }
          await doSignOut();
          setIsSigningIn(false);
          return;
        }
      } catch (vErr) {
        console.warn('Error checking emailVerified on Google sign in result', vErr);
      }

      try {
        const profileResp = await apiClient.get('/user/profile');
        const profile = profileResp?.data?.data;
        if (profile && profile.role === 'user') {
          console.log('Backend role is `user` (pending) after Google sign-in - notifying and signing out');
          if (!pendingNotified.current) {
            pendingRoleNotif();
            pendingNotified.current = true;
          }
          await doSignOut();
          setIsSigningIn(false);
          return;
        }
      } catch (profileErr) {
        console.warn('Immediate profile fetch failed after Google sign-in; will wait for authContext to load userData', profileErr?.message || profileErr);
      }

    } catch (err) {
      console.error("Google sign-in error:", err);
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