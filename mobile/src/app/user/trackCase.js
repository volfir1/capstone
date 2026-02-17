import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, StyleSheet,
  ActivityIndicator, RefreshControl, Modal, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from 'context/authContext';
import { fetchUserCases } from '../../api/userApi';
import { fetchFinalizedCases, fetchCaseRecord } from '../../api/adminApi';
import { PRIMARY_BROWN, PRIMARY_GOLD, CHARCOAL, MUTED_OLIVE } from 'utils/constants';
import { CASE_STATUS_STEPS, getStatusStepById } from 'utils/casStatusSteps';

export default function TrackCase() {
  const router = useRouter();
  const { userData, user } = useAuth();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [caseRecord, setCaseRecord] = useState(null);
  const [detailModal, setDetailModal] = useState(false);
  const [recordLoading, setRecordLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [casesRes, finalizedRes] = await Promise.all([
        fetchUserCases().catch(() => ({ data: [] })),
        fetchFinalizedCases().catch(() => ({ data: [] })),
      ]);
      
      const userCases = casesRes.data || [];
      const allFinalized = finalizedRes.data || [];
      
      // Merge case data with finalized info
      const mergedCases = userCases.map(c => {
        const fin = allFinalized.find(f => f.caseId === c._id);
        return { ...c, finalized: fin };
      });
      
      // Show only accepted/active cases
      const activeCases = mergedCases.filter(c => 
        c.finalized?.status === 'accepted' || c.status === 'in_progress' || c.status === 'completed'
      );
      
      setCases(activeCases.length > 0 ? activeCases : mergedCases);
    } catch (error) {
      console.error('Error loading cases:', error);
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

  const openCaseDetail = async (caseItem) => {
    setSelectedCase(caseItem);
    setDetailModal(true);
    
    if (caseItem.finalized?._id) {
      try {
        setRecordLoading(true);
        const res = await fetchCaseRecord(caseItem.finalized._id);
        setCaseRecord(res.data || null);
      } catch (e) {
        setCaseRecord(null);
      } finally {
        setRecordLoading(false);
      }
    }
  };

  const getCurrentStep = (status) => {
    const idx = CASE_STATUS_STEPS.findIndex(s => s.id === status);
    return idx >= 0 ? idx : 0;
  };

  const renderCase = ({ item }) => {
    const currentStep = getCurrentStep(item.status);
    return (
      <TouchableOpacity style={s.card} onPress={() => openCaseDetail(item)}>
        <View style={s.cardHeader}>
          <Text style={s.caseTitle}>{item.caseTitle || item.caseNature || 'Case'}</Text>
          <View style={[s.statusBadge, { backgroundColor: item.status === 'completed' ? '#22c55e20' : `${PRIMARY_BROWN}15` }]}>
            <Text style={[s.statusText, { color: item.status === 'completed' ? '#22c55e' : PRIMARY_BROWN }]}>
              {(item.status || 'pending').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Text>
          </View>
        </View>
        {item.caseNumber && <Text style={s.caseNumber}>Case #{item.caseNumber}</Text>}
        
        {/* Timeline */}
        <View style={s.timeline}>
          {CASE_STATUS_STEPS.map((step, i) => (
            <View key={step.id} style={s.timelineStep}>
              <View style={[s.dot, i <= currentStep && s.dotActive, item.status === 'rejected' && s.dotRejected]} />
              <Text style={[s.stepLabel, i <= currentStep && s.stepLabelActive]}>{step.label}</Text>
            </View>
          ))}
        </View>
        
        <View style={s.cardFooter}>
          <Text style={s.cardDate}>{new Date(item.updatedAt || item.createdAt).toLocaleDateString()}</Text>
          <Ionicons name="chevron-forward" size={18} color="#ccc" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={24} color={CHARCOAL} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Track Cases</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={PRIMARY_BROWN} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={cases}
          keyExtractor={(item, i) => item._id || i.toString()}
          renderItem={renderCase}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[PRIMARY_BROWN]} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="folder-open-outline" size={56} color="#ccc" />
              <Text style={s.emptyText}>No cases to track</Text>
              <Text style={s.emptySub}>Your accepted cases will appear here</Text>
            </View>
          }
        />
      )}

      {/* Case Detail Modal */}
      <Modal visible={detailModal} animationType="slide" presentationStyle="pageSheet">
        <View style={s.modalContainer}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Case Details</Text>
            <TouchableOpacity onPress={() => { setDetailModal(false); setCaseRecord(null); }}>
              <Ionicons name="close" size={24} color={CHARCOAL} />
            </TouchableOpacity>
          </View>
          {selectedCase && (
            <ScrollView style={s.modalContent}>
              <View style={s.detailSection}>
                <Text style={s.detailLabel}>CASE TITLE</Text>
                <Text style={s.detailValue}>{selectedCase.caseTitle || selectedCase.caseNature || 'N/A'}</Text>
              </View>
              {selectedCase.caseNumber && (
                <View style={s.detailSection}>
                  <Text style={s.detailLabel}>CASE NUMBER</Text>
                  <Text style={s.detailValue}>{selectedCase.caseNumber}</Text>
                </View>
              )}
              <View style={s.detailSection}>
                <Text style={s.detailLabel}>STATUS</Text>
                <Text style={s.detailValue}>
                  {(selectedCase.status || 'pending').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Text>
              </View>

              {/* Status Timeline */}
              <View style={s.detailSection}>
                <Text style={s.detailLabel}>PROGRESS</Text>
                {CASE_STATUS_STEPS.map((step, i) => {
                  const current = getCurrentStep(selectedCase.status);
                  const isComplete = i <= current;
                  const isCurrent = i === current;
                  return (
                    <View key={step.id} style={s.timelineRow}>
                      <View style={s.timelineLeft}>
                        <View style={[s.timelineDot, isComplete && s.timelineDotActive, isCurrent && s.timelineDotCurrent]} />
                        {i < CASE_STATUS_STEPS.length - 1 && (
                          <View style={[s.timelineLine, isComplete && s.timelineLineActive]} />
                        )}
                      </View>
                      <View style={s.timelineRight}>
                        <Text style={[s.timelineLabel, isComplete && s.timelineLabelActive]}>{step.label}</Text>
                        <Text style={s.timelineDesc}>{step.description}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* Case Record */}
              {recordLoading ? (
                <ActivityIndicator size="small" color={PRIMARY_BROWN} style={{ marginVertical: 20 }} />
              ) : caseRecord ? (
                <View style={s.detailSection}>
                  <Text style={s.detailLabel}>CASE RECORD</Text>
                  {caseRecord.title && <DetailRow label="Title" value={caseRecord.title} />}
                  {caseRecord.nature && <DetailRow label="Nature" value={caseRecord.nature} />}
                  {caseRecord.tribunal && <DetailRow label="Tribunal" value={caseRecord.tribunal} />}
                  {caseRecord.branch && <DetailRow label="Branch" value={caseRecord.branch} />}
                  {caseRecord.presidingJudge && <DetailRow label="Presiding Judge" value={caseRecord.presidingJudge} />}
                  {caseRecord.parties && <DetailRow label="Parties" value={caseRecord.parties} />}
                  {caseRecord.caseHistory && <DetailRow label="Case History" value={caseRecord.caseHistory} />}
                  {caseRecord.remarks && <DetailRow label="Remarks" value={caseRecord.remarks} />}
                </View>
              ) : null}

              {/* Chat button */}
              <TouchableOpacity
                style={s.chatBtn}
                onPress={() => {
                  setDetailModal(false);
                  router.push({ pathname: '/user/chat', params: { caseId: selectedCase._id } });
                }}
              >
                <Ionicons name="chatbubbles" size={18} color="#fff" />
                <Text style={s.chatBtnText}>Open Chat</Text>
              </TouchableOpacity>
              <View style={{ height: 40 }} />
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}

const DetailRow = ({ label, value }) => (
  <View style={{ marginBottom: 8 }}>
    <Text style={{ fontSize: 12, color: MUTED_OLIVE, fontWeight: '500' }}>{label}</Text>
    <Text style={{ fontSize: 14, color: CHARCOAL, marginTop: 2 }}>{value}</Text>
  </View>
);

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingBottom: 12, paddingHorizontal: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: CHARCOAL },
  list: { padding: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  caseTitle: { fontSize: 15, fontWeight: '600', color: CHARCOAL, flex: 1, marginRight: 8 },
  caseNumber: { fontSize: 12, color: MUTED_OLIVE, marginTop: 4 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '600' },
  timeline: { flexDirection: 'row', marginTop: 14, justifyContent: 'space-between' },
  timelineStep: { alignItems: 'center', flex: 1 },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#ddd', marginBottom: 4 },
  dotActive: { backgroundColor: PRIMARY_BROWN },
  dotRejected: { backgroundColor: '#ef4444' },
  stepLabel: { fontSize: 9, color: '#aaa', textAlign: 'center' },
  stepLabelActive: { color: PRIMARY_BROWN, fontWeight: '600' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  cardDate: { fontSize: 12, color: '#aaa' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, color: '#aaa', marginTop: 12, fontWeight: '500' },
  emptySub: { fontSize: 13, color: '#ccc', marginTop: 4 },
  modalContainer: { flex: 1, backgroundColor: '#F7F8FA' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 50, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalTitle: { fontSize: 18, fontWeight: '600', color: CHARCOAL },
  modalContent: { padding: 16 },
  detailSection: { marginBottom: 20 },
  detailLabel: { fontSize: 11, color: MUTED_OLIVE, fontWeight: '700', marginBottom: 6, letterSpacing: 0.5 },
  detailValue: { fontSize: 15, color: CHARCOAL },
  timelineRow: { flexDirection: 'row', marginBottom: 4 },
  timelineLeft: { width: 30, alignItems: 'center' },
  timelineDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#ddd', borderWidth: 2, borderColor: '#ddd' },
  timelineDotActive: { backgroundColor: PRIMARY_BROWN, borderColor: PRIMARY_BROWN },
  timelineDotCurrent: { borderColor: PRIMARY_GOLD, backgroundColor: PRIMARY_BROWN },
  timelineLine: { width: 2, flex: 1, backgroundColor: '#ddd', marginVertical: 2 },
  timelineLineActive: { backgroundColor: PRIMARY_BROWN },
  timelineRight: { flex: 1, paddingLeft: 12, paddingBottom: 16 },
  timelineLabel: { fontSize: 14, fontWeight: '500', color: '#aaa' },
  timelineLabelActive: { color: CHARCOAL },
  timelineDesc: { fontSize: 12, color: MUTED_OLIVE, marginTop: 2 },
  chatBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: PRIMARY_BROWN, paddingVertical: 14, borderRadius: 12, marginTop: 10 },
  chatBtnText: { color: '#fff', fontSize: 15, fontWeight: '600', marginLeft: 8 },
});
