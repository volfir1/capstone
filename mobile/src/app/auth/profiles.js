import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useAuth } from 'context/authContext';
import { doSignOut } from '../../firebaseApp/auth';

const PRIMARY_BROWN = '#8B4513';
const PRIMARY_GOLD = '#C4AB7D';
const MUTED_OLIVE = '#6B6B5A';
const CHARCOAL = '#2C2C2C';

const formatRole = (role) =>
  role === 'supervising_lawyer'
    ? 'Supervising Lawyer'
    : role === 'intern'
      ? 'Legal Intern'
      : role
        ? role.charAt(0).toUpperCase() + role.slice(1)
        : 'Staff';

export default function ProfileSelectionScreen() {
  const router = useRouter();
  const {
    userLoggedIn,
    loading,
    accountData,
    profiles,
    activeProfileId,
    selectProfile,
  } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingProfileId, setSubmittingProfileId] = useState('');

  useEffect(() => {
    if (!loading && !userLoggedIn) {
      router.replace('/auth');
    }
  }, [loading, userLoggedIn, router]);

  const selectableProfiles = useMemo(
    () => profiles.filter((profile) => !profile.disabled),
    [profiles]
  );

  const handleBackToLogin = async () => {
    await doSignOut();
    router.replace('/auth');
  };

  const handleSelectProfile = async (profileId) => {
    try {
      setIsSubmitting(true);
      setSubmittingProfileId(profileId);
      const pinState = await selectProfile(profileId);

      if (pinState?.verified) {
        router.replace('/admin');
        return;
      }

      router.replace('/auth/profile-pin');
    } catch (error) {
      const message = error?.response?.data?.message || "Couldn't open that staff profile.";
      alert(message);
    } finally {
      setIsSubmitting(false);
      setSubmittingProfileId('');
    }
  };

  if (loading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color={PRIMARY_BROWN} />
      </View>
    );
  }

  if (!userLoggedIn) {
    return null;
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={handleBackToLogin}>
          <Ionicons name="arrow-back" size={18} color={MUTED_OLIVE} />
          <Text style={s.backBtnText}>Back to Login</Text>
        </TouchableOpacity>
        <Text style={s.title}>Choose a staff profile</Text>
        <Text style={s.subtitle}>Pick the profile you want to use in this session.</Text>

        <View style={s.accountCard}>
          <Text style={s.accountLabel}>Shared Account</Text>
          <Text style={s.accountEmail}>{accountData?.email || 'Signed-in account'}</Text>
        </View>
      </View>

      {selectableProfiles.length === 0 ? (
        <View style={s.emptyCard}>
          <Ionicons name="person-circle-outline" size={42} color={PRIMARY_BROWN} />
          <Text style={s.emptyTitle}>No profiles available</Text>
          <Text style={s.emptyText}>
            This shared account has no active profiles yet. Ask a secretary or director to add a profile from Manage Profiles.
          </Text>
        </View>
      ) : (
        <FlatList
          data={selectableProfiles}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.listContent}
          renderItem={({ item }) => {
            const isActive = activeProfileId === item.id;
            const isLoadingThis = isSubmitting && submittingProfileId === item.id;
            return (
              <View style={[s.card, isActive && s.cardActive]}>
                <View style={s.cardTop}>
                  <View>
                    <Text style={s.profileName}>{item.firstName} {item.lastName}</Text>
                    <Text style={s.profileRole}>{formatRole(item.role)}</Text>
                  </View>
                  {isActive ? <Text style={s.activeBadge}>Active</Text> : null}
                </View>

                <TouchableOpacity
                  style={[s.selectBtn, isActive && s.selectBtnActive]}
                  onPress={() => handleSelectProfile(item.id)}
                  disabled={isSubmitting}
                >
                  {isLoadingThis ? (
                    <ActivityIndicator size="small" color={isActive ? CHARCOAL : '#fff'} />
                  ) : (
                    <Text style={[s.selectBtnText, isActive && s.selectBtnTextActive]}>
                      {isActive ? 'Continue' : 'Select Profile'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}
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
  accountCard: {
    marginTop: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#EDE7DD',
    borderRadius: 12,
    padding: 14,
  },
  accountLabel: { fontSize: 10, color: MUTED_OLIVE, textTransform: 'uppercase', fontWeight: '700' },
  accountEmail: { marginTop: 3, fontSize: 15, color: CHARCOAL, fontWeight: '600' },
  listContent: { padding: 14, paddingTop: 8, gap: 10 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EDE7DD',
    padding: 14,
  },
  cardActive: {
    backgroundColor: '#F9F3E7',
    borderColor: PRIMARY_GOLD,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  profileName: { fontSize: 16, fontWeight: '700', color: CHARCOAL },
  profileRole: { marginTop: 2, fontSize: 12, color: MUTED_OLIVE },
  activeBadge: {
    backgroundColor: PRIMARY_BROWN,
    color: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    fontSize: 10,
    overflow: 'hidden',
  },
  selectBtn: {
    marginTop: 12,
    backgroundColor: PRIMARY_BROWN,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
  },
  selectBtnActive: { backgroundColor: PRIMARY_GOLD },
  selectBtnText: { color: '#fff', fontSize: 13, fontWeight: '700', letterSpacing: 0.4 },
  selectBtnTextActive: { color: CHARCOAL },
  emptyCard: {
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5D8C7',
    borderStyle: 'dashed',
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  emptyTitle: { marginTop: 8, fontSize: 18, fontWeight: '700', color: CHARCOAL },
  emptyText: { marginTop: 6, fontSize: 13, color: MUTED_OLIVE, textAlign: 'center', lineHeight: 18 },
});
