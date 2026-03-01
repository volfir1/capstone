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
  KeyboardAvoidingView,
  Platform,
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
  const [activeTab, setActiveTab] = useState('withRecord');
  const [selectedCase, setSelectedCase] = useState(null);
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [caseRecordModalVisible, setCaseRecordModalVisible] = useState(false);
  const [caseRecordData, setCaseRecordData] = useState(null);
  const [originalCaseRecordData, setOriginalCaseRecordData] = useState(null);
  const [caseRecordDetailsMap, setCaseRecordDetailsMap] = useState({});
  const [caseRecordLoading, setCaseRecordLoading] = useState(false);
  const [caseRecordEditMode, setCaseRecordEditMode] = useState(false);
  const [savingCaseRecord, setSavingCaseRecord] = useState(false);
  const [appointmentModalVisible, setAppointmentModalVisible] = useState(false);
  const [appointmentDetails, setAppointmentDetails] = useState(null);
  const [appointmentLoading, setAppointmentLoading] = useState(false);

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
  const acceptedWithRecord = acceptedCases.filter(f => caseRecordsMap[f._id || f.id]);
  const acceptedWithoutRecord = acceptedCases.filter(f => !caseRecordsMap[f._id || f.id]);
  const rejectedCases = filterCases(finalized.filter(f => f.decision === 'rejected'));
  const pendingCases = filterCases(finalized.filter(f => f.decision === 'pending' || !f.decision));

  const handleCasePress = (caseData) => {
    setSelectedCase(caseData);
    setSelectedCaseId(caseData._id || caseData.id);
    setModalVisible(true);
  };

  const handleViewReview = (caseData) => {
    try {
      const reviewPayload = {
        ...caseData,
        content: caseData.content || {},
      };
      const reviewParam = encodeURIComponent(JSON.stringify(reviewPayload));
      const caseId = caseData.caseId || 'new-case';
      setModalVisible(false);
      router.push(`/admin/recommendation?caseId=${caseId}&review=${reviewParam}&viewOnly=true`);
    } catch (error) {
      console.error('Error opening review view:', error);
      Alert.alert('Error', 'Unable to open review');
    }
  };

  const updateCaseRecordField = (field, value) => {
    setCaseRecordData(prev => ({ ...(prev || {}), [field]: value }));
  };

  const handleCancelCaseRecordEdit = () => {
    setCaseRecordData(originalCaseRecordData || {});
    setCaseRecordEditMode(false);
  };

  const normalizeCaseRecordData = (data = {}) => {
    const normalized = { ...data };
    if (normalized.caseTitle && !normalized.title) normalized.title = normalized.caseTitle;
    if (normalized.caseType && !normalized.nature) normalized.nature = normalized.caseType;
    if (normalized.summary && !normalized.caseHistory) normalized.caseHistory = normalized.summary;
    return normalized;
  };

  const renderCaseRecordField = (label, field, options = {}) => {
    const value = caseRecordData?.[field] || '';
    const multiline = options.multiline;

    return (
      <View style={styles.fieldContainer}>
        <Text style={styles.modalLabel}>{label}</Text>
        {caseRecordEditMode ? (
          <TextInput
            style={[styles.modalInput, multiline && styles.modalTextarea]}
            value={value}
            onChangeText={(text) => updateCaseRecordField(field, text)}
            editable={!savingCaseRecord}
            placeholder={options.placeholder}
            multiline={multiline}
            numberOfLines={multiline ? 4 : 1}
            textAlignVertical={multiline ? 'top' : 'center'}
          />
        ) : (
          <Text style={styles.modalValue}>{value || 'N/A'}</Text>
        )}
      </View>
    );
  };

  const openCaseRecord = async (caseData) => {
    try {
      setCaseRecordLoading(true);
      setCaseRecordData(null);
      setOriginalCaseRecordData(null);
      setCaseRecordEditMode(false);
      setSelectedCaseId(caseData._id || caseData.id || null);

      const caseId = caseData._id || caseData.id;
      if (!caseId) throw new Error('Missing finalize id');

      try {
        const resp = await apiClient.get(`/caserecords/finalize/${caseId}`);
        if (resp.data) {
          const normalized = normalizeCaseRecordData(resp.data);
          setCaseRecordData(normalized);
          setOriginalCaseRecordData(normalized);
          setCaseRecordDetailsMap(prev => ({ ...prev, [caseId]: normalized }));
          setCaseRecordModalVisible(true);
          return;
        }
      } catch (err) {
        // Fallback to finalize content
        const fallbackData = normalizeCaseRecordData(caseData.content?.caseInfo || {});
        setCaseRecordData(fallbackData);
        setOriginalCaseRecordData(fallbackData);
        setCaseRecordDetailsMap(prev => ({ ...prev, [caseId]: fallbackData }));
        setCaseRecordModalVisible(true);
      }
    } catch (error) {
      console.error('Error opening case record:', error);
      Alert.alert('Error', 'Failed to load case record');
    } finally {
      setCaseRecordLoading(false);
    }
  };

  const handleSaveCaseRecord = async () => {
    try {
      if (!selectedCaseId) {
        Alert.alert('Error', 'No case selected');
        return;
      }
      setSavingCaseRecord(true);
      const resp = await apiClient.put(`/caserecords/finalize/${selectedCaseId}`, caseRecordData || {});
      if (resp.data) {
        Alert.alert('Saved', 'Case record saved successfully');
        const updatedData = normalizeCaseRecordData(resp.data || caseRecordData);
        setCaseRecordData(updatedData);
        setOriginalCaseRecordData(updatedData);
        setCaseRecordDetailsMap(prev => ({ ...prev, [selectedCaseId]: updatedData }));
        setCaseRecordEditMode(false);
        await fetchFinalized();
      }
    } catch (err) {
      console.error('Error saving case record:', err);
      Alert.alert('Error', err.response?.data?.error || 'Failed to save case record');
    } finally {
      setSavingCaseRecord(false);
    }
  };

  const openAppointment = async (caseData) => {
    try {
      setAppointmentLoading(true);
      setAppointmentDetails(null);
      const clientInfoId = caseData.caseId;
      if (!clientInfoId) {
        Alert.alert('Unavailable', 'No client info found for this case');
        return;
      }

      const response = await apiClient.get(`/clientsinfo/${clientInfoId}`);
      setAppointmentDetails(response.data);
      setAppointmentModalVisible(true);
    } catch (error) {
      console.error('Error loading appointment details:', error);
      Alert.alert('Error', 'Failed to load full receipt');
    } finally {
      setAppointmentLoading(false);
    }
  };

  const renderCaseCard = (caseData) => {
    const hasRecord = caseRecordsMap[caseData._id || caseData.id];
    const recordOverride = caseRecordDetailsMap[caseData._id || caseData.id];
    const clientName = caseData.clientName || caseData.content?.interviewInfo?.clientName || 'Unknown Client';
    const caseNature = caseData.content?.caseInfo?.nature || caseData.category || 'N/A';
    const decision = caseData.decision || 'pending';
    const displayTitle = hasRecord
      ? (recordOverride?.title || recordOverride?.caseTitle || caseData.caseTitle || caseData.content?.caseInfo?.caseTitle || caseData.content?.caseInfo?.title || `Case for ${clientName}`)
      : clientName;

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
              <Text style={styles.caseName}>{displayTitle}</Text>
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

    if (activeTab === 'withRecord') {
      cases = acceptedWithRecord;
      emptyMessage = 'No accepted cases with records';
    } else if (activeTab === 'withoutRecord') {
      cases = acceptedWithoutRecord;
      emptyMessage = 'No accepted cases without records';
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
        contentContainerStyle={styles.caseListContent}
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
          style={[styles.tab, activeTab === 'withRecord' && styles.activeTab]}
          onPress={() => setActiveTab('withRecord')}
        >
          <Text style={[styles.tabText, activeTab === 'withRecord' && styles.activeTabText]}>
            With Record ({acceptedWithRecord.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'withoutRecord' && styles.activeTab]}
          onPress={() => setActiveTab('withoutRecord')}
        >
          <Text style={[styles.tabText, activeTab === 'withoutRecord' && styles.activeTabText]}>
            Without Record ({acceptedWithoutRecord.length})
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

                <View style={styles.actionGrid}>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.actionOutline]}
                    onPress={() => handleViewReview(selectedCase)}
                  >
                    <Ionicons name="eye" size={18} color={PRIMARY_BROWN} />
                    <Text style={styles.actionButtonTextAlt}>View Review</Text>
                  </TouchableOpacity>

                  {selectedCase.decision === 'accepted' && (
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.actionOutline]}
                      onPress={() => openAppointment(selectedCase)}
                    >
                      <Ionicons name="receipt" size={18} color={PRIMARY_BROWN} />
                      <Text style={styles.actionButtonTextAlt}>Full Receipt</Text>
                    </TouchableOpacity>
                  )}

                  {selectedCase.decision === 'accepted' && (
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.actionFilled]}
                      onPress={() => openCaseRecord(selectedCase)}
                    >
                      <Ionicons name="document-text" size={18} color="white" />
                      <Text style={styles.actionButtonText}>Case Record</Text>
                    </TouchableOpacity>
                  )}

                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Case Record Modal */}
      <Modal
        visible={caseRecordModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCaseRecordModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
          >
            <View style={[styles.modalContent, { maxHeight: '80%', marginTop: 12 }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Case Record</Text>
                <View style={styles.modalHeaderActions}>
                  {caseRecordEditMode ? (
                    <>
                      <TouchableOpacity
                        style={[styles.chipButton, styles.outlineButton, styles.headerActionSpacing]}
                        onPress={handleCancelCaseRecordEdit}
                        disabled={savingCaseRecord}
                      >
                        <Text style={styles.outlineButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.chipButton, styles.filledButton, styles.headerActionSpacing, savingCaseRecord && styles.disabledButton]}
                        onPress={handleSaveCaseRecord}
                        disabled={savingCaseRecord}
                      >
                        {savingCaseRecord ? (
                          <ActivityIndicator size="small" color="white" />
                        ) : (
                          <Text style={styles.filledButtonText}>Save</Text>
                        )}
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity
                      style={[styles.chipButton, styles.outlineButton, styles.headerActionSpacing]}
                      onPress={() => setCaseRecordEditMode(true)}
                      disabled={!caseRecordData || caseRecordLoading}
                    >
                      <Text style={styles.outlineButtonText}>Edit</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => setCaseRecordModalVisible(false)} style={styles.iconButton}>
                    <Ionicons name="close" size={24} color={CHARCOAL} />
                  </TouchableOpacity>
                </View>
              </View>
              <ScrollView
                style={styles.modalBody}
                contentContainerStyle={[styles.caseRecordContent, { paddingBottom: 200 }]}
                keyboardShouldPersistTaps="handled"
              >
                {caseRecordLoading ? (
                  <ActivityIndicator size="large" color={PRIMARY_BROWN} />
                ) : caseRecordData ? (
                  <>
                    <View style={styles.sectionCard}>
                      <Text style={styles.sectionTitle}>Case Information</Text>
                      {renderCaseRecordField('Title', 'title', { placeholder: 'Case title' })}
                      {renderCaseRecordField('Nature of the Case', 'nature', { placeholder: 'Nature' })}
                      {renderCaseRecordField('Tribunal', 'tribunal', { placeholder: 'Tribunal' })}
                      {renderCaseRecordField('Branch', 'branch', { placeholder: 'Branch' })}
                      {renderCaseRecordField('Presiding Judge', 'presidingJudge', { placeholder: 'Presiding judge' })}
                      {renderCaseRecordField('Tel/Email of Clerk of Court', 'telEmail', { placeholder: 'Contact details' })}
                    </View>

                    <View style={styles.sectionCard}>
                      <Text style={styles.sectionTitle}>Contacts</Text>
                      {renderCaseRecordField('Contact Details (Case)', 'contactDetails', { placeholder: 'Phone or email' })}
                      {renderCaseRecordField('Counsel/s on Record', 'counsels', { placeholder: 'Counsel names' })}
                      {renderCaseRecordField('Public Prosecutor', 'publicProsecutor', { placeholder: 'Prosecutor' })}
                      {renderCaseRecordField('Opposing Counsel', 'opposingCounsel', { placeholder: 'Opposing counsel' })}
                      {renderCaseRecordField('Client/s Address', 'clientAddress', { placeholder: 'Client address', multiline: true })}
                      {renderCaseRecordField('Others (Contact Details)', 'others', { placeholder: 'Other contacts', multiline: true })}
                    </View>

                    <View style={styles.sectionCard}>
                      <Text style={styles.sectionTitle}>Parties</Text>
                      {renderCaseRecordField('Party/ies', 'parties', { placeholder: 'List parties involved', multiline: true })}
                    </View>

                    <View style={styles.sectionCard}>
                      <Text style={styles.sectionTitle}>Case History & Notes</Text>
                      {renderCaseRecordField('Case History (reverse chronological)', 'caseHistory', { placeholder: 'Important events and filings', multiline: true })}
                      {renderCaseRecordField('Remarks / Reminders / Notes', 'remarks', { placeholder: 'Deadlines, reminders', multiline: true })}
                    </View>
                  </>
                ) : (
                  <Text style={styles.modalValue}>No case record data available.</Text>
                )}
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Appointment / Full Receipt Modal */}
      <Modal
        visible={appointmentModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAppointmentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '70%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Full Receipt</Text>
              <TouchableOpacity onPress={() => setAppointmentModalVisible(false)}>
                <Ionicons name="close" size={24} color={CHARCOAL} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              {appointmentLoading ? (
                <ActivityIndicator size="large" color={PRIMARY_BROWN} />
              ) : appointmentDetails ? (
                <View style={{ gap: 16 }}>
                  <View>
                    <Text style={styles.modalLabel}>Name</Text>
                    <Text style={styles.modalValue}>{appointmentDetails.fullName || appointmentDetails.name || 'N/A'}</Text>
                  </View>
                  <View style={styles.detailRowBetween}>
                    <View style={{ flex: 1, marginRight: 12 }}>
                      <Text style={styles.modalLabel}>Age</Text>
                      <Text style={styles.modalValue}>{appointmentDetails.age || 'N/A'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalLabel}>Birthday</Text>
                      <Text style={styles.modalValue}>{appointmentDetails.birthday || 'N/A'}</Text>
                    </View>
                  </View>
                  <View style={styles.detailRowBetween}>
                    <View style={{ flex: 1, marginRight: 12 }}>
                      <Text style={styles.modalLabel}>Sex</Text>
                      <Text style={styles.modalValue}>{appointmentDetails.sex || 'N/A'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalLabel}>Civil Status</Text>
                      <Text style={styles.modalValue}>{appointmentDetails.civilStatus || 'N/A'}</Text>
                    </View>
                  </View>
                  <View style={styles.detailRowBetween}>
                    <View style={{ flex: 1, marginRight: 12 }}>
                      <Text style={styles.modalLabel}>Contact Number</Text>
                      <Text style={styles.modalValue}>{appointmentDetails.contactNumber || 'N/A'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalLabel}>Email</Text>
                      <Text style={styles.modalValue}>{appointmentDetails.email || 'N/A'}</Text>
                    </View>
                  </View>
                  <View>
                    <Text style={styles.modalLabel}>Present Address</Text>
                    <Text style={styles.modalValue}>{appointmentDetails.presentAddress || appointmentDetails.address || 'N/A'}</Text>
                  </View>
                  <View>
                    <Text style={styles.modalLabel}>Permanent Address</Text>
                    <Text style={styles.modalValue}>{appointmentDetails.permanentAddress || 'N/A'}</Text>
                  </View>

                  <View>
                    <Text style={styles.modalLabel}>Appointment Date</Text>
                    <Text style={styles.modalValue}>
                      {appointmentDetails.appointedDate
                        ? new Date(appointmentDetails.appointedDate).toLocaleDateString('en-US', {
                            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                          })
                        : 'N/A'}
                    </Text>
                  </View>

                  <View style={styles.detailRowBetween}>
                    <View style={{ flex: 1, marginRight: 12 }}>
                      <Text style={styles.modalLabel}>Income Source</Text>
                      <Text style={styles.modalValue}>{appointmentDetails.currentSourceOfIncome || 'N/A'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalLabel}>Monthly Income</Text>
                      <Text style={styles.modalValue}>
                        {appointmentDetails.monthlyIncome ? `₱${Number(appointmentDetails.monthlyIncome).toLocaleString()}` : 'N/A'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.detailRowBetween}>
                    <View style={{ flex: 1, marginRight: 12 }}>
                      <Text style={styles.modalLabel}>Nature of Work</Text>
                      <Text style={styles.modalValue}>{appointmentDetails.natureOfWork || 'N/A'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalLabel}>Employer</Text>
                      <Text style={styles.modalValue}>{appointmentDetails.employerName || 'N/A'}</Text>
                    </View>
                  </View>
                  <View>
                    <Text style={styles.modalLabel}>Employer Address</Text>
                    <Text style={styles.modalValue}>{appointmentDetails.employerAddress || 'N/A'}</Text>
                  </View>

                  <View style={styles.detailRowBetween}>
                    <View style={{ flex: 1, marginRight: 12 }}>
                      <Text style={styles.modalLabel}>Party Represented</Text>
                      <Text style={styles.modalValue}>{appointmentDetails.partyRepresented || 'N/A'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalLabel}>Case Number</Text>
                      <Text style={styles.modalValue}>{appointmentDetails.caseNumber || 'N/A'}</Text>
                    </View>
                  </View>
                  <View style={styles.detailRowBetween}>
                    <View style={{ flex: 1, marginRight: 12 }}>
                      <Text style={styles.modalLabel}>Venue</Text>
                      <Text style={styles.modalValue}>{appointmentDetails.venue || 'N/A'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalLabel}>Present Stage</Text>
                      <Text style={styles.modalValue}>{appointmentDetails.presentStage || 'N/A'}</Text>
                    </View>
                  </View>
                  <View>
                    <Text style={styles.modalLabel}>Court Division</Text>
                    <Text style={styles.modalValue}>{appointmentDetails.courtDivision || 'N/A'}</Text>
                  </View>
                  <View>
                    <Text style={styles.modalLabel}>Court Address</Text>
                    <Text style={styles.modalValue}>{appointmentDetails.courtAddress || 'N/A'}</Text>
                  </View>
                  <View>
                    <Text style={styles.modalLabel}>Case Description</Text>
                    <Text style={styles.modalValue}>{appointmentDetails.caseDescription || 'N/A'}</Text>
                  </View>
                </View>
              ) : (
                <Text style={styles.modalValue}>No receipt details available.</Text>
              )}
            </ScrollView>
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
    paddingHorizontal: 16,
  },
  caseListContent: {
    paddingBottom: 20,
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
  detailRowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: CHARCOAL,
    backgroundColor: 'white',
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
    marginTop: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActionSpacing: {
    marginLeft: 8,
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: PRIMARY_BROWN,
    backgroundColor: 'white',
  },
  outlineButtonText: {
    color: PRIMARY_BROWN,
    fontWeight: '600',
  },
  filledButton: {
    backgroundColor: PRIMARY_BROWN,
  },
  filledButtonText: {
    color: 'white',
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.6,
  },
  iconButton: {
    padding: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: CHARCOAL,
  },
  modalBody: {
    padding: 20,
  },
  caseRecordContent: {
    paddingBottom: 28,
  },
  sectionCard: {
    backgroundColor: THEMED_LIGHT_BG,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E6E0D6',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: CHARCOAL,
    marginBottom: 6,
  },
  fieldContainer: {
    marginTop: 10,
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
  modalInput: {
    borderWidth: 1,
    borderColor: '#D8D0C4',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: CHARCOAL,
    backgroundColor: 'white',
  },
  modalTextarea: {
    minHeight: 90,
  },
  actionGrid: {
    marginTop: 20,
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  actionOutline: {
    borderWidth: 1,
    borderColor: PRIMARY_BROWN,
    backgroundColor: 'white',
    marginBottom: 8,
    gap: 8,
  },
  actionFilled: {
    backgroundColor: PRIMARY_BROWN,
    gap: 8,
    marginBottom: 8,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  actionButtonTextAlt: {
    color: PRIMARY_BROWN,
    fontWeight: '600',
    marginLeft: 8,
  },
});
