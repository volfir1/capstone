import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Link } from "expo-router";
import { Controller } from "react-hook-form";
import { Ionicons } from "@expo/vector-icons";
import { useAttorneyLogin } from "hooks/useAttorneyLogin";
import loginStyles from "../../asssets/styles/loginStyles";

export default function AttorneyLogin() {
  const {
    control,
    errors,
    handleSubmit,
    showPassword,
    loading,
    handleAttorneyLogin,
    togglePasswordVisibility,
  } = useAttorneyLogin();

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
        <View style={loginStyles.heroSection}>
          <View style={loginStyles.iconContainer}>
            <Ionicons name="briefcase" size={48} color="#C4AB7D" />
          </View>
          <Text style={loginStyles.welcomeText}>Attorney Portal</Text>
          <Text style={loginStyles.subtitle}>
            Sign in to your attorney account
          </Text>
        </View>

        {/* Form Section */}
        <View style={loginStyles.formSection}>
          {/* Email Input */}
          <View style={loginStyles.inputContainer}>
            <Text style={loginStyles.label}>Email</Text>
            <Controller
              control={control}
              name="email"
              rules={{
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address",
                },
              }}
              render={({ field: { onChange, value } }) => (
                <View style={loginStyles.inputWrapper}>
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color="#64748b"
                    style={loginStyles.inputIcon}
                  />
                  <TextInput
                    style={[
                      loginStyles.input,
                      errors.email && loginStyles.inputError,
                    ]}
                    placeholder="Enter your email"
                    value={value}
                    onChangeText={onChange}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!loading}
                  />
                </View>
              )}
            />
            {errors.email && (
              <Text style={loginStyles.errorText}>{errors.email.message}</Text>
            )}
          </View>

          {/* Password Input */}
          <View style={loginStyles.inputContainer}>
            <Text style={loginStyles.label}>Password</Text>
            <Controller
              control={control}
              name="password"
              rules={{
                required: "Password is required",
                minLength: {
                  value: 6,
                  message: "Password must be at least 6 characters",
                },
              }}
              render={({ field: { onChange, value } }) => (
                <View style={loginStyles.inputWrapper}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color="#64748b"
                    style={loginStyles.inputIcon}
                  />
                  <TextInput
                    style={[
                      loginStyles.input,
                      errors.password && loginStyles.inputError,
                    ]}
                    placeholder="Enter your password"
                    value={value}
                    onChangeText={onChange}
                    secureTextEntry={!showPassword}
                    editable={!loading}
                  />
                  <TouchableOpacity
                    onPress={togglePasswordVisibility}
                    style={loginStyles.eyeIcon}
                    disabled={loading}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="#64748b"
                    />
                  </TouchableOpacity>
                </View>
              )}
            />
            {errors.password && (
              <Text style={loginStyles.errorText}>
                {errors.password.message}
              </Text>
            )}
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[
              loginStyles.loginButton,
              loading && loginStyles.buttonDisabled,
            ]}
            onPress={handleSubmit(handleAttorneyLogin)}
            disabled={loading}
          >
            <Text style={loginStyles.loginButtonText}>
              {loading ? "Signing in..." : "Sign in as Attorney"}
            </Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={loginStyles.dividerContainer}>
            <View style={loginStyles.dividerLine} />
            <Text style={loginStyles.dividerText}>or</Text>
            <View style={loginStyles.dividerLine} />
          </View>

          {/* Sign Up Link */}
          <View style={loginStyles.signupContainer}>
            <Text style={loginStyles.signupText}>
              Don't have an attorney account?{" "}
            </Text>
            <TouchableOpacity>
              <Link href="/auth/attorneySignup" style={loginStyles.signupLink}>
                Sign up
              </Link>
            </TouchableOpacity>
          </View>

          {/* Back to User Login */}
          <View style={loginStyles.signupContainer}>
            <Text style={loginStyles.signupText}>Not an attorney? </Text>
            <TouchableOpacity>
              <Link href="/auth" style={loginStyles.signupLink}>
                User Login
              </Link>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
