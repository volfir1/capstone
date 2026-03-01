import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert, TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from 'context/authContext';
import apiClient from '../../api/apiClient';

const PRIMARY_BROWN = '#8B4513';
const PRIMARY_GOLD = '#C4AB7D';
const CHARCOAL = '#2C2C2C';
const MUTED_OLIVE = '#6B6B5A';
const BG = '#F7F8FA';

export default function AssignedCases() {
  const router = useRouter();
  const { userData } = useAuth();
  const [activeTab, setActiveTab] = useState('assignedToMe');
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAssignments = useCallback(async () => {
    try {
      const response = await apiClient.get('/case-assignments');
      setAssignments(response.data?.data || response.data || []);
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAssignments();
  }, [fetchAssignments]);

  const handleMarkDone = async (assignmentId) => {
    Alert.alert(
      'Mark as Done',
      'Are you sure you want to mark this assignment as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await apiClient.put(`/case-assignments/${assignmentId}/complete`);
              Alert.alert('Success', 'Assignment marked as completed.');
              fetchAssignments();
            } catch (error) {
              Alert.alert('Error', 'Failed to update assignment status.');
            }
          },
        },
      ]
    );
  };

  const filteredAssignments = assignments.filter(a => {
    const matchesTab = activeTab === 'assignedToMe'
      ? a.assignedTo?._id === userData?._id || a.assignedTo === userData?._id
      : a.assignedBy?._id === userData?._id || a.assignedBy === userData?._id;
    
    if (!searchQuery) return matchesTab;
    const q = searchQuery.toLowerCase();
    return matchesTab && (
      (a.caseId?.caseNumber || '').toLowerCase().includes(q) ||
      (a.caseId?.clientName || '').toLowerCase().includes(q) ||
      (a.assignedTo?.firstName || '').toLowerCase().includes(q) ||
      (a.assignedBy?.firstName || '').toLowerCase().includes(q)
    );
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#22c55e';
      case 'in-progress': return '#f59e0b';
      case 'pending': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const renderAssignmentCard = (assignment) => (
    <View key={assignment._id} style={s.card}>
      <View style={s.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={s.caseNumber}>
            {assignment.caseId?.caseNumber || 'No Case Number'}
          </Text>
          <Text style={s.clientName}>
            {assignment.caseId?.clientName || assignment.clientInfo?.fullName || 'Unknown Client'}
          </Text>
        </View>
        <View style={[s.statusBadge, { backgroundColor: getStatusColor(assignment.status) + '20' }]}>
          <Text style={[s.statusText, { color: getStatusColor(assignment.status) }]}>
            {assignment.status || 'pending'}
          </Text>
        </View>
      </View>

      <View style={s.cardDetails}>
        {activeTab === 'assignedToMe' && assignment.assignedBy && (
          <View style={s.detailRow}>
            <Ionicons name="person-outline" size={14} color={MUTED_OLIVE} />
            <Text style={s.detailText}>
              Assigned by: {assignment.assignedBy?.firstName} {assignment.assignedBy?.lastName}
            </Text>
          </View>
        )}
        {activeTab === 'assignedByMe' && assignment.assignedTo && (
          <View style={s.detailRow}>
            <Ionicons name="person-outline" size={14} color={MUTED_OLIVE} />
            <Text style={s.detailText}>
              Assigned to: {assignment.assignedTo?.firstName} {assignment.assignedTo?.lastName}
            </Text>
          </View>
        )}
        {assignment.createdAt && (
          <View style={s.detailRow}>
            <Ionicons name="calendar-outline" size={14} color={MUTED_OLIVE} />
            <Text style={s.detailText}>
              {new Date(assignment.createdAt).toLocaleDateString()}
            </Text>
          </View>
        )}
        {assignment.caseId?.natureOfCase && (
          <View style={s.detailRow}>
            <Ionicons name="document-text-outline" size={14} color={MUTED_OLIVE} />
            <Text style={s.detailText}>{assignment.caseId.natureOfCase}</Text>
          </View>
        )}
      </View>

      <View style={s.cardActions}>
        {assignment.reviewId && (
          <TouchableOpacity
            style={s.actionBtn}
            onPress={() => router.push(`/admin/recommendation?caseId=${assignment.reviewId}`)}
          >
            <Ionicons name="eye-outline" size={16} color={PRIMARY_BROWN} />
            <Text style={s.actionBtnText}>View Review</Text>
          </TouchableOpacity>
        )}
        {activeTab === 'assignedToMe' && assignment.status !== 'completed' && (
          <TouchableOpacity
            style={[s.actionBtn, s.actionBtnPrimary]}
            onPress={() => handleMarkDone(assignment._id)}
          >
            <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
            <Text style={[s.actionBtnText, { color: '#fff' }]}>Mark Done</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Assigned Cases</Text>
        <TouchableOpacity onPress={() => router.push('/admin/analytics')}>
          <Ionicons name="analytics-outline" size={24} color={PRIMARY_BROWN} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={s.tabContainer}>
        <TouchableOpacity
          style={[s.tab, activeTab === 'assignedToMe' && s.tabActive]}
          onPress={() => setActiveTab('assignedToMe')}
        >
          <Text style={[s.tabText, activeTab === 'assignedToMe' && s.tabTextActive]}>
            Assigned to Me
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tab, activeTab === 'assignedByMe' && s.tabActive]}
          onPress={() => setActiveTab('assignedByMe')}
        >
          <Text style={[s.tabText, activeTab === 'assignedByMe' && s.tabTextActive]}>
            Assigned by Me
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={s.searchContainer}>
        <View style={s.searchInputContainer}>
          <Ionicons name="search-outline" size={18} color={MUTED_OLIVE} />
          <TextInput
            style={s.searchInput}
            placeholder="Search cases..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={MUTED_OLIVE} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={s.centerContainer}>
          <ActivityIndicator size="large" color={PRIMARY_BROWN} />
        </View>
      ) : (
        <ScrollView
          style={s.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[PRIMARY_BROWN]} />}
        >
          {filteredAssignments.length > 0 ? (
            <>
              <Text style={s.resultCount}>
                {filteredAssignments.length} assignment{filteredAssignments.length !== 1 ? 's' : ''}
              </Text>
              {filteredAssignments.map(renderAssignmentCard)}
            </>
          ) : (
            <View style={s.emptyContainer}>
              <Ionicons name="folder-open-outline" size={48} color="#ccc" />
              <Text style={s.emptyTitle}>No Assignments Found</Text>
              <Text style={s.emptyText}>
                {activeTab === 'assignedToMe'
                  ? 'No cases have been assigned to you yet.'
                  : 'You haven\'t assigned any cases yet.'}
              </Text>
            </View>
          )}
          <View style={{ height: 20 }} />
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: CHARCOAL },
  tabContainer: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#fff', gap: 8 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: '#f5f5f5' },
  tabActive: { backgroundColor: PRIMARY_BROWN },
  tabText: { fontSize: 13, fontWeight: '600', color: MUTED_OLIVE },
  tabTextActive: { color: '#fff' },
  searchContainer: { paddingHorizontal: 16, paddingVertical: 8 },
  searchInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 12, height: 44, borderWidth: 1, borderColor: '#E0E0E0', gap: 8 },
  searchInput: { flex: 1, fontSize: 14, color: CHARCOAL },
  scrollContent: { flex: 1, paddingHorizontal: 16 },
  resultCount: { fontSize: 12, color: MUTED_OLIVE, marginBottom: 8, marginTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#f0f0f0' },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 },
  caseNumber: { fontSize: 15, fontWeight: '700', color: CHARCOAL },
  clientName: { fontSize: 13, color: MUTED_OLIVE, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  cardDetails: { marginBottom: 10 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  detailText: { fontSize: 12, color: MUTED_OLIVE },
  cardActions: { flexDirection: 'row', gap: 8, borderTopWidth: 1, borderTopColor: '#f5f5f5', paddingTop: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: `${PRIMARY_BROWN}10` },
  actionBtnPrimary: { backgroundColor: PRIMARY_BROWN },
  actionBtnText: { fontSize: 12, fontWeight: '600', color: PRIMARY_BROWN },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: CHARCOAL, marginTop: 12 },
  emptyText: { fontSize: 13, color: MUTED_OLIVE, textAlign: 'center', marginTop: 4 },
});
