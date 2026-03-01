import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, RefreshControl, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from 'context/authContext';
import apiClient from '../../api/apiClient';
import { fetchDashboardStats, fetchReviews, fetchFinalizedCases, fetchActivityLogs, fetchUsers } from '../../api/adminApi';
import { PRIMARY_BROWN, PRIMARY_GOLD, CHARCOAL, MUTED_OLIVE, ACCENT_TAN, CATEGORY_COLORS, ROLE_DISPLAY } from 'utils/constants';

const REVIEW_STAGES = [
  { key: 'all', label: 'All' },
  { key: 'supervising_lawyer', label: 'Supervising' },
  { key: 'director', label: 'Director' },
  { key: 'returned', label: 'Returned' },
];

export default function AdminDashboard() {
  const router = useRouter();
  const { logout, userData } = useAuth();
  const isIntern = userData?.role === 'intern' || userData?.role === 'secretary';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ totalCases: 0, totalUsers: 0, pendingReviews: 0, finalized: 0, totalAttorneys: 0, unassignedCases: 0 });
  const [reviews, setReviews] = useState([]);
  const [finalized, setFinalized] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [reviewStage, setReviewStage] = useState('all');

  // Distribution data
  const [serviceDistribution, setServiceDistribution] = useState([]);
  const [roleDistribution, setRoleDistribution] = useState([]);
  const [decisionDistribution, setDecisionDistribution] = useState([]);

  const loadData = useCallback(async () => {
    try {
      const [statsRes, reviewsRes, finalizedRes, logsRes, usersRes] = await Promise.all([
        fetchDashboardStats().catch(() => ({})),
        fetchReviews().catch(() => []),
        fetchFinalizedCases().catch(() => ({ data: [] })),
        fetchActivityLogs().catch(() => []),
        fetchUsers().catch(() => []),
      ]);

      // Stats
      const s = statsRes || {};
      setStats({
        totalCases: s.totalCases || 0,
        totalUsers: s.totalUsers || 0,
        pendingReviews: s.pendingReviews || 0,
        finalized: s.finalized || 0,
        totalAttorneys: s.totalAttorneys || 0,
        unassignedCases: s.unassignedCases || 0,
      });

      // Reviews
      const reviewsData = Array.isArray(reviewsRes) ? reviewsRes : reviewsRes?.data || [];
      setReviews(isIntern && userData?._id
        ? reviewsData.filter(r => r.reviewerId === userData._id).slice(0, 10)
        : reviewsData.slice(0, 10)
      );

      // Finalized
      const finalData = Array.isArray(finalizedRes) ? finalizedRes : finalizedRes?.data || [];
      setFinalized(finalData.slice(0, 10));

      // Calculate distributions from finalized data
      const serviceCounts = {};
      const decisionCounts = { accepted: 0, rejected: 0, pending: 0 };
      finalData.forEach(f => {
        const svc = f.serviceType || f.caseNature || 'Other';
        serviceCounts[svc] = (serviceCounts[svc] || 0) + 1;
        const d = (f.decision || f.status || 'pending').toLowerCase();
        if (decisionCounts[d] !== undefined) decisionCounts[d]++;
      });
      setServiceDistribution(Object.entries(serviceCounts).sort((a, b) => b[1] - a[1]).slice(0, 6));
      setDecisionDistribution([
        { label: 'Accepted', count: decisionCounts.accepted, color: '#22c55e' },
        { label: 'Rejected', count: decisionCounts.rejected, color: '#ef4444' },
        { label: 'Pending', count: decisionCounts.pending, color: PRIMARY_GOLD },
      ]);

      // Users by role
      const usersData = Array.isArray(usersRes) ? usersRes : usersRes?.data || [];
      setUsers(usersData);
      const roleCounts = {};
      usersData.forEach(u => {
        const r = u.role || 'user';
        roleCounts[r] = (roleCounts[r] || 0) + 1;
      });
      setRoleDistribution(Object.entries(roleCounts).sort((a, b) => b[1] - a[1]));

      // Activity logs
      const logsData = Array.isArray(logsRes) ? logsRes : logsRes?.data || [];
      setActivityLogs(logsData.slice(0, 10));
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }, [isIntern, userData?._id]);

  useEffect(() => { loadData(); }, [loadData]);
  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    try { await logout(); router.replace('/'); } catch (e) { console.error(e); }
  };

  // Filter reviews by stage
  const filteredReviews = reviewStage === 'all' ? reviews :
    reviewStage === 'returned' ? reviews.filter(r => r.reviewStage === 'returned_to_intern' || r.status === 'returned') :
    reviews.filter(r => r.reviewStage === reviewStage || r.currentStage === reviewStage || r.reviewerRole === reviewStage);

  const statCards = [
    { label: 'Total Cases', value: stats.totalCases, icon: 'documents-outline', color: '#8B6F47', bg: '#F5EFE7' },
    { label: 'Total Users', value: stats.totalUsers, icon: 'people-outline', color: '#6B8E23', bg: '#F0F8E8' },
    { label: 'Pending Reviews', value: stats.pendingReviews, icon: 'hourglass-outline', color: '#D2691E', bg: '#FFF3E6' },
    { label: 'Finalized', value: stats.finalized, icon: 'checkmark-done-outline', color: '#4682B4', bg: '#E8F4F8' },
  ];

  const ROLE_COLORS_MAP = {
    user: '#4A90D9', secretary: '#7B68EE', intern: '#20B2AA',
    director: '#E67E22', supervising_lawyer: '#9B59B6',
    pao_lawyer: '#2ECC71', attorney: '#E74C3C', legal_volunteer: '#1ABC9C',
  };

  if (loading) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.loadingCenter}>
          <ActivityIndicator size="large" color={PRIMARY_BROWN} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.logoRow}>
          <Image source={require('../../assets/images/logo.png')} style={s.logo} />
          <Text style={s.appName}>JustReach Admin</Text>
        </View>
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color={CHARCOAL} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[PRIMARY_BROWN]} />}
      >
        {/* Welcome */}
        <View style={s.welcomeSection}>
          <Text style={s.welcomeLabel}>Welcome back,</Text>
          <Text style={s.welcomeName}>{isIntern ? 'Intern' : (userData?.firstName || 'Administrator')}</Text>
        </View>

        {/* Stat Cards */}
        <View style={s.statsGrid}>
          {statCards.map(card => (
            <View key={card.label} style={[s.statCard, { backgroundColor: card.bg }]}>
              <View style={[s.statIcon, { backgroundColor: card.color }]}>
                <Ionicons name={card.icon} size={22} color="#fff" />
              </View>
              <Text style={s.statValue}>{card.value}</Text>
              <Text style={s.statLabel}>{card.label}</Text>
            </View>
          ))}
        </View>

        {/* Service Distribution */}
        {serviceDistribution.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Legal Services Distribution</Text>
            {serviceDistribution.map(([label, count]) => {
              const max = serviceDistribution[0][1];
              const pct = max > 0 ? (count / max) * 100 : 0;
              return (
                <View key={label} style={s.distItem}>
                  <View style={s.distHeader}>
                    <Text style={s.distLabel} numberOfLines={1}>{label}</Text>
                    <Text style={s.distCount}>{count}</Text>
                  </View>
                  <View style={s.distBarBg}>
                    <View style={[s.distBarFill, { width: `${pct}%`, backgroundColor: CATEGORY_COLORS[label] || PRIMARY_BROWN }]} />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Decision Summary */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Finalized Decisions</Text>
          <View style={s.decisionRow}>
            {decisionDistribution.map(d => (
              <View key={d.label} style={s.decisionCard}>
                <Text style={[s.decisionValue, { color: d.color }]}>{d.count}</Text>
                <Text style={s.decisionLabel}>{d.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Users by Role */}
        {roleDistribution.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Users by Role</Text>
            <View style={s.roleGrid}>
              {roleDistribution.map(([role, count]) => (
                <View key={role} style={s.roleItem}>
                  <View style={[s.roleDot, { backgroundColor: ROLE_COLORS_MAP[role] || '#999' }]} />
                  <Text style={s.roleText}>{ROLE_DISPLAY[role] || role}</Text>
                  <Text style={s.roleCount}>{count}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Case Reviews */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Case Reviews</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
            {REVIEW_STAGES.map(stage => (
              <TouchableOpacity
                key={stage.key}
                style={[s.stageBtn, reviewStage === stage.key && s.stageBtnActive]}
                onPress={() => setReviewStage(stage.key)}
              >
                <Text style={[s.stageBtnText, reviewStage === stage.key && s.stageBtnTextActive]}>
                  {stage.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {filteredReviews.length > 0 ? filteredReviews.slice(0, 5).map(review => {
            const clientName = review.content?.interviewInfo?.clientName || review.clientName || 'Unknown Client';
            return (
              <TouchableOpacity
                key={review._id || review.caseId}
                style={s.reviewCard}
                onPress={() => {
                  const reviewParam = encodeURIComponent(JSON.stringify(review));
                  router.push(`/admin/recommendation?caseId=${review.caseId || ''}&review=${reviewParam}`);
                }}
              >
                <View style={s.reviewIcon}>
                  <Ionicons name="document-text" size={20} color={PRIMARY_BROWN} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.reviewName}>{clientName}</Text>
                  <Text style={s.reviewMeta}>
                    {review.reviewerRole || 'Intern'} • {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ''}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#ccc" />
              </TouchableOpacity>
            );
          }) : (
            <Text style={s.emptyText}>No reviews for this filter</Text>
          )}
        </View>

        {/* Finalized Records */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Finalized Records</Text>
          {finalized.length > 0 ? finalized.slice(0, 5).map(record => {
            const clientName = record.clientName || record.content?.interviewInfo?.clientName || 'Client';
            const decision = record.decision || record.status || 'pending';
            return (
              <TouchableOpacity
                key={record._id}
                style={s.reviewCard}
                onPress={() => router.push('/admin/finalized')}
              >
                <View style={[s.reviewIcon, { backgroundColor: decision === 'accepted' ? '#22c55e15' : decision === 'rejected' ? '#ef444415' : '#f5f5f5' }]}>
                  <Ionicons
                    name={decision === 'accepted' ? 'checkmark-circle' : decision === 'rejected' ? 'close-circle' : 'time'}
                    size={20}
                    color={decision === 'accepted' ? '#22c55e' : decision === 'rejected' ? '#ef4444' : PRIMARY_GOLD}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.reviewName}>{clientName}</Text>
                  <Text style={s.reviewMeta}>
                    {decision.charAt(0).toUpperCase() + decision.slice(1)} • {record.createdAt ? new Date(record.createdAt).toLocaleDateString() : ''}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#ccc" />
              </TouchableOpacity>
            );
          }) : (
            <Text style={s.emptyText}>No finalized records</Text>
          )}
        </View>

        {/* Activity Log */}
        {activityLogs.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Activity Log</Text>
            {activityLogs.slice(0, 5).map((log, i) => (
              <View key={log._id || i} style={s.logItem}>
                <View style={[s.logDot, { backgroundColor: log.action === 'login' ? '#22c55e' : log.action === 'logout' ? '#ef4444' : PRIMARY_GOLD }]} />
                <View style={{ flex: 1 }}>
                  <Text style={s.logText}>{log.userName || log.userId?.firstName || 'User'} - {log.action || 'action'}</Text>
                  <Text style={s.logTime}>{log.createdAt ? new Date(log.createdAt).toLocaleString() : ''}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Quick Actions */}
        {!isIntern && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Quick Actions</Text>
            <View style={s.actionsGrid}>
              {[
                { label: 'Assigned Cases', icon: 'git-branch-outline', route: '/admin/assigned-cases' },
                { label: 'Analytics', icon: 'bar-chart-outline', route: '/admin/analytics' },
                { label: 'Recommendations', icon: 'star-outline', route: '/admin/recommendation' },
              ].map(action => (
                <TouchableOpacity key={action.label} style={s.actionCard} onPress={() => router.push(action.route)}>
                  <View style={s.actionIcon}><Ionicons name={action.icon} size={22} color={PRIMARY_BROWN} /></View>
                  <Text style={s.actionLabel}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  logoRow: { flexDirection: 'row', alignItems: 'center' },
  logo: { width: 36, height: 36, borderRadius: 10, resizeMode: 'contain' },
  appName: { fontSize: 20, fontWeight: '700', color: PRIMARY_BROWN, marginLeft: 10 },
  logoutBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' },
  welcomeSection: { paddingHorizontal: 16, paddingVertical: 16 },
  welcomeLabel: { fontSize: 14, color: MUTED_OLIVE },
  welcomeName: { fontSize: 22, fontWeight: '700', color: CHARCOAL },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8 },
  statCard: { width: '48%', borderRadius: 12, padding: 14, flexGrow: 1 },
  statIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statValue: { fontSize: 24, fontWeight: '700', color: CHARCOAL },
  statLabel: { fontSize: 11, color: MUTED_OLIVE, marginTop: 2 },
  section: { backgroundColor: '#fff', marginHorizontal: 12, marginTop: 10, borderRadius: 12, padding: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: CHARCOAL, marginBottom: 12 },
  distItem: { marginBottom: 10 },
  distHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  distLabel: { fontSize: 12, color: CHARCOAL, flex: 1, marginRight: 8 },
  distCount: { fontSize: 12, fontWeight: '600', color: CHARCOAL },
  distBarBg: { height: 6, backgroundColor: '#f0f0f0', borderRadius: 3, overflow: 'hidden' },
  distBarFill: { height: '100%', borderRadius: 3 },
  decisionRow: { flexDirection: 'row', gap: 8 },
  decisionCard: { flex: 1, backgroundColor: '#f9f9f9', borderRadius: 10, padding: 14, alignItems: 'center' },
  decisionValue: { fontSize: 24, fontWeight: '700' },
  decisionLabel: { fontSize: 11, color: MUTED_OLIVE, marginTop: 2 },
  roleGrid: { gap: 6 },
  roleItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  roleDot: { width: 10, height: 10, borderRadius: 5 },
  roleText: { flex: 1, fontSize: 13, color: CHARCOAL },
  roleCount: { fontSize: 13, fontWeight: '600', color: CHARCOAL },
  stageBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: '#f5f5f5', marginRight: 6 },
  stageBtnActive: { backgroundColor: PRIMARY_BROWN },
  stageBtnText: { fontSize: 12, color: MUTED_OLIVE },
  stageBtnTextActive: { color: '#fff', fontWeight: '600' },
  reviewCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  reviewIcon: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  reviewName: { fontSize: 14, fontWeight: '600', color: CHARCOAL },
  reviewMeta: { fontSize: 11, color: MUTED_OLIVE, marginTop: 2 },
  emptyText: { textAlign: 'center', color: '#aaa', paddingVertical: 16, fontSize: 13 },
  logItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 10 },
  logDot: { width: 8, height: 8, borderRadius: 4 },
  logText: { fontSize: 13, color: CHARCOAL },
  logTime: { fontSize: 10, color: '#999' },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actionCard: { width: '48%', backgroundColor: '#f9f9f9', borderRadius: 10, padding: 14, alignItems: 'center', flexGrow: 1 },
  actionIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: `${PRIMARY_BROWN}10`, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  actionLabel: { fontSize: 12, fontWeight: '600', color: CHARCOAL },
});
