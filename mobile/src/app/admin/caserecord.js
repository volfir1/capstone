import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import apiClient from '../../api/apiClient';

const PRIMARY_BROWN = '#7D5A3B';
const PRIMARY_GOLD = '#C4AB7D';
const CHARCOAL = '#2C2C2C';
const THEMED_LIGHT_BG = '#FAF8F3';

export default function CaseRecord() {
  const router = useRouter();
  const [caseRecords, setCaseRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCaseRecords();
  }, []);

  const fetchCaseRecords = async () => {
    try {
      setLoading(true);
      // This endpoint might need to be created on the backend
      const response = await apiClient.get('/caserecords');
      const data = response.data?.data ?? response.data ?? [];
      setCaseRecords(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching case records:', error);
      setCaseRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewRecord = (record) => {
    Alert.alert(
      'View Case Record',
      'Case record viewing feature coming soon. Please use the website for full functionality.',
      [{ text: 'OK' }]
    );
  };

  const renderRecordCard = (record) => {
    return (
      <TouchableOpacity
        key={record._id || record.id}
        style={styles.recordCard}
        onPress={() => handleViewRecord(record)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Ionicons name="folder-open" size={24} color={PRIMARY_GOLD} />
            <View style={styles.recordInfo}>
              <Text style={styles.recordTitle}>Case Record</Text>
              <Text style={styles.recordId}>ID: {record._id || record.id}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={PRIMARY_BROWN} />
        </View>

        <View style={styles.cardDetails}>
          {record.createdAt && (
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={16} color="#666" />
              <Text style={styles.detailText}>
                {new Date(record.createdAt).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={CHARCOAL} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Case Records</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_BROWN} />
        </View>
      ) : caseRecords.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="folder-open-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No case records found</Text>
          <Text style={styles.emptySubtext}>
            Case records will appear here once created
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.recordList}>
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color={PRIMARY_BROWN} />
            <Text style={styles.infoText}>
              Case records feature is under development. Use the website for full functionality.
            </Text>
          </View>
          {caseRecords.map(renderRecordCard)}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: CHARCOAL,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 8,
    textAlign: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEMED_LIGHT_BG,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: PRIMARY_BROWN,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    marginLeft: 8,
  },
  recordList: {
    flex: 1,
  },
  recordCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recordInfo: {
    marginLeft: 12,
    flex: 1,
  },
  recordTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: CHARCOAL,
  },
  recordId: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  cardDetails: {
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
});
