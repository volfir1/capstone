import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  Alert,
  Modal,
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

export default function FinalizedCases() {
  const router = useRouter();
  const [finalized, setFinalized] = useState([]);
  const [caseRecordsMap, setCaseRecordsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('accepted'); // accepted, rejected, pending
  const [selectedCase, setSelectedCase] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchFinalized();
  }, []);

  const fetchFinalized = async () => {
    try {
      setLoading(true);
      const resp = await apiClient.get('/finalize');
      const data = resp.data?.data ?? resp.data ?? [];
      const finalizedData = Array.isArray(data) ? data : [];
      setFinalized(finalizedData);
      
      // Check which accepted cases have case records
      const accepted = finalizedData.filter(f => f.decision === 'accepted');
      const recordsMap = {};
      
      await Promise.all(
        accepted.map(async (caseData) => {
          try {
            const caseRecordResp = await apiClient.get(`/caserecords/finalize/${caseData._id || caseData.id}`);
            if (caseRecordResp.data) {
              recordsMap[caseData._id || caseData.id] = true;
            }
          } catch (err) {
            recordsMap[caseData._id || caseData.id] = false;
          }
        })
      );
      
      setCaseRecordsMap(recordsMap);
    } catch (err) {
      console.error('Error fetching finalized records', err);
      setFinalized([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchFinalized();
  };

  const filterCases = (cases) => {
    if (!searchTerm.trim()) return cases;
    
    const search = searchTerm.toLowerCase().trim();
    return cases.filter(f => {
      const caseId = (f.caseId || '').toLowerCase();
      const clientName = (f.clientName || f.content?.interviewInfo?.clientName || '').toLowerCase();
      return caseId.includes(search) || clientName.includes(search);
    });
  };

  const acceptedCases = filterCases(finalized.filter(f => f.decision === 'accepted'));
  const rejectedCases = filterCases(finalized.filter(f => f.decision === 'rejected'));
  const pendingCases = filterCases(finalized.filter(f => f.decision === 'pending' || !f.decision));

  const handleCasePress = (caseData) => {
    setSelectedCase(caseData);
    setModalVisible(true);
  };

  const handleOpenChat = (caseData) => {
    setModalVisible(false);
    router.push({
      pathname: '/admin/chat',
      params: { caseNumber: caseData.caseId }
    });
  };

  const renderCaseCard = (caseData) => {
    const hasRecord = caseRecordsMap[caseData._id || caseData.id];
    const clientName = caseData.clientName || caseData.content?.interviewInfo?.clientName || 'Unknown Client';
    const caseNature = caseData.content?.caseInfo?.nature || caseData.category || 'N/A';
    const decision = caseData.decision || 'pending';

    return (
      <TouchableOpacity
        key={caseData._id || caseData.id}
        style={styles.caseCard}
        onPress={() => handleCasePress(caseData)}
      >
        <View style={styles.caseHeader}>
          <View style={styles.caseHeaderLeft}>
            <Ionicons 
              name={decision === 'accepted' ? 'checkmark-circle' : decision === 'rejected' ? 'close-circle' : 'time'} 
              size={24} 
              color={decision === 'accepted' ? '#4CAF50' : decision === 'rejected' ? '#F44336' : '#FF9800'} 
            />
            <View style={styles.caseInfo}>
              <Text style={styles.caseName}>{clientName}</Text>
              <Text style={styles.caseId}>Case #{caseData.caseId}</Text>
            </View>
          </View>
          {decision === 'accepted' && hasRecord && (
            <View style={styles.recordBadge}>
              <Ionicons name="document-text" size={16} color={PRIMARY_GOLD} />
            </View>
          )}
        </View>
        
        <View style={styles.caseDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="briefcase-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{caseNature}</Text>
          </View>
          
          {caseData.reviewedBy && (
            <View style={styles.detailRow}>
              <Ionicons name="person-outline" size={16} color="#666" />
              <Text style={styles.detailText}>Reviewed by: {caseData.reviewedBy}</Text>
            </View>
          )}
          
          {caseData.reviewDate && (
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={16} color="#666" />
              <Text style={styles.detailText}>
                {new Date(caseData.reviewDate).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.caseFooter}>
          <View style={[styles.statusBadge, 
            decision === 'accepted' ? styles.acceptedBadge : 
            decision === 'rejected' ? styles.rejectedBadge : 
            styles.pendingBadge
          ]}>
            <Text style={styles.statusText}>
              {decision === 'accepted' ? 'Accepted' : decision === 'rejected' ? 'Rejected' : 'Pending'}
            </Text>
          </View>
          
          <TouchableOpacity onPress={() => handleCasePress(caseData)}>
            <Ionicons name="chevron-forward" size={20} color={PRIMARY_BROWN} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderTabContent = () => {
    let cases = [];
    let emptyMessage = '';

    if (activeTab === 'accepted') {
      cases = acceptedCases;
      emptyMessage = 'No accepted cases';
    } else if (activeTab === 'rejected') {
      cases = rejectedCases;
      emptyMessage = 'No rejected cases';
    } else {
      cases = pendingCases;
      emptyMessage = 'No pending cases';
    }

    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_BROWN} />
        </View>
      );
    }

    if (cases.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="folder-open-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.caseList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[PRIMARY_BROWN]} />
        }
      >
        {cases.map(renderCaseCard)}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={CHARCOAL} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Finalized Cases</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by case ID or client name..."
          placeholderTextColor="#999"
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'accepted' && styles.activeTab]}
          onPress={() => setActiveTab('accepted')}
        >
          <Text style={[styles.tabText, activeTab === 'accepted' && styles.activeTabText]}>
            Accepted ({acceptedCases.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'rejected' && styles.activeTab]}
          onPress={() => setActiveTab('rejected')}
        >
          <Text style={[styles.tabText, activeTab === 'rejected' && styles.activeTabText]}>
            Rejected ({rejectedCases.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
            Pending ({pendingCases.length})
          </Text>
        </TouchableOpacity>
      </View>

      {renderTabContent()}

      {/* Case Details Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Case Details</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={CHARCOAL} />
              </TouchableOpacity>
            </View>

            {selectedCase && (
              <ScrollView style={styles.modalBody}>
                <Text style={styles.modalLabel}>Client Name</Text>
                <Text style={styles.modalValue}>
                  {selectedCase.clientName || selectedCase.content?.interviewInfo?.clientName || 'N/A'}
                </Text>

                <Text style={styles.modalLabel}>Case ID</Text>
                <Text style={styles.modalValue}>{selectedCase.caseId || 'N/A'}</Text>

                <Text style={styles.modalLabel}>Decision</Text>
                <View style={[styles.statusBadge, 
                  selectedCase.decision === 'accepted' ? styles.acceptedBadge : 
                  selectedCase.decision === 'rejected' ? styles.rejectedBadge : 
                  styles.pendingBadge,
                  { alignSelf: 'flex-start', marginTop: 8 }
                ]}>
                  <Text style={styles.statusText}>
                    {selectedCase.decision === 'accepted' ? 'Accepted' : 
                     selectedCase.decision === 'rejected' ? 'Rejected' : 'Pending'}
                  </Text>
                </View>

                {selectedCase.reviewedBy && (
                  <>
                    <Text style={styles.modalLabel}>Reviewed By</Text>
                    <Text style={styles.modalValue}>{selectedCase.reviewedBy}</Text>
                  </>
                )}

                {selectedCase.comments && (
                  <>
                    <Text style={styles.modalLabel}>Comments</Text>
                    <Text style={styles.modalValue}>{selectedCase.comments}</Text>
                  </>
                )}

                {selectedCase.decision === 'accepted' && (
                  <TouchableOpacity 
                    style={styles.chatButton}
                    onPress={() => handleOpenChat(selectedCase)}
                  >
                    <Ionicons name="chatbubbles" size={20} color="white" />
                    <Text style={styles.chatButtonText}>Open Chat</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F5F5F5',
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: CHARCOAL,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: PRIMARY_BROWN,
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: PRIMARY_BROWN,
    fontWeight: '600',
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
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  caseList: {
    flex: 1,
  },
  caseCard: {
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
  caseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  caseHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  caseInfo: {
    marginLeft: 12,
    flex: 1,
  },
  caseName: {
    fontSize: 16,
    fontWeight: '600',
    color: CHARCOAL,
  },
  caseId: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  recordBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEMED_LIGHT_BG,
    justifyContent: 'center',
    alignItems: 'center',
  },
  caseDetails: {
    marginBottom: 12,
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
  caseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  acceptedBadge: {
    backgroundColor: '#E8F5E9',
  },
  rejectedBadge: {
    backgroundColor: '#FFEBEE',
  },
  pendingBadge: {
    backgroundColor: '#FFF3E0',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: CHARCOAL,
  },
  modalBody: {
    padding: 20,
  },
  modalLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 16,
    marginBottom: 4,
    fontWeight: '600',
  },
  modalValue: {
    fontSize: 16,
    color: CHARCOAL,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY_BROWN,
    padding: 16,
    borderRadius: 8,
    marginTop: 24,
  },
  chatButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
