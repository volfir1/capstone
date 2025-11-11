import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import signupStyles from "../../asssets/styles/signupStyles";

export const SocialSignupButtons = ({ onGoogleSignup, isRegistering }) => {
  return (
    <>
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
          isRegistering && signupStyles.buttonDisabled,
        ]}
        onPress={onGoogleSignup}
        disabled={isRegistering}
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
    </>
  );
};