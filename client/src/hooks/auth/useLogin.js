import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form"; // ← React Hook Form imported HERE
import { useAuth } from "@/context/authContext";
import {
  doSigninWithEmailAndPassword,
  doSignInWithGoogle,
  doSignOut,
} from "@/firebase/auth";
import { successNotif, failNotif, verificationNotif } from "@utils/notification";

export const useLogin = () => {
  const { userLoggedIn, userData } = useAuth();
  const navigate = useNavigate();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [hasNavigated, setHasNavigated] = useState(false);

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    mode: "onBlur",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Handle navigation after successful login
  useEffect(() => {
    // Only navigate if we haven't navigated yet and user is logged in with data
    if (userLoggedIn && userData && !hasNavigated) {
      if (!userData.isVerified) {
        verificationNotif();
        doSignOut();
        setIsSigningIn(false);
        setHasNavigated(false);
        return;
      }
      
      successNotif();
      setHasNavigated(true); // Mark that we've handled this login
      
      // Navigate based on role
      if (userData.role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/user/home", { replace: true });
      }
      
      setIsSigningIn(false);
    }
  }, [userLoggedIn, userData, navigate, hasNavigated]);

  // Email/Password Sign In
  const handleEmailSignIn = async (data) => {
    if (!isSigningIn) {
      setIsSigningIn(true);
      setErrorMessage("");
      setHasNavigated(false); // Reset navigation flag for new login attempt
      
      try {
        await doSigninWithEmailAndPassword(data.email, data.password);
        // Note: Navigation is handled by the useEffect above
      } catch (error) {
        setErrorMessage(error.message);
        setIsSigningIn(false);
        failNotif();
      }
    }
  };

  // Google Sign In
  const handleGoogleSignIn = async (e) => {
    e.preventDefault();
    if (!isSigningIn) {
      setIsSigningIn(true);
      setErrorMessage("");
      setHasNavigated(false); // Reset navigation flag for new login attempt
      
      try {
        const result = await doSignInWithGoogle();
        console.log("Google sign-in successful:", result.user.email);
        // Note: Navigation is handled by the useEffect above
      } catch (err) {
        console.error("Google sign-in error:", err);
        setErrorMessage(err.message);
        setIsSigningIn(false);
        failNotif();
      }
    }
  };

  return {
    // React Hook Form methods
    register,
    handleSubmit,
    errors,
    
    // Custom state
    isSigningIn,
    errorMessage,
    
    // Custom handlers
    handleEmailSignIn,
    handleGoogleSignIn,
  };
};