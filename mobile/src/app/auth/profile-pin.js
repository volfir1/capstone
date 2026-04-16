import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useAuth } from 'context/authContext';

const PRIMARY_BROWN = '#8B4513';
const PRIMARY_GOLD = '#C4AB7D';
const MUTED_OLIVE = '#6B6B5A';
const CHARCOAL = '#2C2C2C';

const normalizePinInput = (value) => String(value || '').replace(/\D/g, '').slice(0, 6);
const isValidPin = (value) => /^\d{4,6}$/.test(String(value || '').trim());

const formatRole = (role) =>
  role === 'supervising_lawyer'
    ? 'Supervising Lawyer'
    : role === 'intern'
      ? 'Legal Intern'
      : role
        ? role.charAt(0).toUpperCase() + role.slice(1)
        : 'Staff';

const formatLockedUntil = (value) => {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};

export default function ProfilePinScreen() {
  const router = useRouter();
  const {
    userLoggedIn,
    loading,
    pinStatusLoading,
    accountData,
    profiles,
    activeProfileId,
    pinStatus,
    requiresPinSetup,
    setupActiveProfilePin,
    verifyActiveProfilePin,
    clearSelectedProfile,
  } = useAuth();

  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedProfile = useMemo(
    () => profiles.find((profile) => profile.id === activeProfileId) || null,
    [activeProfileId, profiles]
  );

  useEffect(() => {
    if (!loading && !userLoggedIn) {
      router.replace('/auth');
    }
  }, [loading, userLoggedIn, router]);

  useEffect(() => {
    if (!loading && !pinStatusLoading && userLoggedIn && !selectedProfile) {
      router.replace('/auth/profiles');
    }
  }, [loading, pinStatusLoading, userLoggedIn, selectedProfile, router]);

  const handleChooseDifferentProfile = async () => {
    await clearSelectedProfile();
    router.replace('/auth/profiles');
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    const normalizedPin = normalizePinInput(pin);
    const normalizedConfirmPin = normalizePinInput(confirmPin);

    if (!isValidPin(normalizedPin)) {
      setErrorMessage('PIN must be 4 to 6 digits.');
      return;
    }

    if (requiresPinSetup && normalizedPin !== normalizedConfirmPin) {
      setErrorMessage('PIN confirmation does not match.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      if (requiresPinSetup) {
        await setupActiveProfilePin(normalizedPin);
      } else {
        await verifyActiveProfilePin(normalizedPin);
      }

      router.replace('/admin');
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        (requiresPinSetup
          ? "We couldn't create the PIN for this profile."
          : "We couldn't verify that PIN.");
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || pinStatusLoading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color={PRIMARY_BROWN} />
      </View>
    );
  }

  if (!userLoggedIn || !selectedProfile) {
    return null;
  }

  const lockedLabel = formatLockedUntil(pinStatus?.lockedUntil);

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={handleChooseDifferentProfile}>
          <Ionicons name="arrow-back" size={18} color={MUTED_OLIVE} />
          <Text style={s.backBtnText}>Choose another profile</Text>
        </TouchableOpacity>

        <Text style={s.title}>{requiresPinSetup ? 'Create a profile PIN' : 'Unlock this profile'}</Text>
        <Text style={s.subtitle}>
          {requiresPinSetup
            ? 'This profile does not have a PIN yet. Create a numeric PIN before continuing.'
            : 'Enter this profile PIN to continue into the dashboard.'}
        </Text>
      </View>

      <View style={s.card}>
        <Text style={s.profileName}>{selectedProfile.firstName} {selectedProfile.lastName}</Text>
        <Text style={s.profileMeta}>{formatRole(selectedProfile.role)}</Text>
        <Text style={s.profileMeta}>{accountData?.email || 'Shared account'}</Text>

        {pinStatus?.isLocked && lockedLabel ? (
          <View style={s.alertDanger}>
            <Text style={s.alertDangerText}>PIN temporarily locked. Try again after {lockedLabel}.</Text>
          </View>
        ) : null}

        {errorMessage ? (
          <View style={s.alertDanger}>
            <Text style={s.alertDangerText}>{errorMessage}</Text>
          </View>
        ) : null}

        {!requiresPinSetup && !pinStatus?.isLocked && typeof pinStatus?.remainingAttempts === 'number' && pinStatus?.maxAttempts ? (
          <Text style={s.hintText}>
            {pinStatus.remainingAttempts} attempt{pinStatus.remainingAttempts === 1 ? '' : 's'} remaining before lockout.
          </Text>
        ) : null}

        <Text style={s.fieldLabel}>{requiresPinSetup ? 'Create PIN' : 'Enter PIN'}</Text>
        <View style={s.inputWrap}>
          <Ionicons name="lock-closed-outline" size={18} color={PRIMARY_GOLD} style={s.inputIcon} />
          <TextInput
            style={s.input}
            placeholder="4 to 6 digits"
            placeholderTextColor="#999"
            keyboardType="number-pad"
            maxLength={6}
            secureTextEntry
            value={pin}
            onChangeText={(value) => setPin(normalizePinInput(value))}
            editable={!isSubmitting && !pinStatus?.isLocked}
          />
        </View>

        {requiresPinSetup ? (
          <>
            <Text style={[s.fieldLabel, { marginTop: 10 }]}>Confirm PIN</Text>
            <View style={s.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color={PRIMARY_GOLD} style={s.inputIcon} />
              <TextInput
                style={s.input}
                placeholder="Re-enter the PIN"
                placeholderTextColor="#999"
                keyboardType="number-pad"
                maxLength={6}
                secureTextEntry
                value={confirmPin}
                onChangeText={(value) => setConfirmPin(normalizePinInput(value))}
                editable={!isSubmitting && !pinStatus?.isLocked}
              />
            </View>
          </>
        ) : null}

        <TouchableOpacity
          style={[s.submitBtn, pinStatus?.isLocked && { opacity: 0.55 }]}
          onPress={handleSubmit}
          disabled={isSubmitting || !!pinStatus?.isLocked}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={s.submitBtnText}>{requiresPinSetup ? 'Create PIN and Continue' : 'Unlock Profile'}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F8FA' },
  header: { paddingTop: 54, paddingHorizontal: 18, paddingBottom: 10 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  backBtnText: { fontSize: 12, color: MUTED_OLIVE },
  title: { fontSize: 26, fontWeight: '700', color: CHARCOAL },
  subtitle: { marginTop: 6, fontSize: 13, color: MUTED_OLIVE },
  card: {
    margin: 16,
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EDE7DD',
    padding: 16,
  },
  profileName: { fontSize: 18, fontWeight: '700', color: CHARCOAL },
  profileMeta: { fontSize: 12, color: MUTED_OLIVE, marginTop: 2 },
  hintText: { marginTop: 8, fontSize: 12, color: MUTED_OLIVE },
  alertDanger: {
    marginTop: 10,
    backgroundColor: '#FFF0F0',
    borderWidth: 1,
    borderColor: '#FFCDD2',
    borderRadius: 8,
    padding: 10,
  },
  alertDangerText: { fontSize: 12, color: '#C62828' },
  fieldLabel: {
    marginTop: 12,
    marginBottom: 6,
    fontSize: 11,
    color: MUTED_OLIVE,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD5C8',
    borderRadius: 8,
    backgroundColor: '#FDFBF8',
    minHeight: 48,
  },
  inputIcon: { marginLeft: 12 },
  input: { flex: 1, color: CHARCOAL, fontSize: 15, paddingHorizontal: 10, paddingVertical: 10 },
  submitBtn: {
    marginTop: 14,
    height: 46,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY_BROWN,
  },
  submitBtnText: { color: '#fff', fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
});
