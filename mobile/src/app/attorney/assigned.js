import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import apiClient from '../../api/apiClient';

const PRIMARY_BROWN = '#7D5A3B';
const PRIMARY_GOLD = '#C4AB7D';
const MUTED_OLIVE = '#9BA17B';
const CHARCOAL = '#2C2C2C';
const THEMED_LIGHT_BG = '#FAF8F3';

const AssignedCases = () => {
  const router = useRouter();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAssignedCases();
  }, []);

  const fetchAssignedCases = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/cases/attorney-cases');
      if (response.data.success) {
        // Filter only recently assigned or pending cases
        const assignedCases = response.data.data.filter(
          c => c.attorneyId && (c.status === 'pending' || c.status === 'new')
        );
        setCases(assignedCases);
      }
    } catch (error) {
      console.error('Error fetching assigned cases:', error);
      Alert.alert('Error', 'Failed to load assigned cases');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAssignedCases();
  };

  const handleAcceptCase = async (caseId) => {
    Alert.alert(
      'Accept Case',
      'Are you sure you want to accept this case?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              await apiClient.put(`/cases/${caseId}/accept`);
              Alert.alert('Success', 'Case accepted successfully');
              fetchAssignedCases();
            } catch (error) {
              console.error('Error accepting case:', error);
              Alert.alert('Error', 'Failed to accept case');
            }
          },
        },
      ]
    );
  };

  const handleViewCase = (caseItem) => {
    router.push({
      pathname: '/attorney/chat',
      params: {
        caseId: caseItem._id,
        clientName: `${caseItem.userId?.firstName} ${caseItem.userId?.lastName}`,
      },
    });
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Assigned Cases</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_BROWN} />
          <Text style={styles.loadingText}>Loading assigned cases...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Assigned Cases</Text>
        <TouchableOpacity onPress={fetchAssignedCases} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Ionicons name="information-circle" size={20} color={PRIMARY_BROWN} />
        <Text style={styles.infoText}>
          These cases have been assigned to you. Review and accept to proceed.
        </Text>
      </View>

      {/* Cases List */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[PRIMARY_BROWN]}
            tintColor={PRIMARY_BROWN}
          />
        }
      >
        {cases.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-done-circle-outline" size={64} color={MUTED_OLIVE} />
            <Text style={styles.emptyText}>All caught up!</Text>
            <Text style={styles.emptySubtext}>
              No pending case assignments. New cases will appear here when assigned.
            </Text>
          </View>
        ) : (
          cases.map((caseItem, index) => (
            <View key={caseItem._id} style={styles.caseCard}>
              <View style={styles.newBadge}>
                <Ionicons name="star" size={12} color="white" />
                <Text style={styles.newBadgeText}>NEW</Text>
              </View>

              <View style={styles.caseHeader}>
                <View style={styles.caseIconContainer}>
                  <Ionicons name="briefcase" size={28} color={PRIMARY_BROWN} />
                </View>
                <View style={styles.caseInfo}>
                  <Text style={styles.caseTitle}>{caseItem.caseTitle}</Text>
                  <Text style={styles.caseNumber}>{caseItem.caseNumber}</Text>
                </View>
              </View>

              <View style={styles.clientInfo}>
                <View style={styles.clientAvatar}>
                  <Text style={styles.clientAvatarText}>
                    {caseItem.userId?.firstName?.[0]}{caseItem.userId?.lastName?.[0]}
                  </Text>
                </View>
                <View style={styles.clientDetails}>
                  <Text style={styles.clientName}>
                    {caseItem.userId?.firstName} {caseItem.userId?.lastName}
                  </Text>
                  <Text style={styles.clientEmail}>{caseItem.userId?.email}</Text>
                </View>
              </View>

              <View style={styles.caseDetailsSection}>
                {caseItem.caseType && (
                  <View style={styles.detailRow}>
                    <Ionicons name="bookmark" size={16} color={MUTED_OLIVE} />
                    <Text style={styles.detailLabel}>Type:</Text>
                    <Text style={styles.detailValue}>{caseItem.caseType}</Text>
                  </View>
                )}
                <View style={styles.detailRow}>
                  <Ionicons name="calendar" size={16} color={MUTED_OLIVE} />
                  <Text style={styles.detailLabel}>Assigned:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(caseItem.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                {caseItem.description && (
                  <View style={styles.descriptionContainer}>
                    <Text style={styles.descriptionLabel}>Description:</Text>
                    <Text style={styles.descriptionText} numberOfLines={3}>
                      {caseItem.description}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.viewButton]}
                  onPress={() => handleViewCase(caseItem)}
                >
                  <Ionicons name="eye-outline" size={18} color={MUTED_OLIVE} />
                  <Text style={styles.viewButtonText}>View Details</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.acceptButton]}
                  onPress={() => handleAcceptCase(caseItem._id)}
                >
                  <Ionicons name="checkmark-circle" size={18} color="white" />
                  <Text style={styles.acceptButtonText}>Accept Case</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEMED_LIGHT_BG,
  },
  header: {
    backgroundColor: PRIMARY_BROWN,
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  refreshButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: MUTED_OLIVE,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${PRIMARY_GOLD}20`,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: PRIMARY_BROWN,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  caseCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    position: 'relative',
    borderWidth: 2,
    borderColor: PRIMARY_GOLD,
  },
  newBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PRIMARY_GOLD,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'white',
  },
  caseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  caseIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${PRIMARY_BROWN}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  caseInfo: {
    flex: 1,
    paddingRight: 50,
  },
  caseTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: CHARCOAL,
    marginBottom: 4,
  },
  caseNumber: {
    fontSize: 13,
    color: MUTED_OLIVE,
    fontWeight: '500',
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEMED_LIGHT_BG,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  clientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PRIMARY_BROWN,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  clientAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  clientDetails: {
    flex: 1,
  },
  clientName: {
    fontSize: 15,
    fontWeight: '600',
    color: CHARCOAL,
    marginBottom: 2,
  },
  clientEmail: {
    fontSize: 13,
    color: MUTED_OLIVE,
  },
  caseDetailsSection: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: MUTED_OLIVE,
  },
  detailValue: {
    fontSize: 14,
    color: CHARCOAL,
  },
  descriptionContainer: {
    marginTop: 8,
  },
  descriptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: MUTED_OLIVE,
    marginBottom: 6,
  },
  descriptionText: {
    fontSize: 14,
    color: CHARCOAL,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  viewButton: {
    backgroundColor: THEMED_LIGHT_BG,
    borderWidth: 1,
    borderColor: MUTED_OLIVE,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: MUTED_OLIVE,
  },
  acceptButton: {
    backgroundColor: PRIMARY_BROWN,
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    color: CHARCOAL,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: MUTED_OLIVE,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

export default AssignedCases;
