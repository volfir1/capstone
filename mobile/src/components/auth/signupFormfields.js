import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NameInputs } from "./signupInputs";
import { PasswordInputs } from "./passwordInput";
import { FormInput } from "components/common/formInput";
import validationRules from "@utils/formValidation";
import signupStyles from "../../asssets/styles/signupStyles";

export const SignupFormFields = ({
  control,
  errors,
  showPassword,
  showConfirmPassword,
  onTogglePassword,
  onToggleConfirmPassword,
  watchPassword,
  onSubmit,
  isRegistering,
}) => {
  return (
    <>
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

      {/* Name Inputs */}
      <NameInputs control={control} errors={errors} />

      {/* Username Input */}
      <View style={signupStyles.inputContainer}>
        <FormInput
          control={control}
          name="username"
          rules={validationRules.username}
          label="Username"
          placeholder="Choose a username"
          iconName="at-outline"
          error={errors.username}
          autoCapitalize="none"
          containerStyle={signupStyles.inputContainer}
          wrapperStyle={signupStyles.inputWrapper}
          inputStyle={signupStyles.input}
          labelStyle={signupStyles.inputLabel}
          iconStyle={signupStyles.icon}
          errorStyle={signupStyles.errorText}
        />
      </View>

      {/* Email Input */}
      <View style={signupStyles.inputContainer}>
        <FormInput
          control={control}
          name="email"
          rules={validationRules.email}
          label="Email"
          placeholder="Enter your email"
          iconName="mail-outline"
          error={errors.email}
          autoCapitalize="none"
          keyboardType="email-address"
          containerStyle={signupStyles.inputContainer}
          wrapperStyle={signupStyles.inputWrapper}
          inputStyle={signupStyles.input}
          labelStyle={signupStyles.inputLabel}
          iconStyle={signupStyles.icon}
          errorStyle={signupStyles.errorText}
        />
      </View>

      {/* Password Inputs */}
      <PasswordInputs
        control={control}
        errors={errors}
        showPassword={showPassword}
        showConfirmPassword={showConfirmPassword}
        onTogglePassword={onTogglePassword}
        onToggleConfirmPassword={onToggleConfirmPassword}
        watchPassword={watchPassword}
      />

      {/* Signup Button */}
      <TouchableOpacity
        style={[
          signupStyles.signupButton,
          isRegistering && signupStyles.buttonDisabled,
        ]}
        onPress={onSubmit}
        disabled={isRegistering}
      >
        <Ionicons
          name="person-add-outline"
          size={20}
          color="#ffffff"
          style={signupStyles.buttonIcon}
        />
        <Text style={signupStyles.signupButtonText}>
          {isRegistering ? "Creating Account..." : "Create Account"}
        </Text>
      </TouchableOpacity>
    </>
  );
};