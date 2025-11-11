// components/SubmitCaseForm.js
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  Modal 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from 'asssets/styles/components/caseFormStyles';
import { CASE_TYPES } from 'utils/caseTypes';

export default function SubmitCaseForm({ visible, onClose, onSubmit }) {
  const [caseTitle, setCaseTitle] = useState('');
  const [caseType, setCaseType] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [detailedDescription, setDetailedDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    // Validation
    if (!caseTitle.trim()) {
      Alert.alert('Required Field', 'Please enter a case title');
      return;
    }
    if (!caseType) {
      Alert.alert('Required Field', 'Please select a case type');
      return;
    }
    if (!shortDescription.trim()) {
      Alert.alert('Required Field', 'Please enter a short description');
      return;
    }
    if (!detailedDescription.trim()) {
      Alert.alert('Required Field', 'Please provide detailed information about your case');
      return;
    }

    setIsSubmitting(true);

    try {
      const caseData = {
        title: caseTitle,
        type: caseType,
        shortDescription: shortDescription,
        detailedDescription: detailedDescription,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      // Call the onSubmit callback passed from parent
      await onSubmit(caseData);

      // Reset form
      setCaseTitle('');
      setCaseType('');
      setShortDescription('');
      setDetailedDescription('');
      
      Alert.alert(
        'Case Submitted Successfully',
        'Your case has been submitted. Please wait while we assign an attorney to your case.',
        [{ text: 'OK', onPress: onClose }]
      );
    } catch (error) {
      Alert.alert('Submission Failed', 'An error occurred. Please try again.');
      console.error('Submit case error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Discard Changes?',
      'Are you sure you want to cancel? All entered information will be lost.',
      [
        { text: 'Continue Editing', style: 'cancel' },
        { 
          text: 'Discard', 
          style: 'destructive',
          onPress: () => {
            setCaseTitle('');
            setCaseType('');
            setShortDescription('');
            setDetailedDescription('');
            onClose();
          }
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCancel}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#2C2C2C" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Submit a Case</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formContainer}>
            {/* Case Title */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Case Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter a brief title for your case"
                placeholderTextColor="#6B6B5A"
                value={caseTitle}
                onChangeText={setCaseTitle}
              />
            </View>

            {/* Case Type Selection */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Case Type *</Text>
              <View style={styles.caseTypeGrid}>
                {CASE_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.caseTypeCard,
                      caseType === type.id && styles.caseTypeCardSelected
                    ]}
                    onPress={() => setCaseType(type.id)}
                  >
                    <Ionicons 
                      name={type.icon} 
                      size={24} 
                      color={caseType === type.id ? '#8B4513' : '#6B6B5A'} 
                    />
                    <Text style={[
                      styles.caseTypeLabel,
                      caseType === type.id && styles.caseTypeLabelSelected
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Short Description */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Short Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Provide a brief summary (2-3 sentences)"
                placeholderTextColor="#6B6B5A"
                value={shortDescription}
                onChangeText={setShortDescription}
                multiline
                numberOfLines={3}
                maxLength={200}
              />
              <Text style={styles.charCount}>{shortDescription.length}/200</Text>
            </View>

            {/* Detailed Description */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Detailed Description *</Text>
              <TextInput
                style={[styles.input, styles.textAreaLarge]}
                placeholder="Provide detailed information about your case, including relevant dates, parties involved, and any important details"
                placeholderTextColor="#6B6B5A"
                value={detailedDescription}
                onChangeText={setDetailedDescription}
                multiline
                numberOfLines={8}
              />
            </View>

            {/* Info Box */}
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color="#8B4513" />
              <Text style={styles.infoText}>
                After submission, your case will be reviewed and an attorney will be assigned to assist you.
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[
              styles.submitButton,
              isSubmitting && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Submitting...' : 'Submit Case'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}