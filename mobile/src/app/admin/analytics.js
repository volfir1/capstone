import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, RefreshControl, Modal, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { fetchFinalizedCases, fetchUsers } from '../../api/adminApi';
import { PRIMARY_BROWN, PRIMARY_GOLD, CHARCOAL, MUTED_OLIVE, ACCENT_TAN, CATEGORY_COLORS } from 'utils/constants';

const DATE_RANGES = [
  { label: '7 Days', value: 7 },
  { label: '30 Days', value: 30 },
  { label: '90 Days', value: 90 },
  { label: '1 Year', value: 365 },
];

export default function Analytics() {
  const router = useRouter();
  const [finalized, setFinalized] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState(30);
  const [selectedTab, setSelectedTab] = useState('interns');
  const [userDetailModal, setUserDetailModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [finalizedRes, usersRes] = await Promise.all([
        fetchFinalizedCases().catch(() => ({ data: [] })),
        fetchUsers().catch(() => []),
      ]);
      setFinalized(finalizedRes.data || []);
      setUsers(Array.isArray(usersRes) ? usersRes : usersRes.data || []);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Filter by date range
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - dateRange);
  const filteredCases = finalized.filter(f => new Date(f.createdAt) >= cutoffDate);

  // Stats by personnel type
  const getPersonnelStats = (roleFilter) => {
    const personnel = users.filter(u => {
      if (roleFilter === 'interns') return u.role === 'intern';
      if (roleFilter === 'supervisors') return u.role === 'supervising_lawyer';
      if (roleFilter === 'directors') return u.role === 'director';
      return false;
    });

    return personnel.map(person => {
      const personCases = filteredCases.filter(fc => {
        if (roleFilter === 'interns') return fc.reviewerId === person._id || fc.internId === person._id;
        if (roleFilter === 'supervisors') return fc.supervisingLawyerId === person._id;
        if (roleFilter === 'directors') return fc.directorId === person._id;
        return false;
      });

      return {
        ...person,
        casesHandled: personCases.length,
        accepted: personCases.filter(c => c.status === 'accepted').length,
        rejected: personCases.filter(c => c.status === 'rejected').length,
        pending: personCases.filter(c => c.status === 'pending').length,
        cases: personCases,
      };
    }).sort((a, b) => b.casesHandled - a.casesHandled);
  };

  const personnelStats = getPersonnelStats(selectedTab);

  // Decision breakdown
  const totalAccepted = filteredCases.filter(c => c.status === 'accepted').length;
  const totalRejected = filteredCases.filter(c => c.status === 'rejected').length;
  const totalPending = filteredCases.filter(c => c.status === 'pending').length;

  // Category distribution
  const categoryMap = {};
  filteredCases.forEach(c => {
    const cat = c.caseNature || c.caseType || 'Other';
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
  });
  const categories = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);

  const getMedalIcon = (index) => {
    if (index === 0) return { name: 'trophy', color: '#FFD700' };
    if (index === 1) return { name: 'medal', color: '#C0C0C0' };
    if (index === 2) return { name: 'medal', color: '#CD7F32' };
    return null;
  };

  const openUserDetail = (person) => {
    setSelectedUser(person);
    setUserDetailModal(true);
  };

  const TABS = [
    { key: 'interns', label: 'Interns' },
    { key: 'supervisors', label: 'Supervisors' },
    { key: 'directors', label: 'Directors' },
  ];

  return (
    <View style={s.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[PRIMARY_BROWN]} />}
      >
        {/* Summary Stats */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Decision Summary</Text>
          <View style={s.summaryGrid}>
            <View style={[s.summaryCard, { borderLeftColor: '#22c55e' }]}>
              <Text style={[s.summaryValue, { color: '#22c55e' }]}>{totalAccepted}</Text>
              <Text style={s.summaryLabel}>Accepted</Text>
            </View>
            <View style={[s.summaryCard, { borderLeftColor: '#ef4444' }]}>
              <Text style={[s.summaryValue, { color: '#ef4444' }]}>{totalRejected}</Text>
              <Text style={s.summaryLabel}>Rejected</Text>
            </View>
            <View style={[s.summaryCard, { borderLeftColor: PRIMARY_GOLD }]}>
              <Text style={[s.summaryValue, { color: PRIMARY_GOLD }]}>{totalPending}</Text>
              <Text style={s.summaryLabel}>Pending</Text>
            </View>
          </View>
        </View>

        {/* Date Range Filter */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Date Range</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {DATE_RANGES.map(range => (
              <TouchableOpacity
                key={range.value}
                style={[s.rangeBtn, dateRange === range.value && s.rangeBtnActive]}
                onPress={() => setDateRange(range.value)}
              >
                <Text style={[s.rangeBtnText, dateRange === range.value && s.rangeBtnTextActive]}>
                  {range.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Category Distribution */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Category Distribution</Text>
          {categories.length > 0 ? categories.slice(0, 8).map(([cat, count], i) => {
            const maxCount = categories[0][1];
            const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
            return (
              <View key={cat} style={s.barItem}>
                <View style={s.barHeader}>
                  <Text style={s.barLabel} numberOfLines={1}>{cat}</Text>
                  <Text style={s.barCount}>{count}</Text>
                </View>
                <View style={s.barBg}>
                  <View style={[s.barFill, { width: `${percentage}%`, backgroundColor: CATEGORY_COLORS[cat] || PRIMARY_BROWN }]} />
                </View>
              </View>
            );
          }) : <Text style={s.noData}>No data for selected period</Text>}
        </View>

        {/* Personnel Tabs */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Personnel Performance</Text>
          <View style={s.tabRow}>
            {TABS.map(tab => (
              <TouchableOpacity
                key={tab.key}
                style={[s.tab, selectedTab === tab.key && s.tabActive]}
                onPress={() => setSelectedTab(tab.key)}
              >
                <Text style={[s.tabText, selectedTab === tab.key && s.tabTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={PRIMARY_BROWN} style={{ marginVertical: 20 }} />
          ) : personnelStats.length > 0 ? (
            personnelStats.map((person, index) => {
              const medal = getMedalIcon(index);
              const max = personnelStats[0]?.casesHandled || 1;
              const pct = Math.round((person.casesHandled / max) * 100);
              return (
                <TouchableOpacity key={person._id} style={s.personCard} onPress={() => openUserDetail(person)}>
                  <View style={s.personHeader}>
                    <View style={s.personRank}>
                      {medal ? <Ionicons name={medal.name} size={20} color={medal.color} /> : <Text style={s.rankNum}>{index + 1}</Text>}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.personName}>{person.firstName} {person.lastName}</Text>
                      <Text style={s.personEmail}>{person.email}</Text>
                    </View>
                    <Text style={s.personCount}>{person.casesHandled}</Text>
                  </View>
                  <View style={s.personBar}>
                    <View style={[s.personBarFill, { width: `${pct}%` }]} />
                  </View>
                  <View style={s.personStats}>
                    <Text style={[s.personStat, { color: '#22c55e' }]}>{person.accepted} accepted</Text>
                    <Text style={[s.personStat, { color: '#ef4444' }]}>{person.rejected} rejected</Text>
                    <Text style={[s.personStat, { color: PRIMARY_GOLD }]}>{person.pending} pending</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <Text style={s.noData}>No {selectedTab} found</Text>
          )}
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* User Detail Modal */}
      <Modal visible={userDetailModal} animationType="slide" presentationStyle="pageSheet">
        <View style={s.modalContainer}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Performance Details</Text>
            <TouchableOpacity onPress={() => setUserDetailModal(false)}>
              <Ionicons name="close" size={24} color={CHARCOAL} />
            </TouchableOpacity>
          </View>
          {selectedUser && (
            <ScrollView style={s.modalContent}>
              <Text style={s.detailName}>{selectedUser.firstName} {selectedUser.lastName}</Text>
              <Text style={s.detailEmail}>{selectedUser.email}</Text>
              <View style={s.detailStats}>
                <View style={s.detailStatItem}>
                  <Text style={s.detailStatValue}>{selectedUser.casesHandled}</Text>
                  <Text style={s.detailStatLabel}>Total</Text>
                </View>
                <View style={s.detailStatItem}>
                  <Text style={[s.detailStatValue, { color: '#22c55e' }]}>{selectedUser.accepted}</Text>
                  <Text style={s.detailStatLabel}>Accepted</Text>
                </View>
                <View style={s.detailStatItem}>
                  <Text style={[s.detailStatValue, { color: '#ef4444' }]}>{selectedUser.rejected}</Text>
                  <Text style={s.detailStatLabel}>Rejected</Text>
                </View>
              </View>
              {selectedUser.cases?.length > 0 && (
                <View style={{ marginTop: 16 }}>
                  <Text style={s.detailLabel}>Cases</Text>
                  {selectedUser.cases.map((c, i) => (
                    <View key={i} style={s.caseListItem}>
                      <Text style={s.caseListTitle}>{c.caseNature || c.caseType || 'Case'}</Text>
                      <View style={[s.caseListBadge, { backgroundColor: c.status === 'accepted' ? '#22c55e20' : c.status === 'rejected' ? '#ef444420' : `${PRIMARY_GOLD}20` }]}>
                        <Text style={[s.caseListBadgeText, { color: c.status === 'accepted' ? '#22c55e' : c.status === 'rejected' ? '#ef4444' : PRIMARY_GOLD }]}>
                          {(c.status || 'pending').toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  section: { backgroundColor: '#fff', marginHorizontal: 12, marginBottom: 8, borderRadius: 12, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: CHARCOAL, marginBottom: 12 },
  summaryGrid: { flexDirection: 'row', gap: 8 },
  summaryCard: { flex: 1, backgroundColor: '#f9f9f9', borderRadius: 10, padding: 14, borderLeftWidth: 3, alignItems: 'center' },
  summaryValue: { fontSize: 28, fontWeight: '700' },
  summaryLabel: { fontSize: 11, color: MUTED_OLIVE, marginTop: 2 },
  rangeBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f5f5f5', marginRight: 8 },
  rangeBtnActive: { backgroundColor: PRIMARY_BROWN },
  rangeBtnText: { fontSize: 13, color: MUTED_OLIVE },
  rangeBtnTextActive: { color: '#fff', fontWeight: '600' },
  barItem: { marginBottom: 12 },
  barHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  barLabel: { fontSize: 12, color: CHARCOAL, flex: 1, marginRight: 8 },
  barCount: { fontSize: 12, fontWeight: '600', color: CHARCOAL },
  barBg: { height: 8, backgroundColor: '#f0f0f0', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  tabRow: { flexDirection: 'row', marginBottom: 16, backgroundColor: '#f5f5f5', borderRadius: 10, padding: 3 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  tabActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  tabText: { fontSize: 13, color: MUTED_OLIVE },
  tabTextActive: { color: PRIMARY_BROWN, fontWeight: '600' },
  personCard: { backgroundColor: '#f9f9f9', borderRadius: 10, padding: 14, marginBottom: 8 },
  personHeader: { flexDirection: 'row', alignItems: 'center' },
  personRank: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  rankNum: { fontSize: 14, fontWeight: '600', color: MUTED_OLIVE },
  personName: { fontSize: 14, fontWeight: '600', color: CHARCOAL },
  personEmail: { fontSize: 11, color: MUTED_OLIVE },
  personCount: { fontSize: 20, fontWeight: '700', color: PRIMARY_BROWN },
  personBar: { height: 4, backgroundColor: '#e0e0e0', borderRadius: 2, marginTop: 8, overflow: 'hidden' },
  personBarFill: { height: '100%', backgroundColor: PRIMARY_BROWN, borderRadius: 2 },
  personStats: { flexDirection: 'row', marginTop: 8, gap: 12 },
  personStat: { fontSize: 11, fontWeight: '500' },
  noData: { textAlign: 'center', color: '#aaa', paddingVertical: 20 },
  modalContainer: { flex: 1, backgroundColor: '#F7F8FA' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 50, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalTitle: { fontSize: 18, fontWeight: '600', color: CHARCOAL },
  modalContent: { padding: 16 },
  detailName: { fontSize: 20, fontWeight: '700', color: CHARCOAL },
  detailEmail: { fontSize: 13, color: MUTED_OLIVE, marginTop: 4 },
  detailStats: { flexDirection: 'row', marginTop: 16, gap: 12 },
  detailStatItem: { flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 14, alignItems: 'center' },
  detailStatValue: { fontSize: 24, fontWeight: '700', color: PRIMARY_BROWN },
  detailStatLabel: { fontSize: 11, color: MUTED_OLIVE, marginTop: 2 },
  detailLabel: { fontSize: 12, color: MUTED_OLIVE, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase' },
  caseListItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  caseListTitle: { fontSize: 14, color: CHARCOAL, flex: 1 },
  caseListBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  caseListBadgeText: { fontSize: 10, fontWeight: '600' },
});
