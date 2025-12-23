import React from 'react';
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
import { useAuth } from 'context/authContext';
import { useAdminDashboard } from '../../hooks/admin/useAdminDashboard';

const AdminDashboard = () => {
  const router = useRouter();
  const { logout } = useAuth();
  const { stats, loading, refreshStats } = useAdminDashboard();

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

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.nameText}>Administrator</Text>
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
                    !feature.route && styles.featureCardDisabled,
                  ]}
                  onPress={() => feature.route && router.push(feature.route)}
                  disabled={!feature.route}
                  activeOpacity={feature.route ? 0.7 : 1}
                >
                  <View style={[styles.iconContainer, { backgroundColor: feature.color }]}>
                    <Ionicons name={feature.icon} size={28} color="#FFFFFF" />
                  </View>
                  <Text style={styles.featureCount}>{feature.count}</Text>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  {feature.route && (
                    <View style={styles.clickableIndicator}>
                      <Ionicons name="arrow-forward" size={16} color={feature.color} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Quick Actions */}
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
              onPress={() => router.push('/admin/users')}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="people-outline" size={24} color="#8B6F47" />
              </View>
              <Text style={styles.actionButtonText}>Manage Users</Text>
              <Text style={styles.actionDescription}>View and manage users</Text>
            </TouchableOpacity>
          </View>
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
    paddingTop: 50,
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
    marginBottom: 20,
    letterSpacing: -0.3,
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
  featureCardDisabled: {
    opacity: 0.9,
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
  rotating: {
    transform: [{ rotate: '180deg' }],
  },
});

export default AdminDashboard;
