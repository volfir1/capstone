import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { useNativeLogin } from 'hooks/useLogin';

const PRIMARY_GOLD = '#C4AB7D';
const PRIMARY_BROWN = '#8B4513';
const MUTED_OLIVE = '#6B6B5A';
const CHARCOAL = '#2C2C2C';
const ACCENT_TAN = '#A68A64';

const ROLE_LABELS = ['Secretary', 'Supervising Lawyer', 'Director', 'Legal Intern'];

export default function Login() {
  const router = useRouter();
  const {
    control,
    errors,
    handleSubmit,
    loading,
    errorMessage,
    handleEmailLogin,
    handleGoogleSignIn,
  } = useNativeLogin();

  const [showPassword, setShowPassword] = useState(false);

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Brand Bar */}
        <View style={s.brandBar}>
          <Ionicons name="scale-outline" size={28} color={PRIMARY_GOLD} />
          <View>
            <Text style={s.brandTitle}>SOLA</Text>
            <Text style={s.brandSub}>SEBASTINIAN OFFICE OF LEGAL AID</Text>
          </View>
        </View>

        {/* Role Badges */}
        <View style={s.roleBadges}>
          {ROLE_LABELS.map((label) => (
            <View key={label} style={s.roleBadge}>
              <Text style={s.roleBadgeText}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Form Area */}
        <View style={s.formArea}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.push('/')}>
            <Ionicons name="arrow-back" size={14} color={MUTED_OLIVE} />
            <Text style={s.backBtnText}>Back to Home</Text>
          </TouchableOpacity>

          <Text style={s.welcomeTitle}>Welcome back</Text>
          <Text style={s.welcomeSub}>Sign in to access the office dashboard</Text>

          {/* Error Message */}
          {errorMessage ? (
            <View style={s.errorBox}>
              <Text style={s.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Email Field */}
          <Text style={s.fieldLabel}>EMAIL ADDRESS</Text>
          <Controller
            control={control}
            name="email"
            rules={{
              required: 'Email is required',
              pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email' },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={[s.inputWrap, errors.email && s.inputError]}>
                <Ionicons name="mail-outline" size={16} color={ACCENT_TAN} style={s.inputIcon} />
                <TextInput
                  style={s.input}
                  placeholder="you@example.com"
                  placeholderTextColor="#bbb"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  editable={!loading}
                />
              </View>
            )}
          />
          {errors.email && <Text style={s.errorField}>{errors.email.message}</Text>}

          {/* Password Field */}
          <View style={s.passwordLabelRow}>
            <Text style={s.fieldLabel}>PASSWORD</Text>
            <TouchableOpacity onPress={() => router.push('/auth/forgotPassword')}>
              <Text style={s.forgotLink}>Forgot password?</Text>
            </TouchableOpacity>
          </View>
          <Controller
            control={control}
            name="password"
            rules={{
              required: 'Password is required',
              minLength: { value: 6, message: 'Minimum 6 characters' },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={[s.inputWrap, errors.password && s.inputError]}>
                <Ionicons name="lock-closed-outline" size={16} color={ACCENT_TAN} style={s.inputIcon} />
                <TextInput
                  style={s.input}
                  placeholder="••••••••"
                  placeholderTextColor="#bbb"
                  secureTextEntry={!showPassword}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  editable={!loading}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={s.eyeBtn}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={MUTED_OLIVE} />
                </TouchableOpacity>
              </View>
            )}
          />
          {errors.password && <Text style={s.errorField}>{errors.password.message}</Text>}

          {/* Sign In Button */}
          <TouchableOpacity
            style={[s.signInBtn, loading && s.signInBtnDisabled]}
            onPress={handleSubmit(handleEmailLogin)}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.signInBtnText}>SIGN IN</Text>
            )}
          </TouchableOpacity>

          {/* Sign Up Link */}
          <View style={s.signUpRow}>
            <Text style={s.signUpText}>No account? </Text>
            <TouchableOpacity onPress={() => router.push('/auth/signup')}>
              <Text style={s.signUpLink}>Sign up</Text>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={s.divider}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>OR CONTINUE WITH</Text>
            <View style={s.dividerLine} />
          </View>

          {/* Google Sign In */}
          <TouchableOpacity style={s.googleBtn} onPress={handleGoogleSignIn} disabled={loading}>
            <Ionicons name="logo-google" size={18} color={CHARCOAL} />
            <Text style={s.googleBtnText}>{loading ? 'Connecting…' : 'Sign in with Google'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#FAF8F5' },
  scroll: { flexGrow: 1 },
  // Brand Bar
  brandBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: PRIMARY_BROWN, paddingHorizontal: 20, paddingVertical: 14, paddingTop: 50,
  },
  brandTitle: { fontSize: 18, fontWeight: '600', color: '#fff', lineHeight: 20 },
  brandSub: { fontSize: 8, color: `${PRIMARY_GOLD}cc`, letterSpacing: 2 },
  // Role Badges
  roleBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20, paddingVertical: 12, backgroundColor: `${PRIMARY_BROWN}08` },
  roleBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16, borderWidth: 1, borderColor: `${PRIMARY_BROWN}25`, backgroundColor: `${PRIMARY_BROWN}08` },
  roleBadgeText: { fontSize: 11, color: PRIMARY_BROWN },
  // Form
  formArea: { flex: 1, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 28 },
  backBtnText: { fontSize: 12, color: MUTED_OLIVE },
  welcomeTitle: { fontSize: 28, fontWeight: '500', color: CHARCOAL, marginBottom: 6 },
  welcomeSub: { fontSize: 14, color: MUTED_OLIVE, fontWeight: '300', marginBottom: 24 },
  // Error
  errorBox: { padding: 12, borderRadius: 4, backgroundColor: '#FFF0F0', borderWidth: 1, borderColor: '#FFCDD2', marginBottom: 16 },
  errorText: { fontSize: 13, color: '#C62828' },
  // Fields
  fieldLabel: { fontSize: 11, fontWeight: '500', letterSpacing: 1, color: MUTED_OLIVE, marginBottom: 8 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#DDD5C8', borderRadius: 4,
    backgroundColor: '#FDFBF8', height: 52, paddingHorizontal: 14, marginBottom: 16,
  },
  inputError: { borderColor: '#C62828' },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: CHARCOAL, height: '100%' },
  eyeBtn: { padding: 4 },
  errorField: { fontSize: 12, color: '#C62828', marginTop: -12, marginBottom: 12 },
  passwordLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  forgotLink: { fontSize: 12, color: MUTED_OLIVE },
  // Sign In
  signInBtn: {
    backgroundColor: PRIMARY_BROWN, height: 52, borderRadius: 4,
    justifyContent: 'center', alignItems: 'center', marginTop: 4, marginBottom: 16,
  },
  signInBtnDisabled: { opacity: 0.7 },
  signInBtnText: { color: '#fff', fontSize: 13, fontWeight: '500', letterSpacing: 1.6 },
  // Sign Up
  signUpRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20 },
  signUpText: { fontSize: 13, color: MUTED_OLIVE },
  signUpLink: { fontSize: 13, color: PRIMARY_BROWN, fontWeight: '600' },
  // Divider
  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#DDD5C8' },
  dividerText: { fontSize: 10, color: MUTED_OLIVE, letterSpacing: 1, marginHorizontal: 12 },
  // Google
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    height: 52, borderWidth: 1.5, borderColor: '#DDD5C8', borderRadius: 4, backgroundColor: '#fff',
  },
  googleBtnText: { fontSize: 14, color: CHARCOAL },
});