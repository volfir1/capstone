import { useState, useEffect, useRef } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { useForm } from "react-hook-form";
import { useAuth } from "context/authContext";
import { doSigninWithEmailAndPassword, doSignOut } from "@firebaseApp/auth";
import apiClient from "../api/apiClient";

export const useAttorneyLogin = () => {
  const router = useRouter();
  const { getAuthErrorMessage } = useAuth();
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
  const [attorneyData, setAttorneyData] = useState(null);

  // Handle navigation when attorney data is loaded
  useEffect(() => {
    if (attorneyData && !hasNavigated.current) {
      console.log("Attorney data loaded, checking role for navigation");
      hasNavigated.current = true;
      
      // Navigate based on role
      if (attorneyData.role === "admin") {
        console.log("Admin role detected, navigating to admin dashboard");
        router.replace("/admin");
      } else {
        console.log("Attorney role detected, navigating to attorney dashboard");
        router.replace("/attorney/dashboard");
      }
    }
  }, [attorneyData]);

  // Email/Password Login for Attorney
  const handleAttorneyLogin = async (data) => {
    try {
      setLoading(true);

      console.log("Step 1: Signing in with Firebase");
      console.log("Attempting login with email:", data.email);
      // Sign in with Firebase (no email verification check)
      const userCredential = await doSigninWithEmailAndPassword(
        data.email,
        data.password
      );
      const user = userCredential.user;
      console.log("Firebase login successful for:", user.email);

      console.log("Step 2: Checking attorney in MongoDB");
      // Check if attorney exists and is verified in MongoDB
      try {
        const response = await apiClient.post("/auth/verify-attorney", {
          email: data.email,
        });

        if (!response.data.success) {
          Alert.alert("Login Failed", response.data.message);
          await doSignOut();
          setLoading(false);
          return;
        }

        const attorney = response.data.data;

        // Check if attorney is verified in MongoDB
        if (!attorney.isVerified) {
          Alert.alert(
            "Account Not Verified",
            "Your attorney account is pending verification. Please wait for admin approval.",
            [{ text: "OK" }]
          );
          await doSignOut();
          setLoading(false);
          return;
        }

        // Check account status
        if (attorney.accountStatus !== "active") {
          Alert.alert(
            "Account Inactive",
            `Your account is currently ${attorney.accountStatus}. Please contact support.`,
            [{ text: "OK" }]
          );
          await doSignOut();
          setLoading(false);
          return;
        }

        console.log("Step 3: Attorney verified, logging in");
        setAttorneyData(attorney);
        setLoading(false);
      } catch (backendError) {
        console.error("Backend verification error:", backendError);
        
        let errorMessage = "Failed to verify attorney account.";
        if (backendError.response?.status === 404) {
          errorMessage = "Attorney account not found. Please sign up as an attorney first.";
        } else if (backendError.response?.data?.message) {
          errorMessage = backendError.response.data.message;
        }

        Alert.alert("Login Failed", errorMessage);
        await doSignOut();
        setLoading(false);
        return;
      }
    } catch (error) {
      console.error("Attorney login error:", error);
      
      let errorMessage = "An error occurred during login.";
      
      if (error.code === "auth/invalid-credential" || error.code === "auth/user-not-found") {
        errorMessage = "Invalid email or password. Make sure you signed up as an attorney first.";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Incorrect password. Please try again.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email format.";
      } else if (getAuthErrorMessage) {
        errorMessage = getAuthErrorMessage(error.code) || error.message;
      } else {
        errorMessage = error.message;
      }
      
      Alert.alert("Login Failed", errorMessage);
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return {
    control,
    errors,
    handleSubmit,
    showPassword,
    loading,
    handleAttorneyLogin,
    togglePasswordVisibility,
  };
};
