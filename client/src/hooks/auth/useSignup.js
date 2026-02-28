import { useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { useAuth } from "@/context/authContext";
import toast from "react-hot-toast";
import {
  doCreateUserWithEmailAndPassword,
  doSignInWithGoogle,
  doSendEmailVerification,
  doSignOut,
} from "@/firebase/auth";
import { GoogleAuthProvider } from 'firebase/auth';
import { registerUser } from "@features/auth/register";

export const useSignup = () => {
  const { userLoggedIn } = useAuth();
  const navigate = useNavigate();
  
  // UI state
  const [isRegistering, setIsRegistering] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    trigger,      // ← Add this
    getValues,    // ← Add this
  } = useForm({
    mode: "onBlur",
    defaultValues: {
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Watch password for confirm password validation
  const password = watch("password");

  // Email/Password Registration
const handleEmailSignup = async (data) => {
  if (!isRegistering) {
    setIsRegistering(true);
    setErrorMessage("");
    
    try {
      console.log("Form data received:", data);
      
      console.log("Step 1: Creating Firebase user");
      await doCreateUserWithEmailAndPassword(data.email, data.password);
      
      console.log("Step 2: Sending verification email");
      await doSendEmailVerification();
      
      // ← Add 1-2 second delay to ensure Firebase user is fully created
      console.log("Step 3: Waiting for Firebase to sync...");
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log("Step 4: Registering user in backend");
      console.log("Calling registerUser with:", {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        username: data.username || null
      });
      
      await registerUser(
        data.firstName,
        data.lastName,
        data.email,
        data.username || null
      );

      await doSignOut();
      toast.success("Account created! Please verify your email before signing in.");
      reset();
      navigate("/login");
    } catch (error) {
      console.error("Registration error:", error);
      setErrorMessage(error.message);
      setIsRegistering(false);
      toast.error("Registration failed!");
    }
  }
};

  // Google Sign Up
  const handleGoogleSignup = async (e) => {
    e.preventDefault();
    if (!isRegistering) {
      setIsRegistering(true);
      setErrorMessage("");
      
      try {
        const result = await doSignInWithGoogle();
        // try to cache access token for later calendar operations
        try {
          const credential = GoogleAuthProvider.credentialFromResult(result);
          const accessToken = credential?.accessToken;
          if (accessToken) localStorage.setItem('googleAccessToken', accessToken);
        } catch (credErr) {
          console.warn('Failed to extract Google credential on signup', credErr);
        }
        const user = result.user;
        const displayName = user.displayName || "";
        const nameParts = displayName.split(" ");
        const googleFirstName = nameParts[0] || "";
        const googleLastName = nameParts.slice(1).join(" ") || "";

        await registerUser(
          googleFirstName, 
          googleLastName, 
          user.email,
          null
        );
        
        toast.success("Account created successfully!");
        reset();
        navigate("/login");
      } catch (err) {
        console.error("Google sign-in error:", err);
        setErrorMessage(err.message);
        setIsRegistering(false);
        toast.error("Registration failed!");
      }
    }
  };

  return {
    // React Hook Form methods
    register,
    handleSubmit,
    errors,
    trigger,      // ← Export this
    getValues,    // ← Export this
    password,     // ← Export this for password matching

    // Custom state
    isRegistering,
    errorMessage,
    userLoggedIn,

    // Custom handlers
    // provide aliases expected by the SignupForm consumer
    onSubmit: handleEmailSignup,
    onGoogleSignup: handleGoogleSignup,
    // also keep original names for compatibility
    handleEmailSignup,
    handleGoogleSignup,
  };
};