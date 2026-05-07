import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useAuth } from 'context/authContext';
import { doSignOut } from '../../firebaseApp/auth';
import { createManagedProfile } from '../../api/userManagementApi';

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

const ROLE_OPTIONS = [
  { value: 'secretary', label: 'Secretary' },
  { value: 'intern', label: 'Legal Intern' },
  { value: 'supervising_lawyer', label: 'Supervising Lawyer' },
  { value: 'director', label: 'Director' },
];

const normalizeProfileValue = (value) => String(value || '').trim().toLowerCase();

const validateProfileDraft = (draft, profiles) => {
  const firstName = String(draft.firstName || '').trim();
  const lastName = String(draft.lastName || '').trim();
  const role = String(draft.role || '').trim();

  if (!firstName || !lastName || !role) {
    return 'Please enter a first name, last name, and role.';
  }

  const duplicate = profiles.some((profile) =>
    normalizeProfileValue(profile.firstName) === normalizeProfileValue(firstName) &&
    normalizeProfileValue(profile.lastName) === normalizeProfileValue(lastName) &&
    normalizeProfileValue(profile.role) === normalizeProfileValue(role)
  );

  if (duplicate) {
    return 'A profile with the same name and role already exists for this shared account.';
  }

  return '';
};

export default function ProfileSelectionScreen() {
  const router = useRouter();
  const {
    userLoggedIn,
    loading,
    accountData,
    profiles,
    activeProfileId,
    selectProfile,
    refreshProfiles,
  } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingProfileId, setSubmittingProfileId] = useState('');
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '', role: '' });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!loading && !userLoggedIn) {
      router.replace('/auth');
    }
  }, [loading, userLoggedIn, router]);

  const selectableProfiles = useMemo(
    () => profiles.filter((profile) => !profile.disabled),
    [profiles]
  );

  const resetProfileModalState = () => {
    setProfileModalVisible(false);
    setProfileForm({ firstName: '', lastName: '', role: '' });
    setActionLoading(false);
  };

  const handleOpenCreateModal = () => {
    setProfileForm({ firstName: '', lastName: '', role: '' });
    setProfileModalVisible(true);
  };

  const handleSaveProfile = async () => {
    const validationMessage = validateProfileDraft(profileForm, profiles);
    if (validationMessage) {
      return Alert.alert('Profile Details Needed', validationMessage);
    }

    setActionLoading(true);
    try {
      await createManagedProfile(profileForm);
      await refreshProfiles();
      Alert.alert('Profile Created', 'The new profile is ready for future logins and profile selection.');
      resetProfileModalState();
    } catch (error) {
      Alert.alert('Create Failed', error.message || "We couldn't create the profile right now.");
      setActionLoading(false);
    }
  };

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

        <TouchableOpacity style={s.addProfileBtn} onPress={handleOpenCreateModal} disabled={actionLoading}>
          <Ionicons name="add-circle-outline" size={18} color="#fff" />
          <Text style={s.addProfileBtnText}>Create Another Profile</Text>
        </TouchableOpacity>
      </View>

      {selectableProfiles.length === 0 ? (
        <View style={s.emptyCard}>
          <Ionicons name="person-circle-outline" size={42} color={PRIMARY_BROWN} />
          <Text style={s.emptyTitle}>No profiles available</Text>
          <Text style={s.emptyText}>
            This shared account has no active profiles yet. Create a new profile using the button above, or ask a secretary or director to add one.
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

      <Modal
        visible={profileModalVisible}
        transparent
        animationType="fade"
        onRequestClose={resetProfileModalState}
      >
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={resetProfileModalState}>
          <View style={s.modalCard} onStartShouldSetResponder={() => true}>
            <Text style={s.modalTitle}>Create another staff profile</Text>
            <Text style={s.modalSub}>Create a new profile under this shared account for future sign-ins.</Text>

            <Text style={s.fieldLabel}>First Name</Text>
            <TextInput
              style={s.fieldInput}
              value={profileForm.firstName}
              onChangeText={(value) => setProfileForm((prev) => ({ ...prev, firstName: value }))}
              placeholder="Enter first name"
              placeholderTextColor="#999"
            />

            <Text style={s.fieldLabel}>Last Name</Text>
            <TextInput
              style={s.fieldInput}
              value={profileForm.lastName}
              onChangeText={(value) => setProfileForm((prev) => ({ ...prev, lastName: value }))}
              placeholder="Enter last name"
              placeholderTextColor="#999"
            />

            <Text style={s.fieldLabel}>Assigned Role</Text>
            <View style={s.roleOptionsWrap}>
              {ROLE_OPTIONS.map((option) => {
                const selected = profileForm.role === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[s.roleOptionBtn, selected && s.roleOptionBtnActive]}
                    onPress={() => setProfileForm((prev) => ({ ...prev, role: option.value }))}
                  >
                    <Text style={[s.roleOptionText, selected && s.roleOptionTextActive]}>{option.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={s.modalActions}>
              <TouchableOpacity style={s.modalCancelBtn} onPress={resetProfileModalState} disabled={actionLoading}>
                <Text style={s.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.modalConfirmBtn} onPress={handleSaveProfile} disabled={actionLoading}>
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={s.modalConfirmText}>Create Profile</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
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
  addProfileBtn: {
    marginTop: 14,
    backgroundColor: PRIMARY_BROWN,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addProfileBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: CHARCOAL },
  modalSub: { marginTop: 6, fontSize: 13, color: MUTED_OLIVE, marginBottom: 16 },
  fieldLabel: { fontSize: 12, color: MUTED_OLIVE, marginTop: 12, marginBottom: 6 },
  fieldInput: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: CHARCOAL,
    backgroundColor: '#FAFAFA',
  },
  roleOptionsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  roleOptionBtn: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
  },
  roleOptionBtnActive: {
    borderColor: PRIMARY_BROWN,
    backgroundColor: '#F8EEE3',
  },
  roleOptionText: { fontSize: 13, color: CHARCOAL },
  roleOptionTextActive: { color: PRIMARY_BROWN, fontWeight: '700' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 20 },
  modalCancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },
  modalCancelText: { color: MUTED_OLIVE, fontWeight: '700' },
  modalConfirmBtn: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: PRIMARY_BROWN,
  },
  modalConfirmText: { color: '#fff', fontWeight: '700' },
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
