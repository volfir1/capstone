import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import apiClient from '../../api/apiClient';
import { useAuth } from '../../context/authContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Alert as RNAlert } from 'react-native';

const PRIMARY_BROWN = '#7D5A3B';
const PRIMARY_GOLD = '#C4AB7D';
const CHARCOAL = '#2C2C2C';
const THEMED_LIGHT_BG = '#FAF8F3';

export default function RecommendationForAction() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const caseIdParam = params.caseId;
  const isViewOnly = params.viewOnly === 'true' || params.mode === 'view';
  const passedReview = (() => {
    if (!params.review) return null;
    try {
      return JSON.parse(params.review);
    } catch (e) {
      return null;
    }
  })();
  // Prefer explicit caseId; avoid falling back to review _id to keep finalize records consistent
  const derivedCaseId = caseIdParam || passedReview?.caseId || 'new-case';
  const { userData } = useAuth();
  const normalizedRole = (userData?.role || '').toLowerCase().trim();
  const isIntern = normalizedRole === 'intern';
  const isAttorneyRole = ['attorney', 'secretary', 'pao_lawyer', 'legal_volunteer', 'admin', 'director', 'supervising_lawyer'].includes(normalizedRole);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [reviewId, setReviewId] = useState(null);
  const [currentReviewStage, setCurrentReviewStage] = useState('supervising_lawyer'); // Track current stage
  const [showSignatureDatePicker, setShowSignatureDatePicker] = useState(false);
  
  // Form data - matches website structure exactly
  const [interviewInfo, setInterviewInfo] = useState({
    dateOfInterview: '',
    dateSubmitted: '',
    clientName: '',
    interviewingInterns: '',
    fastFacts: '',
    clientEvidence: [
      { type: '', author: '', purpose: '', issues: '' },
      { type: '', author: '', purpose: '', issues: '' },
      { type: '', author: '', purpose: '', issues: '' }
    ],
    adversePartyEvidence: [
      { type: '', author: '', purpose: '', issues: '' },
      { type: '', author: '', purpose: '', issues: '' },
      { type: '', author: '', purpose: '', issues: '' }
    ],
    internAdvice: '',
    caseType: '',
    legalOpinion: '',
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

  // Website has 2 steps: Client Interview and Evidence, then Supervising Lawyer & Director Action
  const steps = [
    { label: 'Interview & Evidence', description: 'Client details and documents' },
    { label: 'Supervising & Director', description: 'Final action' },
  ];

  useEffect(() => {
    if (passedReview && passedReview.content) {
      const review = passedReview;
      setReviewId(review._id || review.id);
      setCurrentReviewStage(review.reviewStage || 'supervising_lawyer'); // Load the current stage
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
      }
      if (review.content.actionInfo) {
        setActionInfo(prev => ({ ...prev, ...review.content.actionInfo }));
      }
      setLoading(false);
    } else if (passedReview) {
      // If a review was passed but had no content, don't stay stuck on loading
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (derivedCaseId && !passedReview) {
      loadExistingReview();
      loadClientInfo();
    }
  }, [derivedCaseId, passedReview]);

  // Auto-populate fields based on user role
  useEffect(() => {
    if (!userData) return;
    
    const currentUserName = userData.firstName && userData.lastName 
      ? `${userData.firstName} ${userData.lastName}` 
      : userData.username || userData.displayName || 'Unknown User';
    
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    
    if (normalizedRole === 'intern') {
      // For interns: Set assignedTo and date if not already set
      if (!actionInfo.assignedTo) {
        setActionInfo(prev => ({
          ...prev,
          assignedTo: currentUserName,
          signatureDate: formattedDate
        }));
      } else if (!actionInfo.signatureDate) {
        setActionInfo(prev => ({ ...prev, signatureDate: formattedDate }));
      }
    } else if (normalizedRole === 'supervising_lawyer') {
      // For supervising lawyers: Set supervisingLawyer name if not already set
      if (!actionInfo.supervisingLawyer) {
        setActionInfo(prev => ({ ...prev, supervisingLawyer: currentUserName }));
      }
    } else if (normalizedRole === 'director') {
      // For directors: Set directorSignature if not already set
      if (!actionInfo.directorSignature) {
        setActionInfo(prev => ({ ...prev, directorSignature: currentUserName }));
      }
    }
  }, [normalizedRole, userData, actionInfo.assignedTo, actionInfo.signatureDate, actionInfo.supervisingLawyer, actionInfo.directorSignature]);

  const loadClientInfo = async () => {
    try {
      const response = await apiClient.get(`/clientsinfo/${derivedCaseId}`);
      const clientData = response.data;
      
      const formatDate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toISOString().split('T')[0];
      };
      
      setInterviewInfo(prev => ({
        ...prev,
        clientName: prev.clientName || clientData.fullName || clientData.name || '',
        dateOfInterview: prev.dateOfInterview || formatDate(clientData.appointedDate || clientData.createdAt),
        dateSubmitted: prev.dateSubmitted || formatDate(new Date()),
      }));
    } catch (error) {
      console.error('Error loading client info:', error);
    }
  };

  const loadExistingReview = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/reviews/case/${derivedCaseId}`);
      const reviews = Array.isArray(response.data) ? response.data : response.data?.data || [];
      
      if (reviews.length > 0) {
        const review = reviews[0];
        setReviewId(review._id || review.id);
        
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
          }
          if (review.content.actionInfo) {
            setActionInfo(prev => ({
              ...prev,
              ...review.content.actionInfo,
            }));
          }
        }
      }
    } catch (error) {
      // 404 is expected for new cases - only log other errors
      if (error.response?.status !== 404) {
        console.error('Error loading review:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  // Filter out empty evidence rows before saving (matches website logic)
  const filterEmptyEvidence = (evidenceArray) => {
    if (!evidenceArray || !Array.isArray(evidenceArray)) return [];
    return evidenceArray.filter(row => 
      row && (row.type || row.author || row.purpose || row.issues)
    );
  };

  const handleSave = async () => {
    if (isViewOnly) {
      return;
    }
    setSaving(true);

    try {
      const completeInterviewInfo = {
        ...interviewInfo,
        clientEvidence: filterEmptyEvidence(interviewInfo.clientEvidence),
        adversePartyEvidence: filterEmptyEvidence(interviewInfo.adversePartyEvidence),
      };

      const reviewPayload = {
        caseId: derivedCaseId,
        reviewerId: userData?._id || userData?.id || null,
        reviewerRole: normalizedRole || 'staff',
        step: currentStep,
        content: {
          interviewInfo: completeInterviewInfo,
          actionInfo: actionInfo,
        },
      };

      if (reviewId) {
        await apiClient.put(`/reviews/${reviewId}`, reviewPayload);
      } else {
        const response = await apiClient.post('/reviews', reviewPayload);
        setReviewId(response.data._id || response.data.id);
      }

      if (isIntern) {
        // Interns submit for review only; status marked confirmed and no finalization
        try {
          await apiClient.put(`/clientsinfo/${derivedCaseId}`, { status: 'confirmed' });
        } catch (statusErr) {
          console.error('Error updating status for intern submission:', statusErr);
        }
        Alert.alert('Submitted', 'Review sent to the attorney for finalization.');
        router.back();
        return;
      }

      if (isAttorneyRole) {
        if (!derivedCaseId || derivedCaseId === 'new-case') {
          Alert.alert('Missing case', 'Cannot finalize without a valid case id.');
          setSaving(false);
          return;
        }
        let finalStatus = 'confirmed';
        if (completeInterviewInfo.caseType === 'legal-advice') {
          finalStatus = 'legal-advice';
        } else if (actionInfo.decision === 'accepted' || actionInfo.decision === 'rejected' || actionInfo.decision === 'pending') {
          finalStatus = 'court-case';
        }

        try {
          await apiClient.put(`/clientsinfo/${derivedCaseId}`, { status: finalStatus });
        } catch (statusErr) {
          console.error('Error updating final status:', statusErr);
        }

        let finalizeCreated = null;
        try {
          const res = await apiClient.post('/finalize', {
            caseId: derivedCaseId,
            finalizedBy: userData?._id || userData?.id || null,
            finalizedRole: normalizedRole,
            decision: actionInfo.decision || 'pending',
            content: {
              interviewInfo: completeInterviewInfo,
              actionInfo,
            },
          });
          finalizeCreated = res.data;
        } catch (finalizeErr) {
          console.error('Error saving finalization:', finalizeErr);
          RNAlert.alert('Finalize Failed', 'Could not create finalized record.');
          throw finalizeErr;
        }

        try {
          const toDeleteId = reviewId || passedReview?._id || passedReview?.id;
          if (toDeleteId) {
            await apiClient.delete(`/reviews/${toDeleteId}`);
          }
          await apiClient.delete(`/reviews/case/${derivedCaseId}`);
        } catch (deleteErr) {
          console.error('Error deleting review after finalization:', deleteErr);
          RNAlert.alert('Cleanup Warning', 'Finalized, but could not remove review record.');
        }

        Alert.alert('Finalized', 'Case finalized successfully.');
        router.back();
        return;
      }

      Alert.alert('Saved', 'Recommendation saved successfully.');
      router.back();
    } catch (error) {
      console.error('Error saving review:', error);
      Alert.alert('Error', 'Failed to save recommendation');
    } finally {
      setSaving(false);
    }
  };

  // Update evidence helper
  const updateClientEvidence = (index, field, value) => {
    const updated = [...(interviewInfo.clientEvidence || [])];
    if (!updated[index]) {
      updated[index] = { type: '', author: '', purpose: '', issues: '' };
    }
    updated[index] = { ...updated[index], [field]: value };
    setInterviewInfo({ ...interviewInfo, clientEvidence: updated });
  };

  const updateAdverseEvidence = (index, field, value) => {
    const updated = [...(interviewInfo.adversePartyEvidence || [])];
    if (!updated[index]) {
      updated[index] = { type: '', author: '', purpose: '', issues: '' };
    }
    updated[index] = { ...updated[index], [field]: value };
    setInterviewInfo({ ...interviewInfo, adversePartyEvidence: updated });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Client Interview and Evidence Record (matches website Section 2)
        return (
          <View style={styles.formSection}>
            {/* Section Title */}
            <Text style={styles.mainTitle}>Client Interview and Evidence Record</Text>
            
            <View style={styles.divider} />

            {/* Date and Name Fields */}
            <Text style={styles.inputLabel}>Date of Interview</Text>
            <TextInput
              style={styles.input}
              value={interviewInfo.dateOfInterview}
              onChangeText={(text) => setInterviewInfo({...interviewInfo, dateOfInterview: text})}
              placeholder="YYYY-MM-DD"
            />
            
            <Text style={styles.inputLabel}>Date Submitted</Text>
            <TextInput
              style={styles.input}
              value={interviewInfo.dateSubmitted}
              onChangeText={(text) => setInterviewInfo({...interviewInfo, dateSubmitted: text})}
              placeholder="YYYY-MM-DD"
            />
            
            <Text style={styles.inputLabel}>Client's Name</Text>
            <TextInput
              style={styles.input}
              value={interviewInfo.clientName}
              onChangeText={(text) => setInterviewInfo({...interviewInfo, clientName: text})}
              placeholder="Full Name"
            />
            
            <Text style={styles.inputLabel}>Interviewing Intern/s Duty Day</Text>
            <TextInput
              style={styles.input}
              value={interviewInfo.interviewingInterns}
              onChangeText={(text) => setInterviewInfo({...interviewInfo, interviewingInterns: text})}
              placeholder="Intern Name/s and Duty Day"
            />

            <View style={styles.divider} />
            
            {/* Fast Facts */}
            <Text style={styles.sectionTitle}>Fast Facts</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={interviewInfo.fastFacts}
              onChangeText={(text) => setInterviewInfo({...interviewInfo, fastFacts: text})}
              placeholder="A brief summary of the client's story and the core legal issue/s."
              multiline
              numberOfLines={4}
            />

            <View style={styles.divider} />

            {/* Evidence on Hand for Client(s) */}
            <Text style={styles.sectionTitle}>Evidence on Hand / Available for the Client(s)</Text>
            {(interviewInfo.clientEvidence || []).map((evidence, index) => (
              <View key={`client-${index}`} style={styles.evidenceCard}>
                <Text style={styles.evidenceCardTitle}>Evidence #{index + 1}</Text>
                
                <Text style={styles.inputLabel}>Type / Description</Text>
                <TextInput
                  style={styles.input}
                  value={evidence.type || ''}
                  onChangeText={(text) => updateClientEvidence(index, 'type', text)}
                  placeholder="Type/Desc"
                />
                
                <Text style={styles.inputLabel}>Author / Custodian</Text>
                <TextInput
                  style={styles.input}
                  value={evidence.author || ''}
                  onChangeText={(text) => updateClientEvidence(index, 'author', text)}
                  placeholder="Author/Custodian"
                />
                
                <Text style={styles.inputLabel}>Purpose</Text>
                <TextInput
                  style={styles.input}
                  value={evidence.purpose || ''}
                  onChangeText={(text) => updateClientEvidence(index, 'purpose', text)}
                  placeholder="Purpose"
                />
                
                <Text style={styles.inputLabel}>Admissibility Issues</Text>
                <TextInput
                  style={styles.input}
                  value={evidence.issues || ''}
                  onChangeText={(text) => updateClientEvidence(index, 'issues', text)}
                  placeholder="Admissibility Issues"
                />
              </View>
            ))}

            <View style={styles.divider} />

            {/* Evidence on Hand for Adverse Party(ies) */}
            <Text style={styles.sectionTitle}>Evidence on Hand / Available for the Adverse Party(ies)</Text>
            {(interviewInfo.adversePartyEvidence || []).map((evidence, index) => (
              <View key={`adverse-${index}`} style={styles.evidenceCard}>
                <Text style={styles.evidenceCardTitle}>Evidence #{index + 1}</Text>
                
                <Text style={styles.inputLabel}>Type / Description</Text>
                <TextInput
                  style={styles.input}
                  value={evidence.type || ''}
                  onChangeText={(text) => updateAdverseEvidence(index, 'type', text)}
                  placeholder="Type/Desc"
                />
                
                <Text style={styles.inputLabel}>Author / Custodian</Text>
                <TextInput
                  style={styles.input}
                  value={evidence.author || ''}
                  onChangeText={(text) => updateAdverseEvidence(index, 'author', text)}
                  placeholder="Author/Custodian"
                />
                
                <Text style={styles.inputLabel}>Purpose</Text>
                <TextInput
                  style={styles.input}
                  value={evidence.purpose || ''}
                  onChangeText={(text) => updateAdverseEvidence(index, 'purpose', text)}
                  placeholder="Purpose"
                />
                
                <Text style={styles.inputLabel}>Admissibility Issues</Text>
                <TextInput
                  style={styles.input}
                  value={evidence.issues || ''}
                  onChangeText={(text) => updateAdverseEvidence(index, 'issues', text)}
                  placeholder="Admissibility Issues"
                />
              </View>
            ))}

            <View style={styles.divider} />

            {/* Interviewing Intern's Initial Advice to the Client(s) */}
            <Text style={styles.sectionTitle}>Interviewing Intern's Initial Advice to the Client(s)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={interviewInfo.internAdvice}
              onChangeText={(text) => setInterviewInfo({...interviewInfo, internAdvice: text})}
              placeholder="Brief summary of the initial legal advice given to the client."
              multiline
              numberOfLines={3}
            />
            
            {/* Case Type Radio Buttons */}
            <Text style={styles.inputLabel}>Case Type</Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={styles.radioRow}
                onPress={() => setInterviewInfo({...interviewInfo, caseType: 'legal-advice'})}
              >
                <View style={[styles.radio, interviewInfo.caseType === 'legal-advice' && styles.radioSelected]}>
                  {interviewInfo.caseType === 'legal-advice' && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.radioLabel}>For legal advice only</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.radioRow}
                onPress={() => setInterviewInfo({...interviewInfo, caseType: 'legal-document'})}
              >
                <View style={[styles.radio, interviewInfo.caseType === 'legal-document' && styles.radioSelected]}>
                  {interviewInfo.caseType === 'legal-document' && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.radioLabel}>For drafting of legal document</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.radioRow}
                onPress={() => setInterviewInfo({...interviewInfo, caseType: 'court-representation'})}
              >
                <View style={[styles.radio, interviewInfo.caseType === 'court-representation' && styles.radioSelected]}>
                  {interviewInfo.caseType === 'court-representation' && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.radioLabel}>For court representation</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            {/* Legal Opinion */}
            <Text style={styles.sectionTitle}>Legal Opinion</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={interviewInfo.legalOpinion}
              onChangeText={(text) => setInterviewInfo({...interviewInfo, legalOpinion: text})}
              placeholder="The intern's assessment of the case's merits and possible legal strategy."
              multiline
              numberOfLines={5}
            />
          </View>
        );
      
      case 1: // Supervising Lawyer & Director Action (matches website Section 3)
        return (
          <View style={styles.formSection}>
            {/* Section Title */}
            <Text style={styles.mainTitle}>Supervising Lawyer & Director Action</Text>
            
            <View style={styles.divider} />

            {/* Supervising Lawyer's Comment */}
            <Text style={styles.sectionTitle}>Supervising Lawyer's Comment</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={actionInfo.supervisingComment}
              onChangeText={(text) => setActionInfo({...actionInfo, supervisingComment: text})}
              placeholder="Comments, corrections, or additional instructions from the Supervising Lawyer."
              multiline
              numberOfLines={4}
            />

            <View style={styles.divider} />

            {/* Director's Action */}
            <Text style={styles.sectionTitle}>Director's Action</Text>
            
            <Text style={styles.inputLabel}>Decision</Text>
            <View style={styles.radioGroup}>
              {['accepted', 'rejected', 'pending'].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.radioRow, isIntern && styles.disabledRow]}
                  onPress={() => {
                    if (isIntern) return;
                    setActionInfo({...actionInfo, decision: option});
                  }}
                  disabled={isIntern}
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
              style={[styles.input, styles.textArea]}
              value={actionInfo.decisionNote}
              onChangeText={(text) => setActionInfo({...actionInfo, decisionNote: text})}
              placeholder="Specific instructions or reason for rejection"
              multiline
              numberOfLines={4}
              editable={!isIntern}
              selectTextOnFocus={!isIntern}
              placeholderTextColor={isIntern ? '#999' : undefined}
            />

            <View style={styles.divider} />

            {/* Assignment & Signatures */}
            <Text style={styles.sectionTitle}>Assignment & Signatures</Text>
            
            <Text style={styles.inputLabel}>Assigned to: Law Interns</Text>
            <TextInput
              style={[styles.input, styles.textArea, currentReviewStage === 'director' && styles.disabledInput]}
              value={actionInfo.assignedTo}
              onChangeText={(text) => setActionInfo({...actionInfo, assignedTo: text})}
              placeholder="List of interns assigned to the case"
              multiline
              numberOfLines={3}
              editable={currentReviewStage !== 'director'}
              selectTextOnFocus={currentReviewStage !== 'director'}
            />
            
            <Text style={styles.inputLabel}>Supervising Lawyer</Text>
            <TextInput
              style={[styles.input, currentReviewStage === 'director' && styles.disabledInput]}
              value={actionInfo.supervisingLawyer}
              onChangeText={(text) => setActionInfo({...actionInfo, supervisingLawyer: text})}
              placeholder="Signature/Name of Supervising Lawyer"
              editable={currentReviewStage !== 'director'}
              selectTextOnFocus={currentReviewStage !== 'director'}
            />
            
            <Text style={styles.inputLabel}>Director's Signature</Text>
            <TextInput
              style={[styles.input, currentReviewStage === 'director' && styles.disabledInput]}
              value={actionInfo.directorSignature}
              onChangeText={(text) => setActionInfo({...actionInfo, directorSignature: text})}
              placeholder="Signature/Name of Director"
              editable={currentReviewStage !== 'director'}
              selectTextOnFocus={currentReviewStage !== 'director'}
            />
            
            <Text style={styles.inputLabel}>Date</Text>
            <TouchableOpacity
              onPress={() => setShowSignatureDatePicker(true)}
              style={styles.dateInputWrapper}
              activeOpacity={0.8}
            >
              <Text style={[styles.input, styles.dateDisplay]}>
                {actionInfo.signatureDate || 'Select date'}
              </Text>
              <Ionicons name="calendar" size={18} color={PRIMARY_BROWN} style={styles.dateIcon} />
            </TouchableOpacity>

            {showSignatureDatePicker && (
              <DateTimePicker
                value={actionInfo.signatureDate ? new Date(actionInfo.signatureDate) : new Date()}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowSignatureDatePicker(false);
                  if (event.type === 'dismissed') return;
                  const iso = selectedDate?.toISOString().split('T')[0];
                  setActionInfo({ ...actionInfo, signatureDate: iso || '' });
                }}
              />
            )}
          </View>
        );
      
      default:
        return null;
    }
  };

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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={CHARCOAL} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Case Documentation</Text>
      </View>

      {/* Step Indicator */}
      <View style={styles.stepperContainer}>
        {steps.map((step, index) => (
          <View key={index} style={styles.stepItem}>
            <View style={[
              styles.stepCircle,
              index <= currentStep ? styles.stepCircleActive : styles.stepCircleInactive
            ]}>
              {index < currentStep ? (
                <Ionicons name="checkmark" size={16} color="white" />
              ) : (
                <Text style={[
                  styles.stepNumber,
                  index <= currentStep ? styles.stepNumberActive : styles.stepNumberInactive
                ]}>{index + 1}</Text>
              )}
            </View>
            <Text style={styles.stepLabel}>{step.label}</Text>
            {index < steps.length - 1 && <View style={styles.stepLine} />}
          </View>
        ))}
      </View>

      <ScrollView style={styles.formContainer}>
        {renderStepContent()}
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.buttonContainer}>
        {currentStep > 0 && (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setCurrentStep(currentStep - 1)}
          >
            <Ionicons name="chevron-back" size={20} color={PRIMARY_BROWN} />
            <Text style={styles.secondaryButtonText}>Previous</Text>
          </TouchableOpacity>
        )}
        
        {currentStep < steps.length - 1 ? (
          <TouchableOpacity
            style={[styles.primaryButton, isViewOnly && styles.primaryButtonDisabled]}
            onPress={() => setCurrentStep(currentStep + 1)}
            disabled={isViewOnly && saving}
          >
            <Text style={styles.primaryButtonText}>{isViewOnly ? 'Next' : 'Next'}</Text>
            <Ionicons name="chevron-forward" size={20} color="white" />
          </TouchableOpacity>
        ) : isViewOnly ? (
          <TouchableOpacity
            style={[styles.primaryButton, styles.primaryButtonDisabled]}
            onPress={() => router.back()}
          >
            <Text style={styles.primaryButtonText}>Close</Text>
            <Ionicons name="close" size={20} color="white" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="white" />
                <Text style={styles.primaryButtonText}>{isIntern ? 'Save Changes' : 'Finalize'}</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
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
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    justifyContent: 'flex-end',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: PRIMARY_BROWN,
    borderRadius: 4,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: PRIMARY_BROWN,
  },
  checkboxLabel: {
    fontSize: 14,
    color: CHARCOAL,
  },
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
  disabledInput: {
    backgroundColor: '#F5F5F5',
    opacity: 0.7,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: 'white',
    gap: 12,
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
  },
  primaryButtonDisabled: {
    opacity: 0.85,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  dateInputWrapper: {
    position: 'relative',
  },
  dateDisplay: {
    paddingRight: 40,
  },
  dateIcon: {
    position: 'absolute',
    right: 12,
    top: 14,
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
  },
  secondaryButtonText: {
    color: PRIMARY_BROWN,
    fontSize: 16,
    fontWeight: '600',
  },
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
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 20,
  },
});
