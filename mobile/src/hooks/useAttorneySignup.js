import { useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { useForm } from "react-hook-form";
import { useAuth } from "context/authContext";
import {
  doCreateUserWithEmailAndPassword,
  doSendEmailVerification,
  doSignOut,
} from "@firebaseApp/auth";
import apiClient from "../api/apiClient";

export const useAttorneySignup = () => {
  const router = useRouter();
  const { getAuthErrorMessage } = useAuth();

  // Form state
  const {
    handleSubmit,
    control,
    formState: { errors },
    watch,
  } = useForm({
    defaultValues: {
      email: "",
      username: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      middleName: "",
      lastName: "",
      suffix: "",
      role: "attorney",
      prcLicenseNumber: "",
      ibrNumber: "",
      barAdmissionDate: null,
      phoneNumber: "",
      officeAddress: {
        street: "",
        barangay: "",
        city: "",
        province: "",
        region: "",
        zipCode: "",
      },
      lawFirm: "",
      isPAOLawyer: false,
      paoOffice: "",
      specializations: [],
      languages: [],
      consultationMode: [],
      biography: "",
      education: [],
    },
  });

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // Watch password for validation
  const watchPassword = watch("password");

  // Toggle password visibility
  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () =>
    setShowConfirmPassword(!showConfirmPassword);

  // Attorney Registration
  const handleAttorneySignup = async (data) => {
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

        console.log("Step 3: Registering attorney in backend");
        try {
          // Prepare attorney data
          const attorneyData = {
            email: data.email,
            username: data.username,
            firstName: data.firstName,
            middleName: data.middleName || "",
            lastName: data.lastName,
            suffix: data.suffix || "",
            role: data.role,
            prcLicenseNumber: data.prcLicenseNumber,
            ibrNumber: data.ibrNumber,
            barAdmissionDate: data.barAdmissionDate,
            phoneNumber: data.phoneNumber,
            officeAddress: data.officeAddress,
            lawFirm: data.lawFirm || "",
            isPAOLawyer: data.role === "pao_lawyer",
            paoOffice: data.paoOffice || "",
            specializations: data.specializations,
            languages: data.languages,
            consultationMode: data.consultationMode,
            biography: data.biography || "",
            education: data.education || [],
          };

          // Register attorney in backend
          const response = await apiClient.post(
            "/auth/register-attorney",
            attorneyData
          );
          console.log("Attorney registered in backend:", response.data);
        } catch (registerError) {
          console.error("Backend registration error:", registerError);
          // Continue even if backend registration fails
        }

        console.log("Step 4: Signing out to prevent auto-login");
        await doSignOut();

        // Wait for sign out to complete
        await new Promise((resolve) => setTimeout(resolve, 500));

        console.log("Step 5: Registration complete");

        setIsRegistering(false);
        Alert.alert(
          "Attorney Account Created Successfully!",
          "A verification email has been sent to your email address. Please verify your email before logging in. Your account will be reviewed by an administrator.",
          [
            {
              text: "OK",
              onPress: () => router.replace("/auth"),
            },
          ]
        );
      } catch (error) {
        console.error("Attorney signup error:", error);

        // Sign out on error
        try {
          await doSignOut();
        } catch (signOutError) {
          console.log("Sign out error:", signOutError);
        }

        setIsRegistering(false);
        const errorMessage =
          getAuthErrorMessage?.(error.code) ||
          error.message ||
          "An error occurred during registration.";
        Alert.alert("Registration Failed", errorMessage);
      }
    }
  };

  return {
    control,
    errors,
    handleSubmit,
    watchPassword,
    showPassword,
    showConfirmPassword,
    isRegistering,
    handleAttorneySignup,
    togglePasswordVisibility,
    toggleConfirmPasswordVisibility,
  };
};
