import React from "react";
import { View } from "react-native";
import { FormInput } from "components/common/formInput";
import validationRules from "@utils/formValidation";
import signupStyles from "../../asssets/styles/signupStyles";

export const PasswordInputs = ({
  control,
  errors,
  showPassword,
  showConfirmPassword,
  onTogglePassword,
  onToggleConfirmPassword,
  watchPassword,
}) => {
  return (
    <View style={signupStyles.rowInputs}>
      <View style={[signupStyles.inputContainer, signupStyles.halfInput]}>
        <FormInput
          control={control}
          name="password"
          rules={validationRules.password}
          label="Password"
          placeholder="Enter password"
          iconName="lock-closed-outline"
          error={errors.password}
          secureTextEntry={true}
          showPasswordToggle={true}
          showPassword={showPassword}
          onTogglePassword={onTogglePassword}
          autoCapitalize="none"
          containerStyle={signupStyles.inputContainer}
          wrapperStyle={signupStyles.inputWrapper}
          inputStyle={signupStyles.input}
          labelStyle={signupStyles.inputLabel}
          iconStyle={signupStyles.icon}
          errorStyle={signupStyles.errorText}
        />
      </View>

      <View style={[signupStyles.inputContainer, signupStyles.halfInput]}>
        <FormInput
          control={control}
          name="confirmPassword"
          rules={{
            ...validationRules.confirmPassword,
            validate: (value) =>
              value === watchPassword || "Passwords do not match",
          }}
          label="Confirm"
          placeholder="Confirm password"
          iconName="lock-closed-outline"
          error={errors.confirmPassword}
          secureTextEntry={true}
          showPasswordToggle={true}
          showPassword={showConfirmPassword}
          onTogglePassword={onToggleConfirmPassword}
          containerStyle={signupStyles.inputContainer}
          wrapperStyle={signupStyles.inputWrapper}
          inputStyle={signupStyles.input}
          labelStyle={signupStyles.inputLabel}
          iconStyle={signupStyles.icon}
          errorStyle={signupStyles.errorText}
        />
      </View>
    </View>
  );
};