// components/TrackCase.js
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Modal,
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from 'asssets/styles/components/trackCaseStyles';
import { CASE_STATUS_STEPS } from 'utils/casStatusSteps';
import { getCaseTypeLabel } from 'utils/caseTypes';

export default function TrackCase({ visible, onClose }) {
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      loadCases();
    }
  }, [visible]);

  const loadCases = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await fetchUserCases();
      
      // Mock data for demonstration
      const mockCases = [
        {
          id: '1',
          title: 'Property Dispute Case',
          type: 'property',
          status: 'in_review',
          shortDescription: 'Dispute regarding property boundary lines',
          createdAt: '2025-01-15T10:00:00Z',
          assignedAttorney: null,
          lastUpdated: '2025-01-16T14:30:00Z',
        },
        {
          id: '2',
          title: 'Labor Contract Issue',
          type: 'labor',
          status: 'attorney_assigned',
          shortDescription: 'Unfair termination claim',
          createdAt: '2025-01-10T09:00:00Z',
          assignedAttorney: {
            name: 'Atty. Maria Santos',
            specialization: 'Labor Law',
          },
          lastUpdated: '2025-01-18T11:00:00Z',
        },
        {
          id: '3',
          title: 'Family Custody Matter',
          type: 'family',
          status: 'completed',
          shortDescription: 'Child custody arrangement',
          createdAt: '2024-12-20T08:00:00Z',
          assignedAttorney: {
            name: 'Atty. Juan Dela Cruz',
            specialization: 'Family Law',
          },
          lastUpdated: '2025-01-15T16:00:00Z',
          completedAt: '2025-01-15T16:00:00Z',
        },
      ];
      
      setCases(mockCases);
    } catch (error) {
      console.error('Error loading cases:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentStatusIndex = (status) => {
    return CASE_STATUS_STEPS.findIndex(step => step.id === status);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
      case 'in_review':
        return '#C4AB7D';
      case 'attorney_assigned':
      case 'in_progress':
        return '#8B4513';
      case 'completed':
        return '#5A8F5A';
      case 'rejected':
        return '#D64545';
      default:
        return '#6B6B5A';
    }
  };

  const renderCaseList = () => (
    <ScrollView style={styles.caseListContainer}>
      {cases.map((caseItem) => {
        const currentStepIndex = getCurrentStatusIndex(caseItem.status);
        const statusStep = CASE_STATUS_STEPS[currentStepIndex];
        
        return (
          <TouchableOpacity
            key={caseItem.id}
            style={styles.caseCard}
            onPress={() => setSelectedCase(caseItem)}
          >
            <View style={styles.caseCardHeader}>
              <Text style={styles.caseTitle}>{caseItem.title}</Text>
              <View style={[
                styles.statusBadge, 
                { backgroundColor: getStatusColor(caseItem.status) }
              ]}>
                <Text style={styles.statusBadgeText}>{statusStep?.label}</Text>
              </View>
            </View>
            
            <Text style={styles.caseType}>{getCaseTypeLabel(caseItem.type)}</Text>
            <Text style={styles.caseDescription} numberOfLines={2}>
              {caseItem.shortDescription}
            </Text>
            
            <View style={styles.caseCardFooter}>
              <Text style={styles.caseDate}>
                Filed: {formatDate(caseItem.createdAt)}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#6B6B5A" />
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  const renderCaseDetails = () => {
    if (!selectedCase) return null;
    
    const currentStepIndex = getCurrentStatusIndex(selectedCase.status);
    
    return (
      <ScrollView style={styles.detailsContainer}>
        {/* Header with back button */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => setSelectedCase(null)}
        >
          <Ionicons name="arrow-back" size={24} color="#2C2C2C" />
          <Text style={styles.backButtonText}>Back to Cases</Text>
        </TouchableOpacity>

        {/* Case Info */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>{selectedCase.title}</Text>
          <Text style={styles.detailsType}>{getCaseTypeLabel(selectedCase.type)}</Text>
          <Text style={styles.detailsDescription}>{selectedCase.shortDescription}</Text>
          
          <View style={styles.detailsInfoRow}>
            <Ionicons name="calendar-outline" size={18} color="#6B6B5A" />
            <Text style={styles.detailsInfoText}>
              Filed: {formatDate(selectedCase.createdAt)}
            </Text>
          </View>
          
          <View style={styles.detailsInfoRow}>
            <Ionicons name="time-outline" size={18} color="#6B6B5A" />
            <Text style={styles.detailsInfoText}>
              Last Updated: {formatDate(selectedCase.lastUpdated)}
            </Text>
          </View>

          {selectedCase.assignedAttorney && (
            <View style={styles.attorneyCard}>
              <Ionicons name="person-circle-outline" size={24} color="#8B4513" />
              <View style={styles.attorneyInfo}>
                <Text style={styles.attorneyName}>
                  {selectedCase.assignedAttorney.name}
                </Text>
                <Text style={styles.attorneySpec}>
                  {selectedCase.assignedAttorney.specialization}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Progress Tracker */}
        <View style={styles.trackerCard}>
          <Text style={styles.trackerTitle}>Case Progress</Text>
          
          <View style={styles.progressContainer}>
            {CASE_STATUS_STEPS.map((step, index) => {
              const isCompleted = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const isUpcoming = index > currentStepIndex;
              
              return (
                <View key={step.id} style={styles.progressStep}>
                  <View style={styles.progressStepLeft}>
                    <View style={[
                      styles.progressDot,
                      isCompleted && styles.progressDotCompleted,
                      isCurrent && styles.progressDotCurrent,
                    ]}>
                      {isCompleted && (
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      )}
                    </View>
                    {index < CASE_STATUS_STEPS.length - 1 && (
                      <View style={[
                        styles.progressLine,
                        isCompleted && styles.progressLineCompleted,
                      ]} />
                    )}
                  </View>
                  
                  <View style={styles.progressStepContent}>
                    <Text style={[
                      styles.progressStepTitle,
                      isCurrent && styles.progressStepTitleCurrent,
                      isUpcoming && styles.progressStepTitleUpcoming,
                    ]}>
                      {step.label}
                    </Text>
                    <Text style={styles.progressStepDescription}>
                      {step.description}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#2C2C2C" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {selectedCase ? 'Case Details' : 'Track Cases'}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Content */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8B4513" />
            <Text style={styles.loadingText}>Loading your cases...</Text>
          </View>
        ) : cases.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={80} color="#C4AB7D" />
            <Text style={styles.emptyTitle}>No Cases Found</Text>
            <Text style={styles.emptyText}>
              You haven't submitted any cases yet.
            </Text>
          </View>
        ) : selectedCase ? (
          renderCaseDetails()
        ) : (
          renderCaseList()
        )}
      </View>
    </Modal>
  );
}