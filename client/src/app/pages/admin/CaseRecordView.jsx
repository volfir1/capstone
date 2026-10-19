import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Container, Title, Text, Paper, Stack, Group, Button, Divider, Loader, Center, ActionIcon, Tooltip, ScrollArea, Tabs, Table, TextInput, Modal, FileButton,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconArrowLeft, IconDeviceFloppy, IconFileText, IconDownload, IconHistory, IconChecklist, IconFileDescription, IconFolder, IconEdit, IconTrash, IconEye, IconPaperclip, IconX,
} from '@tabler/icons-react';
import { PRIMARY_BROWN, MUTED_OLIVE, BG, CHARCOAL } from '@utils/constants';
import { CaseInformationSection } from '@/app/pages/other/CaseInformationSection';
import EvidenceList, { normalizeList } from '@/components/EvidenceList';
import apiClient from '@config/api/apiClient';
import { useAuth } from '@/context/authContext';
import jsPDF from 'jspdf';

// Temporary visual preview for the existing Patricia Anne Villanueva finalized
// case. It is only used while that record has no real workflow audit entries.
const PATRICIA_WORKFLOW_PREVIEW = [
  {
    action: 'Submitted to supervising lawyer',
    fromStage: 'draft',
    toStage: 'supervising_lawyer',
    actor: { name: 'Legal Intern', role: 'intern' },
    occurredAt: '2026-10-13T09:15:00+08:00',
    snapshot: {
      interviewInfo: {
        internAdvice: 'Based on the interview, Patricia may pursue a complaint for breach of contract and recovery of unpaid obligations.',
        legalOpinion: 'The available documents indicate a possible cause of action. Further review of the agreement and supporting receipts is recommended.',
      },
      actionInfo: { supervisingComment: '' },
    },
  },
  {
    action: 'Returned to intern/secretary for changes',
    fromStage: 'supervising_lawyer',
    toStage: 'returned_to_intern',
    actor: { name: 'Atty. Maria Santos', role: 'supervising_lawyer' },
    occurredAt: '2026-10-14T10:30:00+08:00',
    snapshot: {
      interviewInfo: {
        internAdvice: 'Based on the interview, Patricia may pursue a complaint for breach of contract and recovery of unpaid obligations.',
        legalOpinion: 'The available documents indicate a possible cause of action. Further review of the agreement and supporting receipts is recommended.',
      },
      actionInfo: { supervisingComment: 'Please add the relevant contract provisions, identify the correct court, and clarify the recommended remedy.' },
    },
  },
  {
    action: 'Resubmitted to supervising lawyer',
    fromStage: 'returned_to_intern',
    toStage: 'supervising_lawyer',
    actor: { name: 'Legal Intern', role: 'intern' },
    occurredAt: '2026-10-15T14:10:00+08:00',
    snapshot: {
      interviewInfo: {
        internAdvice: 'Patricia may file an action for breach of contract and collection of the unpaid amount, subject to final review of the supporting documents.',
        legalOpinion: 'The agreement, receipts, and communications support a possible civil action. The recommended remedy is collection of the unpaid balance, with damages where applicable.',
      },
      actionInfo: { supervisingComment: 'Please add the relevant contract provisions, identify the correct court, and clarify the recommended remedy.' },
    },
  },
  {
    action: 'Submitted to director',
    fromStage: 'supervising_lawyer',
    toStage: 'director',
    actor: { name: 'Atty. Maria Santos', role: 'supervising_lawyer' },
    occurredAt: '2026-10-16T11:45:00+08:00',
    snapshot: {
      interviewInfo: {
        internAdvice: 'Patricia may file an action for breach of contract and collection of the unpaid amount, subject to final review of the supporting documents.',
        legalOpinion: 'The agreement, receipts, and communications support a possible civil action. The recommended remedy is collection of the unpaid balance, with damages where applicable.',
      },
      actionInfo: { supervisingComment: 'Reviewed and revised. Recommended for director approval.' },
    },
  },
];

const isPatriciaWorkflowPreview = (finalizedCase) => {
  const clientName = finalizedCase?.clientName || finalizedCase?.content?.interviewInfo?.clientName || '';
  return clientName.trim().toLowerCase() === 'patricia anne villanueva'
    && finalizedCase?.content?.interviewInfo?.caseType === 'court-representation'
    && !(finalizedCase?.workflowHistory || []).length;
};

export default function CaseRecordView() {
  const { finalizeId } = useParams();
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [caseRecordData, setCaseRecordData] = useState({});
  const [originalData, setOriginalData] = useState({});
  const [activeTab, setActiveTab] = useState('case-record');

  // History tab state
  const [historyRecords, setHistoryRecords] = useState([]);
  const [workflowHistory, setWorkflowHistory] = useState([]);
  const [editHistoryModalOpened, setEditHistoryModalOpened] = useState(false);
  const [editingHistory, setEditingHistory] = useState(null);
  const [viewFileModalOpened, setViewFileModalOpened] = useState(false);
  const [viewingFile, setViewingFile] = useState(null);

  // Evidence tab state
  const [evidenceData, setEvidenceData] = useState([]);
  const evidenceListRef = useRef(null);

  // Drafts tab state
  const [draftsData, setDraftsData] = useState([]);
  const [selectedDraftFile, setSelectedDraftFile] = useState(null);
  const [uploadingDraft, setUploadingDraft] = useState(false);

  useEffect(() => {
    const fetchCaseRecord = async () => {
      try {
        setLoading(true);
        const resp = await apiClient.get(`/caserecords/finalize/${finalizeId}`);
        
        // Check if case record exists and has meaningful data (not just IDs)
        const hasMeaningfulData = resp.data && 
          (resp.data.title || resp.data.clientName || resp.data.nature || 
           (resp.data.courtVenueDetails && resp.data.courtVenueDetails.length > 0) ||
           (resp.data.partiesAndCounselDetails && resp.data.partiesAndCounselDetails.length > 0));
        
        if (hasMeaningfulData) {
          console.log('Case record exists with data:', resp.data);
          setCaseRecordData(resp.data);
          setOriginalData(resp.data);
          setWorkflowHistory(resp.data.finalizeId?.workflowHistory || []);
          // Load history records from server
          if (resp.data.historyRecords && Array.isArray(resp.data.historyRecords)) {
            setHistoryRecords(resp.data.historyRecords);
          }
          // Load evidence data from server - prioritize case record evidence, but also check finalized case
          let evidenceToLoad = [];
          const hasCaseRecordEvidence = resp.data.evidence && Array.isArray(resp.data.evidence) && resp.data.evidence.length > 0;

          // Check if case record evidence has actual annexes data (not just empty arrays)
          const hasActualEvidence = hasCaseRecordEvidence && resp.data.evidence.some(list =>
            list.annexes && Array.isArray(list.annexes) && list.annexes.length > 0
          );

          if (hasActualEvidence) {
            // Use evidence from case record if it has actual data
            console.log('Using evidence from case record:', resp.data.evidence);
            evidenceToLoad = resp.data.evidence;
          } else {
            // Fall back to evidence from finalized case's interviewInfo
            try {
              const finalizedResp = await apiClient.get(`/finalize/detail/${finalizeId}`);
              const finalized = finalizedResp.data;
              if (finalized?.content?.interviewInfo) {
                const interviewInfo = finalized.content.interviewInfo;
                const evidenceLists = [];

                // Look for evidence arrays in interviewInfo (e.g., clientEvidence, prosecutionEvidence, etc.)
                Object.keys(interviewInfo).forEach(key => {
                  const value = interviewInfo[key];
                  // Check if this is an evidence array by looking for evidence-related keys
                  if (Array.isArray(value) && value.length > 0) {
                    const firstItem = value[0];
                    // Check if the item has evidence-related fields
                    const hasEvidenceFields = firstItem.annex !== undefined ||
                                             firstItem.exhibit !== undefined ||
                                             firstItem.document !== undefined ||
                                             firstItem.witness !== undefined ||
                                             (firstItem.annexes && Array.isArray(firstItem.annexes));
                    if (hasEvidenceFields) {
                      // This looks like an evidence array
                      const normalizedList = normalizeList({
                        _id: key,
                        name: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()), // Convert camelCase to Title Case
                        annexes: value
                      });
                      evidenceLists.push(normalizedList);
                    }
                  }
                });

                // If no evidence arrays found, check for a generic 'evidence' field
                if (evidenceLists.length === 0 && Array.isArray(interviewInfo.evidence)) {
                  const normalizedList = normalizeList({
                    _id: 'default',
                    name: 'Client Evidence',
                    annexes: interviewInfo.evidence
                  });
                  evidenceLists.push(normalizedList);
                }

                if (evidenceLists.length > 0) {
                  evidenceToLoad = evidenceLists;
                }
              }
            } catch (err) {
              console.warn('Error fetching finalized case for evidence fallback:', err);
            }
          }
          setEvidenceData(evidenceToLoad);
          // Load drafts data from server
          if (resp.data.drafts && Array.isArray(resp.data.drafts)) {
            setDraftsData(resp.data.drafts);
          }
        } else {
          console.log('No meaningful case record data, fetching client info...');
          // A finalized court-representation case can have a workflow history
          // before staff create its separate case-record document.
          const finalizedResp = await apiClient.get(`/finalize/detail/${finalizeId}`);
          const finalized = finalizedResp.data;
          console.log('Finalized case:', finalized);
          setWorkflowHistory(isPatriciaWorkflowPreview(finalized)
            ? PATRICIA_WORKFLOW_PREVIEW
            : (finalized?.workflowHistory || []));

          // Retrieve evidence from finalized case's content.interviewInfo
          if (finalized?.content?.interviewInfo) {
            const interviewInfo = finalized.content.interviewInfo;
            const evidenceLists = [];

            // Look for evidence arrays in interviewInfo (e.g., clientEvidence, prosecutionEvidence, etc.)
            Object.keys(interviewInfo).forEach(key => {
              const value = interviewInfo[key];
              // Check if this is an evidence array by looking for evidence-related keys
              if (Array.isArray(value) && value.length > 0) {
                const firstItem = value[0];
                // Check if the item has evidence-related fields
                const hasEvidenceFields = firstItem.annex !== undefined ||
                                         firstItem.exhibit !== undefined ||
                                         firstItem.document !== undefined ||
                                         firstItem.witness !== undefined ||
                                         (firstItem.annexes && Array.isArray(firstItem.annexes));
                if (hasEvidenceFields) {
                  // This looks like an evidence array
                  const normalizedList = normalizeList({
                    _id: key,
                    name: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()), // Convert camelCase to Title Case
                    annexes: value
                  });
                  evidenceLists.push(normalizedList);
                }
              }
            });

            // If no evidence arrays found, check for a generic 'evidence' field
            if (evidenceLists.length === 0 && Array.isArray(interviewInfo.evidence)) {
              const normalizedList = normalizeList({
                _id: 'default',
                name: 'Client Evidence',
                annexes: interviewInfo.evidence
              });
              evidenceLists.push(normalizedList);
            }

            if (evidenceLists.length > 0) {
              setEvidenceData(evidenceLists);
            }
          }

          // Fetch client information to populate the case record form (for viewing only, not auto-saving)
          if (finalized?.caseId) {
            try {
              const clientInfoResp = await apiClient.get(`/clientsinfo/${finalized.caseId}`);
              const clientInfo = clientInfoResp.data;
              console.log('Client info fetched:', clientInfo);

              // Map client info to case record fields
              const mappedData = {
                title: clientInfo.caseNature || clientInfo.natureOfCase || clientInfo.caseDescription || '',
                nature: clientInfo.caseNature || clientInfo.natureOfCase || clientInfo.caseDescription || '',
                clientName: clientInfo.fullName || clientInfo.name || '',
                contactNumber: clientInfo.contactNumber || '',
                cellphoneNumber: clientInfo.cellphoneNumber || '',
                presentAddress: clientInfo.presentAddress || '',
                presentAddressTelephone: clientInfo.presentAddressTelephone || '',
                permanentAddress: clientInfo.permanentAddress || '',
                permanentAddressTelephone: clientInfo.permanentAddressTelephone || '',
                throughRelator: clientInfo.throughRelator || 'no',
                relatorName: clientInfo.relatorName || '',
                relationshipToClient: clientInfo.relationshipToClient || '',
                relatorEmail: clientInfo.relatorEmail || '',
                relatorPhone: clientInfo.relatorPhone || '',
                relatorAddress: clientInfo.relatorAddress || '',
                courtVenueDetails: clientInfo.courtVenueDetails || [],
                partiesAndCounselDetails: clientInfo.partiesAndCounselDetails || [],
              };

              console.log('Mapped data:', mappedData);

              // Set both caseRecordData and originalData to the mapped data
              // This allows the form to display the data while preventing auto-save
              setCaseRecordData(mappedData);
              setOriginalData(mappedData);
            } catch (clientErr) {
              console.error('Error fetching client info:', clientErr);
              setCaseRecordData({});
              setOriginalData({});
            }
          } else {
            console.log('No caseId in finalized case');
            setCaseRecordData({});
            setOriginalData({});
          }
        }
      } catch (err) {
        console.error('Error fetching case record:', err);
        notifications.show({ 
          title: 'Error', 
          message: 'Failed to load case record. Please try again.', 
          color: 'red' 
        });
      } finally {
        setLoading(false);
      }
    };

    if (finalizeId) fetchCaseRecord();
  }, [finalizeId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Force sync evidence data before saving
      if (evidenceListRef.current && evidenceListRef.current.forceSync) {
        evidenceListRef.current.forceSync();
      }

      // Convert any File objects to base64 before saving
      const historyRecordsToSave = await Promise.all(historyRecords.map(async (h) => {
        if (h.file instanceof File) {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              const base64 = reader.result.split(',')[1];
              resolve({
                ...h,
                file: base64,
                fileType: h.file.type
              });
            };
            reader.readAsDataURL(h.file);
          });
        }
        return h;
      }));

      const payload = {
        ...caseRecordData,
        historyRecords: historyRecordsToSave,
        evidence: evidenceData
      };
      await apiClient.put(`/caserecords/finalize/${finalizeId}`, payload);
      setOriginalData(caseRecordData);
      setEditMode(false);
      notifications.show({
        title: 'Success',
        message: 'Case record updated successfully.',
        color: 'green'
      });
    } catch (err) {
      console.error('Error saving case record:', err);
      notifications.show({
        title: 'Error',
        message: 'Failed to save case record. Please try again.',
        color: 'red'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setCaseRecordData(originalData);
    setEditMode(false);
  };

  // History functions
  const handleEditHistory = (historyItem) => {
    setEditingHistory(historyItem);
    setEditHistoryModalOpened(true);
  };

  const handleDeleteHistory = async (historyId) => {
    if (window.confirm('Are you sure you want to delete this history record?')) {
      const updatedHistoryRecords = historyRecords.filter(h => h.id !== historyId);
      setHistoryRecords(updatedHistoryRecords);
      
      // Convert any File objects to base64 before saving
      const historyRecordsToSave = await Promise.all(updatedHistoryRecords.map(async (h) => {
        if (h.file instanceof File) {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              const base64 = reader.result.split(',')[1];
              resolve({
                ...h,
                file: base64,
                fileType: h.file.type
              });
            };
            reader.readAsDataURL(h.file);
          });
        }
        return h;
      }));
      
      // Save to server
      try {
        await apiClient.put(`/caserecords/finalize/${finalizeId}`, {
          ...caseRecordData,
          historyRecords: historyRecordsToSave
        });
        notifications.show({ 
          title: 'Deleted', 
          message: 'History record deleted successfully.', 
          color: 'green' 
        });
      } catch (err) {
        console.error('Error deleting history record:', err);
        notifications.show({ 
          title: 'Error', 
          message: 'Failed to delete history record.', 
          color: 'red' 
        });
        // Revert on error
        setHistoryRecords(historyRecords);
      }
    }
  };

  const handleViewFile = (historyItem) => {
    // Check if the file is a File object (local) or base64 string (from server)
    if (historyItem.file instanceof File) {
      // Convert File object to base64 for viewing
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        setViewingFile({
          ...historyItem,
          file: base64,
          fileType: historyItem.file.type
        });
        setViewFileModalOpened(true);
      };
      reader.readAsDataURL(historyItem.file);
    } else {
      // Already in base64 format
      setViewingFile(historyItem);
      setViewFileModalOpened(true);
    }
  };

  const handleDownloadFile = (historyItem) => {
    if (historyItem.file && historyItem.fileName) {
      try {
        let fileData = historyItem.file;
        let fileType = historyItem.fileType || 'application/octet-stream';
        
        // Check if file is a File object (local) or base64 string (from server)
        if (historyItem.file instanceof File) {
          // Use the File object directly
          const url = URL.createObjectURL(historyItem.file);
          const link = document.createElement('a');
          link.href = url;
          link.download = historyItem.fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        } else {
          // Convert base64 to blob and download
          const byteCharacters = atob(fileData);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: fileType });
          
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = historyItem.fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
        
        notifications.show({ 
          title: 'Download', 
          message: `Downloading ${historyItem.fileName}...`, 
          color: 'blue' 
        });
      } catch (err) {
        console.error('Error downloading file:', err);
        notifications.show({ 
          title: 'Error', 
          message: 'Failed to download file.', 
          color: 'red' 
        });
      }
    } else {
      notifications.show({ 
        title: 'No File', 
        message: 'No file attached to this record.', 
        color: 'yellow' 
      });
    }
  };

  const handleDeleteFile = async (historyId) => {
    if (window.confirm('Are you sure you want to delete the attached file?')) {
      const updatedHistoryRecords = historyRecords.map(h => 
        h.id === historyId ? { ...h, file: null, fileName: null, fileType: null } : h
      );
      setHistoryRecords(updatedHistoryRecords);
      
      // Convert any File objects to base64 before saving
      const historyRecordsToSave = await Promise.all(updatedHistoryRecords.map(async (h) => {
        if (h.file instanceof File) {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              const base64 = reader.result.split(',')[1];
              resolve({
                ...h,
                file: base64,
                fileType: h.file.type
              });
            };
            reader.readAsDataURL(h.file);
          });
        }
        return h;
      }));
      
      // Save to server
      try {
        await apiClient.put(`/caserecords/finalize/${finalizeId}`, {
          ...caseRecordData,
          historyRecords: historyRecordsToSave
        });
        notifications.show({ 
          title: 'File Deleted', 
          message: 'Attached file deleted successfully.', 
          color: 'green' 
        });
      } catch (err) {
        console.error('Error deleting file:', err);
        notifications.show({ 
          title: 'Error', 
          message: 'Failed to delete attached file.', 
          color: 'red' 
        });
        // Revert on error
        setHistoryRecords(historyRecords);
      }
    }
  };

  const handleSaveHistory = async () => {
    if (editingHistory) {
      let updatedHistoryRecords;
      
      // Convert File object to base64 if needed
      let historyToSave = { ...editingHistory };
      if (historyToSave.file instanceof File) {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result.split(',')[1];
          historyToSave = {
            ...historyToSave,
            file: base64,
            fileType: historyToSave.file.type
          };
          saveHistoryRecord(historyToSave);
        };
        reader.readAsDataURL(historyToSave.file);
        return;
      }
      
      saveHistoryRecord(historyToSave);
    }
  };

  const saveHistoryRecord = async (historyToSave) => {
    let updatedHistoryRecords;

    // Check if this is a new record or an existing one
    const existingIndex = historyRecords.findIndex(h => h.id === historyToSave.id);

    if (existingIndex >= 0) {
      // Update existing record
      updatedHistoryRecords = historyRecords.map(h =>
        h.id === historyToSave.id ? historyToSave : h
      );
    } else {
      // Add new record
      updatedHistoryRecords = [...historyRecords, historyToSave];
    }

    setHistoryRecords(updatedHistoryRecords);
    setEditHistoryModalOpened(false);
    setEditingHistory(null);

    // Save to server
    try {
      await apiClient.put(`/caserecords/finalize/${finalizeId}`, {
        ...caseRecordData,
        historyRecords: updatedHistoryRecords
      });
      notifications.show({
        title: 'Success',
        message: 'History record saved successfully.',
        color: 'green'
      });
    } catch (err) {
      console.error('Error saving history record:', err);
      notifications.show({
        title: 'Error',
        message: 'Failed to save history record.',
        color: 'red'
      });
      // Revert on error
      setHistoryRecords(historyRecords);
    }
  };

  // Drafts functions
  const loadDrafts = async () => {
    try {
      const resp = await apiClient.get(`/caserecords/finalize/${finalizeId}/drafts`);
      if (resp.data && Array.isArray(resp.data.drafts)) {
        setDraftsData(resp.data.drafts);
      }
    } catch (err) {
      console.error('Error loading drafts:', err);
    }
  };

  const handleUploadDraft = async () => {
    if (!selectedDraftFile) {
      notifications.show({
        title: 'No File',
        message: 'Please select a file to upload.',
        color: 'yellow'
      });
      return;
    }

    setUploadingDraft(true);
    const formData = new FormData();
    formData.append('document', selectedDraftFile);

    try {
      // First upload to Cloudinary via the upload endpoint
      const uploadResp = await apiClient.post('/upload/document', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (!uploadResp.data.success || !uploadResp.data.file) {
        throw new Error('Failed to upload file to Cloudinary');
      }

      // Then create draft record with Cloudinary data
      const draftResp = await apiClient.post(`/caserecords/finalize/${finalizeId}/drafts`, {
        fileData: uploadResp.data.file
      });

      if (draftResp.data.success) {
        notifications.show({
          title: 'Success',
          message: 'Draft uploaded successfully.',
          color: 'green'
        });
        setSelectedDraftFile(null);
        await loadDrafts();
      }
    } catch (err) {
      console.error('Error uploading draft:', err);
      notifications.show({
        title: 'Error',
        message: 'Failed to upload draft.',
        color: 'red'
      });
    } finally {
      setUploadingDraft(false);
    }
  };

  const handleDownloadDraft = (draft) => {
    // Open Cloudinary URL directly for download
    if (draft.cloudinaryUrl) {
      window.open(draft.cloudinaryUrl, '_blank');
      notifications.show({
        title: 'Download',
        message: `Opening ${draft.fileName}...`,
        color: 'blue'
      });
    } else {
      notifications.show({
        title: 'Error',
        message: 'File URL not available.',
        color: 'red'
      });
    }
  };

  const handleDeleteDraft = async (draftId) => {
    if (window.confirm('Are you sure you want to delete this draft?')) {
      try {
        await apiClient.delete(`/caserecords/finalize/${finalizeId}/drafts/${draftId}`);
        notifications.show({
          title: 'Deleted',
          message: 'Draft deleted successfully.',
          color: 'green'
        });
        await loadDrafts();
      } catch (err) {
        console.error('Error deleting draft:', err);
        notifications.show({
          title: 'Error',
          message: 'Failed to delete draft.',
          color: 'red'
        });
      }
    }
  };

  // Load drafts on component mount
  useEffect(() => {
    if (finalizeId) {
      loadDrafts();
    }
  }, [finalizeId]);

  const formatText = (v) => (v == null ? '' : String(v));

  const drawCaseRecordHistoryRemarksPage = (doc, data = {}) => {
    const PDF_FONT_SIZE = 10;
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 10;
    const w = pageW - margin * 2;

    const setFont = (_size = PDF_FONT_SIZE, style = 'normal') => {
      doc.setFont('times', style);
      doc.setFontSize(PDF_FONT_SIZE);
    };

    const safeText = (v) => (v == null ? '' : String(v));

    const mmPerPt = 0.3528;
    const lineHeightMm = (_fontSize = PDF_FONT_SIZE) => PDF_FONT_SIZE * mmPerPt * (doc.getLineHeightFactor?.() || 1.15);

    const drawMultilineInRect = (text, x, y, w, h, fontSize = 9) => {
      setFont(fontSize, 'normal');
      const padding = 2;
      const maxW = Math.max(1, w - padding * 2);
      const maxH = Math.max(1, h - padding * 2);
      const lh = lineHeightMm(fontSize);
      const maxLines = Math.max(1, Math.floor(maxH / lh));
      const lines = doc.splitTextToSize(safeText(text), maxW).slice(0, maxLines);
      doc.text(lines, x + padding, y + padding + lh * 0.75);
    };

    const drawRuledRect = (x, y, w, h, gap = 6) => {
      doc.rect(x, y, w, h);
      for (let yy = y + gap; yy < y + h; yy += gap) {
        doc.line(x, yy, x + w, yy);
      }
    };

    const drawLabeledLine = (label, value, x, y, colW, labelW = 36) => {
      setFont(9, 'normal');
      doc.text(label, x + 2, y);
      const lineX = x + labelW;
      doc.line(lineX, y + 0.6, x + colW - 2, y + 0.6);
      const maxW = Math.max(1, colW - labelW - 4);
      const lines = doc.splitTextToSize(safeText(value), maxW).slice(0, 1);
      if (lines.length) {
        doc.text(lines[0], lineX + 1, y);
      }
    };

    const x0 = margin;
    let y = margin;

    // Header block (two columns)
    const headerH = 68;
    doc.rect(x0, y, w, headerH);
    const midX = x0 + w / 2;
    doc.line(midX, y, midX, y + headerH);

    const colW = w / 2;
    const rowGap = 6;
    const leftX = x0;
    const rightX = midX;

    // Left column fields - Case Information Sheet
    setFont(9, 'normal');
    const leftFields = [
      { label: 'Title of the Case:', value: data.title },
      { label: 'Nature of the Case:', value: data.nature },
      { label: 'Client Name:', value: data.clientName },
      { label: 'Contact Number:', value: data.contactNumber },
      { label: 'Cellphone Number:', value: data.cellphoneNumber },
      { label: 'Present Address:', value: data.presentAddress },
    ];
    leftFields.forEach((f, idx) => {
      drawLabeledLine(f.label, f.value, leftX, y + 6 + idx * rowGap, colW, 44);
    });

    // Right column fields - Court & Venue Details (first tribunal)
    const courtVenueDetails = data.courtVenueDetails && Array.isArray(data.courtVenueDetails) && data.courtVenueDetails.length > 0
      ? data.courtVenueDetails[0]
      : {};
    const rightFields = [
      { label: 'Court / Tribunal:', value: courtVenueDetails.tribunal },
      { label: 'Venue / Place:', value: courtVenueDetails.venue },
      { label: 'Branch / Division:', value: courtVenueDetails.branch },
      { label: 'Judge / Justice:', value: courtVenueDetails.judge },
    ];
    rightFields.forEach((f, idx) => {
      drawLabeledLine(f.label, f.value, rightX, y + 6 + idx * rowGap, colW, 52);
    });

    // Parties and Counsel Details (multi-line) in right column
    const partiesY = y + 6 + rightFields.length * rowGap;
    setFont(9, 'normal');
    doc.text('Parties and Counsel Details:', rightX + 2, partiesY);
    doc.line(rightX + 52, partiesY + 0.6, rightX + colW - 2, partiesY + 0.6);
    drawMultilineInRect(data.partiesAndCounselDetails, rightX + 52, partiesY - 4, colW - 54, 8, 9);

    // Relator Information (multi-line) in right column
    const relatorY = partiesY + 10;
    let relatorText = '';
    if (data.throughRelator === 'yes') {
      relatorText = `Relator: ${data.relatorName || ''}\n`;
      relatorText += `Relationship: ${data.relationshipToClient || ''}\n`;
      relatorText += `Email: ${data.relatorEmail || ''}\n`;
      relatorText += `Phone: ${data.relatorPhone || ''}\n`;
      relatorText += `Address: ${data.relatorAddress || ''}`;
    } else {
      relatorText = 'No relator/representative';
    }
    setFont(9, 'normal');
    doc.text('Relator / Representative:', rightX + 2, relatorY);
    doc.line(rightX + 52, relatorY + 0.6, rightX + colW - 2, relatorY + 0.6);
    drawMultilineInRect(relatorText, rightX + 52, relatorY - 4, colW - 54, 8, 9);

    y += headerH;

    // Bottom sections
    const sectionY = y;
    const sectionH = pageH - sectionY - margin;
    const leftSectionW = (w - 2) / 2;
    const rightSectionW = leftSectionW;
    const leftSectionX = x0;
    const rightSectionX = x0 + leftSectionW + 2;

    // Section header line
    doc.line(x0, sectionY, x0 + w, sectionY);

    setFont(10, 'bold');
    doc.text('REMARKS / REMINDERS / NOTES', x0 + w / 2, sectionY + 7, { align: 'center' });
    setFont(8, 'normal');
    doc.text('(deadlines/material dates, etc.)', x0 + w / 2, sectionY + 12, { align: 'center' });

    const boxY = sectionY + 14;
    const availableH = sectionH - 14;

    // Measure text to make dynamic box (use full width)
    const measureBoxText = (text, boxW, fontSize = 9) => {
      setFont(fontSize, 'normal');
      const padding = 2;
      const maxW = Math.max(1, boxW - padding * 2);
      const lh = lineHeightMm(fontSize);
      const lines = doc.splitTextToSize(safeText(text), maxW);
      return lines.length * lh + padding * 2 + 4;
    };

    const remarksTextH = measureBoxText(data.remarks, w);
    const boxH = Math.max(remarksTextH, Math.min(availableH, 40));

    doc.rect(x0, boxY, w, boxH);

    drawMultilineInRect(data.remarks, x0, boxY, w, boxH, 9);
  };

  const addDateTimeHeaderToAllPages = (doc) => {
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const now = new Date();
      const dateTimeStr = now.toLocaleString();
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated: ${dateTimeStr}`, pageWidth - 10, pageHeight - 10, { align: 'right' });
    }
  };

  const buildClientPdfFileName = (clientName) => {
    const sanitizedName = (clientName || 'case').replace(/[^a-zA-Z0-9\s-_]/g, '').trim();
    const timestamp = new Date().toISOString().slice(0, 10);
    return `${sanitizedName}_case_record_${timestamp}.pdf`;
  };

  const exportCaseRecordPdf = () => {
    if (!caseRecordData || Object.keys(caseRecordData).length === 0) {
      notifications.show({ title: 'Nothing to export', message: 'No case record data loaded.', color: 'yellow' });
      return;
    }

    // Only landscape form page layout
    const doc = new jsPDF({ orientation: 'l', unit: 'mm', format: 'a4' });
    // Convert partiesAndCounselDetails array to string for PDF
    const formatPartiesAndCounsel = (details) => {
      if (!details || !Array.isArray(details) || details.length === 0) return '';
      let text = '';
      details.forEach((group, groupIdx) => {
        text += `Group: ${group.groupName || 'Group ' + (groupIdx + 1)}\n`;
        if (group.parties && Array.isArray(group.parties)) {
          group.parties.forEach((party, partyIdx) => {
            text += `  Party ${partyIdx + 1}: ${party.partyName || ''} (${party.participation || ''})\n`;
            text += `    Address: ${party.mailingAddress || ''}\n`;
            text += `    Email: ${party.emailAddress || ''}\n`;
            text += `    Contact: ${party.contactNumber || ''}\n`;
          });
        }
        if (group.counsels && Array.isArray(group.counsels)) {
          group.counsels.forEach((counsel, counselIdx) => {
            text += `  Counsel ${counselIdx + 1}: ${counsel.counselName || ''} (${counsel.participation || ''})\n`;
            text += `    Address: ${counsel.mailingAddress || ''}\n`;
            text += `    Email: ${counsel.emailAddress || ''}\n`;
            text += `    Contact: ${counsel.contactNumber || ''}\n`;
          });
        }
        text += '\n';
      });
      return text;
    };

    drawCaseRecordHistoryRemarksPage(doc, {
      title: formatText(caseRecordData.title),
      caseId: formatText(caseRecordData.caseId),
      nature: formatText(caseRecordData.nature),
      clientName: formatText(caseRecordData.clientName),
      contactNumber: formatText(caseRecordData.contactNumber),
      cellphoneNumber: formatText(caseRecordData.cellphoneNumber),
      presentAddress: formatText(caseRecordData.presentAddress),
      courtVenueDetails: caseRecordData.courtVenueDetails || [],
      partiesAndCounselDetails: formatPartiesAndCounsel(caseRecordData.partiesAndCounselDetails),
      throughRelator: formatText(caseRecordData.throughRelator),
      relatorName: formatText(caseRecordData.relatorName),
      relationshipToClient: formatText(caseRecordData.relationshipToClient),
      relatorEmail: formatText(caseRecordData.relatorEmail),
      relatorPhone: formatText(caseRecordData.relatorPhone),
      relatorAddress: formatText(caseRecordData.relatorAddress),
      remarks: formatText(caseRecordData.remarks),
    });

    const caseRecordClientName = caseRecordData?.clientName || caseRecordData?.fullName || '';

    addDateTimeHeaderToAllPages(doc);
    doc.save(buildClientPdfFileName(caseRecordClientName));
    notifications.show({ 
      title: 'Success', 
      message: 'Case record exported as PDF.', 
      color: 'green' 
    });
  };

  if (loading) {
    return (
      <Box bg={BG} mih="100vh" py="xl">
        <Center h="80vh"><Loader color={PRIMARY_BROWN} size="lg" /></Center>
      </Box>
    );
  }

  return (
    <Box bg={BG} mih="100vh" py="xl">
      <style>
        {`
          ::-webkit-scrollbar { width: 8px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: ${MUTED_OLIVE}; border-radius: 4px; }
          ::-webkit-scrollbar-thumb:hover { background: ${PRIMARY_BROWN}; }
          * { scrollbar-width: thin; scrollbar-color: ${MUTED_OLIVE} transparent; }
        `}
      </style>
      <Container size="xl">
        {/* Page Header */}
        <Group justify="space-between" align="flex-start" mb="lg">
          <Group gap="sm" align="center">
            <Tooltip label="Back to Finalized Cases">
              <ActionIcon variant="light" color={PRIMARY_BROWN} size="lg" radius="md" onClick={() => navigate('/admin/finalized')}>
                <IconArrowLeft size={18} />
              </ActionIcon>
            </Tooltip>
            <Box style={{
              width: 36, height: 36, borderRadius: 9,
              background: PRIMARY_BROWN,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <IconFileText size={18} color="white" stroke={2.5} />
            </Box>
            <Box>
              <Title order={3} c={CHARCOAL} lh={1.2}>
                Case Record
              </Title>
              <Text size="sm" c={MUTED_OLIVE} mt={2}>
                {caseRecordData.title || 'Untitled Case'}
              </Text>
            </Box>
          </Group>

          <Group gap="xs">
            {!editMode ? (
              <>
                <Button 
                  variant="outline" 
                  color={PRIMARY_BROWN} 
                  fw={600} 
                  onClick={() => setEditMode(true)}
                >
                  Edit
                </Button>
                <Button 
                  variant="subtle" 
                  color={PRIMARY_BROWN} 
                  fw={600} 
                  leftSection={<IconDownload size={16} />} 
                  onClick={exportCaseRecordPdf}
                >
                  Export PDF
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="subtle" 
                  color="gray" 
                  fw={600} 
                  onClick={handleCancelEdit}
                >
                  Cancel
                </Button>
                <Button 
                  color={PRIMARY_BROWN} 
                  radius="md" 
                  fw={600} 
                  leftSection={<IconDeviceFloppy size={16} />} 
                  onClick={handleSave} 
                  loading={saving}
                >
                  Save Changes
                </Button>
              </>
            )}
          </Group>
        </Group>

        <ScrollArea h="calc(100vh - 140px)">
          <Tabs value={activeTab} onChange={setActiveTab} variant="outline" radius="md">
            <Tabs.List>
              <Tabs.Tab value="case-record" leftSection={<IconFileText size={16} />}>
                Case Record
              </Tabs.Tab>
              <Tabs.Tab value="history" leftSection={<IconHistory size={16} />}>
                History
              </Tabs.Tab>
              <Tabs.Tab value="tasks" leftSection={<IconChecklist size={16} />}>
                Tasks
              </Tabs.Tab>
              <Tabs.Tab value="evidence" leftSection={<IconFolder size={16} />}>
                Evidence
              </Tabs.Tab>
              <Tabs.Tab value="drafts" leftSection={<IconFileDescription size={16} />}>
                Drafts
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="case-record" pt="md">
              <CaseInformationSection
                value={caseRecordData}
                onChange={setCaseRecordData}
                readOnly={!editMode}
                workflowHistory={workflowHistory}
              />
            </Tabs.Panel>

            <Tabs.Panel value="history" pt="md">
              <Paper p="xl" radius="lg" bg="white" style={{ border: '1px solid #F0F0F0' }}>
                <Stack gap="md">
                  <Group justify="space-between" align="center">
                    <Title order={3} c={PRIMARY_BROWN}>History</Title>
                    <Button 
                      size="sm" 
                      color={PRIMARY_BROWN}
                      onClick={() => {
                        const newHistory = {
                          id: Date.now(),
                          date: new Date().toISOString().split('T')[0],
                          dateReceived: new Date().toISOString().split('T')[0],
                          remarks: '',
                          file: null,
                          fileName: null,
                          fileType: null
                        };
                        setEditingHistory(newHistory);
                        setEditHistoryModalOpened(true);
                      }}
                    >
                      Add History
                    </Button>
                  </Group>

                  {(workflowHistory.length > 0 && historyRecords.length > 0) && <Divider label="Manual History Records" labelPosition="center" />}

                  {historyRecords.length === 0 ? (
                    <Text c={MUTED_OLIVE} ta="center" py="xl">No history records available yet.</Text>
                  ) : (
                    <Table striped highlightOnHover>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Date</Table.Th>
                          <Table.Th>Date Received</Table.Th>
                          <Table.Th>Remarks</Table.Th>
                          <Table.Th>Attached File</Table.Th>
                          <Table.Th>Actions</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {historyRecords.map((history) => (
                          <Table.Tr key={history.id}>
                            <Table.Td>{history.date}</Table.Td>
                            <Table.Td>{history.dateReceived}</Table.Td>
                            <Table.Td>{history.remarks}</Table.Td>
                            <Table.Td>
                              {history.fileName ? (
                                <Group gap="xs">
                                  <IconPaperclip size={16} color={PRIMARY_BROWN} />
                                  <Text size="sm">{history.fileName}</Text>
                                </Group>
                              ) : (
                                <Text size="sm" c="dimmed">No file</Text>
                              )}
                            </Table.Td>
                            <Table.Td>
                              <Group gap="xs">
                                <Tooltip label="Edit History">
                                  <ActionIcon 
                                    size="sm" 
                                    variant="light" 
                                    color={PRIMARY_BROWN}
                                    onClick={() => handleEditHistory(history)}
                                  >
                                    <IconEdit size={16} />
                                  </ActionIcon>
                                </Tooltip>
                                <Tooltip label="Delete History">
                                  <ActionIcon 
                                    size="sm" 
                                    variant="light" 
                                    color="red"
                                    onClick={() => handleDeleteHistory(history.id)}
                                  >
                                    <IconTrash size={16} />
                                  </ActionIcon>
                                </Tooltip>
                                {history.file && (
                                  <>
                                    <Tooltip label="View Attached File">
                                      <ActionIcon 
                                        size="sm" 
                                        variant="light" 
                                        color="blue"
                                        onClick={() => handleViewFile(history)}
                                      >
                                        <IconEye size={16} />
                                      </ActionIcon>
                                    </Tooltip>
                                    <Tooltip label="Download Attached File">
                                      <ActionIcon 
                                        size="sm" 
                                        variant="light" 
                                        color="green"
                                        onClick={() => handleDownloadFile(history)}
                                      >
                                        <IconDownload size={16} />
                                      </ActionIcon>
                                    </Tooltip>
                                    <Tooltip label="Delete File Only">
                                      <ActionIcon 
                                        size="sm" 
                                        variant="light" 
                                        color="orange"
                                        onClick={() => handleDeleteFile(history.id)}
                                      >
                                        <IconX size={16} />
                                      </ActionIcon>
                                    </Tooltip>
                                  </>
                                )}
                              </Group>
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  )}
                </Stack>
              </Paper>
            </Tabs.Panel>

            <Tabs.Panel value="tasks" pt="md">
              <Paper p="xl" radius="lg" bg="white" style={{ border: '1px solid #F0F0F0' }}>
                <Stack gap="md">
                  <Title order={3} c={PRIMARY_BROWN}>Tasks</Title>
                  <Text c={MUTED_OLIVE}>No tasks available yet.</Text>
                </Stack>
              </Paper>
            </Tabs.Panel>

            <Tabs.Panel value="evidence" pt="md">
              <EvidenceList
                value={evidenceData}
                onChange={setEvidenceData}
                readOnly={!editMode}
                ref={evidenceListRef}
              />
            </Tabs.Panel>

            <Tabs.Panel value="drafts" pt="md">
              <Paper p="xl" radius="lg" bg="white" style={{ border: '1px solid #F0F0F0' }}>
                <Stack gap="md">
                  <Group justify="space-between" align="center">
                    <Title order={3} c={PRIMARY_BROWN}>Drafts</Title>
                    <Group gap="sm">
                      <FileButton
                        onChange={setSelectedDraftFile}
                        accept="*/*"
                      >
                        {(props) => (
                          <Button {...props} variant="outline" size="sm" color={PRIMARY_BROWN}>
                            {selectedDraftFile ? `Change: ${selectedDraftFile.name}` : 'Select File'}
                          </Button>
                        )}
                      </FileButton>
                      <Button
                        size="sm"
                        color={PRIMARY_BROWN}
                        disabled={!selectedDraftFile}
                        loading={uploadingDraft}
                        onClick={handleUploadDraft}
                      >
                        Upload
                      </Button>
                    </Group>
                  </Group>

                  {draftsData.length === 0 ? (
                    <Text c={MUTED_OLIVE} ta="center" py="xl">No drafts available yet.</Text>
                  ) : (
                    <Table striped highlightOnHover>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>File Name</Table.Th>
                          <Table.Th>File Type</Table.Th>
                          <Table.Th>Size</Table.Th>
                          <Table.Th>Uploaded At</Table.Th>
                          <Table.Th>Actions</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {draftsData.map((draft) => (
                          <Table.Tr key={draft.id}>
                            <Table.Td>
                              <Group gap="xs">
                                <IconFileDescription size={16} color={PRIMARY_BROWN} />
                                <Text size="sm">{draft.fileName}</Text>
                              </Group>
                            </Table.Td>
                            <Table.Td><Text size="sm">{draft.fileType || '-'}</Text></Table.Td>
                            <Table.Td><Text size="sm">{draft.fileSize ? `${(draft.fileSize / 1024).toFixed(2)} KB` : '-'}</Text></Table.Td>
                            <Table.Td><Text size="sm">{draft.uploadedAt ? new Date(draft.uploadedAt).toLocaleDateString() : '-'}</Text></Table.Td>
                            <Table.Td>
                              <Group gap="xs">
                                <Tooltip label="Download Draft">
                                  <ActionIcon
                                    size="sm"
                                    variant="light"
                                    color="blue"
                                    onClick={() => handleDownloadDraft(draft)}
                                  >
                                    <IconDownload size={16} />
                                  </ActionIcon>
                                </Tooltip>
                                <Tooltip label="Delete Draft">
                                  <ActionIcon
                                    size="sm"
                                    variant="light"
                                    color="red"
                                    onClick={() => handleDeleteDraft(draft.id)}
                                  >
                                    <IconTrash size={16} />
                                  </ActionIcon>
                                </Tooltip>
                              </Group>
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  )}
                </Stack>
              </Paper>
            </Tabs.Panel>
          </Tabs>
        </ScrollArea>
      </Container>

      {/* Edit History Modal */}
      <Modal
        opened={editHistoryModalOpened}
        onClose={() => {
          setEditHistoryModalOpened(false);
          setEditingHistory(null);
        }}
        title="Edit History Record"
        centered
      >
        {editingHistory && (
          <Stack gap="md">
            <TextInput
              label="Date"
              type="date"
              value={editingHistory.date}
              onChange={(e) => setEditingHistory({ ...editingHistory, date: e.target.value })}
            />
            <TextInput
              label="Date Received"
              type="date"
              value={editingHistory.dateReceived}
              onChange={(e) => setEditingHistory({ ...editingHistory, dateReceived: e.target.value })}
            />
            <TextInput
              label="Remarks"
              value={editingHistory.remarks}
              onChange={(e) => setEditingHistory({ ...editingHistory, remarks: e.target.value })}
            />
            <FileButton
              onChange={(file) => {
                if (file) {
                  const reader = new FileReader();
                  reader.onload = () => {
                    const base64 = reader.result.split(',')[1]; // Remove data URL prefix
                    setEditingHistory({ 
                      ...editingHistory, 
                      file: base64, 
                      fileName: file.name,
                      fileType: file.type
                    });
                  };
                  reader.readAsDataURL(file);
                }
              }}
              accept="*/*"
            >
              {(props) => (
                <Button {...props} variant="outline" size="sm">
                  {editingHistory.fileName ? `Change: ${editingHistory.fileName}` : 'Attach File'}
                </Button>
              )}
            </FileButton>
            {editingHistory.fileName && (
              <Text size="sm" c={PRIMARY_BROWN}>
                Current file: {editingHistory.fileName}
              </Text>
            )}
            <Group justify="flex-end" mt="md">
              <Button
                variant="subtle"
                onClick={() => {
                  setEditHistoryModalOpened(false);
                  setEditingHistory(null);
                }}
              >
                Cancel
              </Button>
              <Button color={PRIMARY_BROWN} onClick={handleSaveHistory}>
                Save
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* View File Modal */}
      <Modal
        opened={viewFileModalOpened}
        onClose={() => {
          setViewFileModalOpened(false);
          setViewingFile(null);
        }}
        title="View Attached File"
        size="xl"
        centered
      >
        {viewingFile && (
          <Stack gap="md">
            <Group>
              <IconPaperclip size={20} color={PRIMARY_BROWN} />
              <Text fw={600}>{viewingFile.fileName || 'Unknown File'}</Text>
            </Group>
            <Paper p="md" bg="#F5F5F5" radius="md" style={{ minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {viewingFile.file && viewingFile.fileType && viewingFile.fileType.startsWith('image/') ? (
                <img 
                  src={`data:${viewingFile.fileType};base64,${viewingFile.file}`} 
                  alt={viewingFile.fileName}
                  style={{ maxWidth: '100%', maxHeight: '500px', objectFit: 'contain' }}
                />
              ) : viewingFile.file ? (
                <Text c="dimmed" ta="center">
                  File preview not available for this file type. 
                  Please download to view the content.
                </Text>
              ) : (
                <Text c="dimmed" ta="center">
                  No file attached.
                </Text>
              )}
            </Paper>
            <Group justify="flex-end">
              <Button
                variant="outline"
                onClick={() => handleDownloadFile(viewingFile)}
                leftSection={<IconDownload size={16} />}
              >
                Download
              </Button>
              <Button
                color={PRIMARY_BROWN}
                onClick={() => {
                  setViewFileModalOpened(false);
                  setViewingFile(null);
                }}
              >
                Close
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Box>
  );
}
