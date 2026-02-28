import React, { memo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { Controller } from "react-hook-form";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import attorneySignupStyles from "@assets/styles/attorneySignupStyles";

const SPECIALIZATIONS = [
  "Criminal Law",
  "Civil Law",
  "Family Law",
  "Labor Law",
  "Commercial Law",
  "Tax Law",
  "Immigration Law",
  "Land and Property Law",
  "Human Rights",
  "Environmental Law",
  "Agrarian Law",
  "Administrative Law",
  "Corporate Law",
  "Intellectual Property",
  "Other",
];

const LANGUAGES = [
  "English",
  "Filipino/Tagalog",
  "Cebuano",
  "Ilocano",
  "Hiligaynon",
  "Waray",
  "Kapampangan",
  "Bikol",
  "Pangasinan",
  "Other",
];

const CONSULTATION_MODES = [
  { value: "online", label: "Online Consultation" },
  { value: "in-person", label: "In-Person Meeting" },
  { value: "both", label: "Both Options" },
];

// Memoized input component
const FormInput = memo(({ 
  control, 
  name, 
  label, 
  placeholder, 
  error, 
  required = false,
  secureTextEntry = false,
  keyboardType = "default",
  autoCapitalize = "sentences",
  rightIcon = null,
  multiline = false,
  numberOfLines = 1,
  helperText = null,
}) => (
  <View style={attorneySignupStyles.inputContainer}>
    <Text style={attorneySignupStyles.label}>
      {label} {required && <Text style={attorneySignupStyles.requiredStar}>*</Text>}
    </Text>
    <View style={attorneySignupStyles.inputWrapper}>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, value } }) => (
          <TextInput
            style={[
              attorneySignupStyles.input,
              error && attorneySignupStyles.inputError,
              rightIcon && attorneySignupStyles.inputWithIcon,
              multiline && attorneySignupStyles.textArea,
            ]}
            placeholder={placeholder}
            placeholderTextColor="#9CA3AF"
            value={value}
            onChangeText={onChange}
            secureTextEntry={secureTextEntry}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            multiline={multiline}
            numberOfLines={numberOfLines}
            textAlignVertical={multiline ? "top" : "center"}
          />
        )}
      />
      {rightIcon}
    </View>
    {error && (
      <Text style={attorneySignupStyles.errorText}>
        {error.message}
      </Text>
    )}
    {helperText && !error && (
      <Text style={attorneySignupStyles.helperText}>
        {helperText}
      </Text>
    )}
  </View>
));

// Memoized checkbox item
const CheckboxItem = memo(({ label, isChecked, onPress }) => (
  <TouchableOpacity
    style={attorneySignupStyles.multiSelectItem}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View
      style={[
        attorneySignupStyles.checkbox,
        isChecked && attorneySignupStyles.checkboxChecked,
      ]}
    >
      {isChecked && (
        <Ionicons name="checkmark" size={16} color="#fff" />
      )}
    </View>
    <Text style={attorneySignupStyles.checkboxLabel}>{label}</Text>
  </TouchableOpacity>
));

export const AttorneySignupFormFields = ({
  control,
  errors,
  onSubmit,
  isRegistering,
  showPassword,
  showConfirmPassword,
  onTogglePassword,
  onToggleConfirmPassword,
}) => {
  return (
    <View>
      {/* Basic Information */}
      <Text style={attorneySignupStyles.sectionTitle}>
        Basic Information
      </Text>

      <FormInput
        control={control}
        name="email"
        label="Email Address"
        placeholder="your.email@example.com"
        error={errors.email}
        required
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <FormInput
        control={control}
        name="username"
        label="Username"
        placeholder="Choose a unique username"
        error={errors.username}
        required
        autoCapitalize="none"
      />

      <FormInput
        control={control}
        name="password"
        label="Password"
        placeholder="Create a secure password"
        error={errors.password}
        required
        secureTextEntry={!showPassword}
        rightIcon={
          <TouchableOpacity
            onPress={onTogglePassword}
            style={attorneySignupStyles.eyeIcon}
            activeOpacity={0.7}
          >
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={20}
              color="#64748b"
            />
          </TouchableOpacity>
        }
        helperText="Must be at least 6 characters"
      />

      <FormInput
        control={control}
        name="confirmPassword"
        label="Confirm Password"
        placeholder="Re-enter your password"
        error={errors.confirmPassword}
        required
        secureTextEntry={!showConfirmPassword}
        rightIcon={
          <TouchableOpacity
            onPress={onToggleConfirmPassword}
            style={attorneySignupStyles.eyeIcon}
            activeOpacity={0.7}
          >
            <Ionicons
              name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
              size={20}
              color="#64748b"
            />
          </TouchableOpacity>
        }
      />

      <View style={attorneySignupStyles.rowContainer}>
        <View style={attorneySignupStyles.halfWidth}>
          <FormInput
            control={control}
            name="firstName"
            label="First Name"
            placeholder="Juan"
            error={errors.firstName}
            required
          />
        </View>

        <View style={attorneySignupStyles.halfWidth}>
          <FormInput
            control={control}
            name="middleName"
            label="Middle Name"
            placeholder="Santos"
          />
        </View>
      </View>

      <View style={attorneySignupStyles.rowContainer}>
        <View style={attorneySignupStyles.halfWidth}>
          <FormInput
            control={control}
            name="lastName"
            label="Last Name"
            placeholder="Dela Cruz"
            error={errors.lastName}
            required
          />
        </View>

        <View style={attorneySignupStyles.halfWidth}>
          <FormInput
            control={control}
            name="suffix"
            label="Suffix"
            placeholder="Jr., Sr., III"
          />
        </View>
      </View>

      {/* Professional Information */}
      <Text style={attorneySignupStyles.sectionTitle}>
        Professional Information
      </Text>

      <View style={attorneySignupStyles.inputContainer}>
        <Text style={attorneySignupStyles.label}>
          Role <Text style={attorneySignupStyles.requiredStar}>*</Text>
        </Text>
        <View style={attorneySignupStyles.pickerContainer}>
          <Controller
            control={control}
            name="role"
            render={({ field: { onChange, value } }) => (
              <Picker
                selectedValue={value}
                onValueChange={onChange}
                style={attorneySignupStyles.picker}
              >
                <Picker.Item label="Select your role" value="" />
                <Picker.Item label="Attorney" value="attorney" />
                <Picker.Item label="Legal Aid Lawyer" value="pao_lawyer" />
                <Picker.Item label="Legal Volunteer" value="legal_volunteer" />
              </Picker>
            )}
          />
        </View>
        {errors.role && (
          <Text style={attorneySignupStyles.errorText}>
            {errors.role.message}
          </Text>
        )}
      </View>

      <FormInput
        control={control}
        name="prcLicenseNumber"
        label="PRC License Number"
        placeholder="e.g., 1234567"
        error={errors.prcLicenseNumber}
        required
        keyboardType="numeric"
      />

      <FormInput
        control={control}
        name="ibrNumber"
        label="IBR Number"
        placeholder="e.g., IBR-1234567"
        error={errors.ibrNumber}
        required
      />

      <FormInput
        control={control}
        name="barAdmissionDate"
        label="Bar Admission Date"
        placeholder="YYYY-MM-DD (e.g., 2020-05-15)"
        error={errors.barAdmissionDate}
        required
        keyboardType="numeric"
        helperText="Format: Year-Month-Day (e.g., 2020-05-15)"
      />

      <FormInput
        control={control}
        name="phoneNumber"
        label="Phone Number"
        placeholder="+639171234567"
        error={errors.phoneNumber}
        required
        keyboardType="phone-pad"
      />

      <FormInput
        control={control}
        name="lawFirm"
        label="Law Firm / Organization"
        placeholder="Enter law firm or organization name"
      />

      {/* Office Address */}
      <Text style={attorneySignupStyles.sectionTitle}>
        Office Address
      </Text>

      <View style={attorneySignupStyles.addressSection}>
        <FormInput
          control={control}
          name="officeAddress.street"
          label="Street Address"
          placeholder="Building name, street"
        />

        <FormInput
          control={control}
          name="officeAddress.barangay"
          label="Barangay"
          placeholder="Barangay name"
        />

        <View style={attorneySignupStyles.rowContainer}>
          <View style={attorneySignupStyles.halfWidth}>
            <FormInput
              control={control}
              name="officeAddress.city"
              label="City"
              placeholder="City"
              error={errors.officeAddress?.city}
              required
            />
          </View>

          <View style={attorneySignupStyles.halfWidth}>
            <FormInput
              control={control}
              name="officeAddress.zipCode"
              label="Zip Code"
              placeholder="1000"
              keyboardType="numeric"
            />
          </View>
        </View>

        <FormInput
          control={control}
          name="officeAddress.province"
          label="Province"
          placeholder="Province name"
          error={errors.officeAddress?.province}
          required
        />

        <FormInput
          control={control}
          name="officeAddress.region"
          label="Region"
          placeholder="e.g., NCR, Region III"
          error={errors.officeAddress?.region}
          required
        />
      </View>

      {/* Specializations */}
      <Text style={attorneySignupStyles.sectionTitle}>
        Areas of Specialization
      </Text>
      <Text style={attorneySignupStyles.sectionDescription}>
        Select all areas where you practice
      </Text>
      <Controller
        control={control}
        name="specializations"
        render={({ field: { onChange, value } }) => (
          <View style={attorneySignupStyles.multiSelectContainer}>
            {SPECIALIZATIONS.map((spec) => (
              <CheckboxItem
                key={spec}
                label={spec}
                isChecked={value?.includes(spec)}
                onPress={() => {
                  const newValue = value?.includes(spec)
                    ? value.filter((s) => s !== spec)
                    : [...(value || []), spec];
                  onChange(newValue);
                }}
              />
            ))}
          </View>
        )}
      />

      {/* Languages */}
      <Text style={attorneySignupStyles.sectionTitle}>
        Languages Spoken
      </Text>
      <Text style={attorneySignupStyles.sectionDescription}>
        Select all languages you can communicate in
      </Text>
      <Controller
        control={control}
        name="languages"
        render={({ field: { onChange, value } }) => (
          <View style={attorneySignupStyles.multiSelectContainer}>
            {LANGUAGES.map((lang) => (
              <CheckboxItem
                key={lang}
                label={lang}
                isChecked={value?.includes(lang)}
                onPress={() => {
                  const newValue = value?.includes(lang)
                    ? value.filter((l) => l !== lang)
                    : [...(value || []), lang];
                  onChange(newValue);
                }}
              />
            ))}
          </View>
        )}
      />

      {/* Consultation Mode */}
      <Text style={attorneySignupStyles.sectionTitle}>
        Consultation Preferences
      </Text>
      <Text style={attorneySignupStyles.sectionDescription}>
        How do you prefer to meet with clients?
      </Text>
      <Controller
        control={control}
        name="consultationMode"
        render={({ field: { onChange, value } }) => (
          <View style={attorneySignupStyles.consultationModeContainer}>
            {CONSULTATION_MODES.map((mode) => (
              <CheckboxItem
                key={mode.value}
                label={mode.label}
                isChecked={value?.includes(mode.value)}
                onPress={() => {
                  const newValue = value?.includes(mode.value)
                    ? value.filter((m) => m !== mode.value)
                    : [...(value || []), mode.value];
                  onChange(newValue);
                }}
              />
            ))}
          </View>
        )}
      />

      {/* Biography */}
      <Text style={attorneySignupStyles.sectionTitle}>
        Professional Biography
      </Text>
      <Text style={attorneySignupStyles.sectionDescription}>
        Tell clients about your experience and expertise
      </Text>
      <FormInput
        control={control}
        name="biography"
        placeholder="Describe your legal background, years of experience, notable cases, and what makes you unique as an attorney..."
        multiline
        numberOfLines={4}
      />

      {/* Submit Button */}
      <TouchableOpacity
        style={[
          attorneySignupStyles.submitButton,
          isRegistering && attorneySignupStyles.submitButtonDisabled,
        ]}
        onPress={onSubmit}
        disabled={isRegistering}
        activeOpacity={0.8}
      >
        <View style={attorneySignupStyles.submitButtonContent}>
          {isRegistering && (
            <Ionicons 
              name="hourglass-outline" 
              size={18} 
              color="#FFFFFF" 
              style={{ marginRight: 8 }} 
            />
          )}
          <Text style={attorneySignupStyles.submitButtonText}>
            {isRegistering ? "Creating Account..." : "Create Attorney Account"}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};