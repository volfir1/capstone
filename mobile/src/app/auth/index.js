import React from "react";
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Text,
} from "react-native";
import { Link } from "expo-router";
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

          {/* Attorney Login Link */}
          <View style={loginStyles.attorneyLinkContainer}>
            <Text style={loginStyles.attorneyLinkText}>Are you an attorney?</Text>
            <Link href="/auth/attorneyLogin" asChild>
              <TouchableOpacity>
                <Text style={loginStyles.attorneyLinkButton}>Login as Attorney</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}