import { useState, useEffect, useRef } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { useForm } from "react-hook-form";
import { sendEmailVerification } from "firebase/auth";
import { useAuth } from "context/authContext";
import {
  doSigninWithEmailAndPassword,
  doSignInWithGoogle,
  doSignOut,
} from "@firebaseApp/auth";

export const useNativeLogin = () => {
  const router = useRouter();
  const { getAuthErrorMessage, userData, userLoggedIn } = useAuth();
  const hasNavigated = useRef(false);

  // Form state
  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm();

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Handle navigation when user data is loaded
  useEffect(() => {
    if (userLoggedIn && userData && !hasNavigated.current) {
      console.log("User data loaded, navigating by role:", userData.role);
      hasNavigated.current = true;
      navigateByRole(userData.role);
    }
  }, [userLoggedIn, userData]);

  const navigateByRole = (role) => {
    const adminLikeRoles = ["admin", "attorney", "secretary", "pao_lawyer", "legal_volunteer", "intern", "supervising_lawyer", "director"];
    if (adminLikeRoles.includes(role)) {
      router.replace("/admin");
    } else {
      // Regular users see pending approval message (matches website behavior)
      Alert.alert(
        "Account Pending",
        "Your account is pending approval. An administrator will review and assign your role. Please check back later.",
        [{ text: "OK", onPress: async () => {
          try {
            await doSignOut();
          } catch (e) {
            console.log("Sign out error:", e);
          }
        }}]
      );
    }
  };

  // Email/Password Login
  const handleEmailLogin = async (data) => {
    try {
      setLoading(true);

      // Sign in with Firebase
      const userCredential = await doSigninWithEmailAndPassword(
        data.email,
        data.password
      );
      const user = userCredential.user;

      // Check if email is verified
      if (!user.emailVerified) {
        Alert.alert(
          "Email Not Verified",
          "Please verify your email before logging in. Check your inbox for the verification link.",
          [
            {
              text: "Resend Verification",
              onPress: async () => {
                try {
                  await sendEmailVerification(user);
                  Alert.alert(
                    "Verification Sent",
                    "A new verification email has been sent to your inbox."
                  );
                } catch (error) {
                  Alert.alert(
                    "Error",
                    "Failed to send verification email. Please try again."
                  );
                }
              },
            },
            {
              text: "OK",
              style: "default",
            },
          ]
        );
        await doSignOut();
    console.trace('doSignOut called from useLogin.handleEmailLogin after unverified email');
        setLoading(false);
        return;
      }

      console.log("Firebase verification passed, login successful");
      // Navigation will happen in useEffect
      setLoading(false);
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert("Login Failed", getAuthErrorMessage(error.code));
      setLoading(false);
    }
  };

  // Google Sign In
  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);

  await doSignInWithGoogle();
  console.trace('doSignInWithGoogle completed in useLogin.handleGoogleSignIn');
      console.log("Google Sign-In successful");
      // Navigation will happen in useEffect

      setLoading(false);
    } catch (error) {
      console.error("Google Sign-In error:", error);

      let errorMessage = "An error occurred during Google Sign-In";

      if (error.message?.includes("cancelled") || error.code === "12501") {
        errorMessage = "Sign-in cancelled";
      } else if (error.code === "auth/network-request-failed") {
        errorMessage = "Network error. Please check your connection.";
      } else if (error.code === "DEVELOPER_ERROR") {
        errorMessage = "Configuration error. Please contact support.";
      }

      Alert.alert("Google Sign-In Failed", errorMessage);
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return {
    // Form
    control,
    errors,
    handleSubmit,

    // UI state
    showPassword,
    loading,

    // Actions
    handleEmailLogin,
    handleGoogleSignIn,
    togglePasswordVisibility,
  };
};