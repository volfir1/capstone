import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  TextInput, ActivityIndicator, Alert, Modal, RefreshControl, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchUsers, updateUserRole, toggleUserStatus, sendPasswordReset } from '../../api/adminApi';
import { PRIMARY_BROWN, PRIMARY_GOLD, CHARCOAL, MUTED_OLIVE, ADMIN_ROLES, ROLE_DISPLAY } from 'utils/constants';

const ROLE_TABS = [
  { key: 'user', label: 'Clients' },
  { key: 'secretary', label: 'Secretaries' },
  { key: 'intern', label: 'Interns' },
  { key: 'director', label: 'Directors' },
  { key: 'supervising_lawyer', label: 'Supervisors' },
  { key: 'inactive', label: 'Inactive' },
];

const ROLE_OPTIONS = [
  { value: 'user', label: 'User (Client)' },
  { value: 'secretary', label: 'Secretary' },
  { value: 'intern', label: 'Intern' },
  { value: 'director', label: 'Director' },
  { value: 'supervising_lawyer', label: 'Supervising Lawyer' },
];

const ROLE_COLORS = {
  user: '#4A90D9',
  secretary: '#7B68EE',
  intern: '#20B2AA',
  director: '#E67E22',
  supervising_lawyer: '#9B59B6',
  pao_lawyer: '#2ECC71',
  legal_volunteer: '#1ABC9C',
  attorney: '#E74C3C',
  admin: '#34495E',
};

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('user');
  const [roleModal, setRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      const data = await fetchUsers();
      setUsers(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  };

  // Filter users by tab and search
  const getFilteredUsers = () => {
    let filtered = users;
    if (activeTab === 'inactive') {
      filtered = filtered.filter(u => u.disabled || !u.isVerified);
    } else {
      filtered = filtered.filter(u => u.role === activeTab);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(u =>
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q)
      );
    }
    return filtered;
  };

  const filteredUsers = getFilteredUsers();

  // Stats
  const totalUsers = users.length;
  const activeUsers = users.filter(u => !u.disabled && u.isVerified).length;
  const inactiveUsers = users.filter(u => u.disabled || !u.isVerified).length;

  const getStatusText = (user) => {
    if (user.disabled) return 'Disabled';
    return user.isVerified ? 'Active' : 'Inactive';
  };

  const getStatusColor = (user) => {
    if (user.disabled) return '#ef4444';
    return user.isVerified ? '#22c55e' : '#999';
  };

  // Actions
  const handleChangeRole = (user) => {
    setSelectedUser(user);
    setSelectedRole(user.role);
    setRoleModal(true);
  };

  const confirmRoleChange = async () => {
    if (!selectedUser || !selectedRole || selectedRole === selectedUser.role) {
      setRoleModal(false);
      return;
    }
    try {
      setActionLoading(true);
      await updateUserRole(selectedUser._id, selectedRole);
      Alert.alert('Success', `Role updated to ${ROLE_DISPLAY[selectedRole] || selectedRole}`);
      setRoleModal(false);
      await loadUsers();
    } catch (err) {
      Alert.alert('Error', 'Failed to update role');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = (user) => {
    const newStatus = !user.disabled;
    const action = newStatus ? 'disable' : 'enable';
    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} Account`,
      `Are you sure you want to ${action} ${user.firstName} ${user.lastName}'s account?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: newStatus ? 'destructive' : 'default',
          onPress: async () => {
            try {
              await toggleUserStatus(user._id, newStatus);
              Alert.alert('Success', `Account ${newStatus ? 'disabled' : 'enabled'} successfully`);
              await loadUsers();
            } catch (err) {
              Alert.alert('Error', `Failed to ${action} account`);
            }
          },
        },
      ]
    );
  };

  const handlePasswordReset = (user) => {
    Alert.alert(
      'Send Password Reset',
      `Send a password reset email to ${user.email}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            try {
              await sendPasswordReset(user.email);
              Alert.alert('Success', 'Password reset email sent');
            } catch (err) {
              Alert.alert('Error', 'Failed to send password reset email');
            }
          },
        },
      ]
    );
  };

  const formatDate = (d) => {
    if (!d) return 'N/A';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderUserCard = ({ item: user }) => {
    const initials = `${(user.firstName || '?')[0]}${(user.lastName || '?')[0]}`.toUpperCase();
    const status = getStatusText(user);
    const statusColor = getStatusColor(user);
    const roleColor = ROLE_COLORS[user.role] || PRIMARY_BROWN;
    const isDisabled = user.disabled;

    return (
      <View style={[s.userCard, isDisabled && s.userCardDisabled]}>
        <View style={s.userRow}>
          <View style={[s.avatar, { backgroundColor: roleColor }]}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          <View style={s.userInfo}>
            <Text style={s.userName}>{user.firstName} {user.lastName}</Text>
            <Text style={s.userEmail}>{user.email}</Text>
            <View style={s.badgeRow}>
              <View style={[s.roleBadge, { backgroundColor: `${roleColor}20` }]}>
                <Text style={[s.roleBadgeText, { color: roleColor }]}>
                  {ROLE_DISPLAY[user.role] || user.role}
                </Text>
              </View>
              <View style={s.statusDot}>
                <View style={[s.dot, { backgroundColor: statusColor }]} />
                <Text style={[s.statusText, { color: statusColor }]}>{status}</Text>
              </View>
            </View>
            <Text style={s.joinDate}>Joined {formatDate(user.createdAt)}</Text>
          </View>
          <TouchableOpacity
            style={s.menuBtn}
            onPress={() => {
              Alert.alert(
                `${user.firstName} ${user.lastName}`,
                'Choose an action',
                [
                  { text: 'Change Role', onPress: () => handleChangeRole(user) },
                  {
                    text: user.disabled ? 'Enable Account' : 'Disable Account',
                    onPress: () => handleToggleStatus(user),
                    style: user.disabled ? 'default' : 'destructive',
                  },
                  { text: 'Send Password Reset', onPress: () => handlePasswordReset(user) },
                  { text: 'Cancel', style: 'cancel' },
                ]
              );
            }}
          >
            <Ionicons name="ellipsis-vertical" size={20} color={MUTED_OLIVE} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>User Management</Text>
        <View style={s.statsRow}>
          <View style={s.statItem}>
            <Text style={s.statValue}>{totalUsers}</Text>
            <Text style={s.statLabel}>Total</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: '#22c55e' }]}>{activeUsers}</Text>
            <Text style={s.statLabel}>Active</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: '#ef4444' }]}>{inactiveUsers}</Text>
            <Text style={s.statLabel}>Inactive</Text>
          </View>
        </View>
      </View>

      {/* Search */}
      <View style={s.searchBox}>
        <Ionicons name="search" size={18} color="#999" />
        <TextInput
          placeholder="Search by name or email..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={s.searchInput}
          placeholderTextColor="#999"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* Role Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabScroll} contentContainerStyle={s.tabContent}>
        {ROLE_TABS.map(tab => {
          const count = tab.key === 'inactive'
            ? users.filter(u => u.disabled || !u.isVerified).length
            : users.filter(u => u.role === tab.key).length;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[s.tabBtn, activeTab === tab.key && s.tabBtnActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[s.tabBtnText, activeTab === tab.key && s.tabBtnTextActive]}>
                {tab.label} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* User List */}
      {loading ? (
        <ActivityIndicator size="large" color={PRIMARY_BROWN} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={item => item._id}
          renderItem={renderUserCard}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[PRIMARY_BROWN]} />}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 20 }}
          ListEmptyComponent={
            <View style={s.emptyState}>
              <Ionicons name="people-outline" size={48} color="#ccc" />
              <Text style={s.emptyTitle}>No users found</Text>
            </View>
          }
        />
      )}

      {/* Role Change Modal */}
      <Modal visible={roleModal} transparent animationType="fade">
        <TouchableOpacity
          style={s.modalOverlay}
          activeOpacity={1}
          onPress={() => !actionLoading && setRoleModal(false)}
        >
          <View style={s.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={s.modalTitle}>Change Role</Text>
            {selectedUser && (
              <Text style={s.modalSubtitle}>{selectedUser.firstName} {selectedUser.lastName}</Text>
            )}
            <View style={s.roleOptions}>
              {ROLE_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={[s.roleOption, selectedRole === opt.value && s.roleOptionActive]}
                  onPress={() => setSelectedRole(opt.value)}
                >
                  <View style={[s.radioOuter, selectedRole === opt.value && s.radioOuterActive]}>
                    {selectedRole === opt.value && <View style={s.radioInner} />}
                  </View>
                  <Text style={[s.roleOptionText, selectedRole === opt.value && s.roleOptionTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={s.modalActions}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setRoleModal(false)} disabled={actionLoading}>
                <Text style={s.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.confirmBtn, actionLoading && { opacity: 0.6 }]}
                onPress={confirmRoleChange}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={s.confirmBtnText}>Update Role</Text>
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
  header: { backgroundColor: '#fff', paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: CHARCOAL },
  statsRow: { flexDirection: 'row', marginTop: 12, gap: 16 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700', color: PRIMARY_BROWN },
  statLabel: { fontSize: 11, color: MUTED_OLIVE },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 12, marginTop: 12, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, gap: 8 },
  searchInput: { flex: 1, fontSize: 14, color: CHARCOAL },
  tabScroll: { maxHeight: 50, marginTop: 8 },
  tabContent: { paddingHorizontal: 12, gap: 6 },
  tabBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff' },
  tabBtnActive: { backgroundColor: PRIMARY_BROWN },
  tabBtnText: { fontSize: 12, color: MUTED_OLIVE, fontWeight: '500' },
  tabBtnTextActive: { color: '#fff', fontWeight: '600' },
  userCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8 },
  userCardDisabled: { opacity: 0.6, backgroundColor: '#fff5f5' },
  userRow: { flexDirection: 'row', alignItems: 'flex-start' },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '600', color: CHARCOAL },
  userEmail: { fontSize: 12, color: MUTED_OLIVE, marginTop: 2 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  roleBadgeText: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },
  statusDot: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '500' },
  joinDate: { fontSize: 10, color: '#bbb', marginTop: 4 },
  menuBtn: { padding: 4 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 14, color: '#aaa', marginTop: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, width: '85%', padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: CHARCOAL },
  modalSubtitle: { fontSize: 14, color: MUTED_OLIVE, marginTop: 4, marginBottom: 16 },
  roleOptions: { gap: 10 },
  roleOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, backgroundColor: '#f9f9f9' },
  roleOptionActive: { backgroundColor: `${PRIMARY_BROWN}10`, borderWidth: 1, borderColor: PRIMARY_BROWN },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#ccc', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  radioOuterActive: { borderColor: PRIMARY_BROWN },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: PRIMARY_BROWN },
  roleOptionText: { fontSize: 14, color: CHARCOAL },
  roleOptionTextActive: { fontWeight: '600', color: PRIMARY_BROWN },
  modalActions: { flexDirection: 'row', marginTop: 20, gap: 10 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#f5f5f5', alignItems: 'center' },
  cancelBtnText: { fontSize: 14, color: MUTED_OLIVE, fontWeight: '600' },
  confirmBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: PRIMARY_BROWN, alignItems: 'center' },
  confirmBtnText: { fontSize: 14, color: '#fff', fontWeight: '600' },
});
