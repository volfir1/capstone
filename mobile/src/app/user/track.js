import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, StyleSheet,
  ActivityIndicator, RefreshControl, ScrollView, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from 'context/authContext';
import { fetchClientInfoRecords, fetchFinalizedCases, fetchReviews } from '../../api/adminApi';
import { PRIMARY_BROWN, PRIMARY_GOLD, CHARCOAL, MUTED_OLIVE, ACCENT_TAN } from 'utils/constants';
import { getStatusLabel, CASE_STATUS_STEPS } from 'utils/casStatusSteps';

const TABS = [
  { key: 'appointments', label: 'Appointments', icon: 'calendar' },
  { key: 'legal_advice', label: 'Legal Advice', icon: 'book' },
  { key: 'court_cases', label: 'Court Cases', icon: 'briefcase' },
  { key: 'documents', label: 'Documents', icon: 'document-text' },
  { key: 'rejected', label: 'Rejected', icon: 'close-circle' },
];

export default function TrackAppointment() {
  const router = useRouter();
  const { userData, user } = useAuth();
  const [activeTab, setActiveTab] = useState('appointments');
  const [appointments, setAppointments] = useState([]);
  const [finalized, setFinalized] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailModal, setDetailModal] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [appointmentsRes, finalizedRes] = await Promise.all([
        fetchClientInfoRecords().catch(() => ({ data: [] })),
        fetchFinalizedCases().catch(() => ({ data: [] })),
      ]);
      
      const allAppts = appointmentsRes.data || [];
      const userAppts = allAppts.filter(
        a => a.userId === userData?._id || a.email === user?.email
      );
      setAppointments(userAppts);

      const allFinalized = finalizedRes.data || [];
      const userFinalized = allFinalized.filter(
        f => f.userId === userData?._id || f.clientInfo?.email === user?.email
      );
      setFinalized(userFinalized);
    } catch (error) {
      console.error('Error loading track data:', error);
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

  // Filter data based on active tab
  const getFilteredData = () => {
    switch (activeTab) {
      case 'appointments':
        return finalized.filter(f => f.status === 'accepted' || f.status === 'pending');
      case 'legal_advice':
        return finalized.filter(f => f.caseType === 'legal-advice');
      case 'court_cases':
        return finalized.filter(f => f.caseType === 'court-representation');
      case 'documents':
        return finalized.filter(f => f.caseType === 'legal-document');
      case 'rejected':
        return finalized.filter(f => f.status === 'rejected');
      default:
        return [];
    }
  };

  const data = getFilteredData();

  const openDetail = (item) => {
    setSelectedItem(item);
    setDetailModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted': return '#22c55e';
      case 'rejected': return '#ef4444';
      case 'pending': return PRIMARY_GOLD;
      default: return MUTED_OLIVE;
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={s.card} onPress={() => openDetail(item)}>
      <View style={s.cardHeader}>
        <View style={[s.statusBadge, { backgroundColor: `${getStatusColor(item.status)}20` }]}>
          <Text style={[s.statusText, { color: getStatusColor(item.status) }]}>
            {(item.status || 'pending').toUpperCase()}
          </Text>
        </View>
        <Text style={s.cardDate}>
          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}
        </Text>
      </View>
      <Text style={s.cardTitle}>
        {item.clientInfo?.firstName || item.firstName || ''} {item.clientInfo?.lastName || item.lastName || ''}
      </Text>
      <Text style={s.cardSub} numberOfLines={2}>
        {item.caseType ? item.caseType.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'N/A'}
      </Text>
      {item.appointmentDate && (
        <View style={s.cardInfo}>
          <Ionicons name="calendar-outline" size={14} color={MUTED_OLIVE} />
          <Text style={s.cardInfoText}>
            {new Date(item.appointmentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            {item.appointmentTime ? ` at ${item.appointmentTime}` : ''}
          </Text>
        </View>
      )}
      {item.caseId && (
        <TouchableOpacity
          style={s.chatBtn}
          onPress={() => router.push({ pathname: '/user/chat', params: { caseId: item.caseId } })}
        >
          <Ionicons name="chatbubble-outline" size={14} color={PRIMARY_BROWN} />
          <Text style={s.chatBtnText}>Chat</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color={CHARCOAL} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Track Appointments</Text>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[s.tab, activeTab === tab.key && s.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Ionicons name={tab.icon} size={16} color={activeTab === tab.key ? PRIMARY_BROWN : MUTED_OLIVE} />
            <Text style={[s.tabText, activeTab === tab.key && s.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      {loading ? (
        <ActivityIndicator size="large" color={PRIMARY_BROWN} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item, i) => item._id || i.toString()}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[PRIMARY_BROWN]} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="folder-open-outline" size={56} color="#ccc" />
              <Text style={s.emptyText}>No items found</Text>
              <Text style={s.emptySub}>Nothing to show for this category</Text>
            </View>
          }
        />
      )}

      {/* Detail Modal */}
      <Modal visible={detailModal} animationType="slide" presentationStyle="pageSheet">
        <View style={s.modalContainer}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Details</Text>
            <TouchableOpacity onPress={() => setDetailModal(false)}>
              <Ionicons name="close" size={24} color={CHARCOAL} />
            </TouchableOpacity>
          </View>
          {selectedItem && (
            <ScrollView style={s.modalContent}>
              <View style={s.detailSection}>
                <Text style={s.detailLabel}>Status</Text>
                <View style={[s.statusBadge, { backgroundColor: `${getStatusColor(selectedItem.status)}20`, alignSelf: 'flex-start' }]}>
                  <Text style={[s.statusText, { color: getStatusColor(selectedItem.status) }]}>
                    {(selectedItem.status || 'pending').toUpperCase()}
                  </Text>
                </View>
              </View>
              <View style={s.detailSection}>
                <Text style={s.detailLabel}>Case Type</Text>
                <Text style={s.detailValue}>
                  {selectedItem.caseType ? selectedItem.caseType.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'N/A'}
                </Text>
              </View>
              <View style={s.detailSection}>
                <Text style={s.detailLabel}>Client Name</Text>
                <Text style={s.detailValue}>
                  {selectedItem.clientInfo?.firstName || selectedItem.firstName || ''} {selectedItem.clientInfo?.lastName || selectedItem.lastName || ''}
                </Text>
              </View>
              {selectedItem.appointmentDate && (
                <View style={s.detailSection}>
                  <Text style={s.detailLabel}>Appointment Date</Text>
                  <Text style={s.detailValue}>
                    {new Date(selectedItem.appointmentDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    {selectedItem.appointmentTime ? ` at ${selectedItem.appointmentTime}` : ''}
                  </Text>
                </View>
              )}
              {selectedItem.decision && (
                <View style={s.detailSection}>
                  <Text style={s.detailLabel}>Decision</Text>
                  <Text style={s.detailValue}>{selectedItem.decision}</Text>
                </View>
              )}
              {selectedItem.notes && (
                <View style={s.detailSection}>
                  <Text style={s.detailLabel}>Notes</Text>
                  <Text style={s.detailValue}>{selectedItem.notes}</Text>
                </View>
              )}
              {selectedItem.caseId && (
                <TouchableOpacity
                  style={s.detailChatBtn}
                  onPress={() => {
                    setDetailModal(false);
                    router.push({ pathname: '/user/chat', params: { caseId: selectedItem.caseId } });
                  }}
                >
                  <Ionicons name="chatbubbles" size={18} color="#fff" />
                  <Text style={s.detailChatBtnText}>Open Chat</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingBottom: 12, paddingHorizontal: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  backBtn: { marginRight: 12 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: CHARCOAL },
  tabBar: { backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 8, maxHeight: 50 },
  tab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, borderRadius: 20, backgroundColor: '#f5f5f5' },
  tabActive: { backgroundColor: `${PRIMARY_BROWN}15` },
  tabText: { fontSize: 12, color: MUTED_OLIVE, marginLeft: 6 },
  tabTextActive: { color: PRIMARY_BROWN, fontWeight: '600' },
  list: { padding: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: PRIMARY_BROWN },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '600' },
  cardDate: { fontSize: 11, color: '#aaa' },
  cardTitle: { fontSize: 15, fontWeight: '600', color: CHARCOAL },
  cardSub: { fontSize: 13, color: MUTED_OLIVE, marginTop: 4 },
  cardInfo: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  cardInfoText: { fontSize: 12, color: MUTED_OLIVE, marginLeft: 6 },
  chatBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 10, paddingVertical: 6, paddingHorizontal: 12, backgroundColor: `${PRIMARY_BROWN}10`, borderRadius: 16, alignSelf: 'flex-start' },
  chatBtnText: { fontSize: 12, color: PRIMARY_BROWN, fontWeight: '500', marginLeft: 4 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, color: '#aaa', marginTop: 12, fontWeight: '500' },
  emptySub: { fontSize: 13, color: '#ccc', marginTop: 4 },
  modalContainer: { flex: 1, backgroundColor: '#F7F8FA' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 50, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalTitle: { fontSize: 18, fontWeight: '600', color: CHARCOAL },
  modalContent: { padding: 16 },
  detailSection: { marginBottom: 16 },
  detailLabel: { fontSize: 12, color: MUTED_OLIVE, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase' },
  detailValue: { fontSize: 15, color: CHARCOAL },
  detailChatBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: PRIMARY_BROWN, paddingVertical: 14, borderRadius: 12, marginTop: 20 },
  detailChatBtnText: { color: '#fff', fontSize: 15, fontWeight: '600', marginLeft: 8 },
});
