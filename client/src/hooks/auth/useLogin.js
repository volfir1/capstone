import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { useAuth } from "@/context/authContext";
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import {
  doSigninWithEmailAndPassword,
  doSignInWithGoogle,
  doSignOut,
} from "@/firebase/auth";
import {
  successNotif,
  failNotif,
  verificationNotif,
  welcomeNotif,
} from "@utils/notification";

export const useLogin = () => {
  const { userLoggedIn, userData } = useAuth();
  const navigate = useNavigate();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [hasNavigated, setHasNavigated] = useState(false);
  const notificationShown = useRef(false); // Add this ref
  
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
    console.log('useEffect triggered:', { userLoggedIn, hasUserData: !!userData, hasNavigated });
    
    if (userLoggedIn && userData && !hasNavigated) {
      console.log('Inside navigation logic');
      
      if (!userData.isVerified) {
        console.log('User not verified');
        verificationNotif();
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

        if (userData.role === "secretary") {
          console.log('Navigating to /admin');
          navigate("/admin", { replace: true });
        } else if (userData.role === "intern") {
          console.log('Navigating to /intern');
          navigate("/intern", { replace: true });
        } else {
          console.log('Navigating to /user/home');
          navigate("/user/home", { replace: true });
        }

        NProgress.done();
        setIsSigningIn(false);
        notificationShown.current = false; // Reset for next login
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

    try {
      await doSigninWithEmailAndPassword(data.email, data.password);
    } catch (error) {
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

    try {
      await doSignInWithGoogle();
    } catch (err) {
      console.error("Google sign-in error:", err);
      setErrorMessage(err.message);
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