import React from "react";
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { AttorneySignupFormFields } from "components/auth/attorneySignupFormFields";
import { useAttorneySignup } from "hooks/useAttorneySignup";
import attorneySignupStyles from "@assets/styles/attorneySignupStyles";
import { PRIMARY_BROWN } from "@utils/constants";

export default function AttorneySignup() {
  const {
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
  } = useAttorneySignup();

  return (
    <KeyboardAvoidingView
      style={attorneySignupStyles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <ScrollView
        contentContainerStyle={attorneySignupStyles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Form Section */}
        <View style={attorneySignupStyles.formSection}>
          {/* Back Button */}
          <Link href="/auth" asChild>
            <TouchableOpacity 
              style={attorneySignupStyles.backButton}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={22} color={PRIMARY_BROWN} />
              <Text style={attorneySignupStyles.backButtonText}>
                Back to Login
              </Text>
            </TouchableOpacity>
          </Link>

          {/* Header Section */}
          <View style={attorneySignupStyles.headerContainer}>
            <View style={attorneySignupStyles.headerRow}>
              <View style={attorneySignupStyles.iconBox}>
                <Ionicons name="briefcase" size={28} color={PRIMARY_BROWN} />
              </View>
              <Text style={attorneySignupStyles.title}>
                Attorney Registration
              </Text>
            </View>
            <Text style={attorneySignupStyles.subtitle}>
              Create your attorney account to start providing legal services
            </Text>
          </View>

          {/* Form Fields */}
          <AttorneySignupFormFields
            control={control}
            errors={errors}
            showPassword={showPassword}
            showConfirmPassword={showConfirmPassword}
            onTogglePassword={togglePasswordVisibility}
            onToggleConfirmPassword={toggleConfirmPasswordVisibility}
            watchPassword={watchPassword}
            onSubmit={handleSubmit(handleAttorneySignup)}
            isRegistering={isRegistering}
          />

          {/* Login Link */}
          <View style={attorneySignupStyles.loginContainer}>
            <Text style={attorneySignupStyles.loginText}>
              Already have an account?{" "}
            </Text>
            <Link href="/auth" asChild>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={attorneySignupStyles.loginLink}>
                  Login here
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}