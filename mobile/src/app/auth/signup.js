import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { useAuth } from "../../context/authContext";
import signupStyles from "../../asssets/styles/signupStyles";
import validationRules from "@utils/formValidation";

export default function Signup() {
  const router = useRouter();
  const { register, googleSignIn, isLoading, getAuthErrorMessage } = useAuth();
  const {
    handleSubmit,
    control,
    formState: { errors },
    watch,
  } = useForm();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Watch password field for validation
  const watchPassword = watch("password");

  const handleSignup = async (data) => {
    try {
      // Check if passwords match
      if (data.password !== data.confirmPassword) {
        Alert.alert("Password Mismatch", "Passwords do not match. Please try again.");
        return;
      }

      // Create user account with Firebase
      const userCredential = await register({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        username: data.username,
      });

      console.log("Signup successful:", userCredential.user);

      // Show success message and inform about email verification
      Alert.alert(
        "Account Created Successfully!",
        "A verification email has been sent to your email address. Please verify your email before logging in.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/auth"), // Navigate to login
          },
        ]
      );
    } catch (error) {
      console.error("Signup error:", error);
      Alert.alert("Signup Failed", getAuthErrorMessage(error.code));
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const userCredential = await googleSignIn();
      console.log("Google Sign-In successful:", userCredential.user);
      router.replace("/user");
    } catch (error) {
      console.error("Google Sign-In error:", error);
      Alert.alert("Google Sign-In Failed", getAuthErrorMessage(error.code));
    }
  };

  return (
    <KeyboardAvoidingView
      style={signupStyles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={signupStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Image Section */}
        <View style={signupStyles.heroSection}>
          <View style={signupStyles.imagePlaceholder}>
            <Image
              source={require("../../asssets/images/law.png")}
              style={signupStyles.heroImage}
            />
          </View>
          <View style={signupStyles.heroOverlay}>
            <Text style={signupStyles.heroTitle}>JOIN US TODAY!</Text>
            <Text style={signupStyles.heroSubtitle}>
              Create your account and start accessing our comprehensive legal
              services.
            </Text>
          </View>
        </View>

        {/* Signup Form Section */}
        <View style={signupStyles.formSection}>
          {/* Brand */}
          <Text style={signupStyles.brandText}>
            Just<Text style={signupStyles.brandAccent}>Reach</Text>
          </Text>

          {/* Title */}
          <View style={signupStyles.titleContainer}>
            <Text style={signupStyles.title}>Create Account</Text>
            <Text style={signupStyles.subtitle}>
              Fill in your details to get started
            </Text>
          </View>

          {/* First Name & Last Name Row */}
          <View style={signupStyles.rowInputs}>
            <View style={[signupStyles.inputContainer, signupStyles.halfInput]}>
              <Text style={signupStyles.inputLabel}>First Name</Text>
              <View style={signupStyles.inputWrapper}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color="#64748b"
                  style={signupStyles.icon}
                />
                <Controller
                  control={control}
                  name="firstName"
                  rules={validationRules.firstName}
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={signupStyles.input}
                      placeholder="First name"
                      placeholderTextColor="#94a3b8"
                      value={value}
                      onChangeText={onChange}
                    />
                  )}
                />
              </View>
              {errors.firstName && (
                <Text style={signupStyles.errorText}>
                  {errors.firstName.message}
                </Text>
              )}
            </View>

            <View style={[signupStyles.inputContainer, signupStyles.halfInput]}>
              <Text style={signupStyles.inputLabel}>Last Name</Text>
              <View style={signupStyles.inputWrapper}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color="#64748b"
                  style={signupStyles.icon}
                />
                <Controller
                  control={control}
                  name="lastName"
                  rules={validationRules.lastName}
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={signupStyles.input}
                      placeholder="Last name"
                      placeholderTextColor="#94a3b8"
                      value={value}
                      onChangeText={onChange}
                    />
                  )}
                />
              </View>
              {errors.lastName && (
                <Text style={signupStyles.errorText}>
                  {errors.lastName.message}
                </Text>
              )}
            </View>
          </View>

          {/* Username Input */}
          <View style={signupStyles.inputContainer}>
            <Text style={signupStyles.inputLabel}>Username</Text>
            <View style={signupStyles.inputWrapper}>
              <Ionicons
                name="at-outline"
                size={20}
                color="#64748b"
                style={signupStyles.icon}
              />
              <Controller
                control={control}
                name="username"
                rules={validationRules.username}
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={signupStyles.input}
                    placeholder="Choose a username"
                    placeholderTextColor="#94a3b8"
                    value={value}
                    onChangeText={onChange}
                    autoCapitalize="none"
                  />
                )}
              />
            </View>
            {errors.username && (
              <Text style={signupStyles.errorText}>{errors.username.message}</Text>
            )}
          </View>

          {/* Email Input */}
          <View style={signupStyles.inputContainer}>
            <Text style={signupStyles.inputLabel}>Email</Text>
            <View style={signupStyles.inputWrapper}>
              <Ionicons
                name="mail-outline"
                size={20}
                color="#64748b"
                style={signupStyles.icon}
              />
              <Controller
                control={control}
                name="email"
                rules={validationRules.email}
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={signupStyles.input}
                    placeholder="Enter your email"
                    placeholderTextColor="#94a3b8"
                    value={value}
                    onChangeText={onChange}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                )}
              />
            </View>
            {errors.email && (
              <Text style={signupStyles.errorText}>{errors.email.message}</Text>
            )}
          </View>

          {/* Password & Confirm Password Row */}
          <View style={signupStyles.rowInputs}>
            <View style={[signupStyles.inputContainer, signupStyles.halfInput]}>
              <Text style={signupStyles.inputLabel}>Password</Text>
              <View style={signupStyles.inputWrapper}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#64748b"
                  style={signupStyles.icon}
                />
                <Controller
                  control={control}
                  name="password"
                  rules={validationRules.password}
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={signupStyles.input}
                      placeholder="Enter password"
                      placeholderTextColor="#94a3b8"
                      value={value}
                      onChangeText={onChange}
                      autoCapitalize="none"
                      secureTextEntry={!showPassword}
                    />
                  )}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color="#64748b"
                  />
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text style={signupStyles.errorText}>{errors.password.message}</Text>
              )}
            </View>

            <View style={[signupStyles.inputContainer, signupStyles.halfInput]}>
              <Text style={signupStyles.inputLabel}>Confirm</Text>
              <View style={signupStyles.inputWrapper}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#64748b"
                  style={signupStyles.icon}
                />
                <Controller
                  control={control}
                  name="confirmPassword"
                  rules={{
                    ...validationRules.confirmPassword,
                    validate: (value) => 
                      value === watchPassword || "Passwords do not match"
                  }}
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={signupStyles.input}
                      placeholder="Confirm password"
                      placeholderTextColor="#94a3b8"
                      value={value}
                      onChangeText={onChange}
                      secureTextEntry={!showConfirmPassword}
                    />
                  )}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons
                    name={
                      showConfirmPassword ? "eye-outline" : "eye-off-outline"
                    }
                    size={20}
                    color="#64748b"
                  />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && (
                <Text style={signupStyles.errorText}>
                  {errors.confirmPassword.message}
                </Text>
              )}
            </View>
          </View>

          {/* Signup Button */}
          <TouchableOpacity
            style={[
              signupStyles.signupButton,
              isLoading && signupStyles.buttonDisabled,
            ]}
            onPress={handleSubmit(handleSignup)}
            disabled={isLoading}
          >
            <Ionicons
              name="person-add-outline"
              size={20}
              color="#ffffff"
              style={signupStyles.buttonIcon}
            />
            <Text style={signupStyles.signupButtonText}>
              {isLoading ? "Creating Account..." : "Create Account"}
            </Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={signupStyles.dividerContainer}>
            <View style={signupStyles.dividerLine} />
            <Text style={signupStyles.dividerText}>or continue with</Text>
            <View style={signupStyles.dividerLine} />
          </View>

          {/* Google Sign In Button */}
          <TouchableOpacity
            style={[
              signupStyles.googleButton,
              isLoading && signupStyles.buttonDisabled,
            ]}
            onPress={handleGoogleSignIn}
            disabled={isLoading}
          >
            <Ionicons
              name="logo-google"
              size={20}
              color="#1e293b"
              style={signupStyles.buttonIcon}
            />
            <Text style={signupStyles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          {/* Sign In Link */}
          <View style={signupStyles.signinContainer}>
            <Text style={signupStyles.signinText}>Already have an account? </Text>
            <TouchableOpacity>
              <Link href="/auth" style={signupStyles.loginLink}>
                Login
              </Link>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}