import { useState, useEffect, useCallback } from 'react';
import {
  Text, View, TouchableOpacity, Alert, ScrollView, Image,
  ActivityIndicator, RefreshControl, StyleSheet,
} from 'react-native';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from 'context/authContext';
import { PRIMARY_BROWN, PRIMARY_GOLD, CHARCOAL, MUTED_OLIVE, ACCENT_TAN } from 'utils/constants';
import { fetchUserCases, fetchUserAppointments } from '../../api/userApi';
import { fetchClientInfoRecords, fetchFinalizedCases } from '../../api/adminApi';
import { useNotifications } from '../../hooks/useNotifications';

export default function UserDashboard() {
  const router = useRouter();
  const { logout, user, userData, isLoading } = useAuth();
  const { unreadCount } = useNotifications();
  const [cases, setCases] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [casesRes, appointmentsRes] = await Promise.all([
        fetchUserCases().catch(() => ({ data: [] })),
        fetchClientInfoRecords().catch(() => ({ data: [] })),
      ]);
      setCases(casesRes.data || []);
      // Filter appointments for current user
      const allAppts = appointmentsRes.data || [];
      const userAppts = allAppts.filter(
        a => a.userId === userData?._id || a.email === user?.email
      );
      setAppointments(userAppts);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, [userData, user]);

  useEffect(() => {
    if (userData) loadData();
  }, [userData, loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/auth');
    } catch (error) {
      Alert.alert('Logout Failed', 'An error occurred while logging out.');
    }
  };

  const confirmLogout = () => {
    Alert.alert('Confirm Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: handleLogout },
    ]);
  };

  const activeCases = cases.filter(c => c.status !== 'completed' && c.status !== 'rejected').length;
  const totalCases = cases.length;
  const totalAppointments = appointments.length;

  const statsData = [
    { icon: 'briefcase', label: 'Active Cases', value: activeCases.toString(), color: PRIMARY_BROWN },
    { icon: 'folder-open', label: 'Total Cases', value: totalCases.toString(), color: PRIMARY_GOLD },
    { icon: 'calendar', label: 'Appointments', value: totalAppointments.toString(), color: MUTED_OLIVE },
    { icon: 'notifications', label: 'Notifications', value: unreadCount.toString(), color: ACCENT_TAN },
  ];

  const quickActions = [
    { icon: 'calendar-outline', title: 'Schedule Appointment', desc: 'Book a legal consultation', path: '/user/appointment' },
    { icon: 'search-outline', title: 'Track Appointment', desc: 'Monitor your appointments', path: '/user/track' },
    { icon: 'folder-outline', title: 'Track Cases', desc: 'View accepted cases', path: '/user/trackCase' },
    { icon: 'chatbubbles-outline', title: 'Chat', desc: 'Message your attorney', path: '/user/chat' },
    { icon: 'person-outline', title: 'Profile', desc: 'Manage your account', path: '/user/profile' },
  ];

  // Case progress
  const caseProgress = (() => {
    if (cases.length === 0) return 0;
    if (cases.some(c => c.status === 'completed')) return 4;
    if (cases.some(c => c.status === 'in_progress')) return 3;
    if (cases.some(c => c.status === 'attorney_assigned')) return 3;
    if (cases.some(c => c.status === 'in_review')) return 2;
    return 1;
  })();
  const progressSteps = ['Submitted', 'Under Review', 'Finalized', 'Case Active'];

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Image source={require('../../assets/images/logo.png')} style={s.logo} />
          <Text style={s.appName}>JustReach</Text>
        </View>
        <View style={s.headerRight}>
          <TouchableOpacity style={s.headerBtn} onPress={() => router.push('/user/notifications')}>
            <Ionicons name="notifications-outline" size={22} color={CHARCOAL} />
            {unreadCount > 0 && (
              <View style={s.badge}><Text style={s.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text></View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={s.headerBtn} onPress={confirmLogout} disabled={isLoading}>
            <Ionicons name="log-out-outline" size={22} color={CHARCOAL} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[PRIMARY_BROWN]} tintColor={PRIMARY_BROWN} />}
      >
        {/* Welcome */}
        <View style={s.welcome}>
          <View>
            <Text style={s.welcomeText}>Welcome back,</Text>
            <Text style={s.nameText}>{userData?.firstName || user?.displayName || 'User'}</Text>
          </View>
          <Text style={s.dateText}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={PRIMARY_BROWN} style={{ marginVertical: 30 }} />
        ) : (
          <>
            {/* Stats */}
            <View style={s.statsGrid}>
              {statsData.map((stat, i) => (
                <View key={i} style={[s.statCard, { borderLeftColor: stat.color }]}>
                  <Ionicons name={stat.icon} size={24} color={stat.color} />
                  <Text style={s.statValue}>{stat.value}</Text>
                  <Text style={s.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>

            {/* Case Progress */}
            {cases.length > 0 && (
              <View style={s.section}>
                <Text style={s.sectionTitle}>Case Progress</Text>
                <View style={s.progressContainer}>
                  {progressSteps.map((step, i) => (
                    <View key={i} style={s.progressStep}>
                      <View style={[s.progressDot, i < caseProgress && s.progressDotActive]} />
                      <Text style={[s.progressLabel, i < caseProgress && s.progressLabelActive]}>{step}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Quick Actions */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>Quick Actions</Text>
              <View style={s.actionsGrid}>
                {quickActions.map((action, i) => (
                  <TouchableOpacity key={i} style={s.actionCard} onPress={() => router.push(action.path)}>
                    <View style={[s.actionIcon, { backgroundColor: `${PRIMARY_BROWN}15` }]}>
                      <Ionicons name={action.icon} size={22} color={PRIMARY_BROWN} />
                    </View>
                    <Text style={s.actionTitle}>{action.title}</Text>
                    <Text style={s.actionDesc}>{action.desc}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Recent Activity */}
            <View style={s.section}>
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>Recent Activity</Text>
                <TouchableOpacity onPress={() => router.push('/user/track')}>
                  <Text style={s.viewAll}>View All</Text>
                </TouchableOpacity>
              </View>
              {cases.length > 0 ? (
                cases.slice(0, 5).map((c, i) => (
                  <View key={i} style={s.activityItem}>
                    <View style={s.activityDot} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.activityTitle}>{c.caseTitle || c.caseNature || 'Case'}</Text>
                      <Text style={s.activitySub}>
                        {(c.status || 'pending').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Text>
                    </View>
                    <Text style={s.activityDate}>{new Date(c.updatedAt || c.createdAt).toLocaleDateString()}</Text>
                  </View>
                ))
              ) : (
                <View style={s.empty}>
                  <Ionicons name="folder-open-outline" size={48} color="#ccc" />
                  <Text style={s.emptyText}>No cases yet</Text>
                  <Text style={s.emptySubtext}>Schedule an appointment to get started</Text>
                </View>
              )}
            </View>
          </>
        )}
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerBtn: { padding: 8, position: 'relative' },
  logo: { width: 32, height: 32, borderRadius: 8 },
  appName: { fontSize: 18, fontWeight: '700', color: PRIMARY_BROWN, marginLeft: 8 },
  badge: { position: 'absolute', top: 2, right: 2, backgroundColor: '#ef4444', borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  welcome: { padding: 20, backgroundColor: '#fff', marginBottom: 8 },
  welcomeText: { fontSize: 14, color: MUTED_OLIVE },
  nameText: { fontSize: 22, fontWeight: '700', color: CHARCOAL, marginTop: 2 },
  dateText: { fontSize: 12, color: MUTED_OLIVE, marginTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8, marginBottom: 8 },
  statCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, width: '48%', flexGrow: 1, borderLeftWidth: 4, alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: '700', color: CHARCOAL, marginTop: 8 },
  statLabel: { fontSize: 12, color: MUTED_OLIVE, marginTop: 2 },
  section: { backgroundColor: '#fff', marginHorizontal: 12, marginBottom: 8, borderRadius: 12, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: CHARCOAL, marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  viewAll: { fontSize: 13, color: PRIMARY_BROWN, fontWeight: '600' },
  progressContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  progressStep: { alignItems: 'center', flex: 1 },
  progressDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#ddd', marginBottom: 6 },
  progressDotActive: { backgroundColor: PRIMARY_BROWN },
  progressLabel: { fontSize: 10, color: '#aaa', textAlign: 'center' },
  progressLabelActive: { color: PRIMARY_BROWN, fontWeight: '600' },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionCard: { backgroundColor: '#f9f9f9', borderRadius: 10, padding: 14, width: '47%', flexGrow: 1 },
  actionIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  actionTitle: { fontSize: 13, fontWeight: '600', color: CHARCOAL },
  actionDesc: { fontSize: 11, color: MUTED_OLIVE, marginTop: 2 },
  activityItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  activityDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: PRIMARY_BROWN, marginRight: 12 },
  activityTitle: { fontSize: 14, fontWeight: '500', color: CHARCOAL },
  activitySub: { fontSize: 12, color: MUTED_OLIVE, marginTop: 2 },
  activityDate: { fontSize: 11, color: '#aaa' },
  empty: { alignItems: 'center', paddingVertical: 30 },
  emptyText: { fontSize: 16, fontWeight: '500', color: '#aaa', marginTop: 12 },
  emptySubtext: { fontSize: 13, color: '#ccc', marginTop: 4 },
});
