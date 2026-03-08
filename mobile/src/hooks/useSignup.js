import { useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { useForm } from "react-hook-form";
import { useAuth } from "context/authContext";
import {
  doCreateUserWithEmailAndPassword,
  doSignInWithGoogle,
  doSendEmailVerification,
  doSignOut,
} from "@firebaseApp/auth";
import { registerUser } from "features/auth/register";

export const useSignup = () => {
  const router = useRouter();
  const { getAuthErrorMessage } = useAuth();

  // Form state
  const {
    handleSubmit,
    control,
    formState: { errors },
    watch,
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

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Watch password for validation
  const watchPassword = watch("password");

  // Email/Password Signup
  const handleEmailSignup = async (data) => {
    if (!isRegistering) {
      setIsRegistering(true);
      setErrorMessage("");
      try {
        await doCreateUserWithEmailAndPassword(data.email, data.password);
        await doSendEmailVerification();

        // Wait for Firebase to sync
        await new Promise((resolve) => setTimeout(resolve, 2000));

        try {
          await registerUser(
            data.firstName,
            data.lastName,
            data.email,
            data.username || null
          );
        } catch (registerError) {
          console.error("Backend registration error:", registerError);
        }

        await doSignOut();
        await new Promise((resolve) => setTimeout(resolve, 500));

        setIsRegistering(false);
        Alert.alert(
          "Account Created Successfully!",
          "A verification email has been sent to your email address. Please verify your email before logging in.",
          [{ text: "OK", onPress: () => router.replace("/auth") }]
        );
      } catch (error) {
        try { await doSignOut(); } catch (e) {}
        setIsRegistering(false);
        setErrorMessage(getAuthErrorMessage(error.code) || error.message);
      }
    }
  };

  // Google Sign Up
  const handleGoogleSignup = async () => {
    if (!isRegistering) {
      setIsRegistering(true);
      setErrorMessage("");
      try {
        const result = await doSignInWithGoogle();
        const user = result.user;
        const displayName = user.displayName || "";
        const nameParts = displayName.split(" ");
        const googleFirstName = nameParts[0] || "";
        const googleLastName = nameParts.slice(1).join(" ") || "N/A";

        try {
          await registerUser(googleFirstName, googleLastName, user.email, null);
        } catch (registerError) {
          console.error("Backend registration error:", registerError);
        }

        await doSignOut();
        await new Promise((resolve) => setTimeout(resolve, 500));

        setIsRegistering(false);
        Alert.alert(
          "Account Created Successfully!",
          "Your Google account has been registered. Please login to continue.",
          [{ text: "OK", onPress: () => router.replace("/auth") }]
        );
      } catch (error) {
        try { await doSignOut(); } catch (e) {}
        setIsRegistering(false);
        setErrorMessage(getAuthErrorMessage(error.code) || error.message);
      }
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

  return {
    control,
    errors,
    handleSubmit,
    watchPassword,
    trigger,
    getValues,
    showPassword,
    showConfirmPassword,
    isRegistering,
    errorMessage,
    handleEmailSignup,
    handleGoogleSignup,
    togglePasswordVisibility,
    toggleConfirmPasswordVisibility,
  };
};