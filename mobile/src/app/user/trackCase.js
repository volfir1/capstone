// pages/TrackCasePage.js
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView,
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import styles from 'asssets/styles/trackCasePageStyles';
import { CASE_STATUS_STEPS } from 'utils/casStatusSteps';
import { getCaseTypeLabel } from 'utils/caseTypes';
import apiClient from '../../api/apiClient';

export default function TrackCasePage() {
  const router = useRouter();
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/cases/user-cases');
      
      if (response.data.success) {
        // Transform API data to match the component's expected format
        const transformedCases = response.data.data.map(caseItem => ({
          id: caseItem._id,
          title: caseItem.caseTitle,
          type: caseItem.caseType,
          status: caseItem.attorneyId ? 'attorney_assigned' : 'pending',
          shortDescription: caseItem.shortDescription,
          createdAt: caseItem.createdAt,
          assignedAttorney: caseItem.attorneyId ? {
            name: `Atty. ${caseItem.attorneyId.firstName} ${caseItem.attorneyId.lastName}`,
            specialization: caseItem.attorneyId.specializations?.[0] || 'General Law',
          } : null,
          lastUpdated: caseItem.updatedAt || caseItem.createdAt,
          caseNumber: caseItem.caseNumber,
          detailedDescription: caseItem.detailedDescription,
        }));
        
        setCases(transformedCases);
      }
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
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => setSelectedCase(null)}
        >
          <Ionicons name="arrow-back" size={24} color="#2C2C2C" />
          <Text style={styles.backButtonText}>Back to Cases</Text>
        </TouchableOpacity>

        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>{selectedCase.title}</Text>
          
          {selectedCase.caseNumber && (
            <Text style={styles.caseNumberText}>Case #{selectedCase.caseNumber}</Text>
          )}
          
          <Text style={styles.detailsType}>{getCaseTypeLabel(selectedCase.type)}</Text>
          <Text style={styles.detailsDescription}>{selectedCase.shortDescription}</Text>
          
          {selectedCase.detailedDescription && (
            <View style={styles.detailedDescSection}>
              <Text style={styles.detailedDescLabel}>Full Description:</Text>
              <Text style={styles.detailedDescText}>{selectedCase.detailedDescription}</Text>
            </View>
          )}
          
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
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="arrow-back" size={28} color="#2C2C2C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {selectedCase ? 'Case Details' : 'Track Cases'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

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
  );
}