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
  } = useForm();

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // Watch password for validation
  const watchPassword = watch("password");

  // Email/Password Signup
  const handleEmailSignup = async (data) => {
    if (!isRegistering) {
      setIsRegistering(true);
      try {
        // Check if passwords match
        if (data.password !== data.confirmPassword) {
          Alert.alert(
            "Password Mismatch",
            "Passwords do not match. Please try again."
          );
          setIsRegistering(false);
          return;
        }

        console.log("Step 1: Creating Firebase user");
        await doCreateUserWithEmailAndPassword(data.email, data.password);

        console.log("Step 2: Sending verification email");
        await doSendEmailVerification();

        console.log("Step 3: Registering user in backend");
        try {
          await registerUser(
            data.firstName,
            data.lastName,
            data.email,
            data.username || null
          );
        } catch (registerError) {
          console.error("Backend registration error:", registerError);
          // Continue even if backend registration fails
        }

        console.log("Step 4: Signing out to prevent auto-login");
        console.trace('doSignOut called from useSignup.handleEmailSignup');
        await doSignOut();

        // Wait for sign out to complete
        await new Promise((resolve) => setTimeout(resolve, 500));

        console.log("Step 5: Registration complete");

        setIsRegistering(false);
        Alert.alert(
          "Account Created Successfully!",
          "A verification email has been sent to your email address. Please verify your email before logging in.",
          [
            {
              text: "OK",
              onPress: () => router.replace("/auth"),
            },
          ]
        );
      } catch (error) {
        console.error("Signup error:", error);

        // Sign out on error
        try {
          console.trace('doSignOut called from useSignup.errorHandler (email signup)');
          await doSignOut();
        } catch (signOutError) {
          console.log("Sign out error:", signOutError);
        }

        setIsRegistering(false);
        Alert.alert(
          "Signup Failed",
          getAuthErrorMessage(error.code) || error.message
        );
      }
    }
  };

  // Google Sign Up
  const handleGoogleSignup = async () => {
    if (!isRegistering) {
      setIsRegistering(true);
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
          // Continue even if backend registration fails
        }

        // Sign out after registration
        console.trace('doSignOut called from useSignup.handleGoogleSignup');
        await doSignOut();

        // Wait for sign out to complete
        await new Promise((resolve) => setTimeout(resolve, 500));

        setIsRegistering(false);
        Alert.alert(
          "Account Created Successfully!",
          "Your Google account has been registered. Please login to continue.",
          [
            {
              text: "OK",
              onPress: () => router.replace("/auth"),
            },
          ]
        );
      } catch (error) {
        console.error("Google Sign-In error:", error);

        // Sign out on error
        try {
          console.trace('doSignOut called from useSignup.errorHandler (google signup)');
          await doSignOut();
        } catch (signOutError) {
          console.log("Sign out error:", signOutError);
        }

        setIsRegistering(false);
        Alert.alert(
          "Google Sign-In Failed",
          getAuthErrorMessage(error.code) || error.message
        );
      }
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return {
    // Form
    control,
    errors,
    handleSubmit,
    watchPassword,

    // UI state
    showPassword,
    showConfirmPassword,
    isRegistering,

    // Actions
    handleEmailSignup,
    handleGoogleSignup,
    togglePasswordVisibility,
    toggleConfirmPasswordVisibility,
  };
};