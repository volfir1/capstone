import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import styles from '../../assets/styles/appointmentFormStyles';
import { PRIMARY_BROWN, PRIMARY_GOLD, MUTED_OLIVE, CHARCOAL } from '../../utils/constants';
import apiClient from '../../api/apiClient';

const FORM_STORAGE_KEY = '@justreach_appointment_draft';

export default function AppointmentForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPreferredDatePicker, setShowPreferredDatePicker] = useState(false);
  const [showPreferredTimePicker, setShowPreferredTimePicker] = useState(false);
  const [showRelator, setShowRelator] = useState(false);
  const [sameAsPresent, setSameAsPresent] = useState(false);

  // Form data state
  const [formData, setFormData] = useState({
    // Personal Details
    name: '',
    age: '',
    birthday: new Date(),
    contactNumber: '',
    sex: '',
    civilStatus: '',
    citizenship: 'Filipino',
    presentAddress: '',
    permanentAddress: '',
    relatorName: '',
    relatorRelationship: '',
    
    // Financial Details
    currentSourceOfIncome: '',
    monthlyIncome: '',
    natureOfWork: '',
    employerName: '',
    employerAddress: '',
    
    // Case Details
    partyRepresented: '',
    venue: '',
    caseNumber: '',
    presentStage: '',
    caseNature: '',
    courtDivision: '',
    courtAddress: '',
    presidingOfficer: '',

    // Preferred schedule
    preferredDate: null,
    preferredTime: null,
  });

  const [errors, setErrors] = useState({});

  const steps = [
    { title: 'Personal Details', icon: 'person' },
    { title: 'Financial Details', icon: 'cash' },
    { title: 'Case Details', icon: 'document-text' },
    { title: 'Review', icon: 'checkmark-circle' },
  ];

  // Load saved draft on mount
  useEffect(() => {
    loadDraft();
  }, []);

  // Save draft whenever form data changes
  useEffect(() => {
    saveDraft();
  }, [formData]);

  const loadDraft = async () => {
    try {
      const savedData = await AsyncStorage.getItem(FORM_STORAGE_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        setFormData({ ...formData, ...parsed });
        Alert.alert('Draft Restored', 'Your previous form data has been restored');
      }
    } catch (error) {
      console.error('Error loading draft:', error);
    }
  };

  const saveDraft = async () => {
    try {
      await AsyncStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(formData));
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  };

  const clearDraft = async () => {
    try {
      await AsyncStorage.removeItem(FORM_STORAGE_KEY);
      setFormData({
        name: '',
        age: '',
        birthday: new Date(),
        contactNumber: '',
        sex: '',
        civilStatus: '',
        citizenship: 'Filipino',
        presentAddress: '',
        permanentAddress: '',
        relatorName: '',
        relatorRelationship: '',
        currentSourceOfIncome: '',
        monthlyIncome: '',
        natureOfWork: '',
        employerName: '',
        employerAddress: '',
        partyRepresented: '',
        venue: '',
        caseNumber: '',
        presentStage: '',
        caseNature: '',
        courtDivision: '',
        courtAddress: '',
        presidingOfficer: '',
        preferredDate: null,
        preferredTime: null,
      });
      setCurrentStep(0);
      Alert.alert('Form Cleared', 'All saved form data has been cleared');
    } catch (error) {
      console.error('Error clearing draft:', error);
    }
  };

  const calculateAge = (birthday) => {
    const today = new Date();
    const birthDate = new Date(birthday);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));

    // Auto-calculate age when birthday changes
    if (field === 'birthday') {
      const age = calculateAge(value);
      setFormData(prev => ({ ...prev, age: age.toString() }));
    }

    // Check if relator needed
    if (field === 'age') {
      const ageNum = parseInt(value);
      setShowRelator(ageNum < 18);
    }

    // Sync permanent address if checked
    if (field === 'presentAddress' && sameAsPresent) {
      setFormData(prev => ({ ...prev, permanentAddress: value }));
    }
  };

  const openPreferredDatePicker = () => {
    const current = formData.preferredDate ? new Date(formData.preferredDate) : new Date();
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: current,
        mode: 'date',
        minimumDate: new Date(),
        onChange: (event, selectedDate) => {
          if (event.type === 'dismissed') return;
          if (selectedDate) updateField('preferredDate', selectedDate.toISOString());
        }
      });
    } else {
      setShowPreferredDatePicker(true);
    }
  };

  const openPreferredTimePicker = () => {
    const current = formData.preferredTime ? new Date(formData.preferredTime) : new Date();
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: current,
        mode: 'time',
        onChange: (event, selectedTime) => {
          if (event.type === 'dismissed') return;
          if (selectedTime) {
            const normalized = new Date();
            normalized.setHours(selectedTime.getHours());
            normalized.setMinutes(selectedTime.getMinutes());
            updateField('preferredTime', normalized.toISOString());
          }
        }
      });
    } else {
      setShowPreferredTimePicker(true);
    }
  };

  const validateStep = () => {
    const newErrors = {};

    if (currentStep === 0) {
      if (!formData.name.trim()) newErrors.name = 'Name is required';
      if (!formData.birthday) newErrors.birthday = 'Birthday is required';
      if (!formData.age) newErrors.age = 'Age is required';
      if (!formData.contactNumber.trim()) newErrors.contactNumber = 'Contact number is required';
      if (!formData.sex) newErrors.sex = 'Sex is required';
      if (!formData.civilStatus) newErrors.civilStatus = 'Civil status is required';
      if (!formData.presentAddress.trim()) newErrors.presentAddress = 'Present address is required';
      if (!formData.permanentAddress.trim()) newErrors.permanentAddress = 'Permanent address is required';
      
      if (showRelator) {
        if (!formData.relatorName.trim()) newErrors.relatorName = 'Relator name is required for minors';
        if (!formData.relatorRelationship.trim()) newErrors.relatorRelationship = 'Relationship is required';
      }
    } else if (currentStep === 1) {
      if (!formData.currentSourceOfIncome.trim()) newErrors.currentSourceOfIncome = 'Source of income is required';
      if (!formData.monthlyIncome.trim()) newErrors.monthlyIncome = 'Monthly income is required';
      if (!formData.natureOfWork.trim()) newErrors.natureOfWork = 'Nature of work is required';
      if (!formData.employerName.trim()) newErrors.employerName = 'Employer name is required';
      if (!formData.employerAddress.trim()) newErrors.employerAddress = 'Employer address is required';
    } else if (currentStep === 2) {
      if (!formData.partyRepresented) newErrors.partyRepresented = 'Party represented is required';
      if (!formData.venue.trim()) newErrors.venue = 'Venue is required';
      if (!formData.caseNumber.trim()) newErrors.caseNumber = 'Case number is required';
      if (!formData.presentStage.trim()) newErrors.presentStage = 'Present stage is required';
      if (!formData.caseNature) newErrors.caseNature = 'Case nature is required';
      if (!formData.courtDivision.trim()) newErrors.courtDivision = 'Court division is required';
      if (!formData.courtAddress.trim()) newErrors.courtAddress = 'Court address is required';
      if (!formData.presidingOfficer.trim()) newErrors.presidingOfficer = 'Presiding officer is required';
      if (!formData.preferredDate) newErrors.preferredDate = 'Preferred date is required';
      if (!formData.preferredTime) newErrors.preferredTime = 'Preferred time is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    } else {
      Alert.alert('Validation Error', 'Please fill in all required fields');
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const formatPreferredDate = (date) => {
    if (!date) return 'Select Date';
    const d = new Date(date);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatPreferredTime = (time) => {
    if (!time) return 'Select Time';
    const d = new Date(time);
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  const handleSubmit = async () => {
    Alert.alert(
      'Submit Application',
      'Are you sure you want to submit your appointment application?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            try {
              const finalErrors = { ...errors };
              if (!formData.preferredDate) finalErrors.preferredDate = 'Preferred date is required';
              if (!formData.preferredTime) finalErrors.preferredTime = 'Preferred time is required';
              setErrors(finalErrors);
              if (finalErrors.preferredDate || finalErrors.preferredTime) {
                Alert.alert('Missing Schedule', 'Please select a preferred appointment date and time.');
                return;
              }

              const payload = {
                ...formData,
                appointedDate: formData.preferredDate,
                appointmentTime: formData.preferredTime,
                status: 'auto-scheduled',
              };

              await apiClient.post('/clientsinfo', payload);
              
              Alert.alert(
                'Success',
                'Your appointment application has been submitted successfully. Please wait for admin review and schedule.',
                [
                  {
                    text: 'OK',
                    onPress: async () => {
                      await clearDraft();
                      router.replace('/user');
                    },
                  },
                ]
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to submit application. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderPersonalDetails = () => (
    <View style={styles.formSection}>
      <Text style={styles.sectionTitle}>Personal Information</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Full Name <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={[styles.input, errors.name && styles.inputError]}
          placeholder="Juan Dela Cruz"
          value={formData.name}
          onChangeText={(text) => updateField('name', text)}
        />
        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.label}>Birthday <Text style={styles.required}>*</Text></Text>
          <TouchableOpacity
            style={[styles.input, errors.birthday && styles.inputError]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.inputText}>
              {formData.birthday instanceof Date 
                ? formData.birthday.toLocaleDateString() 
                : 'Select Date'}
            </Text>
            <Ionicons name="calendar-outline" size={20} color={MUTED_OLIVE} />
          </TouchableOpacity>
          {errors.birthday && <Text style={styles.errorText}>{errors.birthday}</Text>}
        </View>

        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.label}>Age <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={[styles.input, styles.inputReadonly]}
            value={formData.age}
            editable={false}
          />
        </View>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={formData.birthday instanceof Date ? formData.birthday : new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              updateField('birthday', selectedDate);
            }
          }}
          maximumDate={new Date()}
        />
      )}

      {showPreferredDatePicker && (
        <DateTimePicker
          value={formData.preferredDate ? new Date(formData.preferredDate) : new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowPreferredDatePicker(false);
            if (selectedDate) {
              updateField('preferredDate', selectedDate.toISOString());
            }
          }}
          minimumDate={new Date()}
        />
      )}

      {showPreferredTimePicker && (
        <DateTimePicker
          value={formData.preferredTime ? new Date(formData.preferredTime) : new Date()}
          mode="time"
          display="default"
          onChange={(event, selectedTime) => {
            setShowPreferredTimePicker(false);
            if (selectedTime) {
              const normalized = new Date();
              normalized.setHours(selectedTime.getHours());
              normalized.setMinutes(selectedTime.getMinutes());
              updateField('preferredTime', normalized.toISOString());
            }
          }}
        />
      )}

      {parseInt(formData.age) < 18 && formData.age && (
        <View style={styles.alertBox}>
          <Ionicons name="information-circle" size={20} color={PRIMARY_GOLD} />
          <Text style={styles.alertText}>
            As a minor, a relator is required to proceed with this application
          </Text>
        </View>
      )}

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Contact Number <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={[styles.input, errors.contactNumber && styles.inputError]}
          placeholder="+63 912 345 6789"
          value={formData.contactNumber}
          onChangeText={(text) => updateField('contactNumber', text)}
          keyboardType="phone-pad"
        />
        {errors.contactNumber && <Text style={styles.errorText}>{errors.contactNumber}</Text>}
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.label}>Sex <Text style={styles.required}>*</Text></Text>
          <View style={[styles.pickerContainer, errors.sex && styles.inputError]}>
            <Picker
              selectedValue={formData.sex}
              onValueChange={(value) => updateField('sex', value)}
              style={styles.picker}
              dropdownIconColor={CHARCOAL}
              itemStyle={{ color: CHARCOAL }}
            >
              <Picker.Item label="Select..." value="" />
              <Picker.Item label="Male" value="male" />
              <Picker.Item label="Female" value="female" />
            </Picker>
          </View>
          {errors.sex && <Text style={styles.errorText}>{errors.sex}</Text>}
        </View>

        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.label}>Civil Status <Text style={styles.required}>*</Text></Text>
          <View style={[styles.pickerContainer, errors.civilStatus && styles.inputError]}>
            <Picker
              selectedValue={formData.civilStatus}
              onValueChange={(value) => updateField('civilStatus', value)}
              style={styles.picker}
              dropdownIconColor={CHARCOAL}
              itemStyle={{ color: CHARCOAL }}
            >
              <Picker.Item label="Select..." value="" />
              <Picker.Item label="Single" value="single" />
              <Picker.Item label="Married" value="married" />
              <Picker.Item label="Widowed" value="widowed" />
              <Picker.Item label="Separated" value="separated" />
            </Picker>
          </View>
          {errors.civilStatus && <Text style={styles.errorText}>{errors.civilStatus}</Text>}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Citizenship <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={styles.input}
          value={formData.citizenship}
          onChangeText={(text) => updateField('citizenship', text)}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Present Address <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={[styles.input, styles.textArea, errors.presentAddress && styles.inputError]}
          placeholder="123 Street, Barangay, City, Province"
          value={formData.presentAddress}
          onChangeText={(text) => updateField('presentAddress', text)}
          multiline
          numberOfLines={3}
        />
        {errors.presentAddress && <Text style={styles.errorText}>{errors.presentAddress}</Text>}
      </View>

      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={() => {
          const newValue = !sameAsPresent;
          setSameAsPresent(newValue);
          if (newValue) {
            updateField('permanentAddress', formData.presentAddress);
          }
        }}
      >
        <Ionicons
          name={sameAsPresent ? 'checkbox' : 'square-outline'}
          size={24}
          color={sameAsPresent ? PRIMARY_BROWN : MUTED_OLIVE}
        />
        <Text style={styles.checkboxLabel}>Same as present address</Text>
      </TouchableOpacity>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Permanent Address <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={[styles.input, styles.textArea, errors.permanentAddress && styles.inputError]}
          placeholder="123 Street, Barangay, City, Province"
          value={formData.permanentAddress}
          onChangeText={(text) => updateField('permanentAddress', text)}
          multiline
          numberOfLines={3}
          editable={!sameAsPresent}
        />
        {errors.permanentAddress && <Text style={styles.errorText}>{errors.permanentAddress}</Text>}
      </View>

      {showRelator && (
        <>
          <View style={styles.divider} />
          <Text style={styles.subsectionTitle}>Relator Information (Required for Minors)</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Relator Name <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={[styles.input, errors.relatorName && styles.inputError]}
              placeholder="Guardian or Parent Name"
              value={formData.relatorName}
              onChangeText={(text) => updateField('relatorName', text)}
            />
            {errors.relatorName && <Text style={styles.errorText}>{errors.relatorName}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Relationship <Text style={styles.required}>*</Text></Text>
            <View style={[styles.pickerContainer, errors.relatorRelationship && styles.inputError]}>
              <Picker
                selectedValue={formData.relatorRelationship}
                onValueChange={(value) => updateField('relatorRelationship', value)}
                style={styles.picker}
              >
                <Picker.Item label="Select..." value="" />
                <Picker.Item label="Parent" value="parent" />
                <Picker.Item label="Guardian" value="guardian" />
                <Picker.Item label="Grandparent" value="grandparent" />
                <Picker.Item label="Sibling" value="sibling" />
                <Picker.Item label="Other" value="other" />
              </Picker>
            </View>
            {errors.relatorRelationship && <Text style={styles.errorText}>{errors.relatorRelationship}</Text>}
          </View>
        </>
      )}
    </View>
  );

  const renderFinancialDetails = () => (
    <View style={styles.formSection}>
      <Text style={styles.sectionTitle}>Financial Information</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Current Source of Income <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={[styles.input, errors.currentSourceOfIncome && styles.inputError]}
          placeholder="Employment, Business, etc."
          value={formData.currentSourceOfIncome}
          onChangeText={(text) => updateField('currentSourceOfIncome', text)}
        />
        {errors.currentSourceOfIncome && <Text style={styles.errorText}>{errors.currentSourceOfIncome}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Monthly Income <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={[styles.input, errors.monthlyIncome && styles.inputError]}
          placeholder="₱ 0.00"
          value={formData.monthlyIncome}
          onChangeText={(text) => updateField('monthlyIncome', text)}
          keyboardType="numeric"
        />
        {errors.monthlyIncome && <Text style={styles.errorText}>{errors.monthlyIncome}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Nature of Work <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={[styles.input, errors.natureOfWork && styles.inputError]}
          placeholder="Job Title or Business Type"
          value={formData.natureOfWork}
          onChangeText={(text) => updateField('natureOfWork', text)}
        />
        {errors.natureOfWork && <Text style={styles.errorText}>{errors.natureOfWork}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Employer/Business Name <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={[styles.input, errors.employerName && styles.inputError]}
          placeholder="Company or Business Name"
          value={formData.employerName}
          onChangeText={(text) => updateField('employerName', text)}
        />
        {errors.employerName && <Text style={styles.errorText}>{errors.employerName}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Employer/Business Address <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={[styles.input, styles.textArea, errors.employerAddress && styles.inputError]}
          placeholder="Full Business Address"
          value={formData.employerAddress}
          onChangeText={(text) => updateField('employerAddress', text)}
          multiline
          numberOfLines={3}
        />
        {errors.employerAddress && <Text style={styles.errorText}>{errors.employerAddress}</Text>}
      </View>
    </View>
  );

  const renderCaseDetails = () => (
    <View style={styles.formSection}>
      <Text style={styles.sectionTitle}>Case Information</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Party Represented <Text style={styles.required}>*</Text></Text>
        <View style={[styles.pickerContainer, errors.partyRepresented && styles.inputError]}>
          <Picker
            selectedValue={formData.partyRepresented}
            onValueChange={(value) => updateField('partyRepresented', value)}
            style={styles.picker}
            dropdownIconColor={CHARCOAL}
            itemStyle={{ color: CHARCOAL }}
          >
            <Picker.Item label="Select..." value="" />
            <Picker.Item label="Plaintiff" value="plaintiff" />
            <Picker.Item label="Defendant" value="defendant" />
            <Picker.Item label="Petitioner" value="petitioner" />
            <Picker.Item label="Respondent" value="respondent" />
          </Picker>
        </View>
        {errors.partyRepresented && <Text style={styles.errorText}>{errors.partyRepresented}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Venue <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={[styles.input, errors.venue && styles.inputError]}
          placeholder="Court Location"
          value={formData.venue}
          onChangeText={(text) => updateField('venue', text)}
        />
        {errors.venue && <Text style={styles.errorText}>{errors.venue}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Case Number <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={[styles.input, errors.caseNumber && styles.inputError]}
          placeholder="e.g., CV-2025-001"
          value={formData.caseNumber}
          onChangeText={(text) => updateField('caseNumber', text)}
        />
        {errors.caseNumber && <Text style={styles.errorText}>{errors.caseNumber}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Present Stage <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={[styles.input, errors.presentStage && styles.inputError]}
          placeholder="Current Case Stage"
          value={formData.presentStage}
          onChangeText={(text) => updateField('presentStage', text)}
        />
        {errors.presentStage && <Text style={styles.errorText}>{errors.presentStage}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Nature of Case <Text style={styles.required}>*</Text></Text>
        <View style={[styles.pickerContainer, errors.caseNature && styles.inputError]}>
          <Picker
            selectedValue={formData.caseNature}
            onValueChange={(value) => updateField('caseNature', value)}
            style={styles.picker}
            dropdownIconColor={CHARCOAL}
            itemStyle={{ color: CHARCOAL }}
          >
            <Picker.Item label="Select..." value="" />
            <Picker.Item label="Civil" value="civil" />
            <Picker.Item label="Criminal" value="criminal" />
            <Picker.Item label="Family" value="family" />
            <Picker.Item label="Labor" value="labor" />
          </Picker>
        </View>
        {errors.caseNature && <Text style={styles.errorText}>{errors.caseNature}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Court Division <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={[styles.input, errors.courtDivision && styles.inputError]}
          placeholder="e.g., Branch 10"
          value={formData.courtDivision}
          onChangeText={(text) => updateField('courtDivision', text)}
        />
        {errors.courtDivision && <Text style={styles.errorText}>{errors.courtDivision}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Court Address <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={[styles.input, styles.textArea, errors.courtAddress && styles.inputError]}
          placeholder="Full Court Address"
          value={formData.courtAddress}
          onChangeText={(text) => updateField('courtAddress', text)}
          multiline
          numberOfLines={3}
        />
        {errors.courtAddress && <Text style={styles.errorText}>{errors.courtAddress}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Presiding Officer <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={[styles.input, errors.presidingOfficer && styles.inputError]}
          placeholder="Judge or Officer Name"
          value={formData.presidingOfficer}
          onChangeText={(text) => updateField('presidingOfficer', text)}
        />
        {errors.presidingOfficer && <Text style={styles.errorText}>{errors.presidingOfficer}</Text>}
      </View>

      <View style={styles.divider} />
      <Text style={styles.sectionTitle}>Preferred Appointment Schedule</Text>

      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.label}>Preferred Date <Text style={styles.required}>*</Text></Text>
          <TouchableOpacity
            style={[styles.input, errors.preferredDate && styles.inputError]}
            onPress={openPreferredDatePicker}
          >
            <Text style={styles.inputText}>{formatPreferredDate(formData.preferredDate)}</Text>
            <Ionicons name="calendar-outline" size={20} color={MUTED_OLIVE} />
          </TouchableOpacity>
          {errors.preferredDate && <Text style={styles.errorText}>{errors.preferredDate}</Text>}
        </View>

        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.label}>Preferred Time <Text style={styles.required}>*</Text></Text>
          <TouchableOpacity
            style={[styles.input, errors.preferredTime && styles.inputError]}
            onPress={openPreferredTimePicker}
          >
            <Text style={styles.inputText}>{formatPreferredTime(formData.preferredTime)}</Text>
            <Ionicons name="time-outline" size={20} color={MUTED_OLIVE} />
          </TouchableOpacity>
          {errors.preferredTime && <Text style={styles.errorText}>{errors.preferredTime}</Text>}
        </View>
      </View>
    </View>
  );

  const renderReview = () => (
    <View style={styles.formSection}>
      <Text style={styles.sectionTitle}>Review Your Information</Text>
      
      <View style={styles.reviewSection}>
        <Text style={styles.reviewSectionTitle}>Personal Details</Text>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Name:</Text>
          <Text style={styles.reviewValue}>{formData.name}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Age:</Text>
          <Text style={styles.reviewValue}>{formData.age} years old</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Contact:</Text>
          <Text style={styles.reviewValue}>{formData.contactNumber}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Sex:</Text>
          <Text style={styles.reviewValue}>{formData.sex}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Civil Status:</Text>
          <Text style={styles.reviewValue}>{formData.civilStatus}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Present Address:</Text>
          <Text style={styles.reviewValue}>{formData.presentAddress}</Text>
        </View>
      </View>

      <View style={styles.reviewSection}>
        <Text style={styles.reviewSectionTitle}>Financial Details</Text>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Source of Income:</Text>
          <Text style={styles.reviewValue}>{formData.currentSourceOfIncome}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Monthly Income:</Text>
          <Text style={styles.reviewValue}>₱{formData.monthlyIncome}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Nature of Work:</Text>
          <Text style={styles.reviewValue}>{formData.natureOfWork}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Employer:</Text>
          <Text style={styles.reviewValue}>{formData.employerName}</Text>
        </View>
      </View>

      <View style={styles.reviewSection}>
        <Text style={styles.reviewSectionTitle}>Case Details</Text>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Party Represented:</Text>
          <Text style={styles.reviewValue}>{formData.partyRepresented}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Case Number:</Text>
          <Text style={styles.reviewValue}>{formData.caseNumber}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Case Nature:</Text>
          <Text style={styles.reviewValue}>{formData.caseNature}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Venue:</Text>
          <Text style={styles.reviewValue}>{formData.venue}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Presiding Officer:</Text>
          <Text style={styles.reviewValue}>{formData.presidingOfficer}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Preferred Date:</Text>
          <Text style={styles.reviewValue}>{formatPreferredDate(formData.preferredDate)}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Preferred Time:</Text>
          <Text style={styles.reviewValue}>{formatPreferredTime(formData.preferredTime)}</Text>
        </View>
      </View>

      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={20} color={PRIMARY_BROWN} />
        <Text style={styles.infoText}>
          Please review all information carefully before submitting. You'll receive a notification once your application is reviewed.
        </Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Schedule Appointment</Text>
        <TouchableOpacity onPress={clearDraft} style={styles.clearButton}>
          <Ionicons name="trash-outline" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Stepper */}
      <View style={styles.stepperContainer}>
        {steps.map((step, index) => (
          <View key={index} style={styles.stepItem}>
            <View
              style={[
                styles.stepCircle,
                index === currentStep && styles.stepCircleActive,
                index < currentStep && styles.stepCircleCompleted,
              ]}
            >
              {index < currentStep ? (
                <Ionicons name="checkmark" size={16} color="white" />
              ) : (
                <Ionicons
                  name={step.icon}
                  size={16}
                  color={index === currentStep ? 'white' : MUTED_OLIVE}
                />
              )}
            </View>
            {index < steps.length - 1 && (
              <View
                style={[
                  styles.stepLine,
                  index < currentStep && styles.stepLineCompleted,
                ]}
              />
            )}
          </View>
        ))}
      </View>

      <View style={styles.stepLabelsContainer}>
        {steps.map((step, index) => (
          <Text
            key={index}
            style={[
              styles.stepLabel,
              index === currentStep && styles.stepLabelActive,
            ]}
            numberOfLines={1}
          >
            {step.title}
          </Text>
        ))}
      </View>

      {/* Form Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {currentStep === 0 && renderPersonalDetails()}
        {currentStep === 1 && renderFinancialDetails()}
        {currentStep === 2 && renderCaseDetails()}
        {currentStep === 3 && renderReview()}
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.buttonContainer}>
        {currentStep > 0 && (
          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={handlePrevious}
          >
            <Ionicons name="chevron-back" size={20} color={PRIMARY_BROWN} />
            <Text style={styles.buttonSecondaryText}>Previous</Text>
          </TouchableOpacity>
        )}
        
        {currentStep < steps.length - 1 ? (
          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary, currentStep === 0 && { flex: 1 }]}
            onPress={handleNext}
          >
            <Text style={styles.buttonPrimaryText}>Next</Text>
            <Ionicons name="chevron-forward" size={20} color="white" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary]}
            onPress={handleSubmit}
          >
            <Ionicons name="checkmark-circle" size={20} color="white" />
            <Text style={styles.buttonPrimaryText}>Submit Application</Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
