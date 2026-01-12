import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from 'context/authContext';
import { useAdminDashboard } from '../../hooks/admin/useAdminDashboard';
import apiClient from '../../api/apiClient';

const AdminDashboard = () => {
  const router = useRouter();
  const { logout, userData } = useAuth();
  const isIntern = userData?.role === 'intern';
  const { stats, loading, refreshStats } = useAdminDashboard();
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [finalized, setFinalized] = useState([]);
  const [loadingFinalized, setLoadingFinalized] = useState(false);
  const [caseRecordsMap, setCaseRecordsMap] = useState({});

  useEffect(() => {
    fetchReviews();
    fetchFinalized();
  }, []);

  // Refresh whenever this screen regains focus (e.g., after finalize/back)
  useFocusEffect(
    React.useCallback(() => {
      fetchReviews();
      fetchFinalized();
    }, [])
  );

  const fetchReviews = async () => {
    try {
      setLoadingReviews(true);
      // Interns should see their own submissions; other roles see latest 5 overall
      const query = isIntern && userData?._id ? `?reviewerId=${encodeURIComponent(userData._id)}` : '';
      const resp = await apiClient.get(`/reviews${query}`);
      const data = resp.data?.data ?? resp.data ?? [];
      const reviewsArray = Array.isArray(data) ? data : [];
      
      // Fetch user details for reviewer names
      const reviewsWithNames = await Promise.all(
        reviewsArray.map(async (review) => {
          if (review.reviewerId) {
            try {
              const userResp = await apiClient.get(`/users/${review.reviewerId}`);
              const user = userResp.data?.data ?? userResp.data;
              const reviewerName = user?.displayName || user?.fullName || user?.username || review.reviewerRole || 'Staff';
              return { ...review, reviewerName };
            } catch (err) {
              return { ...review, reviewerName: review.reviewerRole || 'Staff' };
            }
          }
          return { ...review, reviewerName: review.reviewerRole || 'Staff' };
        })
      );
      
      setReviews(reviewsWithNames.slice(0, 5)); // Show only 5 most recent (or all intern submissions)
    } catch (err) {
      console.error('Error fetching reviews', err);
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  const fetchFinalized = async () => {
    try {
      setLoadingFinalized(true);
      const resp = await apiClient.get('/finalize');
      const data = resp.data?.data ?? resp.data ?? [];
      const finalizedArray = Array.isArray(data) ? data : [];

      // Detect accepted cases that already have case records
      const accepted = finalizedArray.filter(f => f.decision === 'accepted');
      const recordsMap = {};

      await Promise.all(
        accepted.map(async (caseData) => {
          const key = caseData._id || caseData.id;
          if (!key) return;
          try {
            const caseRecordResp = await apiClient.get(`/caserecords/finalize/${key}`);
            recordsMap[key] = !!caseRecordResp.data;
          } catch (err) {
            recordsMap[key] = false;
          }
        })
      );

      setCaseRecordsMap(recordsMap);
      setFinalized(finalizedArray.slice(0, 5)); // Show only 5 most recent
    } catch (err) {
      console.error('Error fetching finalized records', err);
      setFinalized([]);
      setCaseRecordsMap({});
    } finally {
      setLoadingFinalized(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const features = [
    {
      id: 'cases',
      title: 'Total Cases',
      count: stats.totalCases,
      icon: 'documents-outline',
      color: '#8B6F47',
      bgColor: '#F5EFE7',
      route: null, // Not clickable yet
    },
    {
      id: 'users',
      title: 'Total Users',
      count: stats.totalUsers,
      icon: 'people-outline',
      color: '#6B8E23',
      bgColor: '#F0F8E8',
      route: null, // Not clickable yet
    },
    {
      id: 'attorneys',
      title: 'Total Attorneys',
      count: stats.totalAttorneys,
      icon: 'briefcase-outline',
      color: '#4682B4',
      bgColor: '#E8F4F8',
      route: '/admin/manageAttorneys', // Clickable - goes to manage attorneys
    },
    {
      id: 'unassigned',
      title: 'Unassigned Cases',
      count: stats.unassignedCases,
      icon: 'alert-circle-outline',
      color: '#D2691E',
      bgColor: '#FFF3E6',
      route: '/admin/assignCases', // Clickable - goes to assign cases
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Custom Header */}
      <View style={styles.customHeader}>
        <View style={styles.logoContainer}>
          <View style={styles.logoPlaceholder}>
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.logoImage}
            />
          </View>
          <Text style={styles.appName}>JustReach Admin</Text>
        </View>
        <TouchableOpacity style={styles.headerLogoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#2D2D2D" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.nameText}>{isIntern ? 'Intern' : 'Administrator'}</Text>
          <Text style={styles.subtitle}>Manage your legal services platform</Text>
        </View>

        {/* Dashboard Overview */}
        <View style={styles.content}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Dashboard Overview</Text>
            <TouchableOpacity onPress={refreshStats} disabled={loading}>
              <Ionicons
                name="refresh"
                size={20}
                color="#8B6F47"
                style={loading && styles.rotating}
              />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#8B6F47" />
            </View>
          ) : (
            <View style={styles.statsGrid}>
              {features.map((feature) => (
                <TouchableOpacity
                  key={feature.id}
                  style={[
                    styles.featureCard,
                    { backgroundColor: feature.bgColor },
                  ]}
                  onPress={() => {
                    if (isIntern) return; // interns view-only on stats
                    if (feature.route) {
                      router.push(feature.route);
                    } else if (feature.id === 'cases') {
                      router.push('/admin/finalized');
                    } else if (feature.id === 'users') {
                      router.push('/admin/users');
                    }
                  }}
                  activeOpacity={isIntern ? 1 : 0.7}
                >
                  <View style={[styles.iconContainer, { backgroundColor: feature.color }]}>
                    <Ionicons name={feature.icon} size={28} color="#FFFFFF" />
                  </View>
                  <Text style={styles.featureCount}>{feature.count}</Text>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <View style={styles.clickableIndicator}>
                    <Ionicons name="arrow-forward" size={16} color={feature.color} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Submitted For Review */}
          <Text style={styles.sectionTitle}>Submitted For Review</Text>
          <Text style={styles.sectionSubtitle}>
            {userData?.role === 'intern' 
              ? 'Your submissions awaiting review (view only)'
              : 'Recent submissions from interns'}
          </Text>
          {loadingReviews ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#8B6F47" />
            </View>
          ) : reviews.length > 0 ? (
            <View style={styles.reviewsList}>
              {reviews.map((review) => {
                const submitterName = review.content?.interviewInfo?.clientName || review.clientName || 'Unknown Client';
                const submittedBy = review.reviewerName || 'Staff';
                const caseId = review.caseId || 'new-case';
                return (
                  <TouchableOpacity
                    key={review._id || review.id || review.caseId}
                    style={styles.reviewCard}
                    onPress={() => {
                      const reviewParam = encodeURIComponent(JSON.stringify(review));
                      router.push(`/admin/recommendation?caseId=${caseId}&review=${reviewParam}`);
                    }}
                  >
                    <View style={styles.reviewIconContainer}>
                      <Ionicons name="document-text" size={24} color="#8B6F47" />
                    </View>
                    <View style={styles.reviewContent}>
                      <Text style={styles.reviewClientName}>{submitterName}</Text>
                      <Text style={styles.reviewSubmitter}>Submitted by: {submittedBy} ({review.reviewerRole || 'Intern'})</Text>
                      <View style={styles.reviewBadges}>
                        <View style={styles.reviewBadge}>
                          <Text style={styles.reviewBadgeText}>
                            {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'No Date'}
                          </Text>
                        </View>
                        {caseId && caseId !== 'new-case' && (
                          <View style={[styles.reviewBadge, styles.reviewBadgePrimary]}>
                            <Text style={styles.reviewBadgeTextPrimary}>{caseId}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#8B6F47" />
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <Text style={styles.emptyText}>
              {userData?.role === 'intern' 
                ? 'You have no submissions pending review'
                : 'No reviews pending finalization'}
            </Text>
          )}

          {/* Finalized Records */}
          <Text style={styles.sectionTitle}>Finalized Records</Text>
          <Text style={styles.sectionSubtitle}>Recently finalized case records</Text>
          {loadingFinalized ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#8B6F47" />
            </View>
          ) : finalized.length > 0 ? (
            <View style={styles.finalizedList}>
              {finalized.map((record) => {
                const recordId = record._id || record.id;
                const hasRecord = recordId ? caseRecordsMap[recordId] : false;
                const clientName = record.clientName || record.content?.interviewInfo?.clientName || 'Unknown Client';
                const displayTitle = hasRecord
                  ? (record.caseTitle || record.content?.caseInfo?.caseTitle || record.caseId || clientName)
                  : clientName;

                return (
                <TouchableOpacity
                  key={record._id || record.id || record.caseId}
                  style={styles.finalizedCard}
                  onPress={() => router.push('/admin/recommendation')}
                >
                  <View style={styles.finalizedIconContainer}>
                    <Ionicons name="briefcase" size={24} color="#9BA17B" />
                  </View>
                  <View style={styles.finalizedContent}>
                    <Text style={styles.finalizedTitle}>
                      {displayTitle}
                    </Text>
                    <Text style={styles.finalizedClient}>
                      {record.clientName || record.content?.interviewInfo?.clientName || ''}
                    </Text>
                    <Text style={styles.finalizedMeta}>
                      Finalized: {record.createdAt ? new Date(record.createdAt).toLocaleDateString() : ''} • By: {record.finalizedRole || record.finalizedBy}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9BA17B" />
                </TouchableOpacity>
              );})}
            </View>
          ) : (
            <Text style={styles.emptyText}>No finalized records found</Text>
          )}

          {/* Quick Actions */}
          {!isIntern && (
            <>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => router.push('/admin/assignCases')}
                >
                  <View style={styles.actionIconContainer}>
                    <Ionicons name="person-add-outline" size={24} color="#8B6F47" />
                  </View>
                  <Text style={styles.actionButtonText}>Assign Cases</Text>
                  <Text style={styles.actionDescription}>Assign cases to attorneys</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => router.push('/admin/manageAttorneys')}
                >
                  <View style={styles.actionIconContainer}>
                    <Ionicons name="checkmark-done-outline" size={24} color="#8B6F47" />
                  </View>
                  <Text style={styles.actionButtonText}>Manage Attorneys</Text>
                  <Text style={styles.actionDescription}>Review attorney applications</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => router.push('/admin/recommendation')}
                >
                  <View style={styles.actionIconContainer}>
                    <Ionicons name="star-outline" size={24} color="#8B6F47" />
                  </View>
                  <Text style={styles.actionButtonText}>Recommendations</Text>
                  <Text style={styles.actionDescription}>View case recommendations</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F0',
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#C5A572',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B6F47',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  logoImage: {
    width: 42,
    height: 42,
    borderRadius: 12,
    resizeMode: 'contain',
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#8B6F47',
    marginLeft: 14,
    letterSpacing: -0.5,
  },
  headerLogoutButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F5EFE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  welcomeSection: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 28,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 15,
    color: '#8B6F47',
    marginBottom: 6,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  nameText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2D2D2D',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '400',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2D2D2D',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 32,
  },
  featureCard: {
    width: '48%',
    margin: '1%',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureCount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#2D2D2D',
    marginBottom: 8,
    letterSpacing: -1,
  },
  featureTitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  clickableIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 12,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F5EFE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D2D2D',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 13,
    color: '#666',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
    marginBottom: 20,
  },
  reviewsList: {
    marginBottom: 24,
  },
  reviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FBF7F4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E6D9CC',
  },
  reviewIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#8B6F47',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reviewContent: {
    flex: 1,
  },
  reviewClientName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D2D2D',
    marginBottom: 4,
  },
  reviewSubmitter: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  reviewBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  reviewBadge: {
    backgroundColor: '#E0E0E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  reviewBadgeText: {
    fontSize: 11,
    color: '#666',
  },
  reviewBadgePrimary: {
    backgroundColor: '#C4AB7D',
  },
  reviewBadgeTextPrimary: {
    fontSize: 11,
    color: '#2D2D2D',
    fontWeight: '600',
  },
  finalizedList: {
    marginBottom: 24,
  },
  finalizedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7FBF9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E6D9CC',
  },
  finalizedIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#9BA17B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  finalizedContent: {
    flex: 1,
  },
  finalizedTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D2D2D',
    marginBottom: 2,
  },
  finalizedClient: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  finalizedMeta: {
    fontSize: 11,
    color: '#999',
  },
  rotating: {
    transform: [{ rotate: '180deg' }],
  },
});

export default AdminDashboard;
