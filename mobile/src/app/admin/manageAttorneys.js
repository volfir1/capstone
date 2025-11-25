import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import apiClient from '../../api/apiClient';

const ManageAttorneys = () => {
  const router = useRouter();
  const [attorneys, setAttorneys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activating, setActivating] = useState(null);

  React.useEffect(() => {
    fetchAttorneys();
  }, []);

  const fetchAttorneys = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/auth/all-attorneys');
      
      if (response.data.success) {
        setAttorneys(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching attorneys:', error);
      Alert.alert('Error', 'Failed to load attorneys');
    } finally {
      setLoading(false);
    }
  };

  const handleActivateAccount = async (attorneyId) => {
    try {
      setActivating(attorneyId);
      const response = await apiClient.put(`/auth/activate-attorney/${attorneyId}`);
      
      if (response.data.success) {
        Alert.alert('Success', 'Attorney account activated successfully');
        // Refresh the list
        fetchAttorneys();
      }
    } catch (error) {
      console.error('Error activating attorney:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to activate account');
    } finally {
      setActivating(null);
    }
  };

  const confirmActivation = (attorney) => {
    Alert.alert(
      'Activate Attorney Account',
      `Are you sure you want to activate ${attorney.firstName} ${attorney.lastName}'s account?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Activate',
          onPress: () => handleActivateAccount(attorney._id),
        },
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return '#4CAF50';
      case 'pending':
        return '#FF9800';
      case 'suspended':
        return '#F44336';
      default:
        return '#999';
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case 'active':
        return '#E8F5E9';
      case 'pending':
        return '#FFF3E0';
      case 'suspended':
        return '#FFEBEE';
      default:
        return '#F5F5F5';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#2D2D2D" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Attorneys</Text>
        <TouchableOpacity onPress={fetchAttorneys} disabled={loading}>
          <Ionicons name="refresh" size={24} color="#8B6F47" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B6F47" />
          <Text style={styles.loadingText}>Loading attorneys...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {attorneys.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="briefcase-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No attorneys found</Text>
            </View>
          ) : (
            attorneys.map((attorney) => (
              <View key={attorney._id} style={styles.attorneyCard}>
                <View style={styles.attorneyHeader}>
                  <View style={styles.attorneyAvatar}>
                    <Ionicons name="person" size={28} color="#8B6F47" />
                  </View>
                  <View style={styles.attorneyInfo}>
                    <Text style={styles.attorneyName}>
                      {attorney.firstName} {attorney.lastName}
                    </Text>
                    <Text style={styles.attorneyEmail}>{attorney.email}</Text>
                    <Text style={styles.attorneyRole}>{attorney.role}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusBg(attorney.accountStatus) },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(attorney.accountStatus) },
                      ]}
                    >
                      {attorney.accountStatus}
                    </Text>
                  </View>
                </View>

                <View style={styles.attorneyDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="card-outline" size={16} color="#666" />
                    <Text style={styles.detailText}>PRC: {attorney.prcLicenseNumber}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="document-outline" size={16} color="#666" />
                    <Text style={styles.detailText}>IBR: {attorney.ibrNumber}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="call-outline" size={16} color="#666" />
                    <Text style={styles.detailText}>{attorney.phoneNumber}</Text>
                  </View>
                  {attorney.specializations && attorney.specializations.length > 0 && (
                    <View style={styles.detailRow}>
                      <Ionicons name="briefcase-outline" size={16} color="#666" />
                      <Text style={styles.detailText}>
                        {attorney.specializations.join(', ')}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.verificationInfo}>
                  <View style={styles.verificationRow}>
                    <Text style={styles.verificationLabel}>Email Verified:</Text>
                    <Ionicons
                      name={attorney.isVerified ? 'checkmark-circle' : 'close-circle'}
                      size={20}
                      color={attorney.isVerified ? '#4CAF50' : '#F44336'}
                    />
                  </View>
                  <View style={styles.verificationRow}>
                    <Text style={styles.verificationLabel}>Bar Member:</Text>
                    <Ionicons
                      name={attorney.isBarMemberActive ? 'checkmark-circle' : 'close-circle'}
                      size={20}
                      color={attorney.isBarMemberActive ? '#4CAF50' : '#F44336'}
                    />
                  </View>
                </View>

                {attorney.accountStatus === 'pending' && (
                  <TouchableOpacity
                    style={[
                      styles.activateButton,
                      activating === attorney._id && styles.activateButtonDisabled,
                    ]}
                    onPress={() => confirmActivation(attorney)}
                    disabled={activating === attorney._id}
                  >
                    {activating === attorney._id ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                        <Text style={styles.activateButtonText}>Activate Account</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

                {attorney.accountStatus === 'active' && (
                  <View style={styles.activeIndicator}>
                    <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                    <Text style={styles.activeText}>Account Active</Text>
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0EDE3',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D2D2D',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
  },
  attorneyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  attorneyHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  attorneyAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F5EFE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#E8DCC8',
  },
  attorneyInfo: {
    flex: 1,
  },
  attorneyName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D2D2D',
    marginBottom: 4,
  },
  attorneyEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  attorneyRole: {
    fontSize: 12,
    color: '#8B6F47',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  attorneyDetails: {
    borderTopWidth: 1,
    borderTopColor: '#F0EDE3',
    paddingTop: 12,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  verificationInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#F0EDE3',
    paddingTop: 12,
    marginBottom: 12,
  },
  verificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  verificationLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  activateButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  activateButtonDisabled: {
    backgroundColor: '#ccc',
  },
  activateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  activeIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
  },
  activeText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ManageAttorneys;
