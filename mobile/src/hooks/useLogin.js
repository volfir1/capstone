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
import apiClient from "../api/apiClient";

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
  const [errorMessage, setErrorMessage] = useState('');

  // Handle navigation when user data is loaded
  useEffect(() => {
    if (userLoggedIn && userData && !hasNavigated.current) {
      if (!userData.isVerified) {
        Alert.alert(
          "Email Not Verified",
          "Please verify your email before logging in. Check your inbox for the verification link."
        );
        doSignOut();
        setLoading(false);
        return;
      }

      if (userData.role === 'user') {
        Alert.alert(
          "Account Pending",
          "Your account is pending approval. An administrator will review and assign your role. Please check back later.",
          [{ text: "OK", onPress: async () => {
            try { await doSignOut(); } catch (e) {}
          }}]
        );
        setLoading(false);
        return;
      }

      hasNavigated.current = true;
      navigateByRole(userData.role);
    }
  }, [userLoggedIn, userData]);

  const navigateByRole = (role) => {
    const adminLikeRoles = ["admin", "attorney", "secretary", "pao_lawyer", "legal_volunteer", "intern", "supervising_lawyer", "director"];
    if (adminLikeRoles.includes(role)) {
      router.replace("/admin");
    } else {
      Alert.alert(
        "Account Pending",
        "Your account is pending approval. An administrator will review and assign your role. Please check back later.",
        [{ text: "OK", onPress: async () => {
          try { await doSignOut(); } catch (e) {}
        }}]
      );
    }
  };

  // Email/Password Login
  const handleEmailLogin = async (data) => {
    try {
      setLoading(true);
      setErrorMessage('');
      hasNavigated.current = false;

      let emailToUse = data.email;

      // Username-to-email resolution (matches website logic)
      if (!data.email.includes('@')) {
        try {
          const response = await apiClient.post('/auth/get-email-from-username', {
            username: data.email,
          });
          if (response.data.success) {
            emailToUse = response.data.email;
          } else {
            throw new Error('Username not found');
          }
        } catch (error) {
          setErrorMessage('Username not found. Please check your credentials.');
          setLoading(false);
          return;
        }
      }

      const userCredential = await doSigninWithEmailAndPassword(emailToUse, data.password);
      const user = userCredential.user;

      // Check email verification immediately
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
                  Alert.alert("Verification Sent", "A new verification email has been sent to your inbox.");
                } catch (error) {
                  Alert.alert("Error", "Failed to send verification email. Please try again.");
                }
              },
            },
            { text: "OK", style: "default" },
          ]
        );
        await doSignOut();
        setLoading(false);
        return;
      }

      // Check role immediately (matches website logic)
      try {
        const profileResp = await apiClient.get('/users/profile');
        const profile = profileResp?.data?.data || profileResp?.data;
        if (profile && profile.role === 'user') {
          Alert.alert(
            "Account Pending",
            "Your account is pending approval. An administrator will review and assign your role.",
            [{ text: "OK" }]
          );
          await doSignOut();
          setLoading(false);
          return;
        }
      } catch (profileErr) {
        // Fall back to useEffect-based navigation
      }

      // Navigation will happen in useEffect
      setLoading(false);
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error.code) || error.message);
      setLoading(false);
    }
  };

  // Google Sign In
  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      hasNavigated.current = false;

      await doSignInWithGoogle();

      // Check role immediately after Google sign-in
      try {
        const profileResp = await apiClient.get('/users/profile');
        const profile = profileResp?.data?.data || profileResp?.data;
        if (profile && profile.role === 'user') {
          Alert.alert(
            "Account Pending",
            "Your account is pending approval. An administrator will review and assign your role.",
            [{ text: "OK" }]
          );
          await doSignOut();
          setLoading(false);
          return;
        }
      } catch (profileErr) {
        // Fall back to useEffect-based navigation
      }

      setLoading(false);
    } catch (error) {
      let msg = "An error occurred during Google Sign-In";
      if (error.message?.includes("cancelled") || error.code === "12501") {
        msg = "";
      } else if (error.code === "auth/network-request-failed") {
        msg = "Network error. Please check your connection.";
      } else if (error.code === "DEVELOPER_ERROR") {
        msg = "Configuration error. Please contact support.";
      }
      if (msg) setErrorMessage(msg);
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  return {
    control,
    errors,
    handleSubmit,
    showPassword,
    loading,
    errorMessage,
    handleEmailLogin,
    handleGoogleSignIn,
    togglePasswordVisibility,
  };
};