import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert, TextInput, Modal
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

const CASE_TYPE_SHORT = {
  'court-representation': { letter: 'C', color: '#3B82F6', label: 'Court Representation' },
  'legal-advice':         { letter: 'A', color: '#22C55E', label: 'Legal Advice' },
  'legal-document':       { letter: 'D', color: '#F59E0B', label: 'Drafting of Legal Documents' },
};

const getCaseDisplayTitle = (a) => {
  if (a.caseType === 'legal-advice') return 'Legal Advice';
  if (a.caseType === 'legal-document') return 'Drafting';
  return a.caseTitle || 'Untitled';
};

const isCourtCase = (a) => a.caseType !== 'legal-advice' && a.caseType !== 'legal-document';

export default function AssignedCases() {
  const router = useRouter();
  const { userData } = useAuth();
  const [activeTab, setActiveTab] = useState('my-assignments');
  const [myAssignments, setMyAssignments] = useState([]);
  const [assignedByMe, setAssignedByMe] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Review Modal State
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewData, setReviewData] = useState(null);
  const [reviewStep, setReviewStep] = useState(0);

  // Receipt Modal State
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [receiptDetails, setReceiptDetails] = useState(null);

  // Case History Modal State
  const [caseHistoryModalVisible, setCaseHistoryModalVisible] = useState(false);
  const [caseHistoryLoading, setCaseHistoryLoading] = useState(false);
  const [caseHistoryData, setCaseHistoryData] = useState({});

  const isAssigner = ['director', 'secretary'].includes(userData?.role);

  // Fetch data using the correct separate endpoints (matching web)
  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const requests = [apiClient.get('/case-assignments/mine')];
      if (isAssigner) requests.push(apiClient.get('/case-assignments/assigned-by-me'));
      
      const results = await Promise.all(requests);
      setMyAssignments(results[0].data?.data || []);
      if (isAssigner && results[1]) {
        setAssignedByMe(results[1].data?.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
    } finally {
      if (!silent) setLoading(false);
      setRefreshing(false);
    }
  }, [isAssigner]);

  useEffect(() => {
    if (userData) fetchAll();
  }, [userData, fetchAll]);

  // Polling every 30s as fallback (matching web)
  useEffect(() => {
    if (!userData) return;
    const interval = setInterval(() => fetchAll(true), 30000);
    return () => clearInterval(interval);
  }, [userData, fetchAll]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAll();
  }, [fetchAll]);

  // Mark done
  const handleMarkDone = (assignmentId) => {
    Alert.alert(
      'Mark as Done',
      'Are you sure you want to mark this assignment as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setActionLoading(assignmentId);
            try {
              await apiClient.put(`/case-assignments/${assignmentId}/complete`);
              setMyAssignments(prev =>
                prev.map(a => a._id === assignmentId ? { ...a, status: 'done', completedAt: new Date().toISOString() } : a)
              );
              Alert.alert('Success', 'Assignment marked as completed.');
            } catch (error) {
              Alert.alert('Error', 'Failed to update assignment status.');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  // Undo complete (matching web)
  const handleUndo = (assignmentId) => {
    Alert.alert(
      'Undo Completion',
      'Are you sure you want to revert this assignment to pending?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setActionLoading(assignmentId);
            try {
              await apiClient.put(`/case-assignments/${assignmentId}/undo`);
              setMyAssignments(prev =>
                prev.map(a => a._id === assignmentId ? { ...a, status: 'pending', completedAt: null } : a)
              );
              Alert.alert('Success', 'Assignment reverted to pending.');
            } catch (error) {
              Alert.alert('Error', 'Failed to undo completion.');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  // View Review (matching web - loads from finalize endpoint)
  const handleViewReview = async (assignment) => {
    setReviewModalVisible(true);
    setReviewLoading(true);
    setReviewData(null);
    setReviewStep(0);
    try {
      const res = await apiClient.get(`/finalize/detail/${assignment.finalizeId}`);
      setReviewData(res.data);
    } catch (err) {
      Alert.alert('Error', 'Could not load review data');
      setReviewModalVisible(false);
    } finally {
      setReviewLoading(false);
    }
  };

  // View Receipt (matching web - loads client info)
  const handleViewReceipt = async (assignment) => {
    setReceiptModalVisible(true);
    setReceiptLoading(true);
    setReceiptDetails(null);
    try {
      const clientInfoId = assignment.caseId;
      if (!clientInfoId) { setReceiptLoading(false); return; }
      const clientRes = await apiClient.get(`/clientsinfo/${clientInfoId}`);
      setReceiptDetails(clientRes.data);
    } catch (err) {
      console.error('Error fetching receipt data:', err);
    } finally {
      setReceiptLoading(false);
    }
  };

  // View Case History (matching web)
  const handleViewCaseHistory = async (assignment) => {
    setCaseHistoryModalVisible(true);
    setCaseHistoryLoading(true);
    setCaseHistoryData({});
    try {
      const resp = await apiClient.get(`/caserecords/finalize/${assignment.finalizeId}`);
      if (resp.data) setCaseHistoryData(resp.data);
    } catch {
      try {
        const fRes = await apiClient.get(`/finalize/detail/${assignment.finalizeId}`);
        setCaseHistoryData(fRes.data?.content?.caseInfo || {});
      } catch {
        setCaseHistoryData({});
      }
    } finally {
      setCaseHistoryLoading(false);
    }
  };

  // Filter helper (matching web)
  const filterBySearch = (items) => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(a =>
      (a.caseTitle || '').toLowerCase().includes(q) ||
      (a.caseId || '').toLowerCase().includes(q) ||
      (a.clientName || '').toLowerCase().includes(q) ||
      (a.assignedTo?.name || '').toLowerCase().includes(q) ||
      (a.message || '').toLowerCase().includes(q)
    );
  };

  // Separate pending/done lists (matching web's 4-tab structure)
  const filteredMy = useMemo(() => filterBySearch(myAssignments).filter(a => a.status !== 'done'), [myAssignments, searchQuery]);
  const filteredMyCompleted = useMemo(() => filterBySearch(myAssignments).filter(a => a.status === 'done'), [myAssignments, searchQuery]);
  const filteredAssigned = useMemo(() => filterBySearch(assignedByMe).filter(a => a.status !== 'done'), [assignedByMe, searchQuery]);
  const filteredAssignedCompleted = useMemo(() => filterBySearch(assignedByMe).filter(a => a.status === 'done'), [assignedByMe, searchQuery]);

  // Tab definitions (matching web)
  const tabDefs = [
    { value: 'my-assignments', label: 'Assigned', count: filteredMy.length, color: PRIMARY_BROWN },
    { value: 'my-completed', label: 'Completed', count: filteredMyCompleted.length, color: '#22c55e' },
    ...(isAssigner ? [
      { value: 'assigned-by-me', label: 'By Me', count: filteredAssigned.length, color: '#3B82F6' },
      { value: 'assigned-completed', label: 'Done', count: filteredAssignedCompleted.length, color: '#14B8A6' },
    ] : []),
  ];

  const getActiveData = () => {
    switch (activeTab) {
      case 'my-assignments': return filteredMy;
      case 'my-completed': return filteredMyCompleted;
      case 'assigned-by-me': return filteredAssigned;
      case 'assigned-completed': return filteredAssignedCompleted;
      default: return [];
    }
  };

  const activeData = getActiveData();
  const showAssignedBy = activeTab === 'my-assignments' || activeTab === 'my-completed';
  const showAssignedTo = activeTab === 'assigned-by-me' || activeTab === 'assigned-completed';
  const canComplete = activeTab === 'my-assignments';
  const canUndo = activeTab === 'my-completed';

  // ── Assignment Card ──
  const renderAssignmentCard = (assignment) => {
    const isOverdue = assignment.status !== 'done' && new Date(assignment.deadline) < new Date();
    const caseType = CASE_TYPE_SHORT[assignment.caseType];

    return (
      <View key={assignment._id} style={[s.card, { borderLeftColor: assignment.status === 'done' ? '#22c55e' : isOverdue ? '#EF4444' : PRIMARY_BROWN }]}>
        {/* Header: Title + Status */}
        <View style={s.cardHeader}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {caseType && (
              <View style={[s.caseTypeBadge, { backgroundColor: caseType.color }]}>
                <Text style={s.caseTypeLetter}>{caseType.letter}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={s.caseTitle} numberOfLines={2}>{getCaseDisplayTitle(assignment)}</Text>
              <Text style={s.clientName}>{assignment.clientName || '-'}</Text>
            </View>
          </View>
          <View style={s.statusContainer}>
            {assignment.status === 'done' ? (
              <View style={[s.statusIcon, { backgroundColor: '#DCFCE7' }]}>
                <Ionicons name="checkmark" size={14} color="#22c55e" />
              </View>
            ) : isOverdue ? (
              <View style={[s.statusIcon, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="time" size={14} color="#EF4444" />
              </View>
            ) : (
              <View style={[s.statusIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="time" size={14} color="#F59E0B" />
              </View>
            )}
          </View>
        </View>

        {/* Assigned person info */}
        {showAssignedTo && assignment.assignedTo && (
          <View style={s.personRow}>
            <View style={[s.avatar, { backgroundColor: '#D4C5A9' }]}>
              <Text style={s.avatarText}>{assignment.assignedTo?.name?.charAt(0) || '?'}</Text>
            </View>
            <Text style={s.personText}>To: {assignment.assignedTo?.name}</Text>
            {assignment.assignedTo?.role && (
              <View style={s.roleBadge}>
                <Text style={s.roleText}>{assignment.assignedTo.role.replace(/_/g, ' ')}</Text>
              </View>
            )}
          </View>
        )}
        {showAssignedBy && assignment.assignedBy && (
          <View style={s.personRow}>
            <View style={[s.avatar, { backgroundColor: PRIMARY_BROWN }]}>
              <Text style={s.avatarText}>{assignment.assignedBy?.name?.charAt(0) || '?'}</Text>
            </View>
            <Text style={s.personText}>By: {assignment.assignedBy?.name}</Text>
          </View>
        )}

        {/* Message preview */}
        {assignment.message && (
          <Text style={s.messagePreview} numberOfLines={2}>{assignment.message}</Text>
        )}

        {/* Deadline */}
        <View style={s.deadlineRow}>
          <Ionicons name="calendar-outline" size={13} color={isOverdue ? '#EF4444' : MUTED_OLIVE} />
          <Text style={[s.deadlineText, isOverdue && { color: '#EF4444' }]}>
            Due: {new Date(assignment.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </Text>
          {isOverdue && <Text style={s.overdueLabel}>OVERDUE</Text>}
        </View>

        {/* Actions */}
        <View style={s.cardActions}>
          <TouchableOpacity style={s.menuBtn} onPress={() => handleViewReview(assignment)}>
            <Ionicons name="eye-outline" size={15} color={PRIMARY_BROWN} />
            <Text style={s.menuBtnText}>Review</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.menuBtn} onPress={() => handleViewReceipt(assignment)}>
            <Ionicons name="receipt-outline" size={15} color={PRIMARY_BROWN} />
            <Text style={s.menuBtnText}>Receipt</Text>
          </TouchableOpacity>
          {isCourtCase(assignment) && (
            <TouchableOpacity style={s.menuBtn} onPress={() => handleViewCaseHistory(assignment)}>
              <Ionicons name="document-text-outline" size={15} color={PRIMARY_BROWN} />
              <Text style={s.menuBtnText}>History</Text>
            </TouchableOpacity>
          )}
          {canComplete && assignment.status === 'pending' && (
            <TouchableOpacity
              style={[s.menuBtn, s.doneBtn]}
              onPress={() => handleMarkDone(assignment._id)}
              disabled={actionLoading === assignment._id}
            >
              {actionLoading === assignment._id ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={15} color="#fff" />
                  <Text style={s.doneBtnText}>Done</Text>
                </>
              )}
            </TouchableOpacity>
          )}
          {canUndo && assignment.status === 'done' && (
            <TouchableOpacity
              style={[s.menuBtn, s.undoBtn]}
              onPress={() => handleUndo(assignment._id)}
              disabled={actionLoading === assignment._id}
            >
              {actionLoading === assignment._id ? (
                <ActivityIndicator size="small" color={PRIMARY_BROWN} />
              ) : (
                <>
                  <Ionicons name="arrow-undo-outline" size={15} color={PRIMARY_BROWN} />
                  <Text style={s.menuBtnText}>Undo</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // ── Evidence Table (for Review Modal) ──
  const renderEvidenceSection = (title, evidence = []) => {
    if (!evidence || evidence.length === 0) return null;
    const hasContent = evidence.some(e => e.type || e.author || e.purpose || e.issues);
    if (!hasContent) return null;
    return (
      <View style={s.reviewSection}>
        <Text style={s.reviewSectionTitle}>{title}</Text>
        {evidence.map((item, idx) => {
          if (!item.type && !item.author && !item.purpose && !item.issues) return null;
          return (
            <View key={idx} style={s.evidenceCard}>
              {item.type ? <View style={s.evidenceRow}><Text style={s.evidenceLabel}>Type:</Text><Text style={s.evidenceValue}>{item.type}</Text></View> : null}
              {item.author ? <View style={s.evidenceRow}><Text style={s.evidenceLabel}>Author:</Text><Text style={s.evidenceValue}>{item.author}</Text></View> : null}
              {item.purpose ? <View style={s.evidenceRow}><Text style={s.evidenceLabel}>Purpose:</Text><Text style={s.evidenceValue}>{item.purpose}</Text></View> : null}
              {item.issues ? <View style={s.evidenceRow}><Text style={s.evidenceLabel}>Issues:</Text><Text style={s.evidenceValue}>{item.issues}</Text></View> : null}
            </View>
          );
        })}
      </View>
    );
  };

  // ── Review Modal Content ──
  const renderReviewModal = () => (
    <Modal visible={reviewModalVisible} animationType="slide" onRequestClose={() => setReviewModalVisible(false)}>
      <View style={s.modalContainer}>
        {/* Modal Header */}
        <View style={s.modalHeader}>
          <TouchableOpacity onPress={() => setReviewModalVisible(false)} style={s.modalBackBtn}>
            <Ionicons name="arrow-back" size={22} color={CHARCOAL} />
          </TouchableOpacity>
          <Text style={s.modalTitle}>Recommendation for Action</Text>
          <View style={{ width: 32 }} />
        </View>

        {reviewLoading ? (
          <View style={s.centerContainer}><ActivityIndicator size="large" color={PRIMARY_BROWN} /></View>
        ) : reviewData ? (
          <>
            {/* Stepper */}
            <View style={s.stepperContainer}>
              <TouchableOpacity
                style={[s.stepBtn, reviewStep === 0 && s.stepBtnActive]}
                onPress={() => setReviewStep(0)}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={16} color={reviewStep === 0 ? '#fff' : MUTED_OLIVE} />
                <Text style={[s.stepBtnText, reviewStep === 0 && s.stepBtnTextActive]}>Interview</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.stepBtn, reviewStep === 1 && s.stepBtnActive]}
                onPress={() => setReviewStep(1)}
              >
                <Ionicons name="hammer-outline" size={16} color={reviewStep === 1 ? '#fff' : MUTED_OLIVE} />
                <Text style={[s.stepBtnText, reviewStep === 1 && s.stepBtnTextActive]}>Action</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={s.modalScrollContent} showsVerticalScrollIndicator={false}>
              {reviewStep === 0 ? (
                <>
                  {/* Interview Info */}
                  <View style={s.reviewSection}>
                    <Text style={s.reviewSectionTitle}>Client Interview Information</Text>
                    <View style={s.reviewGrid}>
                      <View style={s.reviewField}>
                        <Text style={s.reviewFieldLabel}>Date of Interview</Text>
                        <Text style={s.reviewFieldValue}>{reviewData.content?.interviewInfo?.dateOfInterview || '-'}</Text>
                      </View>
                      <View style={s.reviewField}>
                        <Text style={s.reviewFieldLabel}>Date Submitted</Text>
                        <Text style={s.reviewFieldValue}>{reviewData.content?.interviewInfo?.dateSubmitted || '-'}</Text>
                      </View>
                      <View style={s.reviewField}>
                        <Text style={s.reviewFieldLabel}>Client's Name</Text>
                        <Text style={s.reviewFieldValue}>{reviewData.content?.interviewInfo?.clientName || '-'}</Text>
                      </View>
                      <View style={s.reviewField}>
                        <Text style={s.reviewFieldLabel}>Interviewing Intern/s</Text>
                        <Text style={s.reviewFieldValue}>{reviewData.content?.interviewInfo?.interviewingInterns || '-'}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Fast Facts */}
                  <View style={s.reviewSection}>
                    <Text style={s.reviewSectionTitle}>Fast Facts</Text>
                    <Text style={s.reviewFieldValue}>{reviewData.content?.interviewInfo?.fastFacts || '-'}</Text>
                  </View>

                  {/* Evidence */}
                  {renderEvidenceSection('Evidence for Client(s)', reviewData.content?.interviewInfo?.clientEvidence)}
                  {renderEvidenceSection('Evidence for Adverse Party(ies)', reviewData.content?.interviewInfo?.adversePartyEvidence)}

                  {/* Intern's Advice */}
                  <View style={s.reviewSection}>
                    <Text style={s.reviewSectionTitle}>Intern's Initial Advice</Text>
                    <Text style={s.reviewFieldValue}>{reviewData.content?.interviewInfo?.internAdvice || '-'}</Text>
                  </View>

                  {/* Legal Opinion */}
                  <View style={s.reviewSection}>
                    <Text style={s.reviewSectionTitle}>Legal Opinion</Text>
                    <Text style={s.reviewFieldValue}>{reviewData.content?.interviewInfo?.legalOpinion || '-'}</Text>
                  </View>
                </>
              ) : (
                <>
                  {/* Supervising Lawyer's Comment */}
                  <View style={s.reviewSection}>
                    <Text style={s.reviewSectionTitle}>Supervising Lawyer & Director Action</Text>
                    <Text style={s.reviewSubLabel}>Supervising Lawyer's Comment</Text>
                    <Text style={s.reviewFieldValue}>{reviewData.content?.actionInfo?.supervisingComment || '-'}</Text>
                  </View>

                  {/* Director's Decision */}
                  <View style={s.reviewSection}>
                    <Text style={s.reviewSubLabel}>Director's Decision</Text>
                    <View style={[s.decisionBadge, {
                      backgroundColor: reviewData.decision === 'accepted' ? '#DCFCE7'
                        : reviewData.decision === 'rejected' ? '#FEE2E2' : '#FEF3C7'
                    }]}>
                      <Text style={[s.decisionText, {
                        color: reviewData.decision === 'accepted' ? '#22c55e'
                          : reviewData.decision === 'rejected' ? '#EF4444' : '#F59E0B'
                      }]}>
                        {(reviewData.decision || 'pending').toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  {/* Decision Note */}
                  <View style={s.reviewSection}>
                    <Text style={s.reviewSubLabel}>Decision Note</Text>
                    <Text style={s.reviewFieldValue}>{reviewData.content?.actionInfo?.decisionNote || '-'}</Text>
                  </View>

                  {/* Assignment Details */}
                  <View style={s.reviewSection}>
                    <View style={s.reviewGrid}>
                      <View style={s.reviewField}>
                        <Text style={s.reviewFieldLabel}>Assigned To</Text>
                        <Text style={s.reviewFieldValue}>{reviewData.content?.actionInfo?.assignedTo || '-'}</Text>
                      </View>
                      <View style={s.reviewField}>
                        <Text style={s.reviewFieldLabel}>Supervising Lawyer</Text>
                        <Text style={s.reviewFieldValue}>{reviewData.content?.actionInfo?.supervisingLawyer || '-'}</Text>
                      </View>
                      <View style={s.reviewField}>
                        <Text style={s.reviewFieldLabel}>Director's Signature</Text>
                        <Text style={s.reviewFieldValue}>{reviewData.content?.actionInfo?.directorSignature || '-'}</Text>
                      </View>
                      <View style={s.reviewField}>
                        <Text style={s.reviewFieldLabel}>Signature Date</Text>
                        <Text style={s.reviewFieldValue}>{reviewData.content?.actionInfo?.signatureDate || '-'}</Text>
                      </View>
                    </View>
                  </View>
                </>
              )}

              {/* Step Navigation */}
              <View style={s.stepNavigation}>
                {reviewStep > 0 && (
                  <TouchableOpacity style={s.stepNavBtn} onPress={() => setReviewStep(0)}>
                    <Ionicons name="chevron-back" size={16} color={MUTED_OLIVE} />
                    <Text style={s.stepNavBtnText}>Previous</Text>
                  </TouchableOpacity>
                )}
                <View style={{ flex: 1 }} />
                {reviewStep < 1 && (
                  <TouchableOpacity style={[s.stepNavBtn, s.stepNavBtnPrimary]} onPress={() => setReviewStep(1)}>
                    <Text style={s.stepNavBtnPrimaryText}>Next Step</Text>
                    <Ionicons name="chevron-forward" size={16} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>
              <View style={{ height: 30 }} />
            </ScrollView>
          </>
        ) : (
          <View style={s.centerContainer}><Text style={{ color: MUTED_OLIVE }}>No review data available</Text></View>
        )}
      </View>
    </Modal>
  );

  // ── Receipt Modal Content ──
  const renderReceiptModal = () => {
    const d = receiptDetails;
    const statusLabel = d?.status
      ? d.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      : 'N/A';

    const renderField = (label, value) => (
      <View style={s.receiptField}>
        <Text style={s.receiptFieldLabel}>{label}</Text>
        <Text style={s.receiptFieldValue}>{value || 'N/A'}</Text>
      </View>
    );

    return (
      <Modal visible={receiptModalVisible} animationType="slide" onRequestClose={() => setReceiptModalVisible(false)}>
        <View style={s.modalContainer}>
          <View style={s.modalHeader}>
            <TouchableOpacity onPress={() => setReceiptModalVisible(false)} style={s.modalBackBtn}>
              <Ionicons name="arrow-back" size={22} color={CHARCOAL} />
            </TouchableOpacity>
            <Text style={s.modalTitle}>Appointment Receipt</Text>
            <View style={{ width: 32 }} />
          </View>

          {receiptLoading ? (
            <View style={s.centerContainer}><ActivityIndicator size="large" color={PRIMARY_BROWN} /></View>
          ) : d ? (
            <ScrollView style={s.modalScrollContent} showsVerticalScrollIndicator={false}>
              {/* Status Banner */}
              <View style={s.receiptBanner}>
                <Text style={s.receiptBannerTitle}>
                  {d.caseDetails?.appointmentType || d.personal?.legalMatter || 'Appointment'}
                </Text>
                <View style={s.receiptStatusBadge}>
                  <Text style={s.receiptStatusText}>{statusLabel}</Text>
                </View>
                <Text style={s.receiptCaseNumber}>Case #{d.caseNumber || 'N/A'}</Text>
              </View>

              {/* Personal Details */}
              <View style={s.receiptSectionCard}>
                <Text style={s.receiptSectionTitle}>Personal Details</Text>
                <View style={s.receiptDivider} />
                {renderField('Name', d.fullName || d.name)}
                {renderField('Age', d.age != null ? String(d.age) : null)}
                {renderField('Birthday', d.birthday ? new Date(d.birthday).toLocaleDateString() : null)}
                {renderField('Sex', d.sex)}
                {renderField('Civil Status', d.civilStatus)}
                {renderField('Citizenship', d.citizenship)}
                {renderField('Contact Number', d.contactNumber)}
                {renderField('Email', d.email)}
                {renderField('Present Address', d.presentAddress)}
                {renderField('Permanent Address', d.permanentAddress)}
                {renderField('Spouse Name', d.spouseName)}
                {renderField('Relator Name', d.relatorName)}
                {renderField('Relator Contact', d.relatorContactNumber)}
              </View>

              {/* Schedule Details */}
              <View style={s.receiptSectionCard}>
                <Text style={s.receiptSectionTitle}>Schedule Details</Text>
                <View style={s.receiptDivider} />
                {renderField('Status', statusLabel)}
                {renderField('Appointment Date', d.appointedDate
                  ? new Date(d.appointedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                  : null
                )}
                {renderField('Appointment Time', d.appointmentTime)}
              </View>

              {/* Financial Details */}
              <View style={s.receiptSectionCard}>
                <Text style={s.receiptSectionTitle}>Financial Details</Text>
                <View style={s.receiptDivider} />
                {renderField('Income Source', d.currentSourceOfIncome)}
                {renderField('Monthly Income', d.monthlyIncome ? `₱${Number(d.monthlyIncome).toLocaleString()}` : null)}
                {renderField('Nature of Work', d.natureOfWork)}
                {renderField('Employer', d.employerName)}
                {renderField('Employer Address', d.employerAddress)}
              </View>

              {/* Case Details */}
              <View style={s.receiptSectionCard}>
                <Text style={s.receiptSectionTitle}>Case Details</Text>
                <View style={s.receiptDivider} />
                {renderField('Party Represented', d.partyRepresented)}
                {renderField('Case Number', d.caseNumber)}
                {renderField('Case Nature', d.caseNature || d.natureOfCase)}
                {renderField('Appointment Type', d.caseDetails?.appointmentType || d.personal?.legalMatter || d.appointmentType)}
                {renderField('Venue', d.venue)}
                {renderField('Present Stage', d.presentStage)}
                {renderField('Court Division', d.courtDivision)}
                {renderField('Court Address', d.courtAddress)}
                {renderField('Court Phone', d.courtPhoneNumber)}
                {renderField('Presiding Officer', d.presidingOfficer)}
                {renderField('Case Description', d.caseDescription)}
              </View>

              {/* Adverse Party */}
              <View style={s.receiptSectionCard}>
                <Text style={s.receiptSectionTitle}>Adverse Party</Text>
                <View style={s.receiptDivider} />
                {renderField('Adverse Party(ies)', d.adverseParty)}
                {renderField('Address', d.adversePartyAddress)}
                {renderField('Phone Number', d.adversePartyPhone)}
                {renderField('Counsel', d.adversePartyCounsel)}
                {renderField('Counsel Address', d.adversePartyCounselAddress)}
                {renderField('Counsel Phone', d.adversePartyCounselPhone)}
              </View>

              <View style={{ height: 30 }} />
            </ScrollView>
          ) : (
            <View style={s.centerContainer}><Text style={{ color: MUTED_OLIVE }}>No appointment details available</Text></View>
          )}
        </View>
      </Modal>
    );
  };

  // ── Case History Modal Content ──
  const renderCaseHistoryModal = () => {
    const d = caseHistoryData;

    const renderField = (label, value) => (
      <View style={s.receiptField}>
        <Text style={s.receiptFieldLabel}>{label}</Text>
        <Text style={s.receiptFieldValue}>{value || 'N/A'}</Text>
      </View>
    );

    return (
      <Modal visible={caseHistoryModalVisible} animationType="slide" onRequestClose={() => setCaseHistoryModalVisible(false)}>
        <View style={s.modalContainer}>
          <View style={s.modalHeader}>
            <TouchableOpacity onPress={() => setCaseHistoryModalVisible(false)} style={s.modalBackBtn}>
              <Ionicons name="arrow-back" size={22} color={CHARCOAL} />
            </TouchableOpacity>
            <Text style={s.modalTitle}>Case Record</Text>
            <View style={{ width: 32 }} />
          </View>

          {caseHistoryLoading ? (
            <View style={s.centerContainer}><ActivityIndicator size="large" color={PRIMARY_BROWN} /></View>
          ) : d && Object.keys(d).length > 0 ? (
            <ScrollView style={s.modalScrollContent} showsVerticalScrollIndicator={false}>
              <View style={s.receiptSectionCard}>
                <Text style={s.receiptSectionTitle}>Case Information</Text>
                <View style={s.receiptDivider} />
                {renderField('Case Number', d.caseNumber)}
                {renderField('Case Title', d.caseTitle)}
                {renderField('Court/Branch', d.courtBranch || d.court)}
                {renderField('Nature of Case', d.natureOfCase)}
                {renderField('Case Type', d.caseType)}
                {renderField('Date Filed', d.dateFiled ? new Date(d.dateFiled).toLocaleDateString() : null)}
                {renderField('Status', d.status)}
                {renderField('Client Name', d.clientName)}
                {renderField('Opposing Party', d.opposingParty)}
                {renderField('Opposing Counsel', d.opposingCounsel)}
                {renderField('Judge', d.judge || d.presidingJudge)}
                {renderField('Summary', d.summary || d.caseSummary)}
              </View>

              {/* Hearing History */}
              {d.hearings && d.hearings.length > 0 && (
                <View style={s.receiptSectionCard}>
                  <Text style={s.receiptSectionTitle}>Hearing History</Text>
                  <View style={s.receiptDivider} />
                  {d.hearings.map((h, idx) => (
                    <View key={idx} style={s.evidenceCard}>
                      {renderField('Date', h.date ? new Date(h.date).toLocaleDateString() : null)}
                      {renderField('Type', h.type)}
                      {renderField('Notes', h.notes || h.remarks)}
                      {renderField('Status', h.status)}
                    </View>
                  ))}
                </View>
              )}

              {/* Notes */}
              {d.notes && (
                <View style={s.receiptSectionCard}>
                  <Text style={s.receiptSectionTitle}>Notes</Text>
                  <View style={s.receiptDivider} />
                  <Text style={s.reviewFieldValue}>{d.notes}</Text>
                </View>
              )}

              <View style={{ height: 30 }} />
            </ScrollView>
          ) : (
            <View style={s.centerContainer}><Text style={{ color: MUTED_OLIVE }}>No case record available</Text></View>
          )}
        </View>
      </Modal>
    );
  };

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Assigned Cases</Text>
          <Text style={s.headerSubtitle}>View and manage your case assignments</Text>
        </View>
        <TouchableOpacity onPress={() => fetchAll()} style={s.refreshBtn}>
          <Ionicons name="refresh-outline" size={20} color={PRIMARY_BROWN} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabScrollContainer} contentContainerStyle={s.tabContainer}>
        {tabDefs.map(tab => (
          <TouchableOpacity
            key={tab.value}
            style={[s.tab, activeTab === tab.value && s.tabActive]}
            onPress={() => setActiveTab(tab.value)}
          >
            <Text style={[s.tabText, activeTab === tab.value && s.tabTextActive]}>{tab.label}</Text>
            {tab.count > 0 && (
              <View style={[s.tabBadge, { backgroundColor: activeTab === tab.value ? '#fff' : tab.color }]}>
                <Text style={[s.tabBadgeText, { color: activeTab === tab.value ? PRIMARY_BROWN : '#fff' }]}>
                  {tab.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Search */}
      <View style={s.searchContainer}>
        <View style={s.searchInputContainer}>
          <Ionicons name="search-outline" size={18} color={MUTED_OLIVE} />
          <TextInput
            style={s.searchInput}
            placeholder="Search by title, client, assignee..."
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
          {activeData.length > 0 ? (
            <>
              <Text style={s.resultCount}>
                {activeData.length} assignment{activeData.length !== 1 ? 's' : ''}
              </Text>
              {activeData.map(renderAssignmentCard)}
            </>
          ) : (
            <View style={s.emptyContainer}>
              <Ionicons name="folder-open-outline" size={48} color="#ccc" />
              <Text style={s.emptyTitle}>No Assignments Found</Text>
              <Text style={s.emptyText}>
                {activeTab === 'my-assignments' ? 'No pending cases assigned to you.'
                  : activeTab === 'my-completed' ? 'No completed assignments yet.'
                  : activeTab === 'assigned-by-me' ? "You haven't assigned any pending cases."
                  : 'No completed assigned cases.'}
              </Text>
            </View>
          )}
          <View style={{ height: 20 }} />
        </ScrollView>
      )}

      {/* Modals */}
      {renderReviewModal()}
      {renderReceiptModal()}
      {renderCaseHistoryModal()}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: CHARCOAL },
  headerSubtitle: { fontSize: 12, color: MUTED_OLIVE, marginTop: 2 },
  refreshBtn: { padding: 8, borderRadius: 8, backgroundColor: `${PRIMARY_BROWN}10` },

  // Tabs
  tabScrollContainer: { backgroundColor: '#fff', maxHeight: 52 },
  tabContainer: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  tab: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: 10, backgroundColor: '#f5f5f5', gap: 6,
  },
  tabActive: { backgroundColor: PRIMARY_BROWN },
  tabText: { fontSize: 13, fontWeight: '600', color: MUTED_OLIVE },
  tabTextActive: { color: '#fff' },
  tabBadge: { minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  tabBadgeText: { fontSize: 11, fontWeight: '700' },

  // Search
  searchContainer: { paddingHorizontal: 16, paddingVertical: 8 },
  searchInputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 10, paddingHorizontal: 12, height: 44,
    borderWidth: 1, borderColor: '#E0E0E0', gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: CHARCOAL },

  // Content
  scrollContent: { flex: 1, paddingHorizontal: 16 },
  resultCount: { fontSize: 12, color: MUTED_OLIVE, marginBottom: 8, marginTop: 4 },

  // Card
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: '#f0f0f0', borderLeftWidth: 4,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 },
  caseTypeBadge: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  caseTypeLetter: { fontSize: 12, fontWeight: '700', color: '#fff' },
  caseTitle: { fontSize: 15, fontWeight: '700', color: CHARCOAL },
  clientName: { fontSize: 13, color: MUTED_OLIVE, marginTop: 2 },
  statusContainer: { marginLeft: 8 },
  statusIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },

  personRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  avatar: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  personText: { fontSize: 12, color: MUTED_OLIVE, flex: 1 },
  roleBadge: { backgroundColor: '#f0f0f0', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  roleText: { fontSize: 10, color: MUTED_OLIVE, textTransform: 'capitalize' },

  messagePreview: { fontSize: 12, color: MUTED_OLIVE, marginBottom: 6 },

  deadlineRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 },
  deadlineText: { fontSize: 12, fontWeight: '500', color: MUTED_OLIVE },
  overdueLabel: { fontSize: 10, fontWeight: '700', color: '#EF4444', backgroundColor: '#FEE2E2', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, marginLeft: 4 },

  cardActions: { flexDirection: 'row', gap: 8, borderTopWidth: 1, borderTopColor: '#f5f5f5', paddingTop: 10, flexWrap: 'wrap' },
  menuBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8,
    backgroundColor: `${PRIMARY_BROWN}10`,
  },
  menuBtnText: { fontSize: 12, fontWeight: '600', color: PRIMARY_BROWN },
  doneBtn: { backgroundColor: '#22c55e' },
  doneBtnText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  undoBtn: { backgroundColor: `${PRIMARY_BROWN}15`, borderWidth: 1, borderColor: `${PRIMARY_BROWN}30` },

  // Empty
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: CHARCOAL, marginTop: 12 },
  emptyText: { fontSize: 13, color: MUTED_OLIVE, textAlign: 'center', marginTop: 4 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Modal
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  modalBackBtn: { padding: 4 },
  modalTitle: { fontSize: 17, fontWeight: '700', color: CHARCOAL },
  modalScrollContent: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },

  // Stepper
  stepperContainer: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 8, backgroundColor: '#FAFAFA' },
  stepBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 10, backgroundColor: '#f5f5f5',
  },
  stepBtnActive: { backgroundColor: PRIMARY_BROWN },
  stepBtnText: { fontSize: 13, fontWeight: '600', color: MUTED_OLIVE },
  stepBtnTextActive: { color: '#fff' },

  // Review
  reviewSection: { marginBottom: 16, backgroundColor: '#FAFAFA', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#f0f0f0' },
  reviewSectionTitle: { fontSize: 14, fontWeight: '700', color: PRIMARY_BROWN, marginBottom: 10 },
  reviewSubLabel: { fontSize: 13, fontWeight: '600', color: PRIMARY_BROWN, marginBottom: 6 },
  reviewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  reviewField: { width: '47%', marginBottom: 8 },
  reviewFieldLabel: { fontSize: 11, color: MUTED_OLIVE, textTransform: 'uppercase', fontWeight: '600', marginBottom: 2 },
  reviewFieldValue: { fontSize: 14, color: CHARCOAL },

  decisionBadge: { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  decisionText: { fontSize: 13, fontWeight: '700' },

  stepNavigation: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  stepNavBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, borderColor: '#E0E0E0',
  },
  stepNavBtnText: { fontSize: 13, fontWeight: '600', color: MUTED_OLIVE },
  stepNavBtnPrimary: { backgroundColor: PRIMARY_BROWN, borderColor: PRIMARY_BROWN },
  stepNavBtnPrimaryText: { fontSize: 13, fontWeight: '600', color: '#fff' },

  // Evidence
  evidenceCard: { backgroundColor: '#fff', padding: 10, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#f0f0f0' },
  evidenceRow: { flexDirection: 'row', marginBottom: 4, gap: 6 },
  evidenceLabel: { fontSize: 12, fontWeight: '600', color: MUTED_OLIVE, width: 60 },
  evidenceValue: { fontSize: 12, color: CHARCOAL, flex: 1 },

  // Receipt
  receiptBanner: {
    backgroundColor: `${PRIMARY_GOLD}15`, borderWidth: 1, borderColor: PRIMARY_GOLD,
    padding: 14, borderRadius: 12, marginBottom: 16,
  },
  receiptBannerTitle: { fontSize: 16, fontWeight: '700', color: PRIMARY_BROWN },
  receiptStatusBadge: { backgroundColor: PRIMARY_GOLD, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6, marginTop: 6 },
  receiptStatusText: { fontSize: 12, fontWeight: '600', color: CHARCOAL },
  receiptCaseNumber: { fontSize: 12, color: MUTED_OLIVE, marginTop: 6 },

  receiptSectionCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#f0f0f0',
  },
  receiptSectionTitle: { fontSize: 15, fontWeight: '700', color: CHARCOAL, marginBottom: 8 },
  receiptDivider: { height: 1, backgroundColor: '#f0f0f0', marginBottom: 12 },
  receiptField: { marginBottom: 10 },
  receiptFieldLabel: { fontSize: 11, color: MUTED_OLIVE, textTransform: 'uppercase', fontWeight: '600', marginBottom: 2 },
  receiptFieldValue: { fontSize: 14, color: CHARCOAL, fontWeight: '500' },
});
