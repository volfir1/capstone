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
import { AttorneySignupFormFields } from "components/auth/attorneySignupFormFields";
import { useAttorneySignup } from "hooks/useAttorneySignup";
import attorneySignupStyles from "../../asssets/styles/attorneySignupStyles";

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
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={attorneySignupStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={attorneySignupStyles.formSection}>
          <Text
            style={{
              fontSize: 28,
              fontWeight: "bold",
              color: "#1e293b",
              marginBottom: 8,
            }}
          >
            Attorney Registration
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: "#64748b",
              marginBottom: 24,
            }}
          >
            Create your attorney account to start providing legal services
          </Text>

          {/* Form Section */}
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
            <TouchableOpacity>
              <Link href="/auth" style={attorneySignupStyles.loginLink}>
                Login
              </Link>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
