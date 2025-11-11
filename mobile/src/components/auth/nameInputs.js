import React from "react";
import { View } from "react-native";
import { FormInput } from "components/common/formInput";
import validationRules from "@utils/formValidation";
import signupStyles from "../../asssets/styles/signupStyles";

export const NameInputs = ({ control, errors }) => {
  return (
    <View style={signupStyles.rowInputs}>
      <View style={[signupStyles.inputContainer, signupStyles.halfInput]}>
        <FormInput
          control={control}
          name="firstName"
          rules={validationRules.firstName}
          label="First Name"
          placeholder="First name"
          iconName="person-outline"
          error={errors.firstName}
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
          name="lastName"
          rules={validationRules.lastName}
          label="Last Name"
          placeholder="Last name"
          iconName="person-outline"
          error={errors.lastName}
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