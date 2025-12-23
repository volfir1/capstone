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

const MyCases = () => {
  const router = useRouter();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/cases/attorney-cases');
      if (response.data.success) {
        setCases(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching cases:', error);
      Alert.alert('Error', 'Failed to load cases');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCases();
  };

  const handleCasePress = (caseItem) => {
    router.push({
      pathname: '/attorney/chat',
      params: {
        caseId: caseItem._id,
        clientName: `${caseItem.userId?.firstName} ${caseItem.userId?.lastName}`,
      },
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return PRIMARY_GOLD;
      case 'active':
      case 'in progress':
        return MUTED_OLIVE;
      case 'closed':
      case 'completed':
        return CHARCOAL;
      default:
        return PRIMARY_BROWN;
    }
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Cases</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_BROWN} />
          <Text style={styles.loadingText}>Loading cases...</Text>
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
        <Text style={styles.headerTitle}>My Cases</Text>
        <TouchableOpacity onPress={fetchCases} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Stats Card */}
      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Ionicons name="briefcase" size={24} color={PRIMARY_BROWN} />
          <View>
            <Text style={styles.statValue}>{cases.length}</Text>
            <Text style={styles.statLabel}>Total Cases</Text>
          </View>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="time" size={24} color={MUTED_OLIVE} />
          <View>
            <Text style={styles.statValue}>
              {cases.filter(c => c.status !== 'closed' && c.status !== 'completed').length}
            </Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="checkmark-circle" size={24} color={CHARCOAL} />
          <View>
            <Text style={styles.statValue}>
              {cases.filter(c => c.status === 'closed' || c.status === 'completed').length}
            </Text>
            <Text style={styles.statLabel}>Closed</Text>
          </View>
        </View>
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
            <Ionicons name="folder-open-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>No cases assigned</Text>
            <Text style={styles.emptySubtext}>Cases will appear here when assigned to you</Text>
          </View>
        ) : (
          cases.map((caseItem, index) => (
            <TouchableOpacity
              key={caseItem._id}
              style={styles.caseCard}
              onPress={() => handleCasePress(caseItem)}
            >
              <View style={styles.caseHeader}>
                <View style={styles.caseIconContainer}>
                  <Ionicons name="document-text" size={24} color={PRIMARY_BROWN} />
                </View>
                <View style={styles.caseInfo}>
                  <Text style={styles.caseTitle} numberOfLines={1}>
                    {caseItem.caseTitle}
                  </Text>
                  <Text style={styles.caseNumber}>{caseItem.caseNumber}</Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: `${getStatusColor(caseItem.status)}20` }
                ]}>
                  <Text style={[styles.statusText, { color: getStatusColor(caseItem.status) }]}>
                    {caseItem.status || 'Pending'}
                  </Text>
                </View>
              </View>

              <View style={styles.caseDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name="person" size={16} color={MUTED_OLIVE} />
                  <Text style={styles.detailText}>
                    {caseItem.userId?.firstName} {caseItem.userId?.lastName}
                  </Text>
                </View>
                {caseItem.caseType && (
                  <View style={styles.detailRow}>
                    <Ionicons name="bookmark" size={16} color={MUTED_OLIVE} />
                    <Text style={styles.detailText}>{caseItem.caseType}</Text>
                  </View>
                )}
                <View style={styles.detailRow}>
                  <Ionicons name="calendar" size={16} color={MUTED_OLIVE} />
                  <Text style={styles.detailText}>
                    {new Date(caseItem.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>

              <View style={styles.caseFooter}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleCasePress(caseItem)}
                >
                  <Ionicons name="chatbubbles-outline" size={18} color={PRIMARY_BROWN} />
                  <Text style={styles.actionText}>Message Client</Text>
                </TouchableOpacity>
                <Ionicons name="chevron-forward" size={20} color={MUTED_OLIVE} />
              </View>
            </TouchableOpacity>
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
  statsCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: CHARCOAL,
  },
  statLabel: {
    fontSize: 12,
    color: MUTED_OLIVE,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  caseCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  caseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  caseIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${PRIMARY_BROWN}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  caseInfo: {
    flex: 1,
  },
  caseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: CHARCOAL,
    marginBottom: 2,
  },
  caseNumber: {
    fontSize: 12,
    color: MUTED_OLIVE,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  caseDetails: {
    marginBottom: 12,
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: CHARCOAL,
  },
  caseFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: PRIMARY_BROWN,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: CHARCOAL,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: MUTED_OLIVE,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default MyCases;
