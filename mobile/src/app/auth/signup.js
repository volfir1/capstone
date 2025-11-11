import React from "react";
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SignupHero } from "components/hero/signupHero";
import { SignupFormFields } from "components/auth/signupFormfields";
import { SocialSignupButtons } from "components/buttons/signupButton";
import { useSignup } from "hooks/useSignup";
import signupStyles from "../../asssets/styles/signupStyles";

export default function Signup() {
  const {
    control,
    errors,
    handleSubmit,
    watchPassword,
    showPassword,
    showConfirmPassword,
    isRegistering,
    handleEmailSignup,
    handleGoogleSignup,
    togglePasswordVisibility,
    toggleConfirmPasswordVisibility,
  } = useSignup();

  return (
    <KeyboardAvoidingView
      style={signupStyles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={signupStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <SignupHero />

        {/* Form Section */}
        <View style={signupStyles.formSection}>
          <SignupFormFields
            control={control}
            errors={errors}
            showPassword={showPassword}
            showConfirmPassword={showConfirmPassword}
            onTogglePassword={togglePasswordVisibility}
            onToggleConfirmPassword={toggleConfirmPasswordVisibility}
            watchPassword={watchPassword}
            onSubmit={handleSubmit(handleEmailSignup)}
            isRegistering={isRegistering}
          />

          <SocialSignupButtons
            onGoogleSignup={handleGoogleSignup}
            isRegistering={isRegistering}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

