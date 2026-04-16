import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useAuth } from 'context/authContext';
import {
  createManagedProfile,
  deleteManagedProfile,
  resetManagedProfilePin,
  sendPasswordReset,
  toggleUserStatus,
  updateManagedProfile,
} from '../../api/userManagementApi';
import ThemedToast, { useToast } from '../../components/ThemedToast';
import AdminSidebarToggle from '../../components/navigation/AdminSidebarToggle';

const PRIMARY_BROWN = '#8B4513';
const PRIMARY_GOLD = '#C4AB7D';
const MUTED_OLIVE = '#6B6B5A';
const CHARCOAL = '#2C2C2C';

const ROLE_OPTIONS = [
  { value: 'secretary', label: 'Secretary' },
  { value: 'intern', label: 'Legal Intern' },
  { value: 'supervising_lawyer', label: 'Supervising Lawyer' },
  { value: 'director', label: 'Director' },
];

const ROLE_LABELS = {
  secretary: 'Secretary',
  intern: 'Legal Intern',
  supervising_lawyer: 'Supervising Lawyer',
  director: 'Director',
};

const ROLE_COLORS = {
  secretary: '#7B68EE',
  intern: '#20B2AA',
  director: '#E67E22',
  supervising_lawyer: '#9B59B6',
};

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'secretary', label: 'Secretaries' },
  { key: 'intern', label: 'Interns' },
  { key: 'supervising_lawyer', label: 'Supervisors' },
  { key: 'director', label: 'Directors' },
  { key: 'inactive', label: 'Inactive' },
];

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  role: '',
};

const formatRole = (role) => ROLE_LABELS[role] || 'Profile';
const normalizeProfileValue = (value) => String(value || '').trim().toLowerCase();

const validateProfileDraft = (draft, profiles, editingId = '') => {
  const firstName = String(draft.firstName || '').trim();
  const lastName = String(draft.lastName || '').trim();
  const role = String(draft.role || '').trim();

  if (!firstName || !lastName || !role) {
    return 'Please enter a first name, last name, and role.';
  }

  const duplicate = profiles.some((profile) => {
    if (profile.id === editingId) return false;

    return (
      normalizeProfileValue(profile.firstName) === normalizeProfileValue(firstName) &&
      normalizeProfileValue(profile.lastName) === normalizeProfileValue(lastName) &&
      normalizeProfileValue(profile.role) === normalizeProfileValue(role)
    );
  });

  if (duplicate) {
    return 'A profile with the same name and role already exists for this shared account.';
  }

  return '';
};

export default function ManageProfilesScreen() {
  const router = useRouter();
  const {
    userData,
    accountData,
    profiles,
    activeProfileId,
    refreshProfiles,
    refreshUserData,
    clearSelectedProfile,
    markActiveProfilePinReset,
  } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [actionLoading, setActionLoading] = useState(false);

  const [actionModalProfile, setActionModalProfile] = useState(null);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [profileModalMode, setProfileModalMode] = useState('create');
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [profileForm, setProfileForm] = useState(EMPTY_FORM);

  const { toast, showToast, hideToast } = useToast();

  const canManageProfiles = userData?.role === 'secretary' || userData?.role === 'director';

  const loadProfiles = useCallback(async () => {
    try {
      setLoading(true);
      await refreshProfiles();
    } catch (error) {
      showToast('error', 'Error', 'Failed to load profiles');
    } finally {
      setLoading(false);
    }
  }, [refreshProfiles, showToast]);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfiles();
    setRefreshing(false);
  };

  const rows = useMemo(
    () =>
      profiles.map((profile) => ({
        id: profile.id,
        firstName: profile.firstName,
        lastName: profile.lastName,
        name: `${profile.firstName || ''} ${profile.lastName || ''}`.trim(),
        email: profile.email,
        role: profile.role,
        disabled: profile.disabled || false,
        status: profile.disabled ? 'Inactive' : 'Active',
        pinStatus: !profile.pinEnabled || profile.pinResetRequired ? 'PIN setup needed' : 'PIN ready',
        isCurrent: activeProfileId === profile.id,
        isLastUsed: accountData?.lastSelectedProfileId === profile.id,
        date: profile.createdAt
          ? new Date(profile.createdAt).toLocaleDateString('en-US', {
              month: 'numeric',
              day: 'numeric',
              year: 'numeric',
            })
          : '-',
      })),
    [profiles, activeProfileId, accountData?.lastSelectedProfileId]
  );

  const filteredRows = useMemo(() => {
    const bySearch = rows.filter((item) => {
      const haystack = `${item.name} ${item.email} ${formatRole(item.role)}`.toLowerCase();
      return haystack.includes(searchQuery.toLowerCase());
    });

    return bySearch.filter((item) => {
      if (activeTab === 'all') return true;
      if (activeTab === 'inactive') return item.disabled;
      return item.role === activeTab && !item.disabled;
    });
  }, [rows, searchQuery, activeTab]);

  const tabCounts = useMemo(() => {
    const counts = {
      all: rows.length,
      secretary: rows.filter((r) => r.role === 'secretary' && !r.disabled).length,
      intern: rows.filter((r) => r.role === 'intern' && !r.disabled).length,
      supervising_lawyer: rows.filter((r) => r.role === 'supervising_lawyer' && !r.disabled).length,
      director: rows.filter((r) => r.role === 'director' && !r.disabled).length,
      inactive: rows.filter((r) => r.disabled).length,
    };

    return counts;
  }, [rows]);

  const totalProfiles = rows.length;
  const activeProfiles = rows.filter((row) => !row.disabled).length;
  const inactiveProfiles = rows.filter((row) => row.disabled).length;

  const resetProfileModalState = () => {
    setProfileModalVisible(false);
    setProfileModalMode('create');
    setSelectedProfile(null);
    setProfileForm(EMPTY_FORM);
  };

  const handleOpenCreateModal = () => {
    setProfileModalMode('create');
    setSelectedProfile(null);
    setProfileForm(EMPTY_FORM);
    setProfileModalVisible(true);
  };

  const handleOpenEditModal = (profile) => {
    setProfileModalMode('edit');
    setSelectedProfile(profile);
    setProfileForm({
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      role: profile.role || '',
    });
    setProfileModalVisible(true);
  };

  const syncAfterMutation = async () => {
    await refreshProfiles();
  };

  const handleSaveProfile = async () => {
    const validationMessage = validateProfileDraft(
      profileForm,
      profiles,
      profileModalMode === 'edit' ? selectedProfile?.id : ''
    );

    if (validationMessage) {
      showToast('warning', 'Profile Details Needed', validationMessage);
      return;
    }

    setActionLoading(true);
    try {
      if (profileModalMode === 'create') {
        await createManagedProfile(profileForm);
        showToast('success', 'Profile Created', 'The new profile is ready for future logins and profile selection.');
      } else if (selectedProfile) {
        await updateManagedProfile(selectedProfile.id, profileForm);
        showToast('success', 'Profile Updated', 'Profile details were updated successfully.');

        if (selectedProfile.isCurrent) {
          await refreshUserData?.();
        }
      }

      await syncAfterMutation();
      resetProfileModalState();
    } catch (error) {
      showToast(
        'error',
        profileModalMode === 'create' ? 'Create Failed' : 'Update Failed',
        error.message || "We couldn't save the profile right now."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = (profile) => {
    const isDisabling = !profile.disabled;
    Alert.alert(
      isDisabling ? 'Disable Profile' : 'Enable Profile',
      `${isDisabling ? 'Disable' : 'Enable'} ${profile.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isDisabling ? 'Disable' : 'Enable',
          style: isDisabling ? 'destructive' : 'default',
          onPress: async () => {
            setActionLoading(true);
            try {
              await toggleUserStatus(profile.id, isDisabling);
              showToast(
                'success',
                isDisabling ? 'Profile Disabled' : 'Profile Enabled',
                `${profile.name} is now ${isDisabling ? 'inactive' : 'active'}.`
              );

              if (profile.isCurrent && isDisabling) {
                await clearSelectedProfile();
                await refreshProfiles();
                router.replace('/auth/profiles');
                return;
              }

              await syncAfterMutation();
            } catch (error) {
              showToast('error', 'Status Update Failed', error.message || "Couldn't update profile status.");
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleResetPin = (profile) => {
    Alert.alert(
      'Reset Profile PIN',
      `Reset PIN for ${profile.name}? They will need to create a new PIN on next access.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset PIN',
          onPress: async () => {
            setActionLoading(true);
            try {
              await resetManagedProfilePin(profile.id);
              showToast('success', 'Profile PIN Reset', `${profile.name} will be asked to set a new PIN.`);

              if (profile.isCurrent) {
                await syncAfterMutation();
                await markActiveProfilePinReset();
                router.replace('/auth/profile-pin');
                return;
              }

              await syncAfterMutation();
            } catch (error) {
              showToast('error', 'PIN Reset Failed', error.message || "Couldn't reset profile PIN.");
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteProfile = (profile) => {
    Alert.alert(
      'Delete Profile',
      `Remove ${profile.name} from this shared account?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await deleteManagedProfile(profile.id);
              showToast('success', 'Profile Deleted', `${profile.name} has been removed.`);

              if (profile.isCurrent) {
                await clearSelectedProfile();
                await refreshProfiles();
                router.replace('/auth/profiles');
                return;
              }

              await syncAfterMutation();
            } catch (error) {
              showToast('error', 'Delete Failed', error.message || "Couldn't delete profile.");
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleResetSharedPassword = async () => {
    if (!accountData?.email) {
      showToast('warning', 'Missing Account Email', "Couldn't find the shared login email.");
      return;
    }

    setActionLoading(true);
    try {
      await sendPasswordReset(accountData.email);
      showToast('success', 'Password Reset Sent', `A reset link was sent to ${accountData.email}.`);
    } catch (error) {
      showToast('error', 'Reset Failed', error.message || "Couldn't send password reset email.");
    } finally {
      setActionLoading(false);
    }
  };

  const renderRow = ({ item }) => {
    const roleColor = ROLE_COLORS[item.role] || PRIMARY_BROWN;

    return (
      <View style={[s.profileCard, item.disabled && s.profileCardDisabled]}>
        <View style={s.profileTopRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.profileName}>{item.name}</Text>
            <Text style={s.profileEmail}>{item.email}</Text>
            <View style={s.badgeRow}>
              <View style={[s.roleBadge, { backgroundColor: `${roleColor}20` }]}>
                <Text style={[s.roleBadgeText, { color: roleColor }]}>{formatRole(item.role)}</Text>
              </View>
              <View style={s.statusWrap}>
                <View style={[s.statusDot, { backgroundColor: item.disabled ? '#9CA3AF' : '#22C55E' }]} />
                <Text style={[s.statusText, { color: item.disabled ? '#6B7280' : '#15803D' }]}>{item.status}</Text>
              </View>
            </View>

            <Text style={s.metaText}>Joined {item.date}</Text>
            <Text style={[s.metaText, item.pinStatus === 'PIN ready' && { color: '#15803D' }]}>{item.pinStatus}</Text>
          </View>

          <TouchableOpacity style={s.menuBtn} onPress={() => setActionModalProfile(item)}>
            <Ionicons name="ellipsis-vertical" size={20} color={MUTED_OLIVE} />
          </TouchableOpacity>
        </View>

        <View style={s.sessionBadgeRow}>
          {item.isCurrent ? <Text style={s.sessionBadge}>Current Session</Text> : null}
          {!item.isCurrent && item.isLastUsed ? <Text style={s.sessionBadgeMuted}>Last Used</Text> : null}
        </View>
      </View>
    );
  };

  if (!canManageProfiles) {
    return (
      <View style={s.blockedWrap}>
        <AdminSidebarToggle />
        <Ionicons name="lock-closed" size={42} color={PRIMARY_BROWN} />
        <Text style={s.blockedTitle}>Profile Manager Access Required</Text>
        <Text style={s.blockedText}>
          Only secretary and director profiles can manage staff profiles on this account.
        </Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <AdminSidebarToggle />
      <View style={s.header}>
        <Text style={s.headerTitle}>Manage Profiles</Text>
        <Text style={s.headerSub}>Add, update, disable, and remove profiles under the shared SOLA login.</Text>

        <View style={s.headerActionsRow}>
          <TouchableOpacity style={s.secondaryBtn} onPress={handleResetSharedPassword} disabled={actionLoading}>
            <Ionicons name="mail-outline" size={16} color={PRIMARY_BROWN} />
            <Text style={s.secondaryBtnText}>Reset Login Password</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.primaryBtn} onPress={handleOpenCreateModal} disabled={actionLoading}>
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={s.primaryBtnText}>Add Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Text style={s.statLabel}>Shared Login</Text>
            <Text style={s.statValue} numberOfLines={1}>{accountData?.email || '-'}</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statLabel}>Total</Text>
            <Text style={s.statValue}>{totalProfiles}</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statLabel}>Active</Text>
            <Text style={s.statValue}>{activeProfiles}</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statLabel}>Inactive</Text>
            <Text style={s.statValue}>{inactiveProfiles}</Text>
          </View>
        </View>
      </View>

      <View style={s.searchWrap}>
        <Ionicons name="search" size={18} color="#999" />
        <TextInput
          style={s.searchInput}
          placeholder="Search profiles by name, email, or role..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="#999" />
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabsScroll} contentContainerStyle={s.tabsContent}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[s.tabBtn, activeTab === tab.key && s.tabBtnActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[s.tabBtnText, activeTab === tab.key && s.tabBtnTextActive]}>
              {tab.label} ({tabCounts[tab.key] || 0})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={s.centered}>
          <ActivityIndicator size="large" color={PRIMARY_BROWN} />
        </View>
      ) : (
        <FlatList
          data={filteredRows}
          keyExtractor={(item) => item.id}
          renderItem={renderRow}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[PRIMARY_BROWN]} />}
          ListEmptyComponent={
            <View style={s.emptyState}>
              <Ionicons name="people-outline" size={42} color="#C9C9C9" />
              <Text style={s.emptyTitle}>No profiles match this view</Text>
            </View>
          }
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
            <Text style={s.modalTitle}>{profileModalMode === 'create' ? 'Add Profile' : 'Edit Profile'}</Text>
            <Text style={s.modalSub}>
              {profileModalMode === 'create'
                ? 'Create another staff profile under this shared account.'
                : `Update details for ${selectedProfile?.name || 'this profile'}.`}
            </Text>

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
              {ROLE_OPTIONS.map((roleOption) => {
                const selected = profileForm.role === roleOption.value;
                return (
                  <TouchableOpacity
                    key={roleOption.value}
                    style={[s.roleOptionBtn, selected && s.roleOptionBtnActive]}
                    onPress={() => setProfileForm((prev) => ({ ...prev, role: roleOption.value }))}
                  >
                    <Text style={[s.roleOptionText, selected && s.roleOptionTextActive]}>{roleOption.label}</Text>
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
                  <Text style={s.modalConfirmText}>{profileModalMode === 'create' ? 'Create Profile' : 'Save Changes'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={!!actionModalProfile}
        transparent
        animationType="slide"
        onRequestClose={() => setActionModalProfile(null)}
      >
        <TouchableOpacity style={s.sheetOverlay} activeOpacity={1} onPress={() => setActionModalProfile(null)}>
          <View style={s.sheetCard} onStartShouldSetResponder={() => true}>
            {actionModalProfile ? (
              <>
                <View style={s.sheetHandle} />
                <Text style={s.sheetTitle}>{actionModalProfile.name}</Text>
                <Text style={s.sheetSub}>{actionModalProfile.email}</Text>

                <TouchableOpacity
                  style={s.sheetItem}
                  onPress={() => {
                    const target = actionModalProfile;
                    setActionModalProfile(null);
                    handleOpenEditModal(target);
                  }}
                >
                  <Ionicons name="create-outline" size={18} color={PRIMARY_BROWN} />
                  <Text style={s.sheetItemText}>Edit Profile</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.sheetItem}
                  onPress={() => {
                    const target = actionModalProfile;
                    setActionModalProfile(null);
                    handleResetPin(target);
                  }}
                >
                  <Ionicons name="key-outline" size={18} color="#F59E0B" />
                  <Text style={s.sheetItemText}>Reset PIN</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.sheetItem}
                  onPress={() => {
                    const target = actionModalProfile;
                    setActionModalProfile(null);
                    handleToggleStatus(target);
                  }}
                >
                  <Ionicons
                    name={actionModalProfile.disabled ? 'lock-open-outline' : 'lock-closed-outline'}
                    size={18}
                    color={actionModalProfile.disabled ? '#22C55E' : '#EF4444'}
                  />
                  <Text style={[s.sheetItemText, !actionModalProfile.disabled && { color: '#EF4444' }]}>
                    {actionModalProfile.disabled ? 'Enable Profile' : 'Disable Profile'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.sheetItem}
                  onPress={() => {
                    const target = actionModalProfile;
                    setActionModalProfile(null);
                    handleDeleteProfile(target);
                  }}
                >
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  <Text style={[s.sheetItemText, { color: '#EF4444' }]}>Delete Profile</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[s.sheetItem, s.sheetCancel]} onPress={() => setActionModalProfile(null)}>
                  <Text style={s.sheetCancelText}>Cancel</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </View>
        </TouchableOpacity>
      </Modal>

      <ThemedToast toast={toast} onHide={hideToast} />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  blockedWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#F7F8FA',
  },
  blockedTitle: { marginTop: 10, fontSize: 20, fontWeight: '700', color: CHARCOAL, textAlign: 'center' },
  blockedText: { marginTop: 8, fontSize: 14, color: MUTED_OLIVE, textAlign: 'center', lineHeight: 20 },
  header: {
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingBottom: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: CHARCOAL },
  headerSub: { marginTop: 4, fontSize: 12, color: MUTED_OLIVE },
  headerActionsRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  secondaryBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D9CDBA',
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  secondaryBtnText: { color: PRIMARY_BROWN, fontSize: 11, fontWeight: '700' },
  primaryBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    backgroundColor: PRIMARY_BROWN,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  primaryBtnText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  statCard: {
    flexBasis: '48%',
    backgroundColor: '#F9F6F0',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E6DED0',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  statLabel: { fontSize: 10, color: MUTED_OLIVE, textTransform: 'uppercase', fontWeight: '700' },
  statValue: { marginTop: 2, fontSize: 13, color: CHARCOAL, fontWeight: '700' },
  searchWrap: {
    marginTop: 10,
    marginHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEE',
    paddingHorizontal: 12,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 13, color: CHARCOAL },
  tabsScroll: { marginTop: 8, maxHeight: 48 },
  tabsContent: { paddingHorizontal: 12, gap: 6 },
  tabBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  tabBtnActive: { backgroundColor: PRIMARY_BROWN, borderColor: PRIMARY_BROWN },
  tabBtnText: { fontSize: 12, color: MUTED_OLIVE, fontWeight: '600' },
  tabBtnTextActive: { color: '#fff' },
  profileCard: {
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEE',
    padding: 12,
  },
  profileCardDisabled: { backgroundColor: '#FEF2F2', opacity: 0.76 },
  profileTopRow: { flexDirection: 'row', alignItems: 'flex-start' },
  profileName: { fontSize: 15, fontWeight: '700', color: CHARCOAL },
  profileEmail: { marginTop: 2, fontSize: 12, color: MUTED_OLIVE },
  badgeRow: { marginTop: 7, flexDirection: 'row', alignItems: 'center', gap: 8 },
  roleBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  roleBadgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  statusWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 99 },
  statusText: { fontSize: 11, fontWeight: '600' },
  metaText: { marginTop: 3, fontSize: 11, color: '#8B8B8B' },
  menuBtn: { paddingHorizontal: 2, paddingVertical: 2, marginLeft: 8 },
  sessionBadgeRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  sessionBadge: {
    fontSize: 10,
    color: '#15803D',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: 'hidden',
    fontWeight: '700',
  },
  sessionBadgeMuted: {
    fontSize: 10,
    color: '#854D0E',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: 'hidden',
    fontWeight: '700',
  },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
  emptyTitle: { marginTop: 8, fontSize: 14, color: '#999' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.38)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modalCard: {
    width: '100%',
    borderRadius: 14,
    backgroundColor: '#fff',
    padding: 14,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: CHARCOAL },
  modalSub: { marginTop: 4, marginBottom: 10, fontSize: 12, color: MUTED_OLIVE, lineHeight: 18 },
  fieldLabel: { marginTop: 6, marginBottom: 4, fontSize: 11, color: MUTED_OLIVE, textTransform: 'uppercase', fontWeight: '700' },
  fieldInput: {
    borderWidth: 1,
    borderColor: '#E4DED3',
    borderRadius: 10,
    minHeight: 44,
    paddingHorizontal: 12,
    fontSize: 14,
    color: CHARCOAL,
    backgroundColor: '#FCFBF9',
  },
  roleOptionsWrap: { marginTop: 4, gap: 7 },
  roleOptionBtn: {
    minHeight: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E4DED3',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  roleOptionBtnActive: { borderColor: PRIMARY_BROWN, backgroundColor: '#F6EFE4' },
  roleOptionText: { fontSize: 13, color: CHARCOAL },
  roleOptionTextActive: { color: PRIMARY_BROWN, fontWeight: '700' },
  modalActions: { marginTop: 12, flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  modalCancelBtn: {
    borderWidth: 1,
    borderColor: '#D5D5D5',
    borderRadius: 8,
    minHeight: 38,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: { color: '#555', fontWeight: '600' },
  modalConfirmBtn: {
    borderRadius: 8,
    minHeight: 38,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY_BROWN,
  },
  modalConfirmText: { color: '#fff', fontWeight: '700' },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheetCard: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingBottom: 20,
    paddingTop: 8,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 99,
    backgroundColor: '#DDD',
    marginBottom: 8,
  },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: CHARCOAL },
  sheetSub: { marginTop: 2, marginBottom: 8, fontSize: 12, color: MUTED_OLIVE },
  sheetItem: {
    minHeight: 44,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 10,
  },
  sheetItemText: { fontSize: 14, color: CHARCOAL, fontWeight: '600' },
  sheetCancel: {
    marginTop: 6,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  sheetCancelText: { width: '100%', textAlign: 'center', color: MUTED_OLIVE, fontWeight: '600' },
});
