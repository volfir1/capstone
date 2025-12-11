import React from "react";
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LoginHero } from "components/hero/loginHero";
import { LoginFormFields } from "components/forms/loginFormFields";
import { SocialLoginButtons } from "components/buttons/loginButton";
import { useNativeLogin } from "hooks/useLogin";
import loginStyles from "@assets/styles/loginStyles";

export default function Login() {
  const {
    control,
    errors,
    handleSubmit,
    showPassword,
    loading,
    handleEmailLogin,
    handleGoogleSignIn,
    togglePasswordVisibility,
  } = useNativeLogin();

  return (
    <KeyboardAvoidingView
      style={loginStyles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={loginStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <LoginHero />

        {/* Form Section */}
        <View style={loginStyles.formSection}>
          <LoginFormFields
            control={control}
            errors={errors}
            showPassword={showPassword}
            onTogglePassword={togglePasswordVisibility}
            onSubmit={handleSubmit(handleEmailLogin)}
            loading={loading}
          />

          <SocialLoginButtons
            onGoogleSignIn={handleGoogleSignIn}
            loading={loading}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}