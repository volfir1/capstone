import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import loginStyles from "../../asssets/styles/loginStyles";

export const SocialLoginButtons = ({ onGoogleSignIn, loading }) => {
  return (
    <>
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
          loading && loginStyles.buttonDisabled,
        ]}
        onPress={onGoogleSignIn}
        disabled={loading}
      >
        <Ionicons
          name="logo-google"
          size={20}
          color="#1e293b"
          style={loginStyles.buttonIcon}
        />
        <Text style={loginStyles.googleButtonText}>Continue with Google</Text>
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
    </>
  );
};