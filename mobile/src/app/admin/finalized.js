import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert, TextInput, Modal,
  KeyboardAvoidingView, Platform, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from 'context/authContext';
import apiClient from '../../api/apiClient';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import DateTimePicker from '@react-native-community/datetimepicker';

const PRIMARY_BROWN = '#8B4513';
const PRIMARY_GOLD = '#C4AB7D';
const CHARCOAL = '#2C2C2C';
const MUTED_OLIVE = '#6B6B5A';
const BG = '#F7F8FA';

const CASE_TYPE_META = {
  'court-representation': { letter: 'C', color: '#3B82F6', label: 'Court Representation' },
  'legal-advice':         { letter: 'A', color: '#22C55E', label: 'Legal Advice' },
  'legal-document':       { letter: 'D', color: '#F59E0B', label: 'Document Drafting' },
};

const REJECTED_FILTER_OPTIONS = [
  { value: 'all', label: 'All Case Types' },
  { value: 'court-representation', label: 'Court Representation' },
  { value: 'legal-document', label: 'Drafting of Legal Document' },
  { value: 'legal-advice', label: 'Legal Advice' },
];

// ── Helpers ──
const isLegalAdvice = (record) => record?.content?.interviewInfo?.caseType === 'legal-advice';
const isDocumentDrafting = (record) => record?.content?.interviewInfo?.caseType === 'legal-document';

const formatDate = (value) => {
  if (!value) return '-';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

const formatShortDate = (value) => {
  if (!value) return 'No Date';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function FinalizedCases() {
  const router = useRouter();
  const { userData } = useAuth();
  const canAssignCases = ['director', 'secretary'].includes(userData?.role);

  // Core data
  const [finalized, setFinalized] = useState([]);
  const [caseRecordsMap, setCaseRecordsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('with-record');
  const [rejectedCaseTypeFilter, setRejectedCaseTypeFilter] = useState('all');

  // Review Modal
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewData, setReviewData] = useState(null);
  const [reviewStep, setReviewStep] = useState(0);

  // Receipt Modal
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [receiptDetails, setReceiptDetails] = useState(null);

  // Case Record Modal
  const [caseRecordModalVisible, setCaseRecordModalVisible] = useState(false);
  const [caseRecordLoading, setCaseRecordLoading] = useState(false);
  const [caseRecordData, setCaseRecordData] = useState(null);
  const [originalCaseRecordData, setOriginalCaseRecordData] = useState(null);
  const [caseRecordEditMode, setCaseRecordEditMode] = useState(false);
  const [savingCaseRecord, setSavingCaseRecord] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState(null);

  // Version History Modal
  const [versionModalVisible, setVersionModalVisible] = useState(false);
  const [versionCase, setVersionCase] = useState(null);

  // Assign Case Modal
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [assignTargetCase, setAssignTargetCase] = useState(null);
  const [adminStaff, setAdminStaff] = useState([]);
  const [assignForm, setAssignForm] = useState({ assigneeId: '', deadline: '', message: '' });
  const [assignLoading, setAssignLoading] = useState(false);
  const [showStaffPicker, setShowStaffPicker] = useState(false);
  const [showDeadlinePicker, setShowDeadlinePicker] = useState(false);

  // Action Menu
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuCase, setMenuCase] = useState(null);

  // ── Fetch ──
  useEffect(() => { fetchFinalized(); }, []);

  // Fetch admin staff on mount for assign feature
  useEffect(() => {
    if (canAssignCases) {
      apiClient.get('/case-assignments/admin-staff')
        .then(r => setAdminStaff(r.data?.data || r.data || []))
        .catch(() => {});
    }
  }, [canAssignCases]);

  const fetchFinalized = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const resp = await apiClient.get('/finalize');
      const data = resp.data?.data ?? resp.data ?? [];
      const finalizedData = Array.isArray(data) ? data : [];

      // Normalize forLegalAdvice flag
      const normalized = finalizedData.map((item) => {
        if (item?.content?.interviewInfo) {
          const flag = item.content.interviewInfo.forLegalAdvice;
          const normalizedFlag = flag === true || flag === 'true' || flag === 1 || flag === '1';
          return {
            ...item,
            content: { ...item.content, interviewInfo: { ...item.content.interviewInfo, forLegalAdvice: normalizedFlag } },
          };
        }
        return item;
      });

      setFinalized(normalized);

      // Bulk-check case records (matching web — single POST instead of N requests)
      const accepted = normalized.filter(f => f.decision === 'accepted');
      let recordsMap = {};

      if (accepted.length > 0) {
        try {
          const ids = accepted.map(f => f._id || f.id);
          const bulkResp = await apiClient.post('/caserecords/finalize/bulk', { ids });
          recordsMap = bulkResp.data?.data || bulkResp.data || {};
        } catch {
          accepted.forEach(f => { recordsMap[f._id || f.id] = false; });
        }
      }

      setCaseRecordsMap(recordsMap);
    } catch (err) {
      console.error('Error fetching finalized records', err);
      setFinalized([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchFinalized();
  }, [fetchFinalized]);

  // ── Filtering (matching web logic) ──
  const filterBySearch = useCallback((cases) => {
    if (!searchTerm.trim()) return cases;
    const q = searchTerm.toLowerCase().trim();
    return cases.filter(f => {
      const caseId = (f.caseId || '').toLowerCase();
      const clientName = (f.clientName || f.content?.interviewInfo?.clientName || '').toLowerCase();
      return caseId.includes(q) || clientName.includes(q);
    });
  }, [searchTerm]);

  const { acceptedWithRecord, acceptedWithoutRecord, legalAdviceCases, documentDraftingCases, rejectedCases } = useMemo(() => {
    const accepted = filterBySearch(finalized.filter(f => f.decision === 'accepted'));
    const courtRep = accepted.filter(f => !isLegalAdvice(f) && !isDocumentDrafting(f));

    // Rejected with own search + case type filter
    let rejected = finalized.filter(f => f.decision === 'rejected');
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      rejected = rejected.filter(f => {
        const caseId = (f.caseId || '').toLowerCase();
        const clientName = (f.clientName || f.content?.interviewInfo?.clientName || '').toLowerCase();
        return caseId.includes(q) || clientName.includes(q);
      });
    }
    if (rejectedCaseTypeFilter !== 'all') {
      rejected = rejected.filter(f => (f.content?.interviewInfo?.caseType || '') === rejectedCaseTypeFilter);
    }

    return {
      acceptedWithRecord: courtRep.filter(f => caseRecordsMap[f._id || f.id]),
      acceptedWithoutRecord: courtRep.filter(f => !caseRecordsMap[f._id || f.id]),
      legalAdviceCases: accepted.filter(isLegalAdvice),
      documentDraftingCases: accepted.filter(isDocumentDrafting),
      rejectedCases: rejected,
    };
  }, [finalized, caseRecordsMap, filterBySearch, searchTerm, rejectedCaseTypeFilter]);

  // Tab definitions (matching web's 5-tab structure)
  const tabDefs = [
    { value: 'with-record', label: 'With Record', count: acceptedWithRecord.length, color: '#22C55E' },
    { value: 'without-record', label: 'Without Record', count: acceptedWithoutRecord.length, color: '#3B82F6' },
    { value: 'legal-advice', label: 'Legal Advice', count: legalAdviceCases.length, color: '#14B8A6' },
    { value: 'document-drafting', label: 'Doc Drafting', count: documentDraftingCases.length, color: '#8B5CF6' },
    { value: 'rejected', label: 'Rejected', count: rejectedCases.length, color: '#EF4444' },
  ];

  const getActiveData = () => {
    switch (activeTab) {
      case 'with-record': return acceptedWithRecord;
      case 'without-record': return acceptedWithoutRecord;
      case 'legal-advice': return legalAdviceCases;
      case 'document-drafting': return documentDraftingCases;
      case 'rejected': return rejectedCases;
      default: return [];
    }
  };

  const activeData = getActiveData();

  // ── Actions ──
  const handleViewReview = async (caseData) => {
    setMenuVisible(false);
    setReviewModalVisible(true);
    setReviewLoading(true);
    setReviewData(null);
    setReviewStep(0);
    try {
      const res = await apiClient.get(`/finalize/detail/${caseData._id || caseData.id}`);
      setReviewData(res.data);
    } catch {
      Alert.alert('Error', 'Could not load review data');
      setReviewModalVisible(false);
    } finally {
      setReviewLoading(false);
    }
  };

  const handleViewReceipt = async (caseData) => {
    setMenuVisible(false);
    setReceiptModalVisible(true);
    setReceiptLoading(true);
    setReceiptDetails(null);
    try {
      const clientInfoId = caseData.caseId;
      if (!clientInfoId) { setReceiptLoading(false); return; }
      const res = await apiClient.get(`/clientsinfo/${clientInfoId}`);
      setReceiptDetails(res.data);
    } catch {
      Alert.alert('Error', 'Failed to load appointment receipt');
    } finally {
      setReceiptLoading(false);
    }
  };

  const openCaseRecord = async (caseData) => {
    setMenuVisible(false);
    setCaseRecordLoading(true);
    setCaseRecordData({});
    setOriginalCaseRecordData({});
    setCaseRecordEditMode(false);
    const caseId = caseData._id || caseData.id;
    setSelectedCaseId(caseId);
    try {
      const resp = await apiClient.get(`/caserecords/finalize/${caseId}`);
      if (resp.data && Object.keys(resp.data).length > 0) {
        const normalized = normalizeCaseRecordData(resp.data);
        setCaseRecordData(normalized);
        setOriginalCaseRecordData(normalized);
      } else {
        const fallback = normalizeCaseRecordData(caseData.content?.caseInfo || {});
        setCaseRecordData(fallback);
        setOriginalCaseRecordData(fallback);
      }
    } catch {
      const fallback = normalizeCaseRecordData(caseData.content?.caseInfo || {});
      setCaseRecordData(fallback);
      setOriginalCaseRecordData(fallback);
    } finally {
      setCaseRecordLoading(false);
      setCaseRecordModalVisible(true);
    }
  };

  const normalizeCaseRecordData = (data = {}) => {
    const n = { ...data };
    if (n.caseTitle && !n.title) n.title = n.caseTitle;
    if (n.caseType && !n.nature) n.nature = n.caseType;
    if (n.summary && !n.caseHistory) n.caseHistory = n.summary;
    return n;
  };

  const handleSaveCaseRecord = async () => {
    if (!selectedCaseId) { Alert.alert('Error', 'No case selected'); return; }
    setSavingCaseRecord(true);
    try {
      const resp = await apiClient.put(`/caserecords/finalize/${selectedCaseId}`, caseRecordData || {});
      if (resp.data) {
        Alert.alert('Saved', 'Case record saved successfully');
        const updated = normalizeCaseRecordData(resp.data || caseRecordData);
        setCaseRecordData(updated);
        setOriginalCaseRecordData(updated);
        setCaseRecordEditMode(false);
        fetchFinalized(true);
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to save case record');
    } finally {
      setSavingCaseRecord(false);
    }
  };

  const handleCancelCaseRecordEdit = () => {
    setCaseRecordData(originalCaseRecordData || {});
    setCaseRecordEditMode(false);
  };

  const openVersionHistory = (caseData) => {
    setMenuVisible(false);
    setVersionCase(caseData);
    setVersionModalVisible(true);
  };

  const handleViewDocument = async (documentData) => {
    if (!documentData) return;
    const url = documentData.cloudinaryUrl || documentData.fileUrl || documentData.fileData;
    if (!url) {
      Alert.alert('Error', 'No file URL available');
      return;
    }
    try {
      const fullUrl = url.startsWith('/') ? `${apiClient.defaults.baseURL}${url}` : url;
      const supported = await Linking.canOpenURL(fullUrl);
      if (supported) {
        await Linking.openURL(fullUrl);
      } else {
        Alert.alert('Cannot Open', 'Unable to open this document on your device.');
      }
    } catch (err) {
      console.error('Error opening document:', err);
      Alert.alert('Error', 'Failed to open document');
    }
  };

  const handleDeleteVersion = async (versionIndex) => {
    if (!versionCase) return;
    const finalizeId = versionCase._id || versionCase.id;
    const versions = [...(versionCase.content?.interviewInfo?.documentVersions || [])];
    const versionToDelete = versions[versionIndex];
    if (!versionToDelete) return;

    Alert.alert('Delete Version', 'Are you sure you want to delete this version?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            // Delete the physical file if it has a fileUrl
            if (versionToDelete.fileUrl) {
              const filename = versionToDelete.fileUrl.split('/').pop();
              if (filename) {
                try {
                  await apiClient.delete(`/upload/document/${encodeURIComponent(filename)}`);
                } catch (fileErr) {
                  console.warn('Could not delete file from server:', fileErr);
                }
              }
            }

            // Remove version from array
            versions.splice(versionIndex, 1);

            // Update the finalize record
            const updatedContent = JSON.parse(JSON.stringify(versionCase.content || {}));
            if (!updatedContent.interviewInfo) updatedContent.interviewInfo = {};
            updatedContent.interviewInfo.documentVersions = versions;

            await apiClient.put(`/finalize/${finalizeId}`, { content: updatedContent });

            // Update local state
            const updatedCase = { ...versionCase, content: updatedContent };
            setVersionCase(updatedCase);

            // Refresh finalized list
            fetchFinalized(true);

            Alert.alert('Deleted', 'Version deleted successfully.');
          } catch (err) {
            console.error('Error deleting version:', err);
            Alert.alert('Error', 'Failed to delete version.');
          }
        },
      },
    ]);
  };

  const openAssignModal = (caseData) => {
    setMenuVisible(false);
    setAssignTargetCase(caseData);
    setAssignForm({ assigneeId: '', deadline: '', message: '' });
    setAssignModalVisible(true);
  };

  const handleAssignCase = async () => {
    if (!assignForm.assigneeId || !assignForm.deadline || !assignForm.message) {
      Alert.alert('Missing Fields', 'Please fill in all fields');
      return;
    }
    setAssignLoading(true);
    try {
      await apiClient.post('/case-assignments', {
        finalizeId: assignTargetCase._id || assignTargetCase.id,
        assigneeId: assignForm.assigneeId,
        deadline: assignForm.deadline,
        message: assignForm.message,
      });
      Alert.alert('Success', 'Case assigned successfully');
      setAssignModalVisible(false);
      setAssignTargetCase(null);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to assign case');
    } finally {
      setAssignLoading(false);
    }
  };

  const handleDelete = (caseData) => {
    setMenuVisible(false);
    const recordId = caseData._id || caseData.id;
    Alert.alert('Delete Record', 'Are you sure you want to delete this finalized record?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.delete(`/finalize/${recordId}`);
            setFinalized(prev => prev.filter(f => (f._id || f.id) !== recordId));
            Alert.alert('Deleted', 'Finalized record has been deleted.');
          } catch {
            Alert.alert('Error', 'Failed to delete finalized record.');
          }
        },
      },
    ]);
  };

  // ── Evidence Table (for Review Modal) ──
  const renderEvidenceSection = (title, evidence = []) => {
    if (!evidence || evidence.length === 0) return null;
    const hasContent = evidence.some(e => e.type || e.author || e.purpose || e.issues);
    if (!hasContent) return null;
    return (
      <View style={st.reviewSection}>
        <Text style={st.reviewSectionTitle}>{title}</Text>
        {evidence.map((item, idx) => {
          if (!item.type && !item.author && !item.purpose && !item.issues) return null;
          return (
            <View key={idx} style={st.evidenceCard}>
              {item.type ? <View style={st.evidenceRow}><Text style={st.evidenceLabel}>Type:</Text><Text style={st.evidenceValue}>{item.type}</Text></View> : null}
              {item.author ? <View style={st.evidenceRow}><Text style={st.evidenceLabel}>Author:</Text><Text style={st.evidenceValue}>{item.author}</Text></View> : null}
              {item.purpose ? <View style={st.evidenceRow}><Text style={st.evidenceLabel}>Purpose:</Text><Text style={st.evidenceValue}>{item.purpose}</Text></View> : null}
              {item.issues ? <View style={st.evidenceRow}><Text style={st.evidenceLabel}>Issues:</Text><Text style={st.evidenceValue}>{item.issues}</Text></View> : null}
            </View>
          );
        })}
      </View>
    );
  };

  // ── Case Record Field Renderer ──
  const renderCaseRecordField = (label, field, options = {}) => {
    const value = caseRecordData?.[field] || '';
    const multiline = options.multiline;
    return (
      <View style={st.crFieldWrap}>
        <Text style={st.crFieldLabel}>{label}</Text>
        {caseRecordEditMode ? (
          <TextInput
            style={[st.crInput, multiline && st.crTextarea]}
            value={value}
            onChangeText={text => setCaseRecordData(prev => ({ ...(prev || {}), [field]: text }))}
            editable={!savingCaseRecord}
            placeholder={options.placeholder}
            multiline={multiline}
            numberOfLines={multiline ? 4 : 1}
            textAlignVertical={multiline ? 'top' : 'center'}
          />
        ) : (
          <Text style={st.crFieldValue}>{value || 'N/A'}</Text>
        )}
      </View>
    );
  };

  // ── Card Renderer (matching web's renderCaseCard) ──
  const renderCaseCard = (f) => {
    const recordId = f._id || f.id;
    const hasRecord = caseRecordsMap[recordId];
    const clientName = f.clientName || f.content?.interviewInfo?.clientName || 'Unknown Client';
    const displayTitle = hasRecord
      ? (f.caseTitle || f.content?.caseInfo?.caseTitle || f.content?.caseInfo?.title || f.caseId || clientName)
      : clientName;
    const caseType = f.content?.interviewInfo?.caseType || 'court-representation';
    const meta = CASE_TYPE_META[caseType] || CASE_TYPE_META['court-representation'];
    const dateStr = formatShortDate(f.createdAt);
    const roleDisplay = f.finalizedRole || f.finalizedBy || 'Secretary';
    const capitalizedRole = roleDisplay.charAt(0).toUpperCase() + roleDisplay.slice(1);
    const isRejected = f.decision === 'rejected';

    return (
      <View key={recordId} style={[st.card, { borderLeftColor: isRejected ? '#EF4444' : meta.color }]}>
        <View style={st.cardHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <View style={[st.caseTypeBadge, { backgroundColor: meta.color }]}>
              <Text style={st.caseTypeLetter}>{meta.letter}</Text>
            </View>
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={st.caseTitle} numberOfLines={1}>{displayTitle}</Text>
              {f.caseId && (
                <Text style={st.caseIdText}>#{f.caseId.length > 12 ? f.caseId.slice(0, 12) + '…' : f.caseId}</Text>
              )}
            </View>
          </View>
          {/* Quick eye + menu */}
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <TouchableOpacity onPress={() => handleViewReview(f)} style={st.iconBtn}>
              <Ionicons name="eye-outline" size={18} color={PRIMARY_BROWN} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setMenuCase(f); setMenuVisible(true); }} style={st.iconBtn}>
              <Ionicons name="ellipsis-vertical" size={18} color={MUTED_OLIVE} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Meta row */}
        <View style={st.cardMeta}>
          <View style={st.metaItem}>
            <Ionicons name="calendar-outline" size={14} color={MUTED_OLIVE} />
            <Text style={st.metaText}>{dateStr}</Text>
          </View>
          <View style={st.metaItem}>
            <Ionicons name="person-outline" size={14} color={MUTED_OLIVE} />
            <Text style={st.metaText}>{capitalizedRole}</Text>
          </View>
          <View style={[st.caseTypePill, { backgroundColor: meta.color + '20' }]}>
            <Text style={[st.caseTypePillText, { color: meta.color }]}>{meta.label}</Text>
          </View>
        </View>
      </View>
    );
  };

  // ── Action Menu Modal ──
  const renderActionMenu = () => {
    if (!menuCase) return null;
    const isAccepted = menuCase.decision === 'accepted';
    const isCourt = !isLegalAdvice(menuCase) && !isDocumentDrafting(menuCase);
    const isDocDraft = isDocumentDrafting(menuCase);

    const actions = [
      { label: 'View Review', icon: 'eye-outline', onPress: () => handleViewReview(menuCase) },
      { label: 'Full Receipt', icon: 'receipt-outline', onPress: () => handleViewReceipt(menuCase) },
    ];

    if (isAccepted && isCourt) {
      actions.push({ label: 'Case Record', icon: 'document-text-outline', onPress: () => openCaseRecord(menuCase) });
    }

    if (isAccepted && isDocDraft) {
      actions.push({ label: 'Version History', icon: 'time-outline', color: '#8B5CF6', onPress: () => openVersionHistory(menuCase) });
    }

    if (canAssignCases && isAccepted) {
      actions.push({ label: 'Assign Case', icon: 'people-outline', color: '#3B82F6', onPress: () => openAssignModal(menuCase) });
    }

    actions.push({ label: 'Delete Record', icon: 'trash-outline', color: '#EF4444', onPress: () => handleDelete(menuCase) });

    return (
      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <TouchableOpacity style={st.menuOverlay} activeOpacity={1} onPress={() => setMenuVisible(false)}>
          <View style={st.menuSheet}>
            <View style={st.menuHandle} />
            <Text style={st.menuTitle}>Actions</Text>
            {actions.map((a, i) => (
              <TouchableOpacity key={i} style={st.menuItem} onPress={a.onPress}>
                <Ionicons name={a.icon} size={20} color={a.color || PRIMARY_BROWN} />
                <Text style={[st.menuItemText, a.color && { color: a.color }]}>{a.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={st.menuCancelBtn} onPress={() => setMenuVisible(false)}>
              <Text style={st.menuCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  // ── PDF Export Helpers ──
  const formatText = (value) => {
    if (value === null || value === undefined || value === '') return '-';
    return String(value).replace(/<br\s*\/?>(\r?\n)?/gi, '\n');
  };

  const escapeHtml = (text) => {
    if (!text) return '';
    return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };

  const generateAndSharePdf = async (htmlContent, fileName) => {
    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent, base64: false });
      // Rename the temp file so the shared PDF has a readable filename
      const FileSystem = require('expo-file-system/legacy');
      const newUri = `${FileSystem.cacheDirectory}${fileName}`;
      await FileSystem.moveAsync({ from: uri, to: newUri });
      await Sharing.shareAsync(newUri, { mimeType: 'application/pdf', dialogTitle: fileName, UTI: 'com.adobe.pdf' });
    } catch (err) {
      console.error('PDF export error:', err);
      Alert.alert('Error', 'Failed to export PDF');
    }
  };

  const buildRecommendationHtml = (d) => {
    const interview = d.content?.interviewInfo || {};
    const action = d.content?.actionInfo || {};

    const renderEvidenceTable = (title, evidence, columns) => {
      const rows = Array.isArray(evidence) ? evidence.filter(Boolean) : [];
      while (rows.length < 3) rows.push({});
      return `
        <p style="font-weight:bold; margin:8px 0 2px;">${escapeHtml(title)}</p>
        <table style="width:100%; border-collapse:collapse; border:1px solid #000;">
          <tr>${columns.map(c => `<th style="border:1px solid #000; padding:3px 4px; font-size:9pt; text-align:center;">${escapeHtml(c)}</th>`).join('')}</tr>
          ${rows.map(r => `<tr>${columns.map((_, i) => {
            const keys = columns.length === 4 ? ['type', 'author', 'purpose', 'issues'] : ['type', 'author', 'issues'];
            return `<td style="border:1px solid #000; padding:3px 4px; font-size:8.5pt; min-height:14px;">${escapeHtml(r[keys[i]] || '')}</td>`;
          }).join('')}</tr>`).join('')}
        </table>`;
    };

    const decision = (action.decision || d.decision || 'pending').toLowerCase();
    const checkMark = (val) => val ? '&#9746;' : '&#9744;';

    return `<!DOCTYPE html><html><head><meta charset="utf-8">
      <style>
        @page { size: A4 portrait; margin: 12mm; }
        body { font-family: 'Times New Roman', Times, serif; font-size: 10pt; color: #000; margin: 0; padding: 0; }
        table { page-break-inside: auto; }
        .header-row { display: flex; width: 100%; }
        .header-left { flex: 1; border: 1px solid #000; padding: 4px 6px; font-size: 10pt; }
        .header-right { width: 160px; border: 1px solid #000; border-left: none; padding: 6px; text-align: center; font-weight: bold; font-size: 10pt; }
        .info-box { border: 1px solid #000; display: flex; }
        .info-left, .info-right { flex: 1; padding: 4px 6px; }
        .info-right { border-left: 1px solid #000; }
        .box { border: 1px solid #000; padding: 4px 6px; min-height: 18mm; font-size: 9pt; white-space: pre-wrap; }
        .section-title { font-weight: bold; margin: 8px 0 2px; }
        .comment-box { border: 1px solid #000; padding: 6px; min-height: 30mm; font-size: 10pt; white-space: pre-wrap; margin-top: 4px; }
        .signature-section { margin-top: 12px; }
        .sig-row { display: flex; gap: 18px; margin-top: 10px; }
        .sig-col { flex: 1; }
        .sig-line { border-bottom: 1px solid #000; min-height: 14px; padding: 2px; font-size: 10pt; }
        .sig-label { font-size: 10pt; margin-bottom: 2px; }
        .timestamp { text-align: right; font-size: 7pt; color: #888; margin-bottom: 4px; }
      </style></head><body>
      <div class="timestamp">Generated: ${new Date().toLocaleString()}</div>
      <div style="font-size:9pt;">SOLA FORM<br>Revised September 2020</div>
      <div class="header-row" style="margin-top:6px;">
        <div class="header-left">San Sebastian Office of Legal Aid (SOLA)<br>College of Law<br>San Sebastian College - Recoletos, Manila</div>
        <div class="header-right">RECOMMENDATION FOR ACTION</div>
      </div>
      <table style="width:100%; border-collapse:collapse; border:1px solid #000; margin-top:4px;">
        <tr>
          <td style="border:1px solid #000; padding:3px 6px; width:50%;">Date of Interview: ${escapeHtml(formatText(interview.dateOfInterview || interview.dateInterview))}<br>Client's Name: ${escapeHtml(formatText(d.clientName || interview.clientName))}</td>
          <td style="border:1px solid #000; padding:3px 6px; width:50%;">Date Submitted: ${escapeHtml(formatText(action.signatureDate || d.updatedAt))}<br>Interviewing Intern/s: ${escapeHtml(formatText(interview.interviewingInterns || interview.interviewingIntern || interview.internName))}</td>
        </tr>
      </table>
      <p class="section-title">Fast Facts</p>
      <div class="box">${escapeHtml(formatText(interview.fastFacts))}</div>
      ${renderEvidenceTable('Evidence on Hand / Available for the Client(s)', interview.clientEvidence, ['Type / Description', 'Author / Custodian', 'Purpose', 'Admissibility Issues'])}
      ${renderEvidenceTable('Evidence on Hand / Available for the Adverse Party(ies)', interview.adversePartyEvidence, ['Type / Description', 'Author / Custodian', 'Admissibility Issues'])}
      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
        <span class="section-title">Interviewing Intern's Initial Advice to the Client(s)</span>
        <span>${interview.forLegalAdvice === true || interview.forLegalAdvice === 'true' ? '&#9746;' : '&#9744;'} For legal advice only</span>
      </div>
      <div class="box">${escapeHtml(formatText(interview.internAdvice))}</div>
      <p class="section-title">Legal Opinion</p>
      <div class="box">${escapeHtml(formatText(interview.legalOpinion))}</div>
      <div style="page-break-before: auto; margin-top: 16px;">
        <p style="font-size:11pt; font-weight:bold;">Supervising Lawyer's Comment</p>
        <div class="comment-box">${escapeHtml(formatText(action.supervisingComment))}</div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
          <span style="font-size:11pt; font-weight:bold;">Director's Action</span>
          <span>${checkMark(decision.includes('accept'))} Accepted &nbsp; ${checkMark(decision.includes('reject'))} Rejected &nbsp; ${checkMark(decision.includes('pend'))} Pending</span>
        </div>
        <p style="font-size:10pt; margin:4px 0 2px;">If accepted/pending, instruction(s); if rejected, reason(s):</p>
        <div class="comment-box">${escapeHtml(formatText(action.decisionNote))}</div>
        <div class="signature-section">
          <p style="font-size:11pt; font-weight:bold;">Assigned to:</p>
          <div class="sig-row">
            <div class="sig-col"><p class="sig-label">Law Interns:</p><div class="sig-line">${escapeHtml(formatText(action.assignedTo))}</div></div>
            <div class="sig-col">
              <p class="sig-label">Supervising Lawyer:</p><div class="sig-line">${escapeHtml(formatText(action.supervisingLawyer))}</div>
              <p class="sig-label" style="margin-top:10px;">Director's Signature:</p><div class="sig-line">${escapeHtml(formatText(action.directorSignature))}</div>
              <p class="sig-label" style="margin-top:10px;">Date:</p><div class="sig-line">${escapeHtml(formatText(action.signatureDate))}</div>
            </div>
          </div>
        </div>
      </div>
    </body></html>`;
  };

  const buildCaseRecordHtml = (cr) => {
    return `<!DOCTYPE html><html><head><meta charset="utf-8">
      <style>
        @page { size: A4 landscape; margin: 10mm; }
        body { font-family: 'Times New Roman', Times, serif; font-size: 9pt; color: #000; margin: 0; padding: 0; }
        .header-grid { border: 1px solid #000; display: flex; }
        .header-col { flex: 1; padding: 4px 6px; }
        .header-col + .header-col { border-left: 1px solid #000; }
        .field-row { margin: 2px 0; }
        .field-label { display: inline; }
        .field-line { border-bottom: 1px solid #000; display: inline-block; min-width: 120px; padding: 0 4px; }
        .sections { display: flex; gap: 2px; margin-top: 0; }
        .section-box { flex: 1; border: 1px solid #000; padding: 6px; min-height: 100px; }
        .section-head { text-align: center; font-size: 10pt; font-weight: bold; margin-bottom: 2px; }
        .section-sub { text-align: center; font-size: 8pt; margin-bottom: 6px; }
        .section-content { white-space: pre-wrap; font-size: 9pt; }
        .timestamp { text-align: right; font-size: 7pt; color: #888; margin-bottom: 4px; }
      </style></head><body>
      <div class="timestamp">Generated: ${new Date().toLocaleString()}</div>
      <div class="header-grid">
        <div class="header-col">
          <div class="field-row"><span class="field-label">Title of the Case:</span> <span class="field-line">${escapeHtml(cr.title || '')}</span></div>
          <div class="field-row"><span class="field-label">Nature of the Case:</span> <span class="field-line">${escapeHtml(cr.nature || '')}</span></div>
          <div class="field-row"><span class="field-label">Tribunal:</span> <span class="field-line">${escapeHtml(cr.tribunal || '')}</span></div>
          <div class="field-row"><span class="field-label">Branch:</span> <span class="field-line">${escapeHtml(cr.branch || '')}</span></div>
          <div class="field-row"><span class="field-label">Presiding Judge:</span> <span class="field-line">${escapeHtml(cr.presidingJudge || '')}</span></div>
          <div class="field-row"><span class="field-label">Tel/Email:</span> <span class="field-line">${escapeHtml(cr.contactDetails || cr.telEmail || '')}</span></div>
          <div class="field-row"><span class="field-label">Party/ies:</span> <span class="field-line">${escapeHtml(cr.parties || '')}</span></div>
        </div>
        <div class="header-col">
          <div class="field-row"><span class="field-label">Contact Details:</span> <span class="field-line">${escapeHtml(cr.contactDetails || cr.telEmail || '')}</span></div>
          <div class="field-row"><span class="field-label">Counsel/s on Record:</span> <span class="field-line">${escapeHtml(cr.counsels || '')}</span></div>
          <div class="field-row"><span class="field-label">Public Prosecutor:</span> <span class="field-line">${escapeHtml(cr.publicProsecutor || '')}</span></div>
          <div class="field-row"><span class="field-label">Opposing Counsel:</span> <span class="field-line">${escapeHtml(cr.opposingCounsel || '')}</span></div>
          <div class="field-row"><span class="field-label">Client/s Address:</span> <span class="field-line">${escapeHtml(cr.clientAddress || '')}</span></div>
          <div class="field-row"><span class="field-label">Others:</span> <span class="field-line">${escapeHtml(cr.others || '')}</span></div>
        </div>
      </div>
      <div class="sections">
        <div class="section-box">
          <div class="section-head">CASE HISTORY</div>
          <div class="section-sub">(in reverse chronological order)</div>
          <div class="section-content">${escapeHtml(cr.caseHistory || '')}</div>
        </div>
        <div class="section-box">
          <div class="section-head">REMARKS / REMINDERS / NOTES</div>
          <div class="section-sub">(deadlines/material dates, etc.)</div>
          <div class="section-content">${escapeHtml(cr.remarks || '')}</div>
        </div>
      </div>
    </body></html>`;
  };

  const buildAppointmentHtml = (a) => {
    const txt = (v) => (v === undefined || v === null ? '' : String(v));
    const money = (v) => {
      if (v === undefined || v === null || v === '') return '';
      const n = Number(String(v).replace(/[^0-9.-]/g, ''));
      return Number.isNaN(n) ? String(v) : n.toLocaleString();
    };
    const fieldRow = (label, value) => `
      <div style="margin:2px 0;"><span style="display:inline;">${escapeHtml(label)}</span> <span style="border-bottom:1px solid #000; display:inline-block; min-width:100px; padding:0 4px;">${escapeHtml(txt(value))}</span></div>`;

    return `<!DOCTYPE html><html><head><meta charset="utf-8">
      <style>
        @page { size: A4 portrait; margin: 12mm; }
        body { font-family: 'Times New Roman', Times, serif; font-size: 10pt; color: #000; margin: 0; padding: 0; }
        .form-header { font-size: 9pt; }
        .title-box { border: 1px solid #000; padding: 4px 12px; text-align: center; font-weight: bold; font-size: 10pt; width: 180px; margin: 0 auto 6px; }
        .org-box { border: 1px solid #000; padding: 4px 6px; font-size: 9pt; width: 200px; margin-bottom: 10px; }
        .section-title { font-weight: bold; font-size: 11pt; margin: 10px 0 4px; }
        .two-col { display: flex; gap: 12px; }
        .col { flex: 1; }
        .privacy-box { border: 1px solid #000; padding: 4px 6px; font-size: 7pt; margin-top: 16px; }
        .timestamp { text-align: right; font-size: 7pt; color: #888; margin-bottom: 4px; }
      </style></head><body>
      <div class="timestamp">Generated: ${new Date().toLocaleString()}</div>
      <div class="form-header">SOLA FORM 3<br>Revised September 2020</div>
      <div class="title-box">CLIENT'S INFORMATION SHEET</div>
      <div class="org-box">Sebastinian Office of Legal Aid (SOLA)<br>College of Law<br>San Sebastian College - Recoletos, Manila</div>
      <div class="two-col">
        <div class="col">
          <p class="section-title">PERSONAL DETAILS</p>
          ${fieldRow('Name:', a.fullName || a.name)}
          <div style="display:flex; gap:8px;">${fieldRow('Age:', a.age)}${fieldRow('Birthday:', a.birthday)}</div>
          ${fieldRow('Contact Number/s:', a.contactNumber)}
          <div style="display:flex; gap:8px;">${fieldRow('Sex:', a.sex)}${fieldRow('Civil Status:', a.civilStatus)}</div>
          ${fieldRow('Citizenship:', a.citizenship)}
          ${fieldRow('Spouse:', a.spouseName)}
          ${fieldRow('Cellphone Number/s:', a.cellphoneNumber || a.contactNumber)}
        </div>
        <div class="col">
          <p style="font-size:10pt; margin-bottom:4px;">If through a Relator / Representative:</p>
          ${fieldRow('Name of Relator / Representative:', a.relatorName)}
          ${fieldRow('Relationship to the Client:', a.relationshipToClient)}
        </div>
      </div>
      ${fieldRow('Present Address:', a.presentAddress)}
      ${fieldRow('Telephone Number:', a.presentAddressTelephone)}
      ${fieldRow('Permanent Address:', a.permanentAddress)}
      ${fieldRow('Telephone Number:', a.permanentAddressTelephone)}
      <p class="section-title">FINANCIAL DETAILS</p>
      <div style="display:flex; gap:8px;">${fieldRow('Current Source of Income:', a.currentSourceOfIncome)}${fieldRow('Income / Month:', money(a.monthlyIncome))}</div>
      ${fieldRow('Nature of Work / Business:', a.natureOfWork)}
      ${fieldRow("Employer / Business Owner's Name:", a.employerName)}
      ${fieldRow('Employer / Business Address:', a.employerAddress)}
      <div style="display:flex; gap:8px;">${fieldRow('Telephone:', a.employerTelephone)}</div>
      <div style="display:flex; gap:8px;">${fieldRow("Spouse's Source of Income:", a.spouseSourceOfIncome)}${fieldRow('Income / Month:', money(a.spouseMonthlyIncome))}</div>
      ${fieldRow("Spouse's Nature of Work / Business:", a.spouseNatureOfWork)}
      ${fieldRow("Spouse's Employer / Business Address:", a.spouseEmployerAddress)}
      ${fieldRow('Total Combined Monthly Income:', money(a.totalCombinedIncome))}
      <p class="section-title">CASE DETAILS</p>
      <div style="display:flex; gap:8px;">${fieldRow('Party Represented:', a.partyRepresented)}${fieldRow('Venue / City:', a.venue)}</div>
      <div style="display:flex; gap:8px;">${fieldRow('Present Stage of the Case:', a.presentStage)}${fieldRow('Case / Docket Number:', a.caseNumber)}</div>
      ${fieldRow('Nature:', a.caseNature || a.natureOfCase)}
      ${fieldRow('Court / Agency / Tribunal Division:', a.courtDivision)}
      ${fieldRow('Court / Agency / Tribunal Address:', a.courtAddress)}
      <div style="display:flex; gap:8px;">${fieldRow('Presiding Officer:', a.presidingOfficer)}${fieldRow('Phone Number:', a.courtPhoneNumber || a.presidingOfficerPhone)}</div>
      ${fieldRow('Adverse Party(ies):', a.adverseParty || a.adverseParties)}
      ${fieldRow('Adverse Party(ies) Address:', a.adversePartyAddress || a.adversePartiesAddress)}
      ${fieldRow('Adverse Party(ies) Counsel:', a.adversePartyCounsel || a.adversePartiesCounsel)}
      ${fieldRow('Adverse Party(ies) Counsel Address:', a.adversePartyCounselAddress || a.adversePartiesCounselAddress)}
      ${fieldRow('Adverse Party(ies) Counsel Phone Number:', a.adversePartyCounselPhone || a.adversePartiesCounselPhone)}
      <div class="privacy-box">DATA PRIVACY: Sebastinian Office of Legal Aid (SOLA) College of Law is committed to upholding the Philippine Data Privacy Act which implements the Constitutional right to informational privacy of data subjects. This form is operated and maintained by the SOLA. Your personal information is collected and processed in order for us to verify your identity, assess your application, and contact you about your case. Rest assured the information provided herein will be treated with utmost confidentiality.</div>
    </body></html>`;
  };

  const exportRecommendationPdf = async () => {
    if (!reviewData) {
      Alert.alert('Nothing to export', 'No review data loaded.');
      return;
    }
    try {
      let htmlContent = buildRecommendationHtml(reviewData);

      // Add case record page for court representation cases
      const caseType = reviewData.content?.interviewInfo?.caseType;
      const isCaseWithRecord = caseType !== 'legal-advice' && caseType !== 'legal-document';
      if (isCaseWithRecord) {
        const finalizeId = reviewData._id || reviewData.id;
        let cr = caseRecordData;
        if ((!cr || Object.keys(cr).length === 0) && finalizeId) {
          try {
            const resp = await apiClient.get(`/caserecords/finalize/${finalizeId}`);
            cr = resp?.data || resp?.data?.data || {};
          } catch { cr = {}; }
        }
        if (cr && Object.keys(cr).length > 0) {
          const crHtml = buildCaseRecordHtml(cr);
          // Append as separate section (expo-print doesn't support mixed orientations in one doc)
          // We'll add it as a page break in the same document
          htmlContent = htmlContent.replace('</body></html>',
            `<div style="page-break-before:always;"></div>
             <div style="font-size:9pt;">${crHtml.replace(/<!DOCTYPE html>.*?<body>/s, '').replace(/<\/body><\/html>/, '')}</div>
            </body></html>`);
        }
      }

      await generateAndSharePdf(htmlContent, 'Recommendation_For_Action.pdf');
    } catch (err) {
      console.error('exportRecommendationPdf failed:', err);
      Alert.alert('Error', 'Failed to export PDF');
    }
  };

  const exportAppointmentPdf = async () => {
    if (!receiptDetails) {
      Alert.alert('Nothing to export', 'No appointment details loaded.');
      return;
    }
    const htmlContent = buildAppointmentHtml(receiptDetails);
    await generateAndSharePdf(htmlContent, 'Appointment_Receipt.pdf');
  };

  const exportCaseRecordPdf = async () => {
    if (!caseRecordData || Object.keys(caseRecordData).length === 0) {
      Alert.alert('Nothing to export', 'No case record data loaded.');
      return;
    }
    const htmlContent = buildCaseRecordHtml(caseRecordData);
    await generateAndSharePdf(htmlContent, 'Case_Record.pdf');
  };

  // ── Review Modal ──
  const renderReviewModal = () => (
    <Modal visible={reviewModalVisible} animationType="slide" onRequestClose={() => setReviewModalVisible(false)}>
      <View style={st.modalContainer}>
        <View style={st.modalHeader}>
          <TouchableOpacity onPress={() => setReviewModalVisible(false)} style={st.modalBackBtn}>
            <Ionicons name="arrow-back" size={22} color={CHARCOAL} />
          </TouchableOpacity>
          <Text style={st.modalTitle}>Recommendation for Action</Text>
          <TouchableOpacity style={st.exportBtn} onPress={exportRecommendationPdf}>
            <Ionicons name="download-outline" size={16} color="#fff" />
            <Text style={st.exportBtnText}>PDF</Text>
          </TouchableOpacity>
        </View>

        {reviewLoading ? (
          <View style={st.centerContainer}><ActivityIndicator size="large" color={PRIMARY_BROWN} /></View>
        ) : reviewData ? (
          <>
            <View style={st.stepperContainer}>
              <TouchableOpacity style={[st.stepBtn, reviewStep === 0 && st.stepBtnActive]} onPress={() => setReviewStep(0)}>
                <Ionicons name="chatbubble-ellipses-outline" size={16} color={reviewStep === 0 ? '#fff' : MUTED_OLIVE} />
                <Text style={[st.stepBtnText, reviewStep === 0 && st.stepBtnTextActive]}>Interview</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[st.stepBtn, reviewStep === 1 && st.stepBtnActive]} onPress={() => setReviewStep(1)}>
                <Ionicons name="hammer-outline" size={16} color={reviewStep === 1 ? '#fff' : MUTED_OLIVE} />
                <Text style={[st.stepBtnText, reviewStep === 1 && st.stepBtnTextActive]}>Action</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={st.modalScrollContent} showsVerticalScrollIndicator={false}>
              {reviewStep === 0 ? (
                <>
                  <View style={st.reviewSection}>
                    <Text style={st.reviewSectionTitle}>Client Interview Information</Text>
                    <View style={st.reviewGrid}>
                      <View style={st.reviewField}><Text style={st.reviewFieldLabel}>Date of Interview</Text><Text style={st.reviewFieldValue}>{reviewData.content?.interviewInfo?.dateOfInterview || '-'}</Text></View>
                      <View style={st.reviewField}><Text style={st.reviewFieldLabel}>Date Submitted</Text><Text style={st.reviewFieldValue}>{reviewData.content?.interviewInfo?.dateSubmitted || '-'}</Text></View>
                      <View style={st.reviewField}><Text style={st.reviewFieldLabel}>Client's Name</Text><Text style={st.reviewFieldValue}>{reviewData.content?.interviewInfo?.clientName || '-'}</Text></View>
                      <View style={st.reviewField}><Text style={st.reviewFieldLabel}>Interviewing Intern/s</Text><Text style={st.reviewFieldValue}>{reviewData.content?.interviewInfo?.interviewingInterns || '-'}</Text></View>
                    </View>
                  </View>
                  <View style={st.reviewSection}><Text style={st.reviewSectionTitle}>Fast Facts</Text><Text style={st.reviewFieldValue}>{reviewData.content?.interviewInfo?.fastFacts || '-'}</Text></View>
                  {renderEvidenceSection('Evidence for Client(s)', reviewData.content?.interviewInfo?.clientEvidence)}
                  {renderEvidenceSection('Evidence for Adverse Party(ies)', reviewData.content?.interviewInfo?.adversePartyEvidence)}
                  <View style={st.reviewSection}><Text style={st.reviewSectionTitle}>Intern's Initial Advice</Text><Text style={st.reviewFieldValue}>{reviewData.content?.interviewInfo?.internAdvice || '-'}</Text></View>
                  <View style={st.reviewSection}><Text style={st.reviewSectionTitle}>Legal Opinion</Text><Text style={st.reviewFieldValue}>{reviewData.content?.interviewInfo?.legalOpinion || '-'}</Text></View>
                </>
              ) : (
                <>
                  <View style={st.reviewSection}>
                    <Text style={st.reviewSectionTitle}>Supervising Lawyer & Director Action</Text>
                    <Text style={st.reviewSubLabel}>Supervising Lawyer's Comment</Text>
                    <Text style={st.reviewFieldValue}>{reviewData.content?.actionInfo?.supervisingComment || '-'}</Text>
                  </View>
                  <View style={st.reviewSection}>
                    <Text style={st.reviewSubLabel}>Director's Decision</Text>
                    <View style={[st.decisionBadge, { backgroundColor: reviewData.decision === 'accepted' ? '#DCFCE7' : reviewData.decision === 'rejected' ? '#FEE2E2' : '#FEF3C7' }]}>
                      <Text style={[st.decisionText, { color: reviewData.decision === 'accepted' ? '#22c55e' : reviewData.decision === 'rejected' ? '#EF4444' : '#F59E0B' }]}>
                        {(reviewData.decision || 'pending').toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <View style={st.reviewSection}>
                    <Text style={st.reviewSubLabel}>Decision Note</Text>
                    <Text style={st.reviewFieldValue}>{reviewData.content?.actionInfo?.decisionNote || '-'}</Text>
                  </View>
                  <View style={st.reviewSection}>
                    <View style={st.reviewGrid}>
                      <View style={st.reviewField}><Text style={st.reviewFieldLabel}>Assigned To</Text><Text style={st.reviewFieldValue}>{reviewData.content?.actionInfo?.assignedTo || '-'}</Text></View>
                      <View style={st.reviewField}><Text style={st.reviewFieldLabel}>Supervising Lawyer</Text><Text style={st.reviewFieldValue}>{reviewData.content?.actionInfo?.supervisingLawyer || '-'}</Text></View>
                      <View style={st.reviewField}><Text style={st.reviewFieldLabel}>Director's Signature</Text><Text style={st.reviewFieldValue}>{reviewData.content?.actionInfo?.directorSignature || '-'}</Text></View>
                      <View style={st.reviewField}><Text style={st.reviewFieldLabel}>Signature Date</Text><Text style={st.reviewFieldValue}>{reviewData.content?.actionInfo?.signatureDate || '-'}</Text></View>
                    </View>
                  </View>
                </>
              )}

              <View style={st.stepNavigation}>
                {reviewStep > 0 && (
                  <TouchableOpacity style={st.stepNavBtn} onPress={() => setReviewStep(0)}>
                    <Ionicons name="chevron-back" size={16} color={MUTED_OLIVE} />
                    <Text style={st.stepNavBtnText}>Previous</Text>
                  </TouchableOpacity>
                )}
                <View style={{ flex: 1 }} />
                {reviewStep < 1 && (
                  <TouchableOpacity style={[st.stepNavBtn, st.stepNavBtnPrimary]} onPress={() => setReviewStep(1)}>
                    <Text style={st.stepNavBtnPrimaryText}>Next Step</Text>
                    <Ionicons name="chevron-forward" size={16} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>
              <View style={{ height: 30 }} />
            </ScrollView>
          </>
        ) : (
          <View style={st.centerContainer}><Text style={{ color: MUTED_OLIVE }}>No review data available</Text></View>
        )}
      </View>
    </Modal>
  );

  // ── Receipt Modal (matching web's full appointment receipt) ──
  const renderReceiptModal = () => {
    const d = receiptDetails;
    const statusLabel = d?.status ? d.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'N/A';
    const renderField = (label, value) => (
      <View style={st.receiptField}>
        <Text style={st.receiptFieldLabel}>{label}</Text>
        <Text style={st.receiptFieldValue}>{value || 'N/A'}</Text>
      </View>
    );

    return (
      <Modal visible={receiptModalVisible} animationType="slide" onRequestClose={() => setReceiptModalVisible(false)}>
        <View style={st.modalContainer}>
          <View style={st.modalHeader}>
            <TouchableOpacity onPress={() => setReceiptModalVisible(false)} style={st.modalBackBtn}>
              <Ionicons name="arrow-back" size={22} color={CHARCOAL} />
            </TouchableOpacity>
            <Text style={st.modalTitle}>Appointment Receipt</Text>
            <TouchableOpacity style={st.exportBtn} onPress={exportAppointmentPdf}>
              <Ionicons name="download-outline" size={16} color="#fff" />
              <Text style={st.exportBtnText}>PDF</Text>
            </TouchableOpacity>
          </View>

          {receiptLoading ? (
            <View style={st.centerContainer}><ActivityIndicator size="large" color={PRIMARY_BROWN} /></View>
          ) : d ? (
            <ScrollView style={st.modalScrollContent} showsVerticalScrollIndicator={false}>
              <View style={st.receiptBanner}>
                <Text style={st.receiptBannerTitle}>{d.caseDetails?.appointmentType || d.personal?.legalMatter || 'Appointment'}</Text>
                <View style={st.receiptStatusBadge}><Text style={st.receiptStatusText}>{statusLabel}</Text></View>
                <Text style={st.receiptCaseNumber}>Case #{d.caseNumber || 'N/A'}</Text>
              </View>

              <View style={st.receiptSectionCard}>
                <Text style={st.receiptSectionTitle}>Personal Details</Text>
                <View style={st.receiptDivider} />
                {renderField('Name', d.fullName || d.name)}
                {renderField('Age', d.age != null ? String(d.age) : null)}
                {renderField('Birthday', d.birthday ? new Date(d.birthday).toLocaleDateString() : null)}
                {renderField('Sex', d.sex)}
                {renderField('Civil Status', d.civilStatus)}
                {renderField('Citizenship', d.citizenship)}
                {renderField('Contact Number', d.contactNumber)}
                {renderField('Cellphone Number', d.cellphoneNumber)}
                {renderField('Email', d.email)}
                {renderField('Present Address', d.presentAddress)}
                {renderField('Present Address Tel.', d.presentAddressTelephone)}
                {renderField('Permanent Address', d.permanentAddress)}
                {renderField('Permanent Address Tel.', d.permanentAddressTelephone)}
                {renderField('Spouse Name', d.spouseName)}
              </View>

              <View style={st.receiptSectionCard}>
                <Text style={st.receiptSectionTitle}>Relator / Representative</Text>
                <View style={st.receiptDivider} />
                {renderField('Relator Name', d.relatorName)}
                {renderField('Relationship to Client', d.relationshipToClient)}
              </View>

              <View style={st.receiptSectionCard}>
                <Text style={st.receiptSectionTitle}>Schedule Details</Text>
                <View style={st.receiptDivider} />
                {renderField('Status', statusLabel)}
                {renderField('Appointment Date', d.appointedDate ? new Date(d.appointedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : null)}
                {renderField('Appointment Time', d.appointmentTime)}
              </View>

              <View style={st.receiptSectionCard}>
                <Text style={st.receiptSectionTitle}>Financial Details</Text>
                <View style={st.receiptDivider} />
                {renderField('Income Source', d.currentSourceOfIncome)}
                {renderField('Monthly Income', d.monthlyIncome ? `₱${Number(d.monthlyIncome).toLocaleString()}` : null)}
                {renderField('Nature of Work', d.natureOfWork)}
                {renderField('Employer', d.employerName)}
                {renderField('Employer Address', d.employerAddress)}
                {renderField('Employer Telephone', d.employerTelephone)}
              </View>

              <View style={st.receiptSectionCard}>
                <Text style={st.receiptSectionTitle}>Spouse's Income</Text>
                <View style={st.receiptDivider} />
                {renderField('Source of Income', d.spouseSourceOfIncome)}
                {renderField('Monthly Income', d.spouseMonthlyIncome ? `₱${Number(d.spouseMonthlyIncome).toLocaleString()}` : null)}
                {renderField('Nature of Work / Business', d.spouseNatureOfWork)}
                {renderField('Spouse Employer Address', d.spouseEmployerAddress)}
                {renderField('Total Combined Income', d.totalCombinedIncome ? `₱${Number(d.totalCombinedIncome).toLocaleString()}` : null)}
              </View>

              <View style={st.receiptSectionCard}>
                <Text style={st.receiptSectionTitle}>Case Details</Text>
                <View style={st.receiptDivider} />
                {renderField('Party Represented', d.partyRepresented)}
                {renderField('Case Number', d.caseNumber)}
                {renderField('Nature of Case', d.caseNature || d.natureOfCase)}
                {renderField('Venue', d.venue)}
                {renderField('Present Stage', d.presentStage)}
                {renderField('Court Division', d.courtDivision)}
                {renderField('Court Address', d.courtAddress)}
                {renderField('Court Phone', d.courtPhoneNumber)}
                {renderField('Presiding Officer', d.presidingOfficer)}
              </View>

              <View style={st.receiptSectionCard}>
                <Text style={st.receiptSectionTitle}>Adverse Party</Text>
                <View style={st.receiptDivider} />
                {renderField('Adverse Party(ies)', d.adverseParty)}
                {renderField('Address', d.adversePartyAddress)}
                {renderField('Counsel', d.adversePartyCounsel)}
                {renderField('Counsel Address', d.adversePartyCounselAddress)}
                {renderField('Counsel Phone', d.adversePartyCounselPhone)}
              </View>
              <View style={{ height: 30 }} />
            </ScrollView>
          ) : (
            <View style={st.centerContainer}><Text style={{ color: MUTED_OLIVE }}>No appointment details available</Text></View>
          )}
        </View>
      </Modal>
    );
  };

  // ── Case Record Modal ──
  const renderCaseRecordModal = () => (
    <Modal visible={caseRecordModalVisible} animationType="slide" onRequestClose={() => setCaseRecordModalVisible(false)}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={st.modalContainer}>
          <View style={st.modalHeader}>
            <TouchableOpacity onPress={() => setCaseRecordModalVisible(false)} style={st.modalBackBtn}>
              <Ionicons name="arrow-back" size={22} color={CHARCOAL} />
            </TouchableOpacity>
            <Text style={st.modalTitle}>Case Record</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TouchableOpacity style={st.exportBtn} onPress={exportCaseRecordPdf}>
                <Ionicons name="download-outline" size={14} color="#fff" />
                <Text style={st.exportBtnText}>PDF</Text>
              </TouchableOpacity>
              {caseRecordEditMode ? (
                <>
                  <TouchableOpacity style={st.crChipOutline} onPress={handleCancelCaseRecordEdit} disabled={savingCaseRecord}>
                    <Text style={st.crChipOutlineText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[st.crChipFilled, savingCaseRecord && { opacity: 0.6 }]} onPress={handleSaveCaseRecord} disabled={savingCaseRecord}>
                    {savingCaseRecord ? <ActivityIndicator size="small" color="#fff" /> : <Text style={st.crChipFilledText}>Save</Text>}
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity style={st.crChipOutline} onPress={() => setCaseRecordEditMode(true)} disabled={caseRecordLoading}>
                  <Text style={st.crChipOutlineText}>Edit</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <ScrollView style={st.modalScrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {caseRecordLoading ? (
              <View style={st.centerContainer}><ActivityIndicator size="large" color={PRIMARY_BROWN} /></View>
            ) : (
              <>
                <View style={st.crSectionCard}>
                  <Text style={st.receiptSectionTitle}>Case Information</Text>
                  <View style={st.receiptDivider} />
                  {renderCaseRecordField('Title', 'title', { placeholder: 'Case title' })}
                  {renderCaseRecordField('Nature of the Case', 'nature', { placeholder: 'Nature' })}
                  {renderCaseRecordField('Tribunal', 'tribunal', { placeholder: 'Tribunal' })}
                  {renderCaseRecordField('Branch', 'branch', { placeholder: 'Branch' })}
                  {renderCaseRecordField('Presiding Judge', 'presidingJudge', { placeholder: 'Presiding judge' })}
                  {renderCaseRecordField('Tel/Email of Clerk of Court', 'telEmail', { placeholder: 'Contact details' })}
                </View>

                <View style={st.crSectionCard}>
                  <Text style={st.receiptSectionTitle}>Contacts</Text>
                  <View style={st.receiptDivider} />
                  {renderCaseRecordField('Contact Details (Case)', 'contactDetails', { placeholder: 'Phone or email' })}
                  {renderCaseRecordField('Counsel/s on Record', 'counsels', { placeholder: 'Counsel names' })}
                  {renderCaseRecordField('Public Prosecutor', 'publicProsecutor', { placeholder: 'Prosecutor' })}
                  {renderCaseRecordField('Opposing Counsel', 'opposingCounsel', { placeholder: 'Opposing counsel' })}
                  {renderCaseRecordField('Client/s Address', 'clientAddress', { placeholder: 'Client address', multiline: true })}
                  {renderCaseRecordField('Others (Contact Details)', 'others', { placeholder: 'Other contacts', multiline: true })}
                </View>

                <View style={st.crSectionCard}>
                  <Text style={st.receiptSectionTitle}>Parties</Text>
                  <View style={st.receiptDivider} />
                  {renderCaseRecordField('Party/ies', 'parties', { placeholder: 'List parties involved', multiline: true })}
                </View>

                <View style={st.crSectionCard}>
                  <Text style={st.receiptSectionTitle}>Case History & Notes</Text>
                  <View style={st.receiptDivider} />
                  {renderCaseRecordField('Case History (reverse chronological)', 'caseHistory', { placeholder: 'Important events and filings', multiline: true })}
                  {renderCaseRecordField('Remarks / Reminders / Notes', 'remarks', { placeholder: 'Deadlines, reminders', multiline: true })}
                </View>
                <View style={{ height: 40 }} />
              </>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  // ── Version History Modal ──
  const renderVersionHistoryModal = () => {
    const versions = versionCase?.content?.interviewInfo?.documentVersions || [];
    const currentDoc = versionCase?.content?.interviewInfo?.uploadedDocument || null;

    return (
      <Modal visible={versionModalVisible} animationType="slide" onRequestClose={() => setVersionModalVisible(false)}>
        <View style={st.modalContainer}>
          <View style={st.modalHeader}>
            <TouchableOpacity onPress={() => setVersionModalVisible(false)} style={st.modalBackBtn}>
              <Ionicons name="arrow-back" size={22} color={CHARCOAL} />
            </TouchableOpacity>
            <Text style={st.modalTitle}>Version History</Text>
            <View style={{ width: 32 }} />
          </View>

          <ScrollView style={st.modalScrollContent} showsVerticalScrollIndicator={false}>
            {/* Case Info Summary */}
            <View style={st.receiptBanner}>
              <Text style={st.receiptBannerTitle}>{versionCase?.caseId || 'Case'}</Text>
              <Text style={st.receiptCaseNumber}>
                {versionCase?.clientName || versionCase?.content?.interviewInfo?.clientName || 'Unknown Client'}
              </Text>
              <View style={[st.receiptStatusBadge, { backgroundColor: '#8B5CF6' }]}>
                <Text style={[st.receiptStatusText, { color: '#fff' }]}>{versions.length} version{versions.length !== 1 ? 's' : ''}</Text>
              </View>
            </View>

            {/* Current Document */}
            {currentDoc && (
              <View style={[st.receiptSectionCard, { borderWidth: 2, borderColor: PRIMARY_GOLD }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={st.receiptSectionTitle}>Current Version</Text>
                  <View style={{ backgroundColor: PRIMARY_BROWN, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>Latest</Text>
                  </View>
                </View>
                <View style={st.receiptDivider} />
                <Text style={st.receiptFieldValue}>{currentDoc.fileName || 'Document'}</Text>
                {currentDoc.fileSize && <Text style={st.metaText}>{(currentDoc.fileSize / 1024).toFixed(1)} KB</Text>}
                {versionCase?.content?.interviewInfo?.uploadedBy && (
                  <Text style={st.metaText}>
                    Uploaded by: {versionCase.content.interviewInfo.uploadedBy}
                    {versionCase.content.interviewInfo.uploadedByRole ? ` (${versionCase.content.interviewInfo.uploadedByRole})` : ''}
                  </Text>
                )}
                {(currentDoc.fileUrl || currentDoc.fileData || currentDoc.cloudinaryUrl) && (
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                    <TouchableOpacity style={[st.versionBtn, { backgroundColor: '#EFF6FF' }]} onPress={() => handleViewDocument(currentDoc)}>
                      <Ionicons name="eye-outline" size={14} color="#3B82F6" />
                      <Text style={[st.versionBtnText, { color: '#3B82F6' }]}>View</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* Version List */}
            {versions.length > 0 ? (
              versions.map((v, idx) => (
                <View key={idx} style={st.receiptSectionCard}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={st.receiptSectionTitle}>Version {versions.length - idx}</Text>
                    {v.uploadedAt && <Text style={st.metaText}>{formatDate(v.uploadedAt)}</Text>}
                  </View>
                  <View style={st.receiptDivider} />
                  <Text style={st.receiptFieldValue}>{v.fileName || 'Document'}</Text>
                  {v.fileSize && <Text style={st.metaText}>{(v.fileSize / 1024).toFixed(1)} KB</Text>}
                  {v.uploadedBy && (
                    <Text style={st.metaText}>
                      Uploaded by: {v.uploadedBy}{v.uploadedByRole ? ` (${v.uploadedByRole})` : v.role ? ` (${v.role})` : ''}
                    </Text>
                  )}
                  {v.uploadedAt && <Text style={st.metaText}>{new Date(v.uploadedAt).toLocaleString()}</Text>}
                  {(v.fileUrl || v.fileData || v.cloudinaryUrl) ? (
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                      <TouchableOpacity style={[st.versionBtn, { backgroundColor: '#EFF6FF' }]} onPress={() => handleViewDocument(v)}>
                        <Ionicons name="eye-outline" size={14} color="#3B82F6" />
                        <Text style={[st.versionBtnText, { color: '#3B82F6' }]}>View</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[st.versionBtn, { backgroundColor: '#FEF2F2' }]} onPress={() => handleDeleteVersion(idx)}>
                        <Ionicons name="trash-outline" size={14} color="#EF4444" />
                        <Text style={[st.versionBtnText, { color: '#EF4444' }]}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>File not available</Text>
                  )}
                </View>
              ))
            ) : !currentDoc ? (
              <View style={st.centerContainer}><Text style={{ color: MUTED_OLIVE }}>No document versions found</Text></View>
            ) : null}
            <View style={{ height: 30 }} />
          </ScrollView>
        </View>
      </Modal>
    );
  };

  // ── Assign Case Modal ──
  const renderAssignModal = () => {
    const availableStaff = adminStaff.filter(u => u._id !== userData?._id && u._id !== userData?.id);
    const selectedStaff = availableStaff.find(u => u._id === assignForm.assigneeId);

    return (
      <Modal visible={assignModalVisible} animationType="slide" onRequestClose={() => setAssignModalVisible(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={st.modalContainer}>
            <View style={st.modalHeader}>
              <TouchableOpacity onPress={() => setAssignModalVisible(false)} style={st.modalBackBtn}>
                <Ionicons name="arrow-back" size={22} color={CHARCOAL} />
              </TouchableOpacity>
              <Text style={st.modalTitle}>Assign Case</Text>
              <View style={{ width: 32 }} />
            </View>

            <ScrollView style={st.modalScrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {/* Case summary */}
              {assignTargetCase && (
                <View style={st.receiptBanner}>
                  <Text style={st.receiptBannerTitle}>
                    {assignTargetCase.caseTitle || assignTargetCase.content?.caseInfo?.caseTitle || assignTargetCase.caseId || 'Case'}
                  </Text>
                  <Text style={st.receiptCaseNumber}>
                    {assignTargetCase.clientName || assignTargetCase.content?.interviewInfo?.clientName || 'Unknown Client'}
                  </Text>
                </View>
              )}

              {/* Staff picker */}
              <Text style={st.assignLabel}>Assign to Admin Staff</Text>
              <TouchableOpacity style={st.assignPickerBtn} onPress={() => setShowStaffPicker(true)}>
                <Text style={selectedStaff ? st.assignPickerText : st.assignPickerPlaceholder}>
                  {selectedStaff ? `${selectedStaff.firstName || ''} ${selectedStaff.lastName || ''} (${selectedStaff.role || ''})`.trim() : 'Select staff member...'}
                </Text>
                <Ionicons name="chevron-down" size={18} color={MUTED_OLIVE} />
              </TouchableOpacity>

              {/* Staff picker modal */}
              <Modal visible={showStaffPicker} transparent animationType="fade" onRequestClose={() => setShowStaffPicker(false)}>
                <TouchableOpacity style={st.menuOverlay} activeOpacity={1} onPress={() => setShowStaffPicker(false)}>
                  <View style={st.staffPickerSheet}>
                    <Text style={st.menuTitle}>Select Staff</Text>
                    <ScrollView style={{ maxHeight: 300 }}>
                      {availableStaff.map(u => (
                        <TouchableOpacity
                          key={u._id}
                          style={[st.staffPickerItem, assignForm.assigneeId === u._id && st.staffPickerItemActive]}
                          onPress={() => {
                            setAssignForm(prev => ({ ...prev, assigneeId: u._id }));
                            setShowStaffPicker(false);
                          }}
                        >
                          <Text style={st.staffPickerItemText}>
                            {u.firstName || ''} {u.lastName || ''} ({u.role || ''})
                          </Text>
                          {assignForm.assigneeId === u._id && <Ionicons name="checkmark" size={18} color={PRIMARY_BROWN} />}
                        </TouchableOpacity>
                      ))}
                      {availableStaff.length === 0 && <Text style={{ color: MUTED_OLIVE, padding: 16 }}>No staff available</Text>}
                    </ScrollView>
                  </View>
                </TouchableOpacity>
              </Modal>

              {/* Deadline */}
              <Text style={st.assignLabel}>Deadline</Text>
              <TouchableOpacity style={st.assignPickerBtn} onPress={() => setShowDeadlinePicker(true)}>
                <Text style={assignForm.deadline ? st.assignPickerText : st.assignPickerPlaceholder}>
                  {assignForm.deadline || 'Select deadline...'}
                </Text>
                <Ionicons name="calendar-outline" size={18} color={MUTED_OLIVE} />
              </TouchableOpacity>
              {showDeadlinePicker && (
                Platform.OS === 'ios' ? (
                  <Modal transparent animationType="slide">
                    <View style={st.dateModalOverlay}>
                      <View style={st.dateModalContent}>
                        <View style={st.dateModalHeader}>
                          <Text style={st.dateModalTitle}>Select Deadline</Text>
                          <TouchableOpacity onPress={() => setShowDeadlinePicker(false)}>
                            <Text style={st.dateModalDone}>Done</Text>
                          </TouchableOpacity>
                        </View>
                        <DateTimePicker
                          value={assignForm.deadline ? new Date(assignForm.deadline) : new Date()}
                          mode="date"
                          display="spinner"
                          minimumDate={new Date()}
                          onChange={(event, selectedDate) => {
                            if (selectedDate) {
                              setAssignForm(prev => ({ ...prev, deadline: selectedDate.toISOString().split('T')[0] }));
                            }
                          }}
                        />
                      </View>
                    </View>
                  </Modal>
                ) : (
                  <DateTimePicker
                    value={assignForm.deadline ? new Date(assignForm.deadline) : new Date()}
                    mode="date"
                    display="default"
                    minimumDate={new Date()}
                    onChange={(event, selectedDate) => {
                      setShowDeadlinePicker(false);
                      if (event.type === 'set' && selectedDate) {
                        setAssignForm(prev => ({ ...prev, deadline: selectedDate.toISOString().split('T')[0] }));
                      }
                    }}
                  />
                )
              )}

              {/* Message */}
              <Text style={st.assignLabel}>Message / Instructions</Text>
              <TextInput
                style={[st.assignInput, { minHeight: 120, textAlignVertical: 'top' }]}
                placeholder="Enter instructions for the assignee..."
                placeholderTextColor="#999"
                value={assignForm.message}
                onChangeText={text => setAssignForm(prev => ({ ...prev, message: text }))}
                multiline
                numberOfLines={6}
              />

              {/* Submit */}
              <TouchableOpacity
                style={[st.assignSubmitBtn, assignLoading && { opacity: 0.6 }]}
                onPress={handleAssignCase}
                disabled={assignLoading}
              >
                {assignLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={st.assignSubmitText}>Assign Case</Text>
                )}
              </TouchableOpacity>
              <View style={{ height: 30 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  };

  // ── Main Render ──
  return (
    <View style={st.container}>
      {/* Header */}
      <View style={st.header}>
        <View>
          <Text style={st.headerTitle}>Finalized Cases</Text>
          <Text style={st.headerSubtitle}>Review and manage finalized case decisions</Text>
        </View>
        <TouchableOpacity onPress={() => fetchFinalized()} style={st.refreshBtn}>
          <Ionicons name="refresh-outline" size={20} color={PRIMARY_BROWN} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={st.tabScrollContainer} contentContainerStyle={st.tabContainer}>
        {tabDefs.map(tab => (
          <TouchableOpacity
            key={tab.value}
            style={[st.tab, activeTab === tab.value && st.tabActive]}
            onPress={() => setActiveTab(tab.value)}
          >
            <Text style={[st.tabText, activeTab === tab.value && st.tabTextActive]}>{tab.label}</Text>
            {tab.count > 0 && (
              <View style={[st.tabBadge, { backgroundColor: activeTab === tab.value ? '#fff' : tab.color }]}>
                <Text style={[st.tabBadgeText, { color: activeTab === tab.value ? PRIMARY_BROWN : '#fff' }]}>{tab.count}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Search + Rejected Filter */}
      <View style={st.searchContainer}>
        <View style={st.searchInputContainer}>
          <Ionicons name="search-outline" size={18} color={MUTED_OLIVE} />
          <TextInput
            style={st.searchInput}
            placeholder="Search by case ID or client name..."
            placeholderTextColor="#999"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          {searchTerm ? (
            <TouchableOpacity onPress={() => setSearchTerm('')}>
              <Ionicons name="close-circle" size={18} color={MUTED_OLIVE} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Rejected case type filter */}
        {activeTab === 'rejected' && (
          <View style={st.rejectedFilterRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 6 }}>
              {REJECTED_FILTER_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={[st.filterChip, rejectedCaseTypeFilter === opt.value && st.filterChipActive]}
                  onPress={() => setRejectedCaseTypeFilter(opt.value)}
                >
                  <Text style={[st.filterChipText, rejectedCaseTypeFilter === opt.value && st.filterChipTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Content */}
      {loading ? (
        <View style={st.centerContainer}>
          <ActivityIndicator size="large" color={PRIMARY_BROWN} />
        </View>
      ) : (
        <ScrollView
          style={st.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[PRIMARY_BROWN]} />}
        >
          {activeData.length > 0 ? (
            <>
              <Text style={st.resultCount}>
                {activeData.length} case{activeData.length !== 1 ? 's' : ''}
              </Text>
              {activeData.map(renderCaseCard)}
            </>
          ) : (
            <View style={st.emptyContainer}>
              <Ionicons name="folder-open-outline" size={48} color="#ccc" />
              <Text style={st.emptyTitle}>No Cases Found</Text>
              <Text style={st.emptyText}>
                {activeTab === 'with-record' ? 'No accepted court representation cases with records.'
                  : activeTab === 'without-record' ? 'No accepted court representation cases without records.'
                  : activeTab === 'legal-advice' ? 'No legal advice cases.'
                  : activeTab === 'document-drafting' ? 'No document drafting cases.'
                  : 'No rejected cases.'}
              </Text>
            </View>
          )}
          <View style={{ height: 20 }} />
        </ScrollView>
      )}

      {/* Modals */}
      {renderActionMenu()}
      {renderReviewModal()}
      {renderReceiptModal()}
      {renderCaseRecordModal()}
      {renderVersionHistoryModal()}
      {renderAssignModal()}
    </View>
  );
}

// ── Styles ──
const st = StyleSheet.create({
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
  searchContainer: { paddingHorizontal: 16, paddingTop: 8 },
  searchInputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 10, paddingHorizontal: 12, height: 44,
    borderWidth: 1, borderColor: '#E0E0E0', gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: CHARCOAL },

  // Rejected filter
  rejectedFilterRow: { marginTop: 4 },
  filterChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    backgroundColor: '#f5f5f5', borderWidth: 1, borderColor: '#E0E0E0',
  },
  filterChipActive: { backgroundColor: PRIMARY_BROWN, borderColor: PRIMARY_BROWN },
  filterChipText: { fontSize: 12, fontWeight: '600', color: MUTED_OLIVE },
  filterChipTextActive: { color: '#fff' },

  // Content
  scrollContent: { flex: 1, paddingHorizontal: 16 },
  resultCount: { fontSize: 12, color: MUTED_OLIVE, marginBottom: 8, marginTop: 4 },

  // Card
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: '#f0f0f0', borderLeftWidth: 4,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 },
  caseTypeBadge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  caseTypeLetter: { fontSize: 13, fontWeight: '700', color: '#fff' },
  caseTitle: { fontSize: 15, fontWeight: '700', color: CHARCOAL },
  caseIdText: { fontSize: 12, color: MUTED_OLIVE, marginTop: 1, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  iconBtn: { padding: 6, borderRadius: 8, backgroundColor: '#f5f5f5' },

  cardMeta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginTop: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: MUTED_OLIVE },
  caseTypePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  caseTypePillText: { fontSize: 11, fontWeight: '600' },

  // Version buttons
  versionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  versionBtnText: { fontSize: 12, fontWeight: '600' },

  // Export button
  exportBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: PRIMARY_BROWN, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  exportBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  // Action Menu
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  menuSheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 30, paddingTop: 12 },
  menuHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#D9D9D9', alignSelf: 'center', marginBottom: 12 },
  menuTitle: { fontSize: 16, fontWeight: '700', color: CHARCOAL, paddingHorizontal: 20, marginBottom: 8 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14 },
  menuItemText: { fontSize: 15, fontWeight: '500', color: CHARCOAL },
  menuCancelBtn: { marginTop: 4, paddingVertical: 14, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  menuCancelText: { fontSize: 15, fontWeight: '600', color: MUTED_OLIVE },

  // Empty
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: CHARCOAL, marginTop: 12 },
  emptyText: { fontSize: 13, color: MUTED_OLIVE, textAlign: 'center', marginTop: 4, paddingHorizontal: 32 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },

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

  // Case Record
  crSectionCard: {
    backgroundColor: '#FAFAFA', borderRadius: 12, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#f0f0f0',
  },
  crFieldWrap: { marginBottom: 12 },
  crFieldLabel: { fontSize: 11, color: MUTED_OLIVE, textTransform: 'uppercase', fontWeight: '600', marginBottom: 4 },
  crFieldValue: { fontSize: 14, color: CHARCOAL },
  crInput: {
    borderWidth: 1, borderColor: '#D8D0C4', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: CHARCOAL, backgroundColor: '#fff',
  },
  crTextarea: { minHeight: 90 },
  crChipOutline: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1, borderColor: PRIMARY_BROWN,
  },
  crChipOutlineText: { fontSize: 13, fontWeight: '600', color: PRIMARY_BROWN },
  crChipFilled: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: PRIMARY_BROWN,
  },
  crChipFilledText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  // Assign
  assignLabel: { fontSize: 13, fontWeight: '600', color: CHARCOAL, marginTop: 16, marginBottom: 6 },
  assignPickerBtn: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#fff',
  },
  assignPickerText: { fontSize: 14, color: CHARCOAL },
  assignPickerPlaceholder: { fontSize: 14, color: '#999' },
  assignInput: {
    borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: CHARCOAL, backgroundColor: '#fff',
  },
  assignSubmitBtn: {
    backgroundColor: PRIMARY_BROWN, borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', marginTop: 20,
  },
  assignSubmitText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  // Date Picker Modal
  dateModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  dateModalContent: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: 30 },
  dateModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#eee' },
  dateModalTitle: { fontSize: 16, fontWeight: '600', color: CHARCOAL },
  dateModalDone: { fontSize: 16, fontWeight: '600', color: PRIMARY_BROWN },

  // Staff Picker
  staffPickerSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingBottom: 30, paddingTop: 12, maxHeight: '50%',
  },
  staffPickerItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f5f5f5',
  },
  staffPickerItemActive: { backgroundColor: `${PRIMARY_BROWN}10` },
  staffPickerItemText: { fontSize: 14, color: CHARCOAL },
});
