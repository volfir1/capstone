import React from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Controller } from "react-hook-form";

export const FormInput = ({
  control,
  name,
  rules,
  label,
  placeholder,
  iconName,
  error,
  secureTextEntry = false,
  showPasswordToggle = false,
  showPassword,
  onTogglePassword,
  keyboardType = "default",
  autoCapitalize = "sentences",
  // Style props for flexibility
  containerStyle,
  wrapperStyle,
  inputStyle,
  labelStyle,
  iconStyle,
  errorStyle,
}) => {
  return (
    <>
      {label && <Text style={labelStyle}>{label}</Text>}
      <View style={wrapperStyle}>
        <Ionicons name={iconName} size={20} color="#64748b" style={iconStyle} />
        <Controller
          control={control}
          name={name}
          rules={rules}
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={inputStyle}
              placeholder={placeholder}
              placeholderTextColor="#94a3b8"
              value={value}
              onChangeText={onChange}
              secureTextEntry={secureTextEntry && !showPassword}
              keyboardType={keyboardType}
              autoCapitalize={autoCapitalize}
            />
          )}
        />
        {showPasswordToggle && (
          <TouchableOpacity onPress={onTogglePassword}>
            <Ionicons
              name={showPassword ? "eye-outline" : "eye-off-outline"}
              size={20}
              color="#64748b"
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={errorStyle}>{error.message}</Text>}
    </>
  );
};