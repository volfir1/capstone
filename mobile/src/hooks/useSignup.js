import { useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { useForm } from "react-hook-form";
import { GoogleAuthProvider } from "firebase/auth";
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
  } = useForm({
    mode: "onBlur",
    defaultValues: {
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

  // Email/Password Signup (shared account creation, matching website logic)
  const handleEmailSignup = async (data) => {
    if (isRegistering) return;

    setIsRegistering(true);
    setErrorMessage("");

    try {
      await doCreateUserWithEmailAndPassword(data.email, data.password);
      await doSendEmailVerification();
      await new Promise((resolve) => setTimeout(resolve, 1200));

      await registerUser({ email: data.email });
      await doSignOut();

      setIsRegistering(false);
      Alert.alert(
        "Account Created",
        "Account created. Verify the email first, then sign in.",
        [{ text: "OK", onPress: () => router.replace("/auth") }]
      );
    } catch (error) {
      try { await doSignOut(); } catch (e) {}
      setIsRegistering(false);
      setErrorMessage(getAuthErrorMessage(error.code) || error.message);
    }
  };

  // Google Sign Up (shared account + profile selection flow)
  const handleGoogleSignup = async () => {
    if (isRegistering) return;

    setIsRegistering(true);
    setErrorMessage("");

    try {
      const result = await doSignInWithGoogle();

      try {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const accessToken = credential?.accessToken;
        if (accessToken) {
          // Reserved for future calendar integrations in mobile
        }
      } catch (credentialError) {
        console.warn("Failed to extract Google credential on signup", credentialError);
      }

      const idToken = await result.user.getIdToken();
      await registerUser({ idToken });

      setIsRegistering(false);
      Alert.alert(
        "Account Created",
        "Account created. Choose or create a staff profile next.",
        [{ text: "OK", onPress: () => router.replace("/auth/profiles") }]
      );
    } catch (error) {
      setIsRegistering(false);
      setErrorMessage(getAuthErrorMessage(error.code) || error.message);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

  return {
    control,
    errors,
    handleSubmit,
    watchPassword,
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