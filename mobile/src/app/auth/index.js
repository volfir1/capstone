import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { useAuth } from "../../context/authContext";
import { auth } from "firebaseApp/firebase";
import loginStyles from "../../asssets/styles/loginStyles";
import validationRules from "@utils/formValidation";
import { sendEmailVerification, signOut } from "firebase/auth";

export default function Login() {
  const router = useRouter();
  const { login, googleSignIn, isLoading, getAuthErrorMessage } = useAuth();
  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm();
  const [showPassword, setShowPassword] = useState(false);

 const handleLogin = async (data) => {
  try {
    const userCredential = await login(data.email, data.password);
    const user = userCredential.user;
    
    // Check if email is verified
    if (!user.emailVerified) {
      Alert.alert(
        "Email Not Verified", 
        "Please verify your email before logging in. Check your inbox for the verification link.",
        [
          {
            text: "Resend Verification",
            onPress: async () => {
              try {
                await sendEmailVerification(user);
                Alert.alert("Verification Sent", "A new verification email has been sent to your inbox.");
              } catch (error) {
                Alert.alert("Error", "Failed to send verification email. Please try again.");
              }
            }
          },
          {
            text: "OK",
            style: "default"
          }
        ]
      );
      
      // Sign out the user since they're not verified
      await signOut(auth);
      return;
    }
    
    console.log("Login successful:", user);
    router.replace("/user");
  } catch (error) {
    console.error("Login error:", error);
    Alert.alert("Login Failed", getAuthErrorMessage(error.code));
  }
};

  const handleGoogleSignIn = async () => {
  try {
    const userCredential = await googleSignIn();
    const user = userCredential.user;
    
    // Google accounts are automatically verified
    // But you can add additional checks if needed
    console.log("Google Sign-In successful:", user);
    router.replace("/user");
  } catch (error) {
    console.error("Google Sign-In error:", error);
    Alert.alert("Google Sign-In Failed", getAuthErrorMessage(error.code));
  }
};

  return (
    <KeyboardAvoidingView
      style={loginStyles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={loginStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Image Section */}
        <View style={loginStyles.heroSection}>
          <View style={loginStyles.imagePlaceholder}>
            <Image
              source={require("../../asssets/images/law.png")}
              style={loginStyles.heroImage}
            />
          </View>
          <View style={loginStyles.heroOverlay}>
            <Text style={loginStyles.heroTitle}>WELCOME BACK!</Text>
            <Text style={loginStyles.heroSubtitle}>
              Securely access your legal services and continue where you left
              off.
            </Text>
          </View>
        </View>

        {/* Login Form Section */}
        <View style={loginStyles.formSection}>
          {/* Brand */}
          <Text style={loginStyles.brandText}>
            Just<Text style={loginStyles.brandAccent}>Reach</Text>
          </Text>

          {/* Title */}
          <View style={loginStyles.titleContainer}>
            <Text style={loginStyles.title}>Login</Text>
            <Text style={loginStyles.subtitle}>
              Enter your credentials to continue
            </Text>
          </View>

          {/* Email Input */}
          <View style={loginStyles.inputContainer}>
            <Text style={loginStyles.inputLabel}>Email</Text>
            <View style={loginStyles.inputWrapper}>
              <Ionicons
                name="mail-outline"
                size={20}
                color="#64748b"
                style={loginStyles.icon}
              />
              <Controller
                control={control}
                name="email"
                rules={validationRules.loginEmail}
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={loginStyles.input}
                    placeholder="Enter your email"
                    placeholderTextColor="#94a3b8"
                    value={value}
                    onChangeText={onChange}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                )}
              />
            </View>
            {errors.email && (
              <Text style={loginStyles.errorText}>{errors.email.message}</Text>
            )}
          </View>

          {/* Password Input */}
          <View style={loginStyles.inputContainer}>
            <Text style={loginStyles.inputLabel}>Password</Text>
            <View style={loginStyles.inputWrapper}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#64748b"
                style={loginStyles.icon}
              />
              <Controller
                control={control}
                name="password"
                rules={validationRules.loginPassword}
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={loginStyles.input}
                    placeholder="Enter your password"
                    placeholderTextColor="#94a3b8"
                    value={value}
                    onChangeText={onChange}
                    secureTextEntry={!showPassword}
                  />
                )}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color="#64748b"
                />
              </TouchableOpacity>
            </View>
            {errors.password && (
              <Text style={loginStyles.errorText}>
                {errors.password.message}
              </Text>
            )}
          </View>

          {/* Forgot Password */}
          <TouchableOpacity style={loginStyles.forgotPassword}>
            <Text style={loginStyles.forgotPasswordText}>Forgot password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={[
              loginStyles.loginButton,
              isLoading && loginStyles.buttonDisabled,
            ]}
            onPress={handleSubmit(handleLogin)}
            disabled={isLoading}
          >
            <Ionicons
              name="log-in-outline"
              size={20}
              color="#ffffff"
              style={loginStyles.buttonIcon}
            />
            <Text style={loginStyles.loginButtonText}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={loginStyles.dividerContainer}>
            <View style={loginStyles.dividerLine} />
            <Text style={loginStyles.dividerText}>or continue with</Text>
            <View style={loginStyles.dividerLine} />
          </View>

          {/* Google Sign In Button */}
          <TouchableOpacity
            style={[
              loginStyles.googleButton,
              isLoading && loginStyles.buttonDisabled,
            ]}
            onPress={handleGoogleSignIn}
            disabled={isLoading}
          >
            <Ionicons
              name="logo-google"
              size={20}
              color="#1e293b"
              style={loginStyles.buttonIcon}
            />
            <Text style={loginStyles.googleButtonText}>
              Continue with Google
            </Text>
          </TouchableOpacity>

          {/* Sign Up Link */}
          <View style={loginStyles.signupContainer}>
            <Text style={loginStyles.signupText}>Don't have an account? </Text>
            <TouchableOpacity>
              <Link href="/auth/signup" style={loginStyles.signupLink}>
                Sign up
              </Link>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}