import React from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Controller } from "react-hook-form";
import loginStyles from "../../asssets/styles/loginStyles";
import validationRules from "../../utils/formValidation";

export const LoginFormFields = ({
  control,
  errors,
  showPassword,
  onTogglePassword,
  onSubmit,
  loading,
}) => {
  return (
    <>
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
          <TouchableOpacity onPress={onTogglePassword}>
            <Ionicons
              name={showPassword ? "eye-outline" : "eye-off-outline"}
              size={20}
              color="#64748b"
            />
          </TouchableOpacity>
        </View>
        {errors.password && (
          <Text style={loginStyles.errorText}>{errors.password.message}</Text>
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
          loading && loginStyles.buttonDisabled,
        ]}
        onPress={onSubmit}
        disabled={loading}
      >
        <Ionicons
          name="log-in-outline"
          size={20}
          color="#ffffff"
          style={loginStyles.buttonIcon}
        />
        <Text style={loginStyles.loginButtonText}>
          {loading ? "Signing in..." : "Sign In"}
        </Text>
      </TouchableOpacity>
    </>
  );
};

export default LoginFormFields;