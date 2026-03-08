import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Controller } from "react-hook-form";
import { Ionicons } from "@expo/vector-icons";
import { useSignup } from "hooks/useSignup";
import { checkEmailExists } from "../../api/userApi";

const PRIMARY_BROWN = "#8B4513";
const PRIMARY_GOLD = "#C4AB7D";
const MUTED_OLIVE = "#6B6B5A";
const CHARCOAL = "#2C2C2C";
const ACCENT_TAN = "#A68A64";

const STEPS = [
  { title: "Create Account", subtitle: "Let's start with your name" },
  { title: "Your Email", subtitle: "Enter your email address" },
  { title: "Choose Username", subtitle: "Pick a unique username (optional)" },
  { title: "Secure Your Account", subtitle: "Create a strong password" },
];

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
    trigger,
    getValues,
  } = useSignup();

  const [step, setStep] = useState(1);
  const [isValidating, setIsValidating] = useState(false);

  const currentStep = STEPS[step - 1];

  const handleNext = async () => {
    setIsValidating(true);
    try {
      let isValid = false;
      if (step === 1) {
        isValid = await trigger(["firstName", "lastName"]);
      } else if (step === 2) {
        isValid = await trigger("email");
        if (isValid) {
          try {
            const response = await checkEmailExists(getValues("email"));
            if (response.exists) {
              Alert.alert("Email Taken", "This email is already registered. Please use a different email or log in.");
              isValid = false;
            }
          } catch {
            Alert.alert("Verification Failed", "Unable to verify email. Please try again.");
            isValid = false;
          }
        }
      } else if (step === 3) {
        const username = getValues("username");
        isValid = username?.trim() ? await trigger("username") : true;
      }
      if (isValid) setStep((s) => s + 1);
    } catch (err) {
      console.error("Validation error:", err);
    } finally {
      setIsValidating(false);
    }
  };

  const handleBack = () => setStep((s) => s - 1);

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      {/* Brand Bar */}
      <View style={s.brandBar}>
        <Ionicons name="scale-outline" size={24} color="#fff" />
        <View>
          <Text style={s.brandTitle}>SOLA</Text>
          <Text style={s.brandSub}>Sebastinian Office of Legal Aid</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Back to Home */}
        <TouchableOpacity style={s.backLink} onPress={() => router.push("/")}>
          <Ionicons name="arrow-back" size={16} color={MUTED_OLIVE} />
          <Text style={s.backLinkText}>Back to Home</Text>
        </TouchableOpacity>

        {/* Step Dots */}
        <View style={s.stepDots}>
          {STEPS.map((_, i) => (
            <View
              key={i}
              style={[
                s.stepDot,
                step === i + 1 && s.stepDotActive,
                step > i + 1 && s.stepDotDone,
              ]}
            />
          ))}
        </View>

        {/* Step Header */}
        <Text style={s.stepTitle}>{currentStep.title}</Text>
        <Text style={s.stepSubtitle}>{currentStep.subtitle}</Text>

        {/* Step 1: Name + Google */}
        {step === 1 && (
          <View style={s.stepContent}>
            <Text style={s.fieldLabel}>FIRST NAME</Text>
            <Controller
              control={control}
              name="firstName"
              rules={{
                required: "First name is required",
                minLength: { value: 2, message: "First name must be at least 2 characters" },
                maxLength: { value: 50, message: "First name must not exceed 50 characters" },
                pattern: { value: /^[A-Za-z\s]+$/, message: "First name can only contain letters" },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={s.inputWrap}>
                  <Ionicons name="person-outline" size={18} color={ACCENT_TAN} style={s.inputIcon} />
                  <TextInput
                    style={s.input}
                    placeholder="First name"
                    placeholderTextColor="#999"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    autoFocus
                  />
                </View>
              )}
            />
            {errors.firstName && <Text style={s.errorText}>{errors.firstName.message}</Text>}

            <Text style={[s.fieldLabel, { marginTop: 16 }]}>LAST NAME</Text>
            <Controller
              control={control}
              name="lastName"
              rules={{
                required: "Last name is required",
                minLength: { value: 2, message: "Last name must be at least 2 characters" },
                maxLength: { value: 50, message: "Last name must not exceed 50 characters" },
                pattern: { value: /^[A-Za-z\s]+$/, message: "Last name can only contain letters" },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={s.inputWrap}>
                  <Ionicons name="person-outline" size={18} color={ACCENT_TAN} style={s.inputIcon} />
                  <TextInput
                    style={s.input}
                    placeholder="Last name"
                    placeholderTextColor="#999"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                </View>
              )}
            />
            {errors.lastName && <Text style={s.errorText}>{errors.lastName.message}</Text>}

            {isValidating ? (
              <ActivityIndicator size="large" color={PRIMARY_BROWN} style={{ marginTop: 20 }} />
            ) : (
              <TouchableOpacity style={s.primaryBtn} onPress={handleNext}>
                <Text style={s.primaryBtnText}>CONTINUE</Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              </TouchableOpacity>
            )}

            {/* Divider */}
            <View style={s.dividerRow}>
              <View style={s.dividerLine} />
              <Text style={s.dividerText}>OR SIGN UP WITH</Text>
              <View style={s.dividerLine} />
            </View>

            {/* Google Signup */}
            <TouchableOpacity style={s.googleBtn} onPress={handleGoogleSignup} disabled={isRegistering}>
              <Ionicons name="logo-google" size={20} color="#DB4437" />
              <Text style={s.googleBtnText}>Continue with Google</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 2: Email */}
        {step === 2 && (
          <View style={s.stepContent}>
            <Text style={s.fieldLabel}>EMAIL ADDRESS</Text>
            <Controller
              control={control}
              name="email"
              rules={{
                required: "Email is required",
                pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: "Invalid email address" },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={s.inputWrap}>
                  <Ionicons name="mail-outline" size={18} color={ACCENT_TAN} style={s.inputIcon} />
                  <TextInput
                    style={s.input}
                    placeholder="you@example.com"
                    placeholderTextColor="#999"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    autoFocus
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              )}
            />
            {errors.email && <Text style={s.errorText}>{errors.email.message}</Text>}

            {isValidating ? (
              <ActivityIndicator size="large" color={PRIMARY_BROWN} style={{ marginTop: 20 }} />
            ) : (
              <View style={s.btnRow}>
                <TouchableOpacity style={s.backBtn} onPress={handleBack}>
                  <Ionicons name="arrow-back" size={16} color={MUTED_OLIVE} />
                  <Text style={s.backBtnText}>BACK</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.primaryBtn, { flex: 1 }]} onPress={handleNext}>
                  <Text style={s.primaryBtnText}>CONTINUE</Text>
                  <Ionicons name="arrow-forward" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Step 3: Username */}
        {step === 3 && (
          <View style={s.stepContent}>
            <Text style={s.fieldLabel}>USERNAME <Text style={s.optionalLabel}>(optional)</Text></Text>
            <Controller
              control={control}
              name="username"
              rules={{
                minLength: { value: 3, message: "Username must be at least 3 characters" },
                maxLength: { value: 20, message: "Username must not exceed 20 characters" },
                pattern: { value: /^[a-zA-Z0-9_]+$/, message: "Username can only contain letters, numbers, and underscores" },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={s.inputWrap}>
                  <Ionicons name="person-outline" size={18} color={ACCENT_TAN} style={s.inputIcon} />
                  <TextInput
                    style={s.input}
                    placeholder="Choose a username"
                    placeholderTextColor="#999"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    autoFocus
                    autoCapitalize="none"
                  />
                </View>
              )}
            />
            <Text style={s.fieldHint}>Your email will be used as login if left empty</Text>
            {errors.username && <Text style={s.errorText}>{errors.username.message}</Text>}

            {isValidating ? (
              <ActivityIndicator size="large" color={PRIMARY_BROWN} style={{ marginTop: 20 }} />
            ) : (
              <View style={s.btnRow}>
                <TouchableOpacity style={s.backBtn} onPress={handleBack}>
                  <Ionicons name="arrow-back" size={16} color={MUTED_OLIVE} />
                  <Text style={s.backBtnText}>BACK</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.primaryBtn, { flex: 1 }]} onPress={handleNext}>
                  <Text style={s.primaryBtnText}>CONTINUE</Text>
                  <Ionicons name="arrow-forward" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Step 4: Password */}
        {step === 4 && (
          <View style={s.stepContent}>
            <Text style={s.fieldLabel}>PASSWORD</Text>
            <Controller
              control={control}
              name="password"
              rules={{
                required: "Password is required",
                minLength: { value: 6, message: "Password must be at least 6 characters" },
                pattern: { value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, message: "Password must contain uppercase, lowercase, and number" },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={s.inputWrap}>
                  <Ionicons name="lock-closed-outline" size={18} color={ACCENT_TAN} style={s.inputIcon} />
                  <TextInput
                    style={[s.input, { paddingRight: 48 }]}
                    placeholder="Create a password"
                    placeholderTextColor="#999"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    secureTextEntry={!showPassword}
                    autoFocus
                  />
                  <TouchableOpacity style={s.eyeBtn} onPress={togglePasswordVisibility}>
                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#999" />
                  </TouchableOpacity>
                </View>
              )}
            />
            <Text style={s.fieldHint}>Min 6 characters with uppercase, lowercase & number</Text>
            {errors.password && <Text style={s.errorText}>{errors.password.message}</Text>}

            <Text style={[s.fieldLabel, { marginTop: 16 }]}>CONFIRM PASSWORD</Text>
            <Controller
              control={control}
              name="confirmPassword"
              rules={{
                required: "Please confirm your password",
                validate: (value) => value === watchPassword || "Passwords do not match",
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={s.inputWrap}>
                  <Ionicons name="lock-closed-outline" size={18} color={ACCENT_TAN} style={s.inputIcon} />
                  <TextInput
                    style={[s.input, { paddingRight: 48 }]}
                    placeholder="Confirm your password"
                    placeholderTextColor="#999"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    secureTextEntry={!showConfirmPassword}
                  />
                  <TouchableOpacity style={s.eyeBtn} onPress={toggleConfirmPasswordVisibility}>
                    <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#999" />
                  </TouchableOpacity>
                </View>
              )}
            />
            {errors.confirmPassword && <Text style={s.errorText}>{errors.confirmPassword.message}</Text>}

            {errorMessage ? (
              <View style={s.errorBanner}>
                <Text style={s.errorBannerText}>{errorMessage}</Text>
              </View>
            ) : null}

            <View style={s.btnRow}>
              <TouchableOpacity style={s.backBtn} onPress={handleBack} disabled={isRegistering}>
                <Ionicons name="arrow-back" size={16} color={MUTED_OLIVE} />
                <Text style={s.backBtnText}>BACK</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.primaryBtn, { flex: 1 }, isRegistering && { opacity: 0.6 }]}
                onPress={handleSubmit(handleEmailSignup)}
                disabled={isRegistering}
              >
                {isRegistering ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="person-add-outline" size={16} color="#fff" />
                    <Text style={s.primaryBtnText}>CREATE ACCOUNT</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerText}>
            Already have an account?{" "}
          </Text>
          <TouchableOpacity onPress={() => router.push("/auth")}>
            <Text style={s.footerLink}>Sign in</Text>
          </TouchableOpacity>
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
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  brandTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },
  brandSub: { fontSize: 8, color: "rgba(196,171,125,0.8)", letterSpacing: 2, textTransform: "uppercase" },
  scrollContent: { padding: 24, paddingBottom: 40 },
  backLink: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 24 },
  backLinkText: { fontSize: 12, color: MUTED_OLIVE },
  stepDots: { flexDirection: "row", gap: 8, alignItems: "center", marginBottom: 20 },
  stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#E0D8CE" },
  stepDotActive: { backgroundColor: PRIMARY_BROWN, width: 24, borderRadius: 4 },
  stepDotDone: { backgroundColor: PRIMARY_GOLD },
  stepTitle: { fontSize: 28, fontWeight: "600", color: CHARCOAL, marginBottom: 6 },
  stepSubtitle: { fontSize: 14, color: MUTED_OLIVE, marginBottom: 28 },
  stepContent: {},
  fieldLabel: { fontSize: 12, fontWeight: "500", letterSpacing: 1, color: MUTED_OLIVE, marginBottom: 8, textTransform: "uppercase" },
  optionalLabel: { fontSize: 11, fontWeight: "400", textTransform: "none", letterSpacing: 0, color: MUTED_OLIVE },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DDD5C8",
    borderRadius: 4,
    backgroundColor: "#FDFBF8",
    height: 52,
  },
  inputIcon: { marginLeft: 14 },
  input: { flex: 1, fontSize: 15, color: CHARCOAL, paddingHorizontal: 12, height: "100%" },
  eyeBtn: { position: "absolute", right: 14, top: 0, bottom: 0, justifyContent: "center" },
  fieldHint: { fontSize: 11, color: MUTED_OLIVE, marginTop: 4 },
  errorText: { fontSize: 12, color: "#C62828", marginTop: 4 },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: PRIMARY_BROWN,
    height: 52,
    borderRadius: 4,
    marginTop: 20,
  },
  primaryBtnText: { color: "#fff", fontSize: 13, fontWeight: "500", letterSpacing: 1.4, textTransform: "uppercase" },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 52,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "#DDD5C8",
    paddingHorizontal: 24,
    marginTop: 20,
  },
  backBtnText: { fontSize: 13, fontWeight: "500", letterSpacing: 1.4, color: MUTED_OLIVE, textTransform: "uppercase" },
  btnRow: { flexDirection: "row", gap: 12 },
  dividerRow: { flexDirection: "row", alignItems: "center", marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#DDD5C8" },
  dividerText: { fontSize: 11, color: MUTED_OLIVE, letterSpacing: 1, marginHorizontal: 12, textTransform: "uppercase" },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 52,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "#DDD5C8",
    backgroundColor: "#fff",
  },
  googleBtnText: { fontSize: 14, fontWeight: "500", color: CHARCOAL },
  errorBanner: { padding: 12, borderRadius: 4, backgroundColor: "#FFF0F0", borderWidth: 1, borderColor: "#FFCDD2", marginTop: 12 },
  errorBannerText: { fontSize: 13, color: "#C62828" },
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 28 },
  footerText: { fontSize: 13, color: MUTED_OLIVE },
  footerLink: { fontSize: 13, fontWeight: "500", color: PRIMARY_BROWN },
});

