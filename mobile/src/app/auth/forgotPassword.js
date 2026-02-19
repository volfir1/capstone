import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { doPasswordReset } from '../firebaseApp/auth';
import { PRIMARY_BROWN, CHARCOAL, MUTED_OLIVE } from 'utils/constants';

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleReset = async () => {
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await doPasswordReset(email.trim());
      setSent(true);
    } catch (err) {
      setError(err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <View style={s.container}>
        <View style={s.center}>
          <View style={s.successIcon}>
            <Ionicons name="mail" size={48} color={PRIMARY_BROWN} />
          </View>
          <Text style={s.successTitle}>Check Your Email</Text>
          <Text style={s.successText}>
            We've sent a password reset link to {email}. Please check your inbox and follow the instructions.
          </Text>
          <TouchableOpacity style={s.btn} onPress={() => router.replace('/auth')}>
            <Text style={s.btnText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={24} color={CHARCOAL} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Reset Password</Text>
      </View>

      <View style={s.content}>
        <View style={s.iconContainer}>
          <Ionicons name="lock-closed" size={48} color={PRIMARY_BROWN} />
        </View>
        <Text style={s.title}>Forgot your password?</Text>
        <Text style={s.subtitle}>
          Enter your email address and we'll send you a link to reset your password.
        </Text>

        <Text style={s.label}>Email Address</Text>
        <TextInput
          style={s.input}
          value={email}
          onChangeText={(v) => { setEmail(v); setError(''); }}
          placeholder="Enter your email"
          placeholderTextColor="#aaa"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {error ? <Text style={s.error}>{error}</Text> : null}

        <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleReset} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={s.btnText}>Send Reset Link</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={s.backLink} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={16} color={PRIMARY_BROWN} />
          <Text style={s.backLinkText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingBottom: 12, paddingHorizontal: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: CHARCOAL },
  content: { padding: 24, alignItems: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  iconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: `${PRIMARY_BROWN}15`, justifyContent: 'center', alignItems: 'center', marginBottom: 20, marginTop: 30 },
  title: { fontSize: 22, fontWeight: '700', color: CHARCOAL, marginBottom: 8 },
  subtitle: { fontSize: 14, color: MUTED_OLIVE, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  label: { fontSize: 12, color: MUTED_OLIVE, fontWeight: '600', alignSelf: 'flex-start', marginBottom: 6, textTransform: 'uppercase' },
  input: { width: '100%', backgroundColor: '#fff', borderRadius: 12, padding: 14, fontSize: 15, color: CHARCOAL, borderWidth: 1, borderColor: '#eee' },
  error: { color: '#ef4444', fontSize: 12, alignSelf: 'flex-start', marginTop: 6 },
  btn: { width: '100%', backgroundColor: PRIMARY_BROWN, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  backLink: { flexDirection: 'row', alignItems: 'center', marginTop: 20 },
  backLinkText: { color: PRIMARY_BROWN, fontSize: 14, fontWeight: '500', marginLeft: 6 },
  successIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: `${PRIMARY_BROWN}15`, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  successTitle: { fontSize: 22, fontWeight: '700', color: CHARCOAL, marginBottom: 12 },
  successText: { fontSize: 14, color: MUTED_OLIVE, textAlign: 'center', lineHeight: 20, marginBottom: 24, paddingHorizontal: 20 },
});
