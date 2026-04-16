import React from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Controller } from "react-hook-form";
import { Ionicons } from "@expo/vector-icons";

import { useSignup } from "hooks/useSignup";

const PRIMARY_BROWN = "#8B4513";
const PRIMARY_GOLD = "#C4AB7D";
const MUTED_OLIVE = "#6B6B5A";
const CHARCOAL = "#2C2C2C";
const ACCENT_TAN = "#A68A64";

export default function Signup() {
  const router = useRouter();
  const {
    control,
    errors,
    handleSubmit,
    watchPassword,
    showPassword,
    showConfirmPassword,
    isRegistering,
    errorMessage,
    handleEmailSignup,
    handleGoogleSignup,
    togglePasswordVisibility,
    toggleConfirmPasswordVisibility,
  } = useSignup();

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={s.brandBar}>
        <Ionicons name="scale-outline" size={24} color="#fff" />
        <View>
          <Text style={s.brandTitle}>SOLA</Text>
          <Text style={s.brandSub}>Sebastinian Office of Legal Aid</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={s.contentWrap}>
          <TouchableOpacity style={s.backLink} onPress={() => router.push("/")}>
            <Ionicons name="arrow-back" size={16} color={MUTED_OLIVE} />
            <Text style={s.backLinkText}>Back to Home</Text>
          </TouchableOpacity>

          <View style={s.infoCard}>
            <View style={s.infoPill}>
              <Text style={s.infoPillText}>Shared Account Setup</Text>
            </View>
            <Text style={s.infoTitle}>Create the shared SOLA account</Text>
            <Text style={s.infoSubtitle}>
              This sign-up creates the main login only. After signing in, you'll choose or create the staff profiles that act like separate office identities.
            </Text>

            <View style={s.infoList}>
              <View style={s.infoItem}>
                <Ionicons name="shield-checkmark" size={16} color={PRIMARY_GOLD} />
                <Text style={s.infoItemText}>One Gmail or email login for the office</Text>
              </View>
              <View style={s.infoItem}>
                <Ionicons name="shield-checkmark" size={16} color={PRIMARY_GOLD} />
                <Text style={s.infoItemText}>Multiple staff profiles under the same account</Text>
              </View>
              <View style={s.infoItem}>
                <Ionicons name="shield-checkmark" size={16} color={PRIMARY_GOLD} />
                <Text style={s.infoItemText}>Each profile keeps its own role and signature</Text>
              </View>
            </View>
          </View>

          <View style={s.formCard}>
            <Text style={s.formTitle}>Create account</Text>
            <Text style={s.formSubtitle}>
              Set up the main login first. Staff profiles can be added right after sign-in.
            </Text>

            {errorMessage ? (
              <View style={s.errorBox}>
                <Text style={s.errorBoxText}>{errorMessage}</Text>
              </View>
            ) : null}

            <Text style={s.fieldLabel}>EMAIL ADDRESS</Text>
            <Controller
              control={control}
              name="email"
              rules={{
                required: "Email is required",
                pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: "Invalid email address" },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={[s.inputWrap, errors.email && s.inputWrapError]}>
                  <Ionicons name="mail-outline" size={18} color={ACCENT_TAN} style={s.inputIcon} />
                  <TextInput
                    style={s.input}
                    placeholder="office@gmail.com"
                    placeholderTextColor="#999"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!isRegistering}
                    returnKeyType="next"
                  />
                </View>
              )}
            />
            {errors.email ? <Text style={s.errorText}>{errors.email.message}</Text> : null}

            <Text style={s.fieldLabel}>PASSWORD</Text>
            <Controller
              control={control}
              name="password"
              rules={{
                required: "Password is required",
                minLength: { value: 6, message: "Password must be at least 6 characters" },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                  message: "Password must contain uppercase, lowercase, and number",
                },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={[s.inputWrap, errors.password && s.inputWrapError]}>
                  <Ionicons name="lock-closed-outline" size={18} color={ACCENT_TAN} style={s.inputIcon} />
                  <TextInput
                    style={[s.input, { paddingRight: 46 }]}
                    placeholder="Create a strong password"
                    placeholderTextColor="#999"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    editable={!isRegistering}
                    returnKeyType="next"
                  />
                  <TouchableOpacity style={s.eyeBtn} onPress={togglePasswordVisibility} disabled={isRegistering}>
                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#999" />
                  </TouchableOpacity>
                </View>
              )}
            />
            {errors.password ? <Text style={s.errorText}>{errors.password.message}</Text> : null}

            <Text style={s.fieldLabel}>CONFIRM PASSWORD</Text>
            <Controller
              control={control}
              name="confirmPassword"
              rules={{
                required: "Please confirm your password",
                validate: (value) => value === watchPassword || "Passwords do not match",
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={[s.inputWrap, errors.confirmPassword && s.inputWrapError]}>
                  <Ionicons name="lock-closed-outline" size={18} color={ACCENT_TAN} style={s.inputIcon} />
                  <TextInput
                    style={[s.input, { paddingRight: 46 }]}
                    placeholder="Re-enter your password"
                    placeholderTextColor="#999"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    editable={!isRegistering}
                    returnKeyType="done"
                  />
                  <TouchableOpacity style={s.eyeBtn} onPress={toggleConfirmPasswordVisibility} disabled={isRegistering}>
                    <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#999" />
                  </TouchableOpacity>
                </View>
              )}
            />
            {errors.confirmPassword ? <Text style={s.errorText}>{errors.confirmPassword.message}</Text> : null}

            <TouchableOpacity
              activeOpacity={0.9}
              style={[s.primaryBtn, isRegistering && s.primaryBtnDisabled]}
              onPress={handleSubmit(handleEmailSignup)}
              disabled={isRegistering}
            >
              {isRegistering ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={s.primaryBtnText}>CREATE SHARED ACCOUNT</Text>
              )}
            </TouchableOpacity>

            <View style={s.dividerRow}>
              <View style={s.dividerLine} />
              <Text style={s.dividerText}>OR CONTINUE WITH</Text>
              <View style={s.dividerLine} />
            </View>

            <TouchableOpacity
              activeOpacity={0.9}
              style={[s.googleBtn, isRegistering && s.googleBtnDisabled]}
              onPress={handleGoogleSignup}
              disabled={isRegistering}
            >
              <Ionicons name="logo-google" size={20} color="#DB4437" />
              <Text style={s.googleBtnText}>{isRegistering ? "Connecting..." : "Continue with Google"}</Text>
            </TouchableOpacity>

            <View style={s.footer}>
              <Text style={s.footerText}>Already have the shared account? </Text>
              <TouchableOpacity onPress={() => router.push("/auth")}>
                <Text style={s.footerLink}>Sign in</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF8F5" },
  brandBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: PRIMARY_BROWN,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.12)",
  },
  brandTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },
  brandSub: {
    fontSize: 8,
    color: "rgba(196,171,125,0.8)",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 34 },
  contentWrap: { width: "100%", maxWidth: 560, alignSelf: "center" },
  backLink: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16 },
  backLinkText: { fontSize: 12, color: MUTED_OLIVE },
  infoCard: {
    backgroundColor: PRIMARY_BROWN,
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    shadowColor: "#2C2C2C",
    shadowOpacity: 0.24,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
    elevation: 4,
  },
  infoPill: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10,
  },
  infoPillText: {
    fontSize: 10,
    color: "#fff",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    fontWeight: "600",
  },
  infoTitle: {
    fontSize: 28,
    lineHeight: 34,
    color: "#fff",
    fontWeight: "600",
    marginBottom: 8,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
  },
  infoSubtitle: {
    fontSize: 13,
    lineHeight: 20,
    color: "rgba(255,255,255,0.8)",
  },
  infoList: { marginTop: 14, gap: 9 },
  infoItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoItemText: { fontSize: 13, color: "rgba(255,255,255,0.9)" },
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EEE3D4",
    padding: 18,
    shadowColor: "#2C2C2C",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  formTitle: {
    fontSize: 32,
    color: CHARCOAL,
    fontWeight: "600",
    marginBottom: 6,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
  },
  formSubtitle: { fontSize: 14, color: MUTED_OLIVE, lineHeight: 20, marginBottom: 14 },
  errorBox: {
    marginBottom: 12,
    borderRadius: 6,
    backgroundColor: "#FFF0F0",
    borderWidth: 1,
    borderColor: "#FFCDD2",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  errorBoxText: { fontSize: 13, color: "#C62828" },
  fieldLabel: {
    fontSize: 11,
    color: MUTED_OLIVE,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: "600",
    marginBottom: 7,
    marginTop: 8,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DDD5C8",
    borderRadius: 4,
    backgroundColor: "#FDFBF8",
    minHeight: 52,
  },
  inputWrapError: { borderColor: "#C62828" },
  inputIcon: { marginLeft: 14 },
  input: { flex: 1, fontSize: 15, color: CHARCOAL, paddingHorizontal: 12, minHeight: 52 },
  eyeBtn: { position: "absolute", right: 14, top: 0, bottom: 0, justifyContent: "center" },
  errorText: { fontSize: 12, color: "#C62828", marginTop: 4 },
  primaryBtn: {
    height: 52,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PRIMARY_BROWN,
    marginTop: 18,
  },
  primaryBtnDisabled: { opacity: 0.7 },
  primaryBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 1.3,
    textTransform: "uppercase",
  },
  dividerRow: { flexDirection: "row", alignItems: "center", marginVertical: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#DDD5C8" },
  dividerText: {
    marginHorizontal: 10,
    fontSize: 11,
    color: MUTED_OLIVE,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  googleBtn: {
    height: 52,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "#DDD5C8",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  googleBtnDisabled: { opacity: 0.65 },
  googleBtnText: { fontSize: 14, color: CHARCOAL, fontWeight: "500" },
  footer: { marginTop: 14, flexDirection: "row", justifyContent: "center", alignItems: "center" },
  footerText: { fontSize: 13, color: MUTED_OLIVE },
  footerLink: { fontSize: 13, color: PRIMARY_BROWN, fontWeight: "600" },
});

