import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Controller } from "react-hook-form";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import attorneySignupStyles from "../../asssets/styles/attorneySignupStyles";

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

const CONSULTATION_MODES = ["online", "in-person", "both"];

export const AttorneySignupFormFields = ({
  control,
  errors,
  onSubmit,
  isRegistering,
  showPassword,
  showConfirmPassword,
  onTogglePassword,
  onToggleConfirmPassword,
  watchPassword,
}) => {
  return (
    <View>
      {/* Basic Information */}
      <Text style={attorneySignupStyles.sectionTitle}>
        Basic Information
      </Text>

      <View style={attorneySignupStyles.inputContainer}>
        <Text style={attorneySignupStyles.label}>
          Email <Text style={attorneySignupStyles.requiredStar}>*</Text>
        </Text>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[
                attorneySignupStyles.input,
                errors.email && attorneySignupStyles.inputError,
              ]}
              placeholder="Enter your email"
              value={value}
              onChangeText={onChange}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          )}
        />
        {errors.email && (
          <Text style={attorneySignupStyles.errorText}>
            {errors.email.message}
          </Text>
        )}
      </View>

      <View style={attorneySignupStyles.inputContainer}>
        <Text style={attorneySignupStyles.label}>
          Username <Text style={attorneySignupStyles.requiredStar}>*</Text>
        </Text>
        <Controller
          control={control}
          name="username"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[
                attorneySignupStyles.input,
                errors.username && attorneySignupStyles.inputError,
              ]}
              placeholder="Enter username"
              value={value}
              onChangeText={onChange}
              autoCapitalize="none"
            />
          )}
        />
        {errors.username && (
          <Text style={attorneySignupStyles.errorText}>
            {errors.username.message}
          </Text>
        )}
      </View>

      <View style={attorneySignupStyles.inputContainer}>
        <Text style={attorneySignupStyles.label}>
          Password <Text style={attorneySignupStyles.requiredStar}>*</Text>
        </Text>
        <View style={{ position: "relative" }}>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[
                  attorneySignupStyles.input,
                  errors.password && attorneySignupStyles.inputError,
                ]}
                placeholder="Enter password"
                value={value}
                onChangeText={onChange}
                secureTextEntry={!showPassword}
              />
            )}
          />
          <TouchableOpacity
            onPress={onTogglePassword}
            style={{
              position: "absolute",
              right: 16,
              top: 12,
            }}
          >
            <Ionicons
              name={showPassword ? "eye-off" : "eye"}
              size={20}
              color="#64748b"
            />
          </TouchableOpacity>
        </View>
        {errors.password && (
          <Text style={attorneySignupStyles.errorText}>
            {errors.password.message}
          </Text>
        )}
      </View>

      <View style={attorneySignupStyles.inputContainer}>
        <Text style={attorneySignupStyles.label}>
          Confirm Password{" "}
          <Text style={attorneySignupStyles.requiredStar}>*</Text>
        </Text>
        <View style={{ position: "relative" }}>
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[
                  attorneySignupStyles.input,
                  errors.confirmPassword && attorneySignupStyles.inputError,
                ]}
                placeholder="Confirm password"
                value={value}
                onChangeText={onChange}
                secureTextEntry={!showConfirmPassword}
              />
            )}
          />
          <TouchableOpacity
            onPress={onToggleConfirmPassword}
            style={{
              position: "absolute",
              right: 16,
              top: 12,
            }}
          >
            <Ionicons
              name={showConfirmPassword ? "eye-off" : "eye"}
              size={20}
              color="#64748b"
            />
          </TouchableOpacity>
        </View>
        {errors.confirmPassword && (
          <Text style={attorneySignupStyles.errorText}>
            {errors.confirmPassword.message}
          </Text>
        )}
      </View>

      <View style={attorneySignupStyles.rowContainer}>
        <View
          style={[attorneySignupStyles.inputContainer, attorneySignupStyles.halfWidth]}
        >
          <Text style={attorneySignupStyles.label}>
            First Name <Text style={attorneySignupStyles.requiredStar}>*</Text>
          </Text>
          <Controller
            control={control}
            name="firstName"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[
                  attorneySignupStyles.input,
                  errors.firstName && attorneySignupStyles.inputError,
                ]}
                placeholder="First name"
                value={value}
                onChangeText={onChange}
              />
            )}
          />
          {errors.firstName && (
            <Text style={attorneySignupStyles.errorText}>
              {errors.firstName.message}
            </Text>
          )}
        </View>

        <View
          style={[attorneySignupStyles.inputContainer, attorneySignupStyles.halfWidth]}
        >
          <Text style={attorneySignupStyles.label}>Middle Name</Text>
          <Controller
            control={control}
            name="middleName"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={attorneySignupStyles.input}
                placeholder="Middle name"
                value={value}
                onChangeText={onChange}
              />
            )}
          />
        </View>
      </View>

      <View style={attorneySignupStyles.rowContainer}>
        <View
          style={[attorneySignupStyles.inputContainer, attorneySignupStyles.halfWidth]}
        >
          <Text style={attorneySignupStyles.label}>
            Last Name <Text style={attorneySignupStyles.requiredStar}>*</Text>
          </Text>
          <Controller
            control={control}
            name="lastName"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[
                  attorneySignupStyles.input,
                  errors.lastName && attorneySignupStyles.inputError,
                ]}
                placeholder="Last name"
                value={value}
                onChangeText={onChange}
              />
            )}
          />
          {errors.lastName && (
            <Text style={attorneySignupStyles.errorText}>
              {errors.lastName.message}
            </Text>
          )}
        </View>

        <View
          style={[attorneySignupStyles.inputContainer, attorneySignupStyles.halfWidth]}
        >
          <Text style={attorneySignupStyles.label}>Suffix</Text>
          <Controller
            control={control}
            name="suffix"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={attorneySignupStyles.input}
                placeholder="Jr., Sr., III"
                value={value}
                onChangeText={onChange}
              />
            )}
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
                <Picker.Item label="Select role" value="" />
                <Picker.Item label="Attorney" value="attorney" />
                <Picker.Item label="PAO Lawyer" value="pao_lawyer" />
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

      <View style={attorneySignupStyles.inputContainer}>
        <Text style={attorneySignupStyles.label}>
          PRC License Number{" "}
          <Text style={attorneySignupStyles.requiredStar}>*</Text>
        </Text>
        <Controller
          control={control}
          name="prcLicenseNumber"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[
                attorneySignupStyles.input,
                errors.prcLicenseNumber && attorneySignupStyles.inputError,
              ]}
              placeholder="Enter PRC License Number"
              value={value}
              onChangeText={onChange}
            />
          )}
        />
        {errors.prcLicenseNumber && (
          <Text style={attorneySignupStyles.errorText}>
            {errors.prcLicenseNumber.message}
          </Text>
        )}
      </View>

      <View style={attorneySignupStyles.inputContainer}>
        <Text style={attorneySignupStyles.label}>
          IBR Number <Text style={attorneySignupStyles.requiredStar}>*</Text>
        </Text>
        <Controller
          control={control}
          name="ibrNumber"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[
                attorneySignupStyles.input,
                errors.ibrNumber && attorneySignupStyles.inputError,
              ]}
              placeholder="Enter IBR Number"
              value={value}
              onChangeText={onChange}
            />
          )}
        />
        {errors.ibrNumber && (
          <Text style={attorneySignupStyles.errorText}>
            {errors.ibrNumber.message}
          </Text>
        )}
      </View>

      <View style={attorneySignupStyles.inputContainer}>
        <Text style={attorneySignupStyles.label}>
          Bar Admission Date{" "}
          <Text style={attorneySignupStyles.requiredStar}>*</Text>
        </Text>
        <Controller
          control={control}
          name="barAdmissionDate"
          rules={{
            required: "Bar admission date is required",
            pattern: {
              value: /^\d{4}-\d{2}-\d{2}$/,
              message: "Please use YYYY-MM-DD format (e.g., 2020-05-15)",
            },
          }}
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[
                attorneySignupStyles.input,
                errors.barAdmissionDate && attorneySignupStyles.inputError,
              ]}
              placeholder="YYYY-MM-DD (e.g., 2020-05-15)"
              value={value ? (typeof value === 'string' ? value : value.toISOString().split('T')[0]) : ''}
              onChangeText={onChange}
              keyboardType="numeric"
            />
          )}
        />
        {errors.barAdmissionDate && (
          <Text style={attorneySignupStyles.errorText}>
            {errors.barAdmissionDate.message}
          </Text>
        )}
        <Text style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
          Format: Year-Month-Day (e.g., 2020-05-15)
        </Text>
      </View>

      <View style={attorneySignupStyles.inputContainer}>
        <Text style={attorneySignupStyles.label}>
          Phone Number <Text style={attorneySignupStyles.requiredStar}>*</Text>
        </Text>
        <Controller
          control={control}
          name="phoneNumber"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[
                attorneySignupStyles.input,
                errors.phoneNumber && attorneySignupStyles.inputError,
              ]}
              placeholder="+639171234567"
              value={value}
              onChangeText={onChange}
              keyboardType="phone-pad"
            />
          )}
        />
        {errors.phoneNumber && (
          <Text style={attorneySignupStyles.errorText}>
            {errors.phoneNumber.message}
          </Text>
        )}
      </View>

      <View style={attorneySignupStyles.inputContainer}>
        <Text style={attorneySignupStyles.label}>Law Firm</Text>
        <Controller
          control={control}
          name="lawFirm"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={attorneySignupStyles.input}
              placeholder="Enter law firm name"
              value={value}
              onChangeText={onChange}
            />
          )}
        />
      </View>

      {/* Office Address */}
      <Text style={attorneySignupStyles.sectionTitle}>Office Address</Text>

      <View style={attorneySignupStyles.addressSection}>
        <View style={attorneySignupStyles.inputContainer}>
          <Text style={attorneySignupStyles.label}>Street</Text>
          <Controller
            control={control}
            name="officeAddress.street"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={attorneySignupStyles.input}
                placeholder="Street address"
                value={value}
                onChangeText={onChange}
              />
            )}
          />
        </View>

        <View style={attorneySignupStyles.inputContainer}>
          <Text style={attorneySignupStyles.label}>Barangay</Text>
          <Controller
            control={control}
            name="officeAddress.barangay"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={attorneySignupStyles.input}
                placeholder="Barangay"
                value={value}
                onChangeText={onChange}
              />
            )}
          />
        </View>

        <View style={attorneySignupStyles.inputContainer}>
          <Text style={attorneySignupStyles.label}>
            City <Text style={attorneySignupStyles.requiredStar}>*</Text>
          </Text>
          <Controller
            control={control}
            name="officeAddress.city"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[
                  attorneySignupStyles.input,
                  errors.officeAddress?.city &&
                    attorneySignupStyles.inputError,
                ]}
                placeholder="City"
                value={value}
                onChangeText={onChange}
              />
            )}
          />
          {errors.officeAddress?.city && (
            <Text style={attorneySignupStyles.errorText}>
              {errors.officeAddress.city.message}
            </Text>
          )}
        </View>

        <View style={attorneySignupStyles.inputContainer}>
          <Text style={attorneySignupStyles.label}>
            Province <Text style={attorneySignupStyles.requiredStar}>*</Text>
          </Text>
          <Controller
            control={control}
            name="officeAddress.province"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[
                  attorneySignupStyles.input,
                  errors.officeAddress?.province &&
                    attorneySignupStyles.inputError,
                ]}
                placeholder="Province"
                value={value}
                onChangeText={onChange}
              />
            )}
          />
          {errors.officeAddress?.province && (
            <Text style={attorneySignupStyles.errorText}>
              {errors.officeAddress.province.message}
            </Text>
          )}
        </View>

        <View style={attorneySignupStyles.inputContainer}>
          <Text style={attorneySignupStyles.label}>
            Region <Text style={attorneySignupStyles.requiredStar}>*</Text>
          </Text>
          <Controller
            control={control}
            name="officeAddress.region"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[
                  attorneySignupStyles.input,
                  errors.officeAddress?.region &&
                    attorneySignupStyles.inputError,
                ]}
                placeholder="Region"
                value={value}
                onChangeText={onChange}
              />
            )}
          />
          {errors.officeAddress?.region && (
            <Text style={attorneySignupStyles.errorText}>
              {errors.officeAddress.region.message}
            </Text>
          )}
        </View>

        <View style={attorneySignupStyles.inputContainer}>
          <Text style={attorneySignupStyles.label}>Zip Code</Text>
          <Controller
            control={control}
            name="officeAddress.zipCode"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={attorneySignupStyles.input}
                placeholder="Zip code"
                value={value}
                onChangeText={onChange}
                keyboardType="numeric"
              />
            )}
          />
        </View>
      </View>

      {/* Specializations */}
      <Text style={attorneySignupStyles.sectionTitle}>Specializations</Text>
      <Controller
        control={control}
        name="specializations"
        render={({ field: { onChange, value } }) => (
          <View style={attorneySignupStyles.multiSelectContainer}>
            {SPECIALIZATIONS.map((spec) => (
              <TouchableOpacity
                key={spec}
                style={attorneySignupStyles.multiSelectItem}
                onPress={() => {
                  const newValue = value?.includes(spec)
                    ? value.filter((s) => s !== spec)
                    : [...(value || []), spec];
                  onChange(newValue);
                }}
              >
                <View
                  style={[
                    attorneySignupStyles.checkbox,
                    value?.includes(spec) &&
                      attorneySignupStyles.checkboxChecked,
                  ]}
                >
                  {value?.includes(spec) && (
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  )}
                </View>
                <Text style={attorneySignupStyles.checkboxLabel}>{spec}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      />

      {/* Languages */}
      <Text style={attorneySignupStyles.sectionTitle}>Languages</Text>
      <Controller
        control={control}
        name="languages"
        render={({ field: { onChange, value } }) => (
          <View style={attorneySignupStyles.multiSelectContainer}>
            {LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang}
                style={attorneySignupStyles.multiSelectItem}
                onPress={() => {
                  const newValue = value?.includes(lang)
                    ? value.filter((l) => l !== lang)
                    : [...(value || []), lang];
                  onChange(newValue);
                }}
              >
                <View
                  style={[
                    attorneySignupStyles.checkbox,
                    value?.includes(lang) &&
                      attorneySignupStyles.checkboxChecked,
                  ]}
                >
                  {value?.includes(lang) && (
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  )}
                </View>
                <Text style={attorneySignupStyles.checkboxLabel}>{lang}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      />

      {/* Consultation Mode */}
      <Text style={attorneySignupStyles.sectionTitle}>Consultation Mode</Text>
      <Controller
        control={control}
        name="consultationMode"
        render={({ field: { onChange, value } }) => (
          <View style={attorneySignupStyles.multiSelectContainer}>
            {CONSULTATION_MODES.map((mode) => (
              <TouchableOpacity
                key={mode}
                style={attorneySignupStyles.multiSelectItem}
                onPress={() => {
                  const newValue = value?.includes(mode)
                    ? value.filter((m) => m !== mode)
                    : [...(value || []), mode];
                  onChange(newValue);
                }}
              >
                <View
                  style={[
                    attorneySignupStyles.checkbox,
                    value?.includes(mode) &&
                      attorneySignupStyles.checkboxChecked,
                  ]}
                >
                  {value?.includes(mode) && (
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  )}
                </View>
                <Text style={attorneySignupStyles.checkboxLabel}>
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      />

      {/* Biography */}
      <Text style={attorneySignupStyles.sectionTitle}>Biography</Text>
      <View style={attorneySignupStyles.inputContainer}>
        <Controller
          control={control}
          name="biography"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[attorneySignupStyles.input, attorneySignupStyles.textArea]}
              placeholder="Tell us about yourself and your experience..."
              value={value}
              onChangeText={onChange}
              multiline
              numberOfLines={4}
            />
          )}
        />
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[
          attorneySignupStyles.submitButton,
          isRegistering && attorneySignupStyles.submitButtonDisabled,
        ]}
        onPress={onSubmit}
        disabled={isRegistering}
      >
        <Text style={attorneySignupStyles.submitButtonText}>
          {isRegistering ? "Creating Account..." : "Create Attorney Account"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};
