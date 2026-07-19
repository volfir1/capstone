import { useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { GoogleAuthProvider } from "firebase/auth";
import toast from "react-hot-toast";

import { useAuth } from "@/context/authContext";
import {
  doCreateUserWithEmailAndPassword,
  doSendEmailVerification,
  doSignInWithGoogle,
  doSignOut,
} from "@/firebase/auth";
import { registerUser } from "@features/auth/register";

export const useSignup = () => {
  const { userLoggedIn } = useAuth();
  const navigate = useNavigate();

  const [isRegistering, setIsRegistering] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    mode: "onBlur",
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const password = watch("password");

const handleEmailSignup = async (data) => {
  if (isRegistering) return false;
  setIsRegistering(true);
  setErrorMessage("");

  try {
    await doCreateUserWithEmailAndPassword(data.email, data.password);
    await doSendEmailVerification();
    await new Promise((resolve) => setTimeout(resolve, 1200));
    
    await registerUser({ email: data.email }); // ✅ fires first, no auth needed
    await doSignOut(); // ✅ THEN sign out

    toast.success("Account created. Verify the email first, then sign in.");
    reset();
    navigate("/auth/admin");
    return true;
  } catch (error) {
    console.error("Registration error:", error);
    setErrorMessage(error.message || "Registration failed");
    setIsRegistering(false);
    toast.error("Registration failed");
    return false;
  }
};

  const handleGoogleSignup = async (event) => {
    event.preventDefault();
    if (isRegistering) return;

    setIsRegistering(true);
    setErrorMessage("");

    try {
      const result = await doSignInWithGoogle();

      try {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const accessToken = credential?.accessToken;
        if (accessToken) sessionStorage.setItem("googleAccessToken", accessToken);
      } catch (credentialError) {
        console.warn("Failed to extract Google credential on signup", credentialError);
      }

      const idToken = await result.user.getIdToken();
      await registerUser({ idToken });

      toast.success("Account created. Choose or create a staff profile next.");
      reset();
      navigate("/auth/profiles");
    } catch (error) {
      console.error("Google signup error:", error);
      setErrorMessage(error.message || "Google sign-up failed");
      setIsRegistering(false);
      toast.error("Registration failed");
    }
  };

  return {
    register,
    handleSubmit,
    errors,
    password,
    isRegistering,
    errorMessage,
    userLoggedIn,
    onSubmit: handleEmailSignup,
    onGoogleSignup: handleGoogleSignup,
  };
};
