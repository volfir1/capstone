import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import apiClient from '../../api/apiClient';
import { useAuth } from '../../context/authContext';
import getEnv from '../../api/environment';
import ThemedToast, { useToast } from '../../components/ThemedToast';

// Safe import — prevents "unmatched route" crash when native module isn't linked yet
let DocumentPicker = null;
try {
  DocumentPicker = require('expo-document-picker');
} catch (e) {
  console.warn('expo-document-picker not available — rebuild required');
}

// ─── Color constants ───
const PRIMARY_BROWN = '#7D5A3B';
const PRIMARY_GOLD = '#C4AB7D';
const CHARCOAL = '#2C2C2C';
const MUTED_OLIVE = '#6B6B5A';
const THEMED_LIGHT_BG = '#FAF8F3';
const EMPTY_EVIDENCE_ROW = { type: '', author: '', purpose: '', issues: '' };

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function RecommendationForAction() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const caseIdParam = params.caseId;
  const reviewIdParam = params.reviewId || null;
  const isViewOnly = params.viewOnly === 'true' || params.mode === 'view';
  const { toast, showToast, hideToast } = useToast();

  // Parse review from params if passed (legacy support)
  const passedReview = (() => {
    if (!params.review) return null;
    try { return JSON.parse(params.review); } catch { return null; }
  })();

  const derivedCaseId = caseIdParam || passedReview?.caseId || 'new-case';
  const { userData } = useAuth();
  const normalizedRole = (userData?.role || '').toLowerCase().trim();
  const isIntern = normalizedRole === 'intern' || normalizedRole === 'secretary';

  // ─── Refs ───
  const scrollViewRef = useRef(null);
  const legalOpinionRef = useRef(null);

  // ─── State ───
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [documentVersions, setDocumentVersions] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [reviewId, setReviewId] = useState(null);
  const [currentReviewStage, setCurrentReviewStage] = useState(''); // '' = new review not yet submitted
  const [isViewingExistingReview, setIsViewingExistingReview] = useState(false);

  const [interviewInfo, setInterviewInfo] = useState({
    dateOfInterview: '',
    dateSubmitted: '',
    clientName: '',
    interviewingInterns: '',
    fastFacts: '',
    clientEvidence: [
      { ...EMPTY_EVIDENCE_ROW },
      { ...EMPTY_EVIDENCE_ROW },
      { ...EMPTY_EVIDENCE_ROW },
    ],
    adversePartyEvidence: [
      { ...EMPTY_EVIDENCE_ROW },
      { ...EMPTY_EVIDENCE_ROW },
      { ...EMPTY_EVIDENCE_ROW },
    ],
    internAdvice: '',
    caseType: '',
    legalOpinion: '',
    uploadedDocument: null,
  });

  const [actionInfo, setActionInfo] = useState({
    supervisingComment: '',
    decision: '',
    decisionNote: '',
    assignedTo: '',
    supervisingLawyer: '',
    directorSignature: '',
    signatureDate: '',
  });

  const steps = [
    { label: 'Interview & Evidence', description: 'Client details and documents' },
    { label: 'Supervising & Director', description: 'Final action' },
  ];

  // ─── Read-only logic (matches website) ───
  const isReturnedToIntern = currentReviewStage === 'returned_to_intern';

  // Interview section read-only
  const isInternViewingSubmittedReview = isIntern &&
    (currentReviewStage === 'supervising_lawyer' || currentReviewStage === 'director' || currentReviewStage === 'completed');
  const isSLViewingDirectorReview = normalizedRole === 'supervising_lawyer' &&
    (currentReviewStage === 'director' || currentReviewStage === 'completed');
  const interviewReadOnly = isViewOnly || isInternViewingSubmittedReview || isSLViewingDirectorReview;

  // Supervising lawyer comment disabled for roles that aren't SL, or when stage is director
  const supervisingLawyerDisabled = isIntern || normalizedRole === 'director' || currentReviewStage === 'director';
  // Director section only editable by director
  const directorSectionDisabled = normalizedRole !== 'director';
  // Assignment & Signature read-only for interns/SL, and when director stage
  const assignmentReadOnly = isIntern || normalizedRole === 'supervising_lawyer' || currentReviewStage === 'director';

  // ─── Load existing review from passedReview (legacy) ───
  useEffect(() => {
    // If reviewId param is provided, skip passedReview and use API loading instead
    if (reviewIdParam) return;
    if (passedReview && passedReview.content) {
      setReviewId(passedReview._id || passedReview.id);
      setCurrentReviewStage(passedReview.reviewStage || 'supervising_lawyer');
      setIsViewingExistingReview(true);
      if (passedReview.content.interviewInfo) {
        setInterviewInfo(prev => ({
          ...prev,
          ...passedReview.content.interviewInfo,
          clientEvidence: passedReview.content.interviewInfo.clientEvidence?.length > 0
            ? passedReview.content.interviewInfo.clientEvidence
            : prev.clientEvidence,
          adversePartyEvidence: passedReview.content.interviewInfo.adversePartyEvidence?.length > 0
            ? passedReview.content.interviewInfo.adversePartyEvidence
            : prev.adversePartyEvidence,
        }));
        // Restore uploaded document and version history from passedReview
        if (passedReview.content.interviewInfo.uploadedDocument) {
          setUploadedFile(passedReview.content.interviewInfo.uploadedDocument);
        }
        if (passedReview.content.interviewInfo.documentVersions?.length > 0) {
          setDocumentVersions(passedReview.content.interviewInfo.documentVersions);
        }
      }
      if (passedReview.content.actionInfo) {
        setActionInfo(prev => ({ ...prev, ...passedReview.content.actionInfo }));
      }
      setLoading(false);
    } else if (passedReview) {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Load existing review from API (when no passedReview, or reviewId param provided) ───
  useEffect(() => {
    if (derivedCaseId && derivedCaseId !== 'new-case' && (!passedReview || reviewIdParam)) {
      loadExistingReview();
      loadClientInfo();
    } else if (!passedReview) {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [derivedCaseId]);

  // ─── Auto-populate fields based on user role (matches website) ───
  useEffect(() => {
    if (!userData) return;
    const currentUserName = userData.firstName && userData.lastName
      ? `${userData.firstName} ${userData.lastName}`
      : userData.username || userData.displayName || 'Unknown User';
    const today = new Date();
    const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    if (isIntern) {
      if (!actionInfo.assignedTo) {
        setActionInfo(prev => ({ ...prev, assignedTo: currentUserName, assignedToId: userData?._id || userData?.id || null, signatureDate: formattedDate }));
      } else if (!actionInfo.assignedTo.includes(currentUserName)) {
        setActionInfo(prev => ({ ...prev, assignedTo: prev.assignedTo + ', ' + currentUserName, signatureDate: formattedDate }));
      } else if (!actionInfo.signatureDate) {
        setActionInfo(prev => ({ ...prev, signatureDate: formattedDate }));
      }
    } else if (normalizedRole === 'supervising_lawyer') {
      if (!actionInfo.supervisingLawyer) {
        setActionInfo(prev => ({ ...prev, supervisingLawyer: currentUserName, supervisingLawyerId: userData?._id || userData?.id || null }));
      }
    } else if (normalizedRole === 'director') {
      if (!actionInfo.directorSignature) {
        setActionInfo(prev => ({ ...prev, directorSignature: currentUserName, directorId: userData?._id || userData?.id || null }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedRole, userData]);

  // ──────────────────────────────────────────────────
  // API helpers
  // ──────────────────────────────────────────────────
  const loadClientInfo = async () => {
    try {
      const response = await apiClient.get(`/clientsinfo/${derivedCaseId}`);
      const clientData = response.data;
      const formatDate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      };
      const currentUserName = userData?.firstName && userData?.lastName
        ? `${userData.firstName} ${userData.lastName}`
        : userData?.username || 'Unknown User';
      const currentUserId = userData?._id || userData?.id || null;

      setInterviewInfo(prev => {
        const updated = {
          ...prev,
          clientName: prev.clientName || clientData.fullName || clientData.name || '',
          dateOfInterview: prev.dateOfInterview || formatDate(clientData.appointedDate || clientData.createdAt),
          dateSubmitted: prev.dateSubmitted || formatDate(new Date()),
        };
        if (!prev.interviewingInterns) {
          updated.interviewingInterns = currentUserName;
          updated.interviewingInternsId = currentUserId;
        }
        return updated;
      });
    } catch (error) {
      console.error('Error loading client info:', error);
    }
  };

  const loadExistingReview = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/reviews/${derivedCaseId}`);
      const reviews = Array.isArray(response.data) ? response.data : response.data?.data || [];

      if (reviews.length > 0) {
        const review = (reviewIdParam ? reviews.find(r => (r._id || r.id) === reviewIdParam) : null) || reviews[0];
        setReviewId(review._id || review.id);
        setCurrentReviewStage(review.reviewStage || 'supervising_lawyer');
        setIsViewingExistingReview(true);
        if (review.content) {
          if (review.content.interviewInfo) {
            setInterviewInfo(prev => ({
              ...prev,
              ...review.content.interviewInfo,
              clientEvidence: review.content.interviewInfo.clientEvidence?.length > 0
                ? review.content.interviewInfo.clientEvidence
                : prev.clientEvidence,
              adversePartyEvidence: review.content.interviewInfo.adversePartyEvidence?.length > 0
                ? review.content.interviewInfo.adversePartyEvidence
                : prev.adversePartyEvidence,
            }));
            // Restore uploaded document if present
            if (review.content.interviewInfo.uploadedDocument) {
              setUploadedFile(review.content.interviewInfo.uploadedDocument);
            }
            // Restore version history if present
            if (review.content.interviewInfo.documentVersions?.length > 0) {
              setDocumentVersions(review.content.interviewInfo.documentVersions);
            }
          }
          if (review.content.actionInfo) {
            setActionInfo(prev => ({ ...prev, ...review.content.actionInfo }));
          }
        }
      }
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Error loading review:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const filterEmptyEvidence = (evidenceArray) => {
    if (!evidenceArray || !Array.isArray(evidenceArray)) return [];
    return evidenceArray.filter(row => row && (row.type || row.author || row.purpose || row.issues));
  };

  const buildCompleteInterviewInfo = () => ({
    ...interviewInfo,
    clientEvidence: filterEmptyEvidence(interviewInfo.clientEvidence),
    adversePartyEvidence: filterEmptyEvidence(interviewInfo.adversePartyEvidence),
    documentVersions: documentVersions,
    createdByRole: interviewInfo.createdByRole || normalizedRole || null,
    createdByName: interviewInfo.createdByName || (userData?.firstName && userData?.lastName
      ? `${userData.firstName} ${userData.lastName}`
      : userData?.username || 'Unknown User'),
  });

  const updateCaseStatus = async (status) => {
    try {
      const resp = await apiClient.put(`/clientsinfo/${derivedCaseId}`, { status });
      if (resp?.status >= 200 && resp.status < 300) return true;
    } catch (err) {
      console.error('Status update error:', err);
    }
    return false;
  };

  // ──────────────────────────────────────────────────
  // Handler: Submit (intern creates new review OR director finalizes)
  // Matches website handleSubmit exactly
  // ──────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (isViewOnly || saving) return;
    setSaving(true);
    try {
      const completeInterviewInfo = buildCompleteInterviewInfo();

      // ── Intern / Secretary submitting for review ──
      if (isIntern) {
        const reviewPayload = {
          caseId: derivedCaseId,
          reviewerId: userData?._id || userData?.id || null,
          reviewerRole: normalizedRole,
          step: currentStep,
          reviewStage: 'supervising_lawyer', // Goes to SL review
          content: {
            interviewInfo: completeInterviewInfo,
            actionInfo: actionInfo,
          },
        };

        // Update status to confirmed
        const statusOk = await updateCaseStatus('confirmed');
        if (!statusOk) {
          showToast('error', 'Error', 'Failed to update case status.');
          setSaving(false);
          return;
        }

        if (reviewId) {
          await apiClient.put(`/reviews/${reviewId}`, reviewPayload);
        } else {
          const response = await apiClient.post('/reviews', reviewPayload);
          setReviewId(response.data._id || response.data.id);
        }

        showToast('success', 'Submitted', 'Review submitted to the supervising lawyer for review.');
        router.back();
        return;
      }

      // ── Director / Attorney finalizing record ──
      if (!derivedCaseId || derivedCaseId === 'new-case') {
        showToast('error', 'Missing Case', 'Cannot finalize without a valid case ID.');
        setSaving(false);
        return;
      }

      const finalDecision = actionInfo.decision || 'accepted';
      let finalStatus = 'confirmed';

      if (interviewInfo.caseType === 'legal-advice') {
        finalStatus = 'legal-advice';
      } else if (interviewInfo.caseType === 'legal-document') {
        finalStatus = 'confirmed';
      } else if (finalDecision === 'rejected') {
        finalStatus = 'rejected';
      } else if (finalDecision === 'accepted' || finalDecision === 'pending') {
        finalStatus = 'court-case';
      }

      const statusOk = await updateCaseStatus(finalStatus);
      if (!statusOk) {
        showToast('error', 'Error', 'Failed to update final case status.');
        setSaving(false);
        return;
      }

      // Create finalize record
      await apiClient.post('/finalize', {
        caseId: derivedCaseId,
        finalizedBy: userData?._id || userData?.id || null,
        finalizedRole: normalizedRole,
        decision: finalDecision,
        content: {
          interviewInfo: completeInterviewInfo,
          actionInfo: { ...actionInfo, decision: finalDecision },
        },
      });

      // Delete review records after finalization
      try {
        await apiClient.delete(`/reviews/case/${derivedCaseId}`);
      } catch (deleteErr) {
        console.error('Error deleting review after finalization:', deleteErr);
      }

      showToast('success', 'Finalized', 'Case finalized successfully.');
      router.back();
    } catch (error) {
      console.error('handleSubmit error:', error);
      showToast('error', 'Error', 'Failed to save recommendation.');
    } finally {
      setSaving(false);
    }
  };

  // ──────────────────────────────────────────────────
  // Handler: Save Changes (any role, updates existing review in place)
  // ──────────────────────────────────────────────────
  const handleSaveChanges = async () => {
    if (!reviewId) {
      showToast('error', 'Error', 'No review ID found. Cannot save changes.');
      return;
    }
    setSaving(true);
    try {
      const completeInterviewInfo = buildCompleteInterviewInfo();
      const updatePayload = {
        content: {
          interviewInfo: completeInterviewInfo,
          actionInfo,
        },
      };
      await apiClient.put(`/reviews/${reviewId}`, updatePayload);
      showToast('success', 'Saved', 'Changes saved successfully.');
    } catch (err) {
      console.error('handleSaveChanges error:', err);
      showToast('error', 'Error', 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  // ──────────────────────────────────────────────────
  // Handler: Resubmit for Review (intern → supervising_lawyer)
  // ──────────────────────────────────────────────────
  const handleResubmitForReview = async () => {
    if (!reviewId) {
      showToast('error', 'Error', 'No review ID found.');
      return;
    }
    setSaving(true);
    try {
      const completeInterviewInfo = buildCompleteInterviewInfo();
      const updatePayload = {
        reviewStage: 'supervising_lawyer',
        content: {
          interviewInfo: completeInterviewInfo,
          actionInfo,
        },
      };
      await apiClient.put(`/reviews/${reviewId}`, updatePayload);
      showToast('success', 'Resubmitted', 'Review resubmitted for supervising lawyer review.');
      router.back();
    } catch (err) {
      console.error('handleResubmitForReview error:', err);
      showToast('error', 'Error', 'Failed to resubmit review.');
    } finally {
      setSaving(false);
    }
  };

  // ──────────────────────────────────────────────────
  // Handler: Return to Intern (supervising_lawyer → returned_to_intern)
  // ──────────────────────────────────────────────────
  const handleReturnToIntern = async () => {
    if (!reviewId) {
      showToast('error', 'Error', 'No review ID found.');
      return;
    }
    setSaving(true);
    try {
      const completeInterviewInfo = buildCompleteInterviewInfo();
      const updatePayload = {
        reviewStage: 'returned_to_intern',
        content: {
          interviewInfo: completeInterviewInfo,
          actionInfo,
        },
      };
      await apiClient.put(`/reviews/${reviewId}`, updatePayload);
      showToast('success', 'Returned', 'Review returned to intern for revision.');
      router.back();
    } catch (err) {
      console.error('handleReturnToIntern error:', err);
      showToast('error', 'Error', 'Failed to return review to intern.');
    } finally {
      setSaving(false);
    }
  };

  // ──────────────────────────────────────────────────
  // Handler: Approve to Director (supervising_lawyer → director)
  // ──────────────────────────────────────────────────
  const handleApproveToDirector = async () => {
    if (!reviewId) {
      showToast('error', 'Error', 'No review ID found.');
      return;
    }
    setSaving(true);
    try {
      const completeInterviewInfo = buildCompleteInterviewInfo();
      const updatePayload = {
        reviewStage: 'director',
        content: {
          interviewInfo: completeInterviewInfo,
          actionInfo,
        },
      };
      await apiClient.put(`/reviews/${reviewId}`, updatePayload);
      showToast('success', 'Approved', 'Review approved and sent to director for review.');
      router.back();
    } catch (err) {
      console.error('handleApproveToDirector error:', err);
      showToast('error', 'Error', 'Failed to approve review to director.');
    } finally {
      setSaving(false);
    }
  };

  // ──────────────────────────────────────────────────
  // Handler: Return to Supervising Lawyer (director → supervising_lawyer)
  // ──────────────────────────────────────────────────
  const handleReturnToSupervisingLawyer = async () => {
    if (!reviewId) {
      showToast('error', 'Error', 'No review ID found.');
      return;
    }
    setSaving(true);
    try {
      const completeInterviewInfo = buildCompleteInterviewInfo();
      const updatePayload = {
        reviewStage: 'supervising_lawyer',
        content: {
          interviewInfo: completeInterviewInfo,
          actionInfo,
        },
      };
      await apiClient.put(`/reviews/${reviewId}`, updatePayload);
      showToast('success', 'Returned', 'Review returned to supervising lawyer.');
      router.back();
    } catch (err) {
      console.error('handleReturnToSupervisingLawyer error:', err);
      showToast('error', 'Error', 'Failed to return review to supervising lawyer.');
    } finally {
      setSaving(false);
    }
  };

  // ─── Evidence helpers ───
  const updateClientEvidence = useCallback((index, field, value) => {
    setInterviewInfo(prev => {
      const updated = [...(prev.clientEvidence || [])];
      if (!updated[index]) updated[index] = { ...EMPTY_EVIDENCE_ROW };
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, clientEvidence: updated };
    });
  }, []);

  const updateAdverseEvidence = useCallback((index, field, value) => {
    setInterviewInfo(prev => {
      const updated = [...(prev.adversePartyEvidence || [])];
      if (!updated[index]) updated[index] = { ...EMPTY_EVIDENCE_ROW };
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, adversePartyEvidence: updated };
    });
  }, []);

  const addClientEvidenceRow = useCallback(() => {
    setInterviewInfo(prev => ({
      ...prev,
      clientEvidence: [...(prev.clientEvidence || []), { ...EMPTY_EVIDENCE_ROW }],
    }));
  }, []);

  const addAdverseEvidenceRow = useCallback(() => {
    setInterviewInfo(prev => ({
      ...prev,
      adversePartyEvidence: [...(prev.adversePartyEvidence || []), { ...EMPTY_EVIDENCE_ROW }],
    }));
  }, []);

  // ─── Resolve full document URL from relative server path ───
  const resolveDocUrl = (relativeUrl) => {
    if (!relativeUrl) return null;
    if (relativeUrl.startsWith('http')) return relativeUrl;
    // Build base URL from apiClient (strip /api suffix)
    const { apiUrl } = getEnv();
    const baseUrl = apiUrl.replace(/\/api\/?$/, '');
    // The relativeUrl should already be URI-encoded from the server;
    // just concatenate without double-encoding.
    return `${baseUrl}${relativeUrl}`;
  };

  // ─── Document picker & upload helpers ───
  const handlePickDocument = async () => {
    if (!DocumentPicker) {
      Alert.alert(
        'Rebuild Required',
        'Document picker requires a native rebuild. Run: npx expo run:android',
      );
      return;
    }
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) return;

      const file = result.assets[0];
      setUploading(true);

      // Push current document to version history before replacing
      const currentDoc = uploadedFile || interviewInfo.uploadedDocument;
      if (currentDoc && currentDoc.fileName) {
        setDocumentVersions(prev => [currentDoc, ...prev]);
      }

      const formData = new FormData();
      formData.append('document', {
        uri: Platform.OS === 'android' ? file.uri : file.uri.replace('file://', ''),
        name: file.name,
        type: file.mimeType || 'application/octet-stream',
      });

      // Use raw XMLHttpRequest to bypass Axios 1.x transform pipeline
      // which can corrupt FormData in React Native 0.81 (new architecture).
      const { apiUrl: uploadBaseUrl } = getEnv();
      const { getAuth: getFirebaseAuth } = require('firebase/auth');
      const firebaseAuth = getFirebaseAuth();
      const fbUser = firebaseAuth.currentUser;
      const uploadToken = fbUser ? await fbUser.getIdToken() : null;

      const uploadResult = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${uploadBaseUrl}/upload/document`);
        if (uploadToken) xhr.setRequestHeader('Authorization', `Bearer ${uploadToken}`);
        // Do NOT set Content-Type — the native XHR sets multipart/form-data + boundary
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try { resolve(JSON.parse(xhr.responseText)); }
            catch { reject(new Error('Invalid server response')); }
          } else {
            reject(new Error(`Upload failed (${xhr.status}): ${xhr.responseText}`));
          }
        };
        xhr.onerror = () => reject(new Error('Network request failed — check server connection'));
        xhr.ontimeout = () => reject(new Error('Upload timed out'));
        xhr.timeout = 60000;
        xhr.send(formData);
      });

      if (uploadResult?.success) {
        const serverFile = uploadResult.file;
        const uploadedDoc = {
          fileName: serverFile.displayName || serverFile.originalName || file.name,
          fileSize: serverFile.size || file.size,
          fileUrl: serverFile.cloudinaryUrl || serverFile.url || serverFile.path,
          filename: serverFile.filename,
          mimeType: serverFile.mimetype || file.mimeType,
          cloudinaryUrl: serverFile.cloudinaryUrl || null,
          uploadedBy: userData?.firstName && userData?.lastName
            ? `${userData.firstName} ${userData.lastName}`
            : userData?.username || 'Unknown',
          uploadedByRole: normalizedRole,
          uploadedAt: new Date().toISOString(),
        };
        setUploadedFile(uploadedDoc);
        setInterviewInfo(prev => ({ ...prev, uploadedDocument: uploadedDoc }));
        showToast('success', 'Success', 'Document uploaded successfully.');
      } else {
        showToast('error', 'Error', 'Upload failed. Please try again.');
      }
    } catch (error) {
      console.error('Document pick/upload error:', error);
      showToast('error', 'Error', 'Failed to upload document.');
    } finally {
      setUploading(false);
    }
  };

  const handleViewDocument = (doc) => {
    const docData = doc || uploadedFile || interviewInfo.uploadedDocument;
    if (!docData) return;

    // Prefer cloudinaryUrl (signed, no auth needed) for external browser viewing
    if (docData.cloudinaryUrl) {
      Linking.openURL(docData.cloudinaryUrl).catch(() => {
        showToast('error', 'Error', 'Cannot open document. The file may not be available.');
      });
      return;
    }

    // Fallback: use the server's static file URL (no auth required for /uploads)
    const url = resolveDocUrl(docData.fileUrl);
    if (url) {
      Linking.openURL(url).catch(() => {
        showToast('error', 'Error', 'Cannot open document. The file may not be available on the server.');
      });
    } else {
      showToast('error', 'Error', 'No document URL available.');
    }
  };

  const handleRemoveDocument = () => {
    const docData = uploadedFile || interviewInfo.uploadedDocument;
    Alert.alert(
      'Remove Document',
      'Are you sure you want to remove the current document?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            // Try to delete from server
            if (docData?.filename) {
              try {
                await apiClient.delete(`/upload/document/${docData.filename}`);
              } catch (err) {
                console.warn('Server delete failed (may already be gone):', err.message);
              }
            }
            setUploadedFile(null);
            setInterviewInfo(prev => ({ ...prev, uploadedDocument: null }));
          },
        },
      ],
    );
  };

  const handleRemoveVersion = (index) => {
    const version = documentVersions[index];
    Alert.alert(
      'Remove Version',
      `Remove version "${version?.fileName || 'Unknown'}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            if (version?.filename) {
              try {
                await apiClient.delete(`/upload/document/${version.filename}`);
              } catch (err) {
                console.warn('Server delete failed:', err.message);
              }
            }
            setDocumentVersions(prev => prev.filter((_, i) => i !== index));
          },
        },
      ],
    );
  };

  // ─── Get review stage display info ───
  const getStageInfo = () => {
    switch (currentReviewStage) {
      case 'supervising_lawyer':
        return { label: 'Supervising Lawyer Review', color: '#FF8C42', bg: '#FFF4E6', description: 'Pending review by the supervising lawyer' };
      case 'director':
        return { label: 'Director Review', color: '#9C27B0', bg: '#F3E5F5', description: 'Approved by supervising lawyer, pending director review' };
      case 'returned_to_intern':
        return { label: 'Returned to Intern', color: '#DC2626', bg: '#FEF2F2', description: 'Returned to intern for revision' };
      case 'completed':
        return { label: 'Completed', color: '#4CAF50', bg: '#E8F5E9', description: 'Review completed' };
      default:
        return null;
    }
  };

  // ──────────────────────────────────────────────────
  // Step 0: Client Interview and Evidence Record
  // ──────────────────────────────────────────────────
  const renderInterviewStep = () => {
    const readOnly = interviewReadOnly;
    return (
      <View style={styles.formSection}>
        <Text style={styles.mainTitle}>Client Interview and Evidence Record</Text>

        {readOnly && (
          <View style={styles.alertBox}>
            <Ionicons name="lock-closed" size={16} color="#F59E0B" />
            <Text style={styles.alertText}>
              {isInternViewingSubmittedReview
                ? 'This record has been submitted for review and can no longer be edited.'
                : isSLViewingDirectorReview
                ? 'This record is under director review and cannot be edited.'
                : 'View only mode.'}
            </Text>
          </View>
        )}

        <View style={styles.divider} />

        {/* Date & Name fields - always read-only (matches website) */}
        <Text style={styles.inputLabel}>Date of Interview</Text>
        <TextInput
          style={[styles.input, styles.disabledInput]}
          value={interviewInfo.dateOfInterview}
          editable={false}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#999"
        />

        <Text style={styles.inputLabel}>Date Submitted</Text>
        <TextInput
          style={[styles.input, styles.disabledInput]}
          value={interviewInfo.dateSubmitted}
          editable={false}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#999"
        />

        <Text style={styles.inputLabel}>Client's Name</Text>
        <TextInput
          style={[styles.input, styles.disabledInput]}
          value={interviewInfo.clientName}
          editable={false}
          placeholder="Full Name"
          placeholderTextColor="#999"
        />

        <Text style={styles.inputLabel}>Interviewing Intern/s Duty Day</Text>
        <TextInput
          style={[styles.input, styles.disabledInput]}
          value={interviewInfo.interviewingInterns}
          editable={false}
          placeholder="Intern Name/s and Duty Day"
          placeholderTextColor="#999"
        />

        <View style={styles.divider} />

        {/* Fast Facts */}
        <Text style={styles.sectionTitle}>Fast Facts</Text>
        <TextInput
          style={[styles.input, styles.textArea, readOnly && styles.disabledInput]}
          value={interviewInfo.fastFacts}
          onChangeText={(text) => setInterviewInfo(prev => ({ ...prev, fastFacts: text }))}
          placeholder="A brief summary of the client's story and the core legal issue/s."
          placeholderTextColor="#999"
          multiline
          numberOfLines={4}
          editable={!readOnly}
        />

        <View style={styles.divider} />

        {/* Client Evidence */}
        <Text style={styles.sectionTitle}>Evidence on Hand / Available for the Client(s)</Text>
        {(interviewInfo.clientEvidence || []).map((evidence, index) => (
          <View key={`client-${index}`} style={styles.evidenceCard}>
            <Text style={styles.evidenceCardTitle}>Evidence #{index + 1}</Text>

            <Text style={styles.inputLabel}>Type / Description</Text>
            <TextInput
              style={[styles.input, readOnly && styles.disabledInput]}
              value={evidence.type || ''}
              onChangeText={(text) => updateClientEvidence(index, 'type', text)}
              placeholder="Type/Desc"
              placeholderTextColor="#999"
              editable={!readOnly}
            />

            <Text style={styles.inputLabel}>Author / Custodian</Text>
            <TextInput
              style={[styles.input, readOnly && styles.disabledInput]}
              value={evidence.author || ''}
              onChangeText={(text) => updateClientEvidence(index, 'author', text)}
              placeholder="Author/Custodian"
              placeholderTextColor="#999"
              editable={!readOnly}
            />

            <Text style={styles.inputLabel}>Purpose</Text>
            <TextInput
              style={[styles.input, readOnly && styles.disabledInput]}
              value={evidence.purpose || ''}
              onChangeText={(text) => updateClientEvidence(index, 'purpose', text)}
              placeholder="Purpose"
              placeholderTextColor="#999"
              editable={!readOnly}
            />

            <Text style={styles.inputLabel}>Admissibility Issues</Text>
            <TextInput
              style={[styles.input, readOnly && styles.disabledInput]}
              value={evidence.issues || ''}
              onChangeText={(text) => updateClientEvidence(index, 'issues', text)}
              placeholder="Admissibility Issues"
              placeholderTextColor="#999"
              editable={!readOnly}
            />
          </View>
        ))}
        {!readOnly && (
          <TouchableOpacity style={styles.addRowButton} onPress={addClientEvidenceRow}>
            <Ionicons name="add-circle-outline" size={18} color={PRIMARY_BROWN} />
            <Text style={styles.addRowText}>Add another row</Text>
          </TouchableOpacity>
        )}

        <View style={styles.divider} />

        {/* Adverse Party Evidence */}
        <Text style={styles.sectionTitle}>Evidence on Hand / Available for the Adverse Party(ies)</Text>
        {(interviewInfo.adversePartyEvidence || []).map((evidence, index) => (
          <View key={`adverse-${index}`} style={styles.evidenceCard}>
            <Text style={styles.evidenceCardTitle}>Evidence #{index + 1}</Text>

            <Text style={styles.inputLabel}>Type / Description</Text>
            <TextInput
              style={[styles.input, readOnly && styles.disabledInput]}
              value={evidence.type || ''}
              onChangeText={(text) => updateAdverseEvidence(index, 'type', text)}
              placeholder="Type/Desc"
              placeholderTextColor="#999"
              editable={!readOnly}
            />

            <Text style={styles.inputLabel}>Author / Custodian</Text>
            <TextInput
              style={[styles.input, readOnly && styles.disabledInput]}
              value={evidence.author || ''}
              onChangeText={(text) => updateAdverseEvidence(index, 'author', text)}
              placeholder="Author/Custodian"
              placeholderTextColor="#999"
              editable={!readOnly}
            />

            <Text style={styles.inputLabel}>Admissibility Issues</Text>
            <TextInput
              style={[styles.input, readOnly && styles.disabledInput]}
              value={evidence.issues || ''}
              onChangeText={(text) => updateAdverseEvidence(index, 'issues', text)}
              placeholder="Admissibility Issues"
              placeholderTextColor="#999"
              editable={!readOnly}
            />
          </View>
        ))}
        {!readOnly && (
          <TouchableOpacity style={styles.addRowButton} onPress={addAdverseEvidenceRow}>
            <Ionicons name="add-circle-outline" size={18} color={PRIMARY_BROWN} />
            <Text style={styles.addRowText}>Add another row</Text>
          </TouchableOpacity>
        )}

        <View style={styles.divider} />

        {/* Intern Advice */}
        <Text style={styles.sectionTitle}>Interviewing Intern's Initial Advice to the Client(s)</Text>
        <TextInput
          style={[styles.input, styles.textArea, readOnly && styles.disabledInput]}
          value={interviewInfo.internAdvice}
          onChangeText={(text) => setInterviewInfo(prev => ({ ...prev, internAdvice: text }))}
          placeholder="Brief summary of the initial legal advice given to the client."
          placeholderTextColor="#999"
          multiline
          numberOfLines={3}
          editable={!readOnly}
        />

        {/* Case Type Radio Buttons */}
        <Text style={styles.inputLabel}>Case Type</Text>
        <View style={styles.radioGroup}>
          {[
            { value: 'legal-advice', label: 'For legal advice only' },
            { value: 'legal-document', label: 'For drafting of legal document' },
            { value: 'court-representation', label: 'For court representation' },
          ].map(({ value, label }) => {
            // Case type only editable by interns creating, or when returned for revision
            const caseTypeDisabled = readOnly || isReturnedToIntern || (normalizedRole !== 'intern' && normalizedRole !== 'secretary' && isViewingExistingReview);
            return (
              <TouchableOpacity
                key={value}
                style={[styles.radioRow, caseTypeDisabled && styles.disabledRow]}
                onPress={() => {
                  if (caseTypeDisabled) return;
                  setInterviewInfo(prev => ({ ...prev, caseType: value }));
                }}
                disabled={caseTypeDisabled}
              >
                <View style={[styles.radio, interviewInfo.caseType === value && styles.radioSelected]}>
                  {interviewInfo.caseType === value && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.radioLabel}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Conditional File Upload for Legal Document Drafting */}
        {interviewInfo.caseType === 'legal-document' && (
          <View style={styles.uploadSection}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Ionicons name="document-attach-outline" size={20} color={PRIMARY_BROWN} />
              <Text style={styles.sectionTitle}>Legal Document Management</Text>
            </View>
            <Text style={{ fontSize: 12, color: MUTED_OLIVE, marginBottom: 12 }}>
              Upload a PDF or Word document (.pdf, .doc, .docx)
            </Text>

            {/* Upload Button — available at all stages so any reviewer can upload a version */}
            <TouchableOpacity
              style={[styles.uploadButton, uploading && styles.buttonDisabled]}
              onPress={handlePickDocument}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator size="small" color={PRIMARY_BROWN} />
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={20} color={PRIMARY_BROWN} />
                  <Text style={styles.uploadButtonText}>
                    {uploadedFile || interviewInfo.uploadedDocument ? 'Upload New Version' : 'Upload Document'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Current Document Display */}
            {(uploadedFile || interviewInfo.uploadedDocument) && (() => {
              const doc = uploadedFile || interviewInfo.uploadedDocument;
              return (
                <View style={styles.uploadedFileCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 8 }}>
                    <Ionicons name="document-text-outline" size={24} color={PRIMARY_BROWN} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: CHARCOAL }} numberOfLines={1}>
                        {doc.fileName || 'Document'}
                      </Text>
                      <Text style={{ fontSize: 11, color: MUTED_OLIVE }}>
                        {((doc.fileSize || 0) / 1024).toFixed(2)} KB
                        {doc.uploadedAt ? ` • ${new Date(doc.uploadedAt).toLocaleDateString()}` : ''}
                      </Text>
                      {doc.uploadedBy && (
                        <Text style={{ fontSize: 11, color: MUTED_OLIVE }}>
                          By: {doc.uploadedBy} ({doc.uploadedByRole || 'unknown'})
                        </Text>
                      )}
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <TouchableOpacity onPress={() => handleViewDocument(doc)} style={styles.docActionBtn}>
                      <Ionicons name="eye-outline" size={18} color="#2563EB" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleRemoveDocument} style={styles.docActionBtn}>
                      <Ionicons name="trash-outline" size={18} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })()}

            {/* Version History */}
            {documentVersions.length > 0 && (
              <View style={styles.versionSection}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <Ionicons name="time-outline" size={16} color={PRIMARY_BROWN} />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: PRIMARY_BROWN }}>
                    Version History ({documentVersions.length})
                  </Text>
                </View>
                {documentVersions.map((version, index) => (
                  <View key={`version-${index}`} style={styles.versionCard}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View style={styles.versionDot} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: CHARCOAL }} numberOfLines={1}>
                          v{documentVersions.length - index}: {version.fileName || 'Document'}
                        </Text>
                        <Text style={{ fontSize: 10, color: MUTED_OLIVE }}>
                          {((version.fileSize || 0) / 1024).toFixed(2)} KB
                          {version.uploadedBy ? ` • ${version.uploadedBy}` : ''}
                          {version.uploadedAt ? ` • ${new Date(version.uploadedAt).toLocaleDateString()}` : ''}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 4 }}>
                        <TouchableOpacity onPress={() => handleViewDocument(version)} style={styles.docActionBtnSmall}>
                          <Ionicons name="eye-outline" size={14} color="#2563EB" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleRemoveVersion(index)} style={styles.docActionBtnSmall}>
                          <Ionicons name="trash-outline" size={14} color="#DC2626" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        <View style={styles.divider} />

        {/* Legal Opinion */}
        <Text style={styles.sectionTitle}>Legal Opinion</Text>
        <TextInput
          ref={legalOpinionRef}
          style={[styles.input, styles.textArea, readOnly && styles.disabledInput]}
          value={interviewInfo.legalOpinion}
          onChangeText={(text) => setInterviewInfo(prev => ({ ...prev, legalOpinion: text }))}
          placeholder="The intern's assessment of the case's merits and possible legal strategy."
          placeholderTextColor="#999"
          multiline
          numberOfLines={5}
          editable={!readOnly}
          onFocus={() => {
            // Scroll to make the legal opinion field visible above the keyboard
            setTimeout(() => {
              legalOpinionRef.current?.measureLayout?.(
                scrollViewRef.current,
                (_x, y) => {
                  scrollViewRef.current?.scrollTo({ y: y - 80, animated: true });
                },
                () => {}
              );
            }, 300);
          }}
        />
      </View>
    );
  };

  // ──────────────────────────────────────────────────
  // Step 1: Supervising Lawyer & Director Action
  // ──────────────────────────────────────────────────
  const renderActionStep = () => {
    const handleDecisionChange = (val) => {
      if (directorSectionDisabled) return;
      // Toggle off if clicking same value  
      setActionInfo(prev => ({ ...prev, decision: prev.decision === val ? '' : val }));
    };

    return (
      <View style={styles.formSection}>
        <Text style={styles.mainTitle}>Supervising Lawyer & Director Action</Text>

        <View style={styles.divider} />

        {/* Supervising Lawyer's Comment */}
        <Text style={styles.sectionTitle}>Supervising Lawyer's Comment</Text>
        <TextInput
          style={[styles.input, styles.textArea, supervisingLawyerDisabled && styles.disabledInput]}
          value={actionInfo.supervisingComment}
          onChangeText={(text) => setActionInfo(prev => ({ ...prev, supervisingComment: text }))}
          placeholder="Comments, corrections, or additional instructions from the Supervising Lawyer."
          placeholderTextColor="#999"
          multiline
          numberOfLines={4}
          editable={!supervisingLawyerDisabled}
        />

        <View style={styles.divider} />

        {/* Director's Action */}
        <Text style={styles.sectionTitle}>Director's Action</Text>

        <Text style={styles.inputLabel}>Decision</Text>
        <View style={styles.radioGroup}>
          {['accepted', 'rejected', 'pending'].map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.radioRow, directorSectionDisabled && styles.disabledRow]}
              onPress={() => handleDecisionChange(option)}
              disabled={directorSectionDisabled}
            >
              <View style={[styles.radio, actionInfo.decision === option && styles.radioSelected]}>
                {actionInfo.decision === option && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.radioLabel}>{option.charAt(0).toUpperCase() + option.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.inputLabel}>If accepted/pending, instruction(s); if rejected, reason(s):</Text>
        <TextInput
          style={[styles.input, styles.textArea, directorSectionDisabled && styles.disabledInput]}
          value={actionInfo.decisionNote}
          onChangeText={(text) => setActionInfo(prev => ({ ...prev, decisionNote: text }))}
          placeholder="Specific instructions or reason for rejection"
          placeholderTextColor="#999"
          multiline
          numberOfLines={4}
          editable={!directorSectionDisabled}
        />

        <View style={styles.divider} />

        {/* Assignment & Signatures */}
        <Text style={styles.sectionTitle}>Assignment & Signatures</Text>

        <Text style={styles.inputLabel}>Assigned to: Law Interns</Text>
        <TextInput
          style={[styles.input, styles.textArea, assignmentReadOnly && styles.disabledInput]}
          value={actionInfo.assignedTo}
          onChangeText={(text) => setActionInfo(prev => ({ ...prev, assignedTo: text }))}
          placeholder="List of interns assigned to the case"
          placeholderTextColor="#999"
          multiline
          numberOfLines={3}
          editable={!assignmentReadOnly}
        />

        <Text style={styles.inputLabel}>Supervising Lawyer</Text>
        <TextInput
          style={[styles.input, assignmentReadOnly && styles.disabledInput]}
          value={actionInfo.supervisingLawyer}
          onChangeText={(text) => setActionInfo(prev => ({ ...prev, supervisingLawyer: text }))}
          placeholder="Signature/Name of Supervising Lawyer"
          placeholderTextColor="#999"
          editable={!assignmentReadOnly}
        />

        <Text style={styles.inputLabel}>Director's Signature</Text>
        <TextInput
          style={[styles.input, assignmentReadOnly && styles.disabledInput]}
          value={actionInfo.directorSignature}
          onChangeText={(text) => setActionInfo(prev => ({ ...prev, directorSignature: text }))}
          placeholder="Signature/Name of Director"
          placeholderTextColor="#999"
          editable={!assignmentReadOnly}
        />

        <Text style={styles.inputLabel}>Date</Text>
        <TextInput
          style={[styles.input, styles.disabledInput]}
          value={actionInfo.signatureDate}
          onChangeText={(text) => setActionInfo(prev => ({ ...prev, signatureDate: text }))}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#999"
          editable={false}
        />
      </View>
    );
  };

  // ──────────────────────────────────────────────────
  // Role-based action buttons on Step 1 (matches website exactly)
  // ──────────────────────────────────────────────────
  const renderActionButtons = () => {
    if (currentStep !== 1) return null;
    if (isViewOnly) {
      return (
        <TouchableOpacity style={[styles.primaryButton, styles.primaryButtonDisabled]} onPress={() => router.back()}>
          <Ionicons name="close" size={20} color="white" />
          <Text style={styles.primaryButtonText}>Close</Text>
        </TouchableOpacity>
      );
    }

    // ── Viewing existing review ──
    if (isViewingExistingReview) {
      // INTERN
      if (isIntern) {
        if (currentReviewStage === 'returned_to_intern') {
          return (
            <View style={styles.actionButtonGroup}>
              {currentStep > 0 && (
                <TouchableOpacity style={styles.prevButton} onPress={() => setCurrentStep(0)}>
                  <Ionicons name="chevron-back" size={18} color={PRIMARY_BROWN} />
                  <Text style={styles.secondaryButtonText}>Previous</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.outlineButton, saving && styles.buttonDisabled]}
                onPress={handleSaveChanges}
                disabled={saving}
              >
                {saving ? <ActivityIndicator size="small" color={PRIMARY_BROWN} /> : (
                  <><Ionicons name="save-outline" size={18} color={PRIMARY_BROWN} /><Text style={styles.outlineButtonText}>Save Changes</Text></>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.goldButton, saving && styles.buttonDisabled]}
                onPress={handleResubmitForReview}
                disabled={saving}
              >
                {saving ? <ActivityIndicator size="small" color={PRIMARY_BROWN} /> : (
                  <><Ionicons name="send" size={18} color={PRIMARY_BROWN} /><Text style={styles.goldButtonText}>Resubmit for Review</Text></>
                )}
              </TouchableOpacity>
            </View>
          );
        }
        // Other stages: view only for interns
        return (
          <View style={styles.actionButtonGroup}>
            {currentStep > 0 && (
              <TouchableOpacity style={styles.prevButton} onPress={() => setCurrentStep(0)}>
                <Ionicons name="chevron-back" size={18} color={PRIMARY_BROWN} />
                <Text style={styles.secondaryButtonText}>Previous</Text>
              </TouchableOpacity>
            )}
            <View style={styles.viewOnlyContainer}>
              <Text style={styles.viewOnlyText}>
                View only — Pending review by {currentReviewStage === 'supervising_lawyer' ? 'supervising lawyer' : 'director'}
              </Text>
            </View>
          </View>
        );
      }

      // SUPERVISING LAWYER
      if (normalizedRole === 'supervising_lawyer') {
        if (currentReviewStage === 'supervising_lawyer') {
          return (
            <View style={styles.actionButtonGrid}>
              {/* Row 1: Save (left) + Approve to Director (right) */}
              <View style={styles.actionButtonRow}>
                <TouchableOpacity
                  style={[styles.gridButton, styles.outlineButton, saving && styles.buttonDisabled]}
                  onPress={handleSaveChanges}
                  disabled={saving}
                >
                  {saving ? <ActivityIndicator size="small" color={PRIMARY_BROWN} /> : (
                    <><Ionicons name="save-outline" size={18} color={PRIMARY_BROWN} /><Text style={styles.outlineButtonText}>Save</Text></>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.gridButton, styles.orangeButton, saving && styles.buttonDisabled]}
                  onPress={handleApproveToDirector}
                  disabled={saving}
                >
                  {saving ? <ActivityIndicator size="small" color="white" /> : (
                    <><Ionicons name="arrow-forward" size={18} color="white" /><Text style={styles.orangeButtonText}>Approve to Director</Text></>
                  )}
                </TouchableOpacity>
              </View>
              {/* Row 2: Previous (left) + Return to Intern (right) */}
              <View style={styles.actionButtonRow}>
                {currentStep > 0 ? (
                  <TouchableOpacity
                    style={[styles.gridButton, styles.prevButton]}
                    onPress={() => setCurrentStep(0)}
                  >
                    <Ionicons name="chevron-back" size={18} color={PRIMARY_BROWN} />
                    <Text style={styles.secondaryButtonText}>Previous</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.gridButton} />
                )}
                <TouchableOpacity
                  style={[styles.gridButton, styles.redButton, saving && styles.buttonDisabled]}
                  onPress={handleReturnToIntern}
                  disabled={saving}
                >
                  {saving ? <ActivityIndicator size="small" color="white" /> : (
                    <><Ionicons name="arrow-back" size={18} color="white" /><Text style={styles.redButtonText}>Return to Intern</Text></>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          );
        }
        if (currentReviewStage === 'returned_to_intern') {
          return (
            <View style={styles.viewOnlyContainer}>
              <Text style={styles.viewOnlyText}>View only — Returned to intern for revision</Text>
            </View>
          );
        }
        return (
          <View style={styles.viewOnlyContainer}>
            <Text style={styles.viewOnlyText}>View only — Pending director review</Text>
          </View>
        );
      }

      // DIRECTOR
      if (normalizedRole === 'director') {
        if (currentReviewStage === 'director') {
          return (
            <View style={styles.actionButtonGrid}>
              {/* Row 1: Save (left) + Finalize Record (right) */}
              <View style={styles.actionButtonRow}>
                <TouchableOpacity
                  style={[styles.gridButton, styles.outlineButton, (saving || actionInfo.decision !== 'pending') && styles.buttonDisabled]}
                  onPress={handleSaveChanges}
                  disabled={saving || actionInfo.decision !== 'pending'}
                >
                  {saving ? <ActivityIndicator size="small" color={PRIMARY_BROWN} /> : (
                    <><Ionicons name="save-outline" size={18} color={PRIMARY_BROWN} /><Text style={styles.outlineButtonText}>Save</Text></>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.gridButton, styles.primaryButton, (saving || (actionInfo.decision !== 'accepted' && actionInfo.decision !== 'rejected')) && styles.buttonDisabled]}
                  onPress={handleSubmit}
                  disabled={saving || (actionInfo.decision !== 'accepted' && actionInfo.decision !== 'rejected')}
                >
                  {saving ? <ActivityIndicator size="small" color="white" /> : (
                    <><Ionicons name="checkmark-circle" size={18} color="white" /><Text style={styles.primaryButtonText}>Finalize Record</Text></>
                  )}
                </TouchableOpacity>
              </View>
              {/* Row 2: Previous (left) + Return to SL (right) */}
              <View style={styles.actionButtonRow}>
                {currentStep > 0 ? (
                  <TouchableOpacity
                    style={[styles.gridButton, styles.prevButton]}
                    onPress={() => setCurrentStep(0)}
                  >
                    <Ionicons name="chevron-back" size={18} color={PRIMARY_BROWN} />
                    <Text style={styles.secondaryButtonText}>Previous</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.gridButton} />
                )}
                <TouchableOpacity
                  style={[styles.gridButton, styles.redButton, (saving || !!actionInfo.decision) && styles.buttonDisabled]}
                  onPress={handleReturnToSupervisingLawyer}
                  disabled={saving || !!actionInfo.decision}
                >
                  {saving ? <ActivityIndicator size="small" color="white" /> : (
                    <><Ionicons name="arrow-back" size={18} color="white" /><Text style={styles.redButtonText}>Return to SL</Text></>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          );
        }
        if (currentReviewStage === 'returned_to_intern') {
          return (
            <View style={styles.viewOnlyContainer}>
              <Text style={styles.viewOnlyText}>View only — Returned to intern for revision</Text>
            </View>
          );
        }
        return (
          <View style={styles.viewOnlyContainer}>
            <Text style={styles.viewOnlyText}>View only — Pending supervising lawyer review</Text>
          </View>
        );
      }

      // Fallback: attorney, etc.
      return (
        <View style={styles.actionButtonGroup}>
          <TouchableOpacity
            style={[styles.outlineButton, saving && styles.buttonDisabled]}
            onPress={handleSaveChanges}
            disabled={saving}
          >
            {saving ? <ActivityIndicator size="small" color={PRIMARY_BROWN} /> : (
              <><Ionicons name="save-outline" size={18} color={PRIMARY_BROWN} /><Text style={styles.outlineButtonText}>Save Changes</Text></>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryButton, saving && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={saving}
          >
            {saving ? <ActivityIndicator size="small" color="white" /> : (
              <><Ionicons name="checkmark-circle" size={18} color="white" /><Text style={styles.primaryButtonText}>Finalize Record</Text></>
            )}
          </TouchableOpacity>
        </View>
      );
    }

    // ── Creating new review ──
    if (isIntern) {
      return (
        <View style={styles.actionButtonGroup}>
          {currentStep > 0 && (
            <TouchableOpacity style={styles.prevButton} onPress={() => setCurrentStep(0)}>
              <Ionicons name="chevron-back" size={18} color={PRIMARY_BROWN} />
              <Text style={styles.secondaryButtonText}>Previous</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.goldButton, saving && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={saving}
          >
            {saving ? <ActivityIndicator size="small" color={PRIMARY_BROWN} /> : (
              <><Ionicons name="send" size={18} color={PRIMARY_BROWN} /><Text style={styles.goldButtonText}>Submit for Review</Text></>
            )}
          </TouchableOpacity>
        </View>
      );
    }

    // Attorney / other creating new: Finalize record
    return (
      <TouchableOpacity
        style={[styles.primaryButton, saving && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={saving}
      >
        {saving ? <ActivityIndicator size="small" color="white" /> : (
          <><Ionicons name="checkmark-circle" size={18} color="white" /><Text style={styles.primaryButtonText}>Finalize Record</Text></>
        )}
      </TouchableOpacity>
    );
  };

  // ──────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={CHARCOAL} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Case Documentation</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_BROWN} />
        </View>
      </SafeAreaView>
    );
  }

  const stageInfo = getStageInfo();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={CHARCOAL} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Case Documentation</Text>
      </View>

      {/* Review Stage Indicator */}
      {isViewingExistingReview && stageInfo && (
        <View style={[styles.stageBanner, { backgroundColor: stageInfo.bg, borderColor: stageInfo.color }]}>
          <View style={styles.stageBannerContent}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.stageLabel, { color: PRIMARY_BROWN }]}>Current Review Stage</Text>
              <Text style={[styles.stageDescription, { color: MUTED_OLIVE }]}>{stageInfo.description}</Text>
            </View>
            <View style={[styles.stageBadge, { backgroundColor: stageInfo.color }]}>
              <Text style={styles.stageBadgeText}>{stageInfo.label}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Step Indicator */}
      <View style={styles.stepperContainer}>
        {steps.map((step, index) => (
          <View key={index} style={styles.stepItem}>
            <View style={[styles.stepCircle, index <= currentStep ? styles.stepCircleActive : styles.stepCircleInactive]}>
              {index < currentStep ? (
                <Ionicons name="checkmark" size={16} color="white" />
              ) : (
                <Text style={[styles.stepNumber, index <= currentStep ? styles.stepNumberActive : styles.stepNumberInactive]}>{index + 1}</Text>
              )}
            </View>
            <Text style={styles.stepLabel}>{step.label}</Text>
            {index < steps.length - 1 && <View style={styles.stepLine} />}
          </View>
        ))}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.formContainer}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {currentStep === 0 ? renderInterviewStep() : renderActionStep()}
          <View style={{ height: 20 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Navigation & Action Buttons */}
      <View style={styles.buttonContainer}>
        {currentStep < steps.length - 1 ? (
          <>
            {currentStep > 0 && (
              <TouchableOpacity style={styles.prevButton} onPress={() => setCurrentStep(0)}>
                <Ionicons name="chevron-back" size={20} color={PRIMARY_BROWN} />
                <Text style={styles.secondaryButtonText}>Previous</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.primaryButton} onPress={() => setCurrentStep(currentStep + 1)}>
              <Text style={styles.primaryButtonText}>Next Step</Text>
              <Ionicons name="chevron-forward" size={20} color="white" />
            </TouchableOpacity>
          </>
        ) : (
          renderActionButtons()
        )}
      </View>
      <ThemedToast toast={toast} onHide={hideToast} />
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
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

  // Stage banner
  stageBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    borderWidth: 2,
    borderRadius: 10,
    padding: 12,
  },
  stageBannerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stageLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  stageDescription: {
    fontSize: 11,
    marginTop: 2,
  },
  stageBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  stageBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
  },

  // Stepper
  stepperContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: THEMED_LIGHT_BG,
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepCircleActive: {
    backgroundColor: PRIMARY_BROWN,
  },
  stepCircleInactive: {
    backgroundColor: '#E0E0E0',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
  },
  stepNumberActive: {
    color: 'white',
  },
  stepNumberInactive: {
    color: '#999',
  },
  stepLabel: {
    fontSize: 11,
    color: CHARCOAL,
    textAlign: 'center',
  },
  stepLine: {
    position: 'absolute',
    top: 16,
    left: '50%',
    right: '-50%',
    height: 2,
    backgroundColor: '#E0E0E0',
    zIndex: -1,
  },

  // Form
  formContainer: {
    flex: 1,
    padding: 16,
  },
  formSection: {
    marginBottom: 20,
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: PRIMARY_BROWN,
    textAlign: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: PRIMARY_BROWN,
    marginBottom: 12,
    marginTop: 8,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
    marginTop: 12,
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
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  disabledInput: {
    backgroundColor: '#F5F5F5',
    opacity: 0.7,
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 20,
  },

  // Alert
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    gap: 8,
  },
  alertText: {
    fontSize: 13,
    color: '#92400E',
    flex: 1,
  },

  // Evidence
  evidenceCard: {
    backgroundColor: THEMED_LIGHT_BG,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  evidenceCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: PRIMARY_BROWN,
    marginBottom: 8,
  },
  addRowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 8,
    gap: 6,
  },
  addRowText: {
    fontSize: 13,
    color: PRIMARY_BROWN,
    fontWeight: '500',
  },

  // Radio
  radioGroup: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: PRIMARY_BROWN,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: PRIMARY_BROWN,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: PRIMARY_BROWN,
  },
  radioLabel: {
    fontSize: 15,
    color: CHARCOAL,
  },
  disabledRow: {
    opacity: 0.5,
  },

  // Buttons
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: 'white',
    gap: 12,
    flexWrap: 'wrap',
  },
  prevButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderWidth: 1.5,
    borderColor: PRIMARY_BROWN,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 8,
    gap: 6,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY_BROWN,
    padding: 14,
    borderRadius: 8,
    gap: 8,
    minWidth: 100,
  },
  primaryButtonDisabled: {
    opacity: 0.85,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderWidth: 1.5,
    borderColor: PRIMARY_BROWN,
    padding: 14,
    borderRadius: 8,
    gap: 8,
    minWidth: 100,
  },
  secondaryButtonText: {
    color: PRIMARY_BROWN,
    fontSize: 14,
    fontWeight: '600',
  },
  outlineButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderWidth: 1.5,
    borderColor: PRIMARY_GOLD,
    padding: 12,
    borderRadius: 8,
    gap: 6,
    minWidth: 80,
  },
  outlineButtonText: {
    color: PRIMARY_BROWN,
    fontSize: 13,
    fontWeight: '600',
  },
  goldButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY_GOLD,
    padding: 14,
    borderRadius: 8,
    gap: 8,
    minWidth: 100,
  },
  goldButtonText: {
    color: PRIMARY_BROWN,
    fontSize: 14,
    fontWeight: '700',
  },
  orangeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF8C42',
    padding: 12,
    borderRadius: 8,
    gap: 6,
    minWidth: 80,
  },
  orangeButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  redButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    padding: 12,
    borderRadius: 8,
    gap: 6,
    minWidth: 80,
  },
  redButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  actionButtonGroup: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButtonGrid: {
    flex: 1,
    gap: 10,
  },
  actionButtonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  gridButton: {
    flex: 1,
    minWidth: 0,
  },
  viewOnlyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  viewOnlyText: {
    fontSize: 13,
    color: MUTED_OLIVE,
    fontStyle: 'italic',
    textAlign: 'center',
  },

  // Upload section
  uploadSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#FFF9F0',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: PRIMARY_BROWN,
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
    backgroundColor: 'white',
  },
  uploadButtonText: {
    color: PRIMARY_BROWN,
    fontSize: 14,
    fontWeight: '600',
  },
  uploadedFileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#B0D4F1',
  },
  docActionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  docActionBtnSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  versionSection: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8D9C0',
  },
  versionCard: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  versionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PRIMARY_GOLD,
  },
});
