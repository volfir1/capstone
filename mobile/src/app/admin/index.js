import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, RefreshControl, Image, Modal, Animated, Pressable,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuth } from 'context/authContext';
import apiClient from '../../api/apiClient';
import { fetchDashboardStats, fetchReviews, fetchFinalizedCases, fetchActivityLogs, fetchUsers } from '../../api/adminApi';
import { PRIMARY_BROWN, PRIMARY_GOLD, CHARCOAL, MUTED_OLIVE, ACCENT_TAN, CATEGORY_COLORS, ROLE_DISPLAY } from 'utils/constants';
import Svg, { Path, Circle as SvgCircle, G } from 'react-native-svg';
import { useNotifications } from '../../hooks/useNotifications';

const REVIEW_STAGES = [
  { key: 'all', label: 'All' },
  { key: 'supervising_lawyer', label: 'Supervising' },
  { key: 'director', label: 'Director' },
  { key: 'returned', label: 'Returned' },
];

// Donut chart component
function DonutChart({ data, size = 120, thickness = 20, label }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) {
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: thickness, borderColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: CHARCOAL }}>0</Text>
        </View>
      </View>
    );
  }
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  let cumulativePercent = 0;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${center}, ${center}`}>
          {data.map((item, index) => {
            const percent = item.value / total;
            const strokeDasharray = `${circumference * percent} ${circumference * (1 - percent)}`;
            const strokeDashoffset = -circumference * cumulativePercent;
            cumulativePercent += percent;
            return (
              <SvgCircle
                key={index}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={item.color}
                strokeWidth={thickness}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
              />
            );
          })}
        </G>
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: CHARCOAL }}>{total}</Text>
        {label && <Text style={{ fontSize: 9, color: MUTED_OLIVE }}>{label}</Text>}
      </View>
    </View>
  );
}

// Notification type config (matching website)
const NOTIF_TYPE_CONFIG = {
  case_assigned:       { icon: 'briefcase',         color: '#3B82F6' },
  new_case:            { icon: 'briefcase-outline',  color: '#8B5CF6' },
  appointment_created: { icon: 'calendar',           color: '#10B981' },
  appointment_updated: { icon: 'calendar-outline',   color: '#F59E0B' },
  case_accepted:       { icon: 'checkmark-circle',   color: '#10B981' },
  case_rejected:       { icon: 'alert-circle',       color: '#EF4444' },
  review_pending:      { icon: 'checkbox',           color: '#F97316' },
  review_returned:     { icon: 'alert-circle',       color: '#EF4444' },
  review_resubmitted:  { icon: 'checkbox-outline',   color: '#3B82F6' },
  account_verified:    { icon: 'shield-checkmark',   color: '#10B981' },
  general:             { icon: 'notifications',      color: ACCENT_TAN },
};

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (seconds < 60) return 'Just now';
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

// In-app toast notification banner
function InAppToast({ notification, onPress, onDismiss }) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-120)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (notification) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
      const timer = setTimeout(() => dismiss(), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: -120, duration: 200, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onDismiss?.());
  };

  if (!notification) return null;
  const config = NOTIF_TYPE_CONFIG[notification.type] || NOTIF_TYPE_CONFIG.general;

  return (
    <Animated.View style={{
      position: 'absolute', top: insets.top + 4, left: 12, right: 12, zIndex: 999,
      transform: [{ translateY: slideAnim }], opacity: opacityAnim,
    }}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => { dismiss(); onPress?.(notification); }}
        style={{
          backgroundColor: '#fff', borderRadius: 14, padding: 14,
          flexDirection: 'row', alignItems: 'center', gap: 12,
          shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15, shadowRadius: 12, elevation: 8,
          borderLeftWidth: 4, borderLeftColor: config.color,
        }}
      >
        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${config.color}15`, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name={config.icon} size={18} color={config.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: CHARCOAL }} numberOfLines={1}>{notification.title}</Text>
          <Text style={{ fontSize: 11, color: MUTED_OLIVE, marginTop: 2 }} numberOfLines={2}>{notification.message}</Text>
        </View>
        <TouchableOpacity onPress={(e) => { e.stopPropagation?.(); dismiss(); }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="close" size={18} color="#ccc" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const navigation = useNavigation();
  const { logout, userData, clearSelectedProfile } = useAuth();
  const isIntern = userData?.role === 'intern' || userData?.role === 'secretary';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalCases: 0, totalUsers: 0, pendingReviews: 0, totalFinalized: 0,
    totalAttorneys: 0, unassignedCases: 0,
    serviceBreakdown: {}, reviewBreakdown: {}, finalizeBreakdown: {}, roleBreakdown: {},
    totalReviews: 0,
  });
  const [reviews, setReviews] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [reviewStage, setReviewStage] = useState('all');
  const [notifModalVisible, setNotifModalVisible] = useState(false);
  const [accountMenuVisible, setAccountMenuVisible] = useState(false);
  const [inAppToast, setInAppToast] = useState(null);
  const prevUnreadRef = useRef(null);

  const {
    notifications: notifList,
    unreadCount,
    loading: notifLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification: deleteNotif,
    clearAllNotifications: clearAllNotifs,
    refresh: refreshNotifs,
  } = useNotifications();

  const loadData = useCallback(async () => {
    try {
      const [statsRes, reviewsRes, logsRes] = await Promise.all([
        fetchDashboardStats().catch(() => ({})),
        fetchReviews().catch(() => []),
        fetchActivityLogs().catch(() => []),
      ]);

      // Stats - the API returns { success, data: { ... } }
      const s = statsRes?.data || statsRes || {};
      setStats({
        totalCases: s.totalCases || 0,
        totalUsers: s.totalUsers || 0,
        pendingReviews: s.pendingReviews || 0,
        totalFinalized: s.totalFinalized || 0,
        totalAttorneys: s.totalAttorneys || 0,
        unassignedCases: s.unassignedCases || 0,
        serviceBreakdown: s.serviceBreakdown || {},
        reviewBreakdown: s.reviewBreakdown || {},
        finalizeBreakdown: s.finalizeBreakdown || {},
        roleBreakdown: s.roleBreakdown || {},
        totalReviews: s.totalReviews || 0,
      });

      // Reviews
      const reviewsData = Array.isArray(reviewsRes) ? reviewsRes : reviewsRes?.data || [];
      setReviews(isIntern && userData?._id
        ? reviewsData.filter(r => r.reviewerId === userData._id).slice(0, 10)
        : reviewsData.slice(0, 10)
      );

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

  // In-app toast: show when new notifications arrive
  useEffect(() => {
    if (prevUnreadRef.current !== null && unreadCount > prevUnreadRef.current && notifList.length > 0) {
      const newest = notifList[0];
      if (newest && !newest.read) {
        setInAppToast(newest);
      }
    }
    prevUnreadRef.current = unreadCount;
  }, [unreadCount, notifList]);

  const handleNotifNavigation = (notification) => {
    if (!notification) return;
    if (!notification.read) markAsRead(notification._id);
    setNotifModalVisible(false);
    const { type, referenceId } = notification;
    if (type === 'case_assigned') {
      router.push('/admin/assigned-cases');
    } else if (type === 'appointment_created' || type === 'appointment_updated') {
      router.push('/admin/clientformstatus');
    } else if ((type === 'review_pending' || type === 'review_returned' || type === 'review_resubmitted') && referenceId) {
      router.push(`/admin/recommendation?caseId=${referenceId}`);
    } else if (referenceId) {
      router.push(`/admin/recommendation?caseId=${referenceId}`);
    }
  };

  // Auto-select review tab based on role (matching web)
  useEffect(() => {
    if (userData) {
      if (userData.role === 'director') setReviewStage('director');
      else if (userData.role === 'supervising_lawyer') setReviewStage('supervising_lawyer');
      else if (userData.role === 'intern' || userData.role === 'secretary') setReviewStage('returned');
    }
  }, [userData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    setAccountMenuVisible(false);
    try {
      await logout();
      router.replace('/');
    } catch (e) {
      console.error(e);
    }
  };

  const handleSwitchProfile = async () => {
    setAccountMenuVisible(false);

    try {
      await clearSelectedProfile();
      router.replace('/auth/profiles');
    } catch (error) {
      console.error('Failed to switch profile:', error);
    }
  };

  // Filter reviews by stage
  const filteredReviews = reviewStage === 'all' ? reviews :
    reviewStage === 'returned' ? reviews.filter(r => r.reviewStage === 'returned_to_intern' || r.status === 'returned') :
    reviews.filter(r => r.reviewStage === reviewStage || r.currentStage === reviewStage || r.reviewerRole === reviewStage);

  // Donut chart data (matching web Dashboard)
  const serviceData = [
    { name: 'Legal Advice', value: stats.serviceBreakdown?.legalAdvice || 0, color: '#4DABF7' },
    { name: 'Legal Drafting', value: stats.serviceBreakdown?.legalDrafting || 0, color: PRIMARY_GOLD },
    { name: 'With Record', value: stats.serviceBreakdown?.courtWithRecord || 0, color: '#40C057' },
    { name: 'Without Record', value: stats.serviceBreakdown?.courtWithoutRecord || 0, color: '#FCC419' },
  ].filter(d => d.value > 0);

  const reviewStageData = [
    { name: 'Supervising', value: stats.reviewBreakdown?.supervising_lawyer || 0, color: '#F59F00' },
    { name: 'Director', value: stats.reviewBreakdown?.director || 0, color: '#7950F2' },
    { name: 'Completed', value: stats.reviewBreakdown?.completed || 0, color: '#40C057' },
    { name: 'Returned', value: stats.reviewBreakdown?.returned_to_intern || 0, color: '#FA5252' },
  ].filter(d => d.value > 0);

  const finalizeData = [
    { name: 'Accepted', value: stats.finalizeBreakdown?.accepted || 0, color: '#40C057' },
    { name: 'Rejected', value: stats.finalizeBreakdown?.rejected || 0, color: '#FA5252' },
    { name: 'Pending', value: stats.finalizeBreakdown?.pending || 0, color: '#FCC419' },
  ].filter(d => d.value > 0);

  const userRoleData = [
    { name: 'Clients', value: stats.roleBreakdown?.user || 0, color: PRIMARY_GOLD },
    { name: 'Interns', value: stats.roleBreakdown?.intern || 0, color: '#4DABF7' },
    { name: 'Sup. Lawyers', value: stats.roleBreakdown?.supervising_lawyer || 0, color: MUTED_OLIVE },
    { name: 'Directors', value: stats.roleBreakdown?.director || 0, color: '#7950F2' },
    { name: 'Secretaries', value: stats.roleBreakdown?.secretary || 0, color: ACCENT_TAN },
  ].filter(d => d.value > 0);

  const donutCharts = [
    { title: 'Legal Services', data: serviceData },
    { title: 'Review Pipeline', data: reviewStageData },
    { title: 'Finalized Decisions', data: finalizeData },
    { title: 'Users by Role', data: userRoleData },
  ];

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
          <TouchableOpacity
            style={s.menuBtn}
            onPress={() => navigation.openDrawer?.()}
            accessibilityRole="button"
            accessibilityLabel="Open sidebar navigation"
          >
            <Ionicons name="menu-outline" size={22} color={CHARCOAL} />
          </TouchableOpacity>
          <Image source={require('../../assets/images/logo.png')} style={s.logo} />
          <Text style={s.appName}>JustReach Admin</Text>
        </View>
        <View style={s.headerActions}>
          <TouchableOpacity
            style={s.headerIconBtn}
            onPress={() => { setNotifModalVisible(true); refreshNotifs(); }}
          >
            <Ionicons name="notifications-outline" size={22} color={CHARCOAL} />
            {unreadCount > 0 && (
              <View style={s.notifBadge}>
                <Text style={s.notifBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={s.headerIconBtn} onPress={() => setAccountMenuVisible((current) => !current)}>
            <View style={s.accountTriggerInner}>
              <Ionicons name="person-circle-outline" size={20} color={CHARCOAL} />
              <Ionicons name={accountMenuVisible ? 'chevron-up' : 'chevron-down'} size={14} color={MUTED_OLIVE} />
            </View>
          </TouchableOpacity>

          {accountMenuVisible && (
            <View style={s.accountMenu}>
              <TouchableOpacity style={s.accountMenuItem} onPress={handleSwitchProfile}>
                <Ionicons name="swap-horizontal-outline" size={18} color={CHARCOAL} />
                <Text style={s.accountMenuItemText}>Switch Profile</Text>
              </TouchableOpacity>
              <View style={s.accountMenuDivider} />
              <TouchableOpacity style={s.accountMenuItem} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={18} color="#B42318" />
                <Text style={[s.accountMenuItemText, s.accountMenuItemDanger]}>Log Out</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {accountMenuVisible && (
        <Pressable style={s.accountMenuBackdrop} onPress={() => setAccountMenuVisible(false)} />
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[PRIMARY_BROWN]} />}
      >
        {/* Welcome */}
        <View style={s.welcomeSection}>
          <Text style={s.welcomeLabel}>Welcome back,</Text>
          <Text style={s.welcomeName}>{isIntern ? 'Intern' : (userData?.firstName || 'Administrator')}</Text>
        </View>

        {/* Donut Charts (matching web dashboard) */}
        <View style={s.chartsGrid}>
          {donutCharts.map(chart => (
            <View key={chart.title} style={s.chartCard}>
              <Text style={s.chartTitle}>{chart.title}</Text>
              <View style={s.chartContent}>
                <DonutChart data={chart.data} size={100} thickness={16} />
                <View style={s.chartLegend}>
                  {chart.title === 'Legal Services' ? (
                    <>
                      {chart.data.filter(d => d.name !== 'With Record' && d.name !== 'Without Record').map(d => (
                        <View key={d.name} style={s.legendItem}>
                          <View style={[s.legendDot, { backgroundColor: d.color }]} />
                          <Text style={s.legendText} numberOfLines={1}>{d.name}: {d.value}</Text>
                        </View>
                      ))}
                      {chart.data.some(d => d.name === 'With Record' || d.name === 'Without Record') && (
                        <>
                          <Text style={s.legendSubheading}>Court Representation:</Text>
                          {chart.data.filter(d => d.name === 'With Record' || d.name === 'Without Record').map(d => (
                            <View key={d.name} style={[s.legendItem, { marginLeft: 8 }]}>
                              <View style={[s.legendDot, { backgroundColor: d.color }]} />
                              <Text style={s.legendText} numberOfLines={1}>{d.name}: {d.value}</Text>
                            </View>
                          ))}
                        </>
                      )}
                    </>
                  ) : (
                    chart.data.map(d => (
                      <View key={d.name} style={s.legendItem}>
                        <View style={[s.legendDot, { backgroundColor: d.color }]} />
                        <Text style={s.legendText} numberOfLines={1}>{d.name}: {d.value}</Text>
                      </View>
                    ))
                  )}
                </View>
              </View>
            </View>
          ))}
        </View>

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
                  router.push(`/admin/recommendation?caseId=${review.caseId || ''}&reviewId=${review._id || ''}`);
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

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Notification Modal */}
      <Modal visible={notifModalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F7F8FA' }}>
          {/* Header */}
          <View style={s.notifHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: CHARCOAL }}>Notifications</Text>
              {unreadCount > 0 && (
                <View style={{ backgroundColor: PRIMARY_BROWN, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 }}>
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{unreadCount}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={() => setNotifModalVisible(false)}>
              <Ionicons name="close" size={24} color={CHARCOAL} />
            </TouchableOpacity>
          </View>

          {/* Actions */}
          {notifList.length > 0 && (
            <View style={s.notifActions}>
              {unreadCount > 0 && (
                <TouchableOpacity onPress={markAllAsRead} style={s.notifActionBtn}>
                  <Ionicons name="checkmark-done" size={14} color={PRIMARY_BROWN} />
                  <Text style={[s.notifActionText, { color: PRIMARY_BROWN }]}>Mark all read</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={async () => { await clearAllNotifs(); }} style={s.notifActionBtn}>
                <Ionicons name="trash-outline" size={14} color="#EF4444" />
                <Text style={[s.notifActionText, { color: '#EF4444' }]}>Clear all</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* List */}
          <ScrollView style={{ flex: 1 }}>
            {notifLoading && notifList.length === 0 ? (
              <ActivityIndicator size="large" color={PRIMARY_BROWN} style={{ marginTop: 40 }} />
            ) : notifList.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 60 }}>
                <Ionicons name="notifications-off-outline" size={48} color="#ddd" />
                <Text style={{ color: MUTED_OLIVE, marginTop: 12, fontSize: 14 }}>No notifications yet</Text>
              </View>
            ) : (
              notifList.map(notif => {
                const config = NOTIF_TYPE_CONFIG[notif.type] || NOTIF_TYPE_CONFIG.general;
                return (
                  <TouchableOpacity
                    key={notif._id}
                    style={[s.notifItem, !notif.read && { backgroundColor: '#FDFAF5', borderLeftWidth: 3, borderLeftColor: config.color }]}
                    onPress={() => handleNotifNavigation(notif)}
                    activeOpacity={0.7}
                  >
                    <View style={[s.notifIcon, { backgroundColor: `${config.color}15` }]}>
                      <Ionicons name={config.icon} size={16} color={config.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={[s.notifTitle, !notif.read && { fontWeight: '700' }]} numberOfLines={1}>{notif.title}</Text>
                        <TouchableOpacity onPress={() => deleteNotif(notif._id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                          <Ionicons name="close" size={16} color="#ccc" />
                        </TouchableOpacity>
                      </View>
                      <Text style={s.notifMessage} numberOfLines={2}>{notif.message}</Text>
                      <Text style={s.notifTime}>{timeAgo(notif.createdAt)}</Text>
                    </View>
                    {!notif.read && <View style={[s.unreadDot, { backgroundColor: config.color }]} />}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* In-App Toast */}
      <InAppToast
        notification={inAppToast}
        onPress={handleNotifNavigation}
        onDismiss={() => setInAppToast(null)}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    zIndex: 20,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center' },
  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  logo: { width: 36, height: 36, borderRadius: 10, resizeMode: 'contain' },
  appName: { fontSize: 20, fontWeight: '700', color: PRIMARY_BROWN, marginLeft: 10 },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    position: 'relative',
    zIndex: 30,
  },
  headerIconBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  accountTriggerInner: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  accountMenuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  accountMenu: {
    position: 'absolute',
    top: 48,
    right: 0,
    width: 188,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ECE6DB',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    zIndex: 40,
    overflow: 'hidden',
  },
  accountMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  accountMenuItemText: {
    fontSize: 13,
    color: CHARCOAL,
    fontWeight: '600',
  },
  accountMenuItemDanger: {
    color: '#B42318',
  },
  accountMenuDivider: {
    height: 1,
    backgroundColor: '#F0ECE4',
  },
  notifBadge: { position: 'absolute', top: 4, right: 4, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  notifBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  logoutBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' },
  welcomeSection: { paddingHorizontal: 16, paddingVertical: 16 },
  welcomeLabel: { fontSize: 14, color: MUTED_OLIVE },
  welcomeName: { fontSize: 22, fontWeight: '700', color: CHARCOAL },

  section: { backgroundColor: '#fff', marginHorizontal: 12, marginTop: 10, borderRadius: 12, padding: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: CHARCOAL, marginBottom: 12 },
  // Donut charts
  chartsGrid: { paddingHorizontal: 12, marginTop: 10 },
  chartCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10 },
  chartTitle: { fontSize: 11, fontWeight: '600', color: MUTED_OLIVE, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  chartContent: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  chartLegend: { flex: 1, gap: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 2 },
  legendText: { fontSize: 12, color: CHARCOAL, fontWeight: '500' },
  legendSubheading: { fontSize: 11, fontWeight: '700', color: CHARCOAL, marginTop: 4 },
  // Case reviews
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
  // Notification panel
  notifHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  notifActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  notifActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  notifActionText: { fontSize: 12, fontWeight: '600' },
  notifItem: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', gap: 12 },
  notifIcon: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  notifTitle: { fontSize: 13, fontWeight: '500', color: CHARCOAL, flex: 1, marginRight: 8 },
  notifMessage: { fontSize: 12, color: MUTED_OLIVE, lineHeight: 17, marginTop: 2 },
  notifTime: { fontSize: 10, color: '#B0B0B0', marginTop: 4 },
  unreadDot: { position: 'absolute', top: 14, right: 40, width: 7, height: 7, borderRadius: 4 },
});
