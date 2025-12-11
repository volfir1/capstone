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
import attorneyLoginStyles from "@assets/styles/attornyeLoginStyles";

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
      style={attorneyLoginStyles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={attorneyLoginStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={attorneyLoginStyles.heroSection}>
          <View style={attorneyLoginStyles.iconContainer}>
            <Ionicons name="briefcase" size={48} color="#C4AB7D" />
          </View>
          <Text style={attorneyLoginStyles.welcomeText}>Attorney Portal</Text>
          <Text style={attorneyLoginStyles.subtitle}>
            Sign in to your attorney account
          </Text>
        </View>

        {/* Form Section */}
        <View style={attorneyLoginStyles.formSection}>
          {/* Email Input */}
          <View style={attorneyLoginStyles.inputContainer}>
            <Text style={attorneyLoginStyles.label}>Email</Text>
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
                <View style={attorneyLoginStyles.inputWrapper}>
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color="#64748b"
                    style={attorneyLoginStyles.inputIcon}
                  />
                  <TextInput
                    style={[
                      attorneyLoginStyles.input,
                      errors.email && attorneyLoginStyles.inputError,
                    ]}
                    placeholder="Enter your email"
                    placeholderTextColor="#9CA3AF"
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
              <Text style={attorneyLoginStyles.errorText}>
                {errors.email.message}
              </Text>
            )}
          </View>

          {/* Password Input */}
          <View style={attorneyLoginStyles.inputContainer}>
            <Text style={attorneyLoginStyles.label}>Password</Text>
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
                <View style={attorneyLoginStyles.inputWrapper}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color="#64748b"
                    style={attorneyLoginStyles.inputIcon}
                  />
                  <TextInput
                    style={[
                      attorneyLoginStyles.input,
                      errors.password && attorneyLoginStyles.inputError,
                    ]}
                    placeholder="Enter your password"
                    placeholderTextColor="#9CA3AF"
                    value={value}
                    onChangeText={onChange}
                    secureTextEntry={!showPassword}
                    editable={!loading}
                  />
                  <TouchableOpacity
                    onPress={togglePasswordVisibility}
                    style={attorneyLoginStyles.eyeIcon}
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
              <Text style={attorneyLoginStyles.errorText}>
                {errors.password.message}
              </Text>
            )}
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[
              attorneyLoginStyles.loginButton,
              loading && attorneyLoginStyles.buttonDisabled,
            ]}
            onPress={handleSubmit(handleAttorneyLogin)}
            disabled={loading}
          >
            <Text style={attorneyLoginStyles.loginButtonText}>
              {loading ? "Signing in..." : "Sign in as Attorney"}
            </Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={attorneyLoginStyles.dividerContainer}>
            <View style={attorneyLoginStyles.dividerLine} />
            <Text style={attorneyLoginStyles.dividerText}>or</Text>
            <View style={attorneyLoginStyles.dividerLine} />
          </View>

          {/* Sign Up Link */}
          <View style={attorneyLoginStyles.signupContainer}>
            <Text style={attorneyLoginStyles.signupText}>
              Don't have an attorney account?{" "}
            </Text>
            <TouchableOpacity>
              <Link href="/auth/attorneySignup" style={attorneyLoginStyles.signupLink}>
                Sign up
              </Link>
            </TouchableOpacity>
          </View>

          {/* Back to User Login */}
          <View style={attorneyLoginStyles.signupContainer}>
            <Text style={attorneyLoginStyles.signupText}>Not an attorney? </Text>
            <TouchableOpacity>
              <Link href="/auth" style={attorneyLoginStyles.signupLink}>
                User Login
              </Link>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}