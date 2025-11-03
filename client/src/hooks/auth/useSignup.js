import { useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form"; // ← React Hook Form imported HERE
import { useAuth } from "@/context/authContext";
import {
  doCreateUserWithEmailAndPassword,
  doSignInWithGoogle,
  doSendEmailVerification,
  doSignOut,
} from "@/firebase/auth";
import { registerUser } from "@/features/auth/register";
import toast from "react-hot-toast";

export const useSignup = () => {
  const { userLoggedIn } = useAuth();
  const navigate = useNavigate();
  
  // UI state
  const [isRegistering, setIsRegistering] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // React Hook Form setup - THIS IS THE KEY PART
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
    trigger,
    getValues,
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
        console.log("Step 1: Creating Firebase user");
        await doCreateUserWithEmailAndPassword(data.email, data.password);
        
        console.log("Step 2: Sending verification email");
        await doSendEmailVerification();
        
        console.log("Step 3: Registering user");
        await registerUser(
          data.firstName,
          data.lastName,
          data.username || data.email
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
        const user = result.user;
        const displayName = user.displayName || "";
        const nameParts = displayName.split(" ");
        const googleFirstName = nameParts[0] || "";
        const googleLastName = nameParts.slice(1).join(" ") || "";
        const googleUsername = user.email;

        await registerUser(googleFirstName, googleLastName, googleUsername);
        
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

  // RETURN React Hook Form methods + custom handlers
  return {
    // React Hook Form methods
    register,
    handleSubmit,
    errors,
    password,
    trigger,
    getValues,
    
    // Custom state
    isRegistering,
    errorMessage,
    userLoggedIn,
    
    // Custom handlers
    handleEmailSignup,
    handleGoogleSignup,
  };
};