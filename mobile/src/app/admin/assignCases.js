import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAssignCase } from '../../hooks/admin/useAssignCase';
import { Picker } from '@react-native-picker/picker';

const AssignCases = () => {
  const router = useRouter();
  const { cases, attorneys, loading, assigning, assignAttorneyToCase } = useAssignCase();
  const [selectedCase, setSelectedCase] = useState(null);
  const [selectedAttorney, setSelectedAttorney] = useState('');

  // Update selectedCase when cases list changes (after assignment)
  useEffect(() => {
    if (selectedCase && cases.length > 0) {
      const updatedCase = cases.find(c => c._id === selectedCase._id);
      if (updatedCase) {
        setSelectedCase(updatedCase);
        setSelectedAttorney(updatedCase.attorneyId?._id || '');
      }
    }
  }, [cases]);

  const handleCasePress = (caseItem) => {
    setSelectedCase(caseItem);
    setSelectedAttorney(caseItem.attorneyId?._id || '');
  };

  const handleAssign = async () => {
    if (!selectedAttorney) {
      alert('Please select an attorney');
      return;
    }

    const success = await assignAttorneyToCase(selectedCase._id, selectedAttorney);
    // Don't close modal - let the useEffect update the selectedCase with new data
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B6F47" />
          <Text style={styles.loadingText}>Loading cases...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#2D2D2D" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Assign Cases</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {cases.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No cases available</Text>
          </View>
        ) : (
          cases.map((caseItem) => (
            <TouchableOpacity
              key={caseItem._id}
              style={styles.caseCard}
              onPress={() => handleCasePress(caseItem)}
            >
              <View style={styles.caseHeader}>
                <Text style={styles.caseNumber}>{caseItem.caseNumber}</Text>
                {caseItem.attorneyId ? (
                  <View style={styles.assignedBadge}>
                    <Text style={styles.assignedText}>Assigned</Text>
                  </View>
                ) : (
                  <View style={styles.unassignedBadge}>
                    <Text style={styles.unassignedText}>Unassigned</Text>
                  </View>
                )}
              </View>
              <Text style={styles.caseTitle}>{caseItem.caseTitle}</Text>
              <Text style={styles.caseType}>{caseItem.caseType}</Text>
              {caseItem.attorneyId && (
                <Text style={styles.attorneyInfo}>
                  Assigned to: {caseItem.attorneyId.firstName} {caseItem.attorneyId.lastName}
                </Text>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Case Detail Modal */}
      <Modal
        visible={selectedCase !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedCase(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Case Details</Text>
              <TouchableOpacity onPress={() => setSelectedCase(null)}>
                <Ionicons name="close" size={28} color="#2D2D2D" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {selectedCase && (
                <>
                  <Text style={styles.detailLabel}>Case Number</Text>
                  <Text style={styles.detailValue}>{selectedCase.caseNumber}</Text>

                  <Text style={styles.detailLabel}>Title</Text>
                  <Text style={styles.detailValue}>{selectedCase.caseTitle}</Text>

                  <Text style={styles.detailLabel}>Type</Text>
                  <Text style={styles.detailValue}>{selectedCase.caseType}</Text>

                  <Text style={styles.detailLabel}>Short Description</Text>
                  <Text style={styles.detailValue}>{selectedCase.shortDescription}</Text>

                  <Text style={styles.detailLabel}>Detailed Description</Text>
                  <Text style={styles.detailValue}>{selectedCase.detailedDescription}</Text>

                  <Text style={styles.detailLabel}>Assign Attorney</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={selectedAttorney}
                      onValueChange={(itemValue) => setSelectedAttorney(itemValue)}
                      style={styles.picker}
                    >
                      <Picker.Item label="Select an attorney..." value="" />
                      {attorneys.map((attorney) => (
                        <Picker.Item
                          key={attorney._id}
                          label={`${attorney.firstName} ${attorney.lastName}`}
                          value={attorney._id}
                        />
                      ))}
                    </Picker>
                  </View>

                  <TouchableOpacity
                    style={[styles.assignButton, assigning && styles.assignButtonDisabled]}
                    onPress={handleAssign}
                    disabled={assigning}
                  >
                    <Text style={styles.assignButtonText}>
                      {assigning ? 'Assigning...' : 'Assign Attorney'}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0EDE3',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D2D2D',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
  },
  caseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  caseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  caseNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B6F47',
  },
  assignedBadge: {
    backgroundColor: '#D4EDDA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  assignedText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#155724',
  },
  unassignedBadge: {
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  unassignedText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#856404',
  },
  caseTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D2D2D',
    marginBottom: 4,
  },
  caseType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  attorneyInfo: {
    fontSize: 12,
    color: '#8B6F47',
    marginTop: 4,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EDE3',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2D2D2D',
  },
  modalBody: {
    padding: 24,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B6F47',
    marginTop: 16,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 16,
    color: '#2D2D2D',
    lineHeight: 24,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginTop: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  assignButton: {
    backgroundColor: '#8B6F47',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  assignButtonDisabled: {
    backgroundColor: '#ccc',
  },
  assignButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default AssignCases;
