import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, TextInput, KeyboardAvoidingView, Platform, Switch, Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { fetchClientInfoById, updateClientInfo } from '../../api/adminApi';
import { useAuth } from '../../context/authContext';

const PRIMARY_BROWN = '#8B4513';
const PRIMARY_GOLD = '#C4AB7D';
const CHARCOAL = '#2C2C2C';
const MUTED_OLIVE = '#6B6B5A';
const BG = '#F7F8FA';
const ACCENT_TAN = '#B8956A';

const STEPS = ['Personal', 'Financial', 'Case', 'Review'];

const GENDER_OPTIONS = ['Male', 'Female'];
const CIVIL_STATUS_OPTIONS = ['Single', 'Married', 'Widowed', 'Separated', 'Annulled', 'Divorced'];

const TIME_OPTIONS = [
  { value: '09:00', label: '9:00 AM' },
  { value: '09:30', label: '9:30 AM' },
  { value: '10:00', label: '10:00 AM' },
  { value: '10:30', label: '10:30 AM' },
  { value: '11:00', label: '11:00 AM' },
  { value: '11:30', label: '11:30 AM' },
  { value: '13:00', label: '1:00 PM' },
  { value: '13:30', label: '1:30 PM' },
  { value: '14:00', label: '2:00 PM' },
  { value: '14:30', label: '2:30 PM' },
  { value: '15:00', label: '3:00 PM' },
  { value: '15:30', label: '3:30 PM' },
  { value: '16:00', label: '4:00 PM' },
  { value: '16:30', label: '4:30 PM' },
  { value: '17:00', label: '5:00 PM' },
];

// ─── Phone / Telephone formatters (matching website exactly) ───
const formatPhoneNumber = (value) => {
  if (!value) return '';
  const cleaned = value.replace(/\D/g, '');
  const number = cleaned.startsWith('63') ? cleaned.substring(2) : cleaned;
  const limited = number.substring(0, 10);
  if (limited.length <= 3) return `+63 ${limited}`;
  if (limited.length <= 6) return `+63 ${limited.slice(0, 3)} ${limited.slice(3)}`;
  return `+63 ${limited.slice(0, 3)} ${limited.slice(3, 6)} ${limited.slice(6)}`;
};

const formatTelephoneNumber = (value) => {
  if (!value) return '';
  const digitsOnly = value.replace(/\D/g, '');
  const withLeadingZero = digitsOnly.startsWith('0') ? digitsOnly : `0${digitsOnly}`;
  const limited = withLeadingZero.slice(0, 10);
  if (limited.length <= 2) return `(${limited}`;
  if (limited.length <= 4) return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
  if (limited.length <= 8) return `(${limited.slice(0, 2)}) ${limited.slice(2, 6)}-${limited.slice(6)}`;
  return `(${limited.slice(0, 2)}) ${limited.slice(2, 6)}-${limited.slice(6, 10)}`;
};

// Capitalize each word
const capitalizeWords = (str) => {
  if (!str) return '';
  return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
};

// Calculate age from birthday
const calculateAge = (birthday) => {
  if (!birthday) return '';
  const today = new Date();
  const birthDate = new Date(birthday);
  if (isNaN(birthDate.getTime())) return '';
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
  return age >= 0 ? String(age) : '';
};

// ─── Extracted components (defined outside to prevent remount on parent re-render) ───

const InfoRowComponent = React.memo(({ label, value, fieldValue, field, keyboardType, multiline, editable = true, formatter, isEditing, onChangeField }) => (
  <View style={s.infoRow}>
    <Text style={s.infoLabel}>{label}</Text>
    {isEditing && field && editable ? (
      <TextInput
        style={[s.editInput, multiline && { minHeight: 60, textAlignVertical: 'top' }]}
        value={String(fieldValue || '')}
        onChangeText={v => {
          const formatted = formatter ? formatter(v) : v;
          onChangeField(field, formatted);
        }}
        placeholder={`Enter ${label.toLowerCase()}`}
        placeholderTextColor="#999"
        keyboardType={keyboardType || 'default'}
        multiline={multiline}
      />
    ) : (
      <Text style={s.infoValue}>{value || 'N/A'}</Text>
    )}
  </View>
));

const SelectRowComponent = React.memo(({ label, value, fieldValue, field, options, showPicker, setShowPicker, isEditing, onChangeField }) => (
  <View style={s.infoRow}>
    <Text style={s.infoLabel}>{label}</Text>
    {isEditing && field ? (
      <View>
        <TouchableOpacity style={s.selectBtn} onPress={() => setShowPicker(!showPicker)}>
          <Text style={[s.selectBtnText, !fieldValue && { color: '#999' }]}>
            {typeof options[0] === 'object'
              ? (options.find(o => o.value === fieldValue)?.label || fieldValue || `Select ${label.toLowerCase()}`)
              : (fieldValue || `Select ${label.toLowerCase()}`)}
          </Text>
          <Ionicons name="chevron-down" size={16} color={MUTED_OLIVE} />
        </TouchableOpacity>
        {showPicker && (
          <View style={s.pickerDropdown}>
            {options.map(opt => {
              const optValue = typeof opt === 'string' ? opt : opt.value;
              const optLabel = typeof opt === 'string' ? opt : opt.label;
              return (
                <TouchableOpacity
                  key={optValue}
                  style={[s.pickerOption, fieldValue === optValue && s.pickerOptionActive]}
                  onPress={() => { onChangeField(field, optValue); setShowPicker(false); }}
                >
                  <Text style={[s.pickerOptionText, fieldValue === optValue && s.pickerOptionTextActive]}>
                    {optLabel}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    ) : (
      <Text style={s.infoValue}>
        {typeof options[0] === 'object'
          ? (options.find(o => o.value === value)?.label || value || 'N/A')
          : (value || 'N/A')}
      </Text>
    )}
  </View>
));

const ReviewFieldComponent = React.memo(({ label, value }) => (
  <View style={s.reviewField}>
    <Text style={s.reviewLabel}>{label}</Text>
    <Text style={s.reviewValue}>{value || 'N/A'}</Text>
  </View>
));

// ─── Civil Status with free-text input ───
const CivilStatusRow = React.memo(({ fieldValue, isEditing, onChangeField, showPicker, setShowPicker }) => (
  <View style={s.infoRow}>
    <Text style={s.infoLabel}>CIVIL STATUS</Text>
    {isEditing ? (
      <View>
        <TouchableOpacity style={s.selectBtn} onPress={() => setShowPicker(!showPicker)}>
          <Text style={[s.selectBtnText, !fieldValue && { color: '#999' }]}>
            {fieldValue || 'Select or type civil status'}
          </Text>
          <Ionicons name="chevron-down" size={16} color={MUTED_OLIVE} />
        </TouchableOpacity>
        {showPicker && (
          <View style={s.pickerDropdown}>
            {CIVIL_STATUS_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt}
                style={[s.pickerOption, fieldValue === opt && s.pickerOptionActive]}
                onPress={() => { onChangeField('civilStatus', opt); setShowPicker(false); }}
              >
                <Text style={[s.pickerOptionText, fieldValue === opt && s.pickerOptionTextActive]}>
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        <TextInput
          style={[s.editInput, { marginTop: 8 }]}
          value={CIVIL_STATUS_OPTIONS.includes(fieldValue) ? '' : String(fieldValue || '')}
          onChangeText={v => onChangeField('civilStatus', v)}
          placeholder="Or type a custom status..."
          placeholderTextColor="#999"
        />
      </View>
    ) : (
      <Text style={s.infoValue}>{fieldValue || 'N/A'}</Text>
    )}
  </View>
));

// ─── Birthday with DateTimePicker ───
const BirthdayRow = React.memo(({ fieldValue, isEditing, onChangeField, showPicker, setShowPicker }) => {
  const dateValue = fieldValue ? new Date(fieldValue) : new Date();
  const displayStr = fieldValue
    ? new Date(fieldValue).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  return (
    <View style={s.infoRow}>
      <Text style={s.infoLabel}>BIRTHDAY</Text>
      {isEditing ? (
        <View>
          <TouchableOpacity style={s.selectBtn} onPress={() => setShowPicker(true)}>
            <Text style={[s.selectBtnText, !fieldValue && { color: '#999' }]}>
              {displayStr || 'Select birthday'}
            </Text>
            <Ionicons name="calendar-outline" size={16} color={MUTED_OLIVE} />
          </TouchableOpacity>
          {showPicker && (
            Platform.OS === 'ios' ? (
              <Modal transparent animationType="slide">
                <View style={s.dateModalOverlay}>
                  <View style={s.dateModalContent}>
                    <View style={s.dateModalHeader}>
                      <Text style={s.dateModalTitle}>Select Birthday</Text>
                      <TouchableOpacity onPress={() => setShowPicker(false)}>
                        <Text style={s.dateModalDone}>Done</Text>
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      value={isNaN(dateValue.getTime()) ? new Date() : dateValue}
                      mode="date"
                      display="spinner"
                      maximumDate={new Date()}
                      onChange={(event, selectedDate) => {
                        if (selectedDate) {
                          onChangeField('birthday', selectedDate.toISOString().split('T')[0]);
                        }
                      }}
                    />
                  </View>
                </View>
              </Modal>
            ) : (
              <DateTimePicker
                value={isNaN(dateValue.getTime()) ? new Date() : dateValue}
                mode="date"
                display="default"
                maximumDate={new Date()}
                onChange={(event, selectedDate) => {
                  setShowPicker(false);
                  if (event.type === 'set' && selectedDate) {
                    onChangeField('birthday', selectedDate.toISOString().split('T')[0]);
                  }
                }}
              />
            )
          )}
        </View>
      ) : (
        <Text style={s.infoValue}>{displayStr || 'N/A'}</Text>
      )}
    </View>
  );
});

export default function ClientInfoView() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { userData } = useAuth();
  const [clientInfo, setClientInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [sameAsPresent, setSameAsPresent] = useState(false);

  // Dropdown state
  const [showSexPicker, setShowSexPicker] = useState(false);
  const [showCivilStatusPicker, setShowCivilStatusPicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showBirthdayPicker, setShowBirthdayPicker] = useState(false);

  useEffect(() => {
    if (id) loadClientInfo();
  }, [id]);

  const loadClientInfo = async () => {
    try {
      setLoading(true);
      const response = await fetchClientInfoById(id);
      const data = response.data || response;

      // Map data to form fields (matching website's ClientInfoView.jsx exactly)
      const hasRelator = data?.relatorName || data?.relationshipToClient;
      const mapped = {
        name: data?.fullName || data?.name || '',
        age: data?.age !== undefined && data?.age !== null ? String(data.age) : '',
        birthday: data?.birthday || '',
        sex: data?.sex || '',
        civilStatus: data?.civilStatus || '',
        citizenship: data?.citizenship || 'Filipino',
        spouse: data?.spouseName || data?.spouse || '',
        contactNumber: data?.contactNumber || '',
        cellphoneNumber: data?.cellphoneNumber || '',
        presentAddress: data?.presentAddress || '',
        presentAddressTelephone: data?.presentAddressTelephone || '',
        permanentAddress: data?.permanentAddress || '',
        permanentAddressTelephone: data?.permanentAddressTelephone || '',
        throughRelator: data?.throughRelator || (hasRelator ? 'yes' : 'no'),
        relatorName: data?.relatorName || '',
        relationshipToClient: data?.relationshipToClient || '',
        // Financial
        currentSourceOfIncome: data?.currentSourceOfIncome || '',
        monthlyIncome: data?.monthlyIncome !== undefined && data?.monthlyIncome !== null ? String(data.monthlyIncome) : '',
        natureOfWork: data?.natureOfWork || '',
        employerName: data?.employerName || '',
        employerAddress: data?.employerAddress || '',
        employerTelephone: data?.employerTelephone || '',
        spouseSourceOfIncome: data?.spouseSourceOfIncome || '',
        spouseMonthlyIncome: data?.spouseMonthlyIncome !== undefined && data?.spouseMonthlyIncome !== null ? String(data.spouseMonthlyIncome) : '',
        spouseEmployerAddress: data?.spouseEmployerAddress || '',
        totalCombinedIncome: data?.totalCombinedIncome !== undefined && data?.totalCombinedIncome !== null ? String(data.totalCombinedIncome) : '',
        // Case
        partyRepresented: data?.partyRepresented || '',
        caseNumber: data?.caseNumber || '',
        venue: data?.venue || '',
        presentStage: data?.presentStage || '',
        caseNature: data?.caseNature || data?.natureOfCase || '',
        courtDivision: data?.courtDivision || '',
        presidingOfficer: data?.presidingOfficer || '',
        courtAddress: data?.courtAddress || '',
        courtPhoneNumber: data?.courtPhoneNumber || '',
        adverseParty: data?.adverseParty || '',
        adversePartyAddress: data?.adversePartyAddress || '',
        adversePartyCounsel: data?.adversePartyCounsel || '',
        adversePartyCounselAddress: data?.adversePartyCounselAddress || '',
        adversePartyCounselPhone: data?.adversePartyCounselPhone || '',
        // Review / Appointment
        appointedDate: data?.appointedDate || '',
        appointmentTime: data?.appointmentTime || '',
      };

      setClientInfo(data);
      setEditData(mapped);
    } catch (error) {
      console.error('Failed to load client info:', error);
      Alert.alert('Error', 'Failed to load client information.');
    } finally {
      setLoading(false);
    }
  };

  const buildPayload = (values) => ({
    fullName: values.name || undefined,
    name: values.name || undefined,
    age: values.age ? Number(values.age) : undefined,
    birthday: values.birthday || undefined,
    sex: values.sex || undefined,
    civilStatus: values.civilStatus || undefined,
    citizenship: values.citizenship || undefined,
    contactNumber: values.contactNumber || undefined,
    cellphoneNumber: values.cellphoneNumber || undefined,
    presentAddressTelephone: values.presentAddressTelephone || undefined,
    permanentAddressTelephone: values.permanentAddressTelephone || undefined,
    presentAddress: values.presentAddress || undefined,
    permanentAddress: values.permanentAddress || undefined,
    spouseName: values.spouse || undefined,
    throughRelator: values.throughRelator || undefined,
    relatorName: values.relatorName || undefined,
    relationshipToClient: values.relationshipToClient || undefined,
    currentSourceOfIncome: values.currentSourceOfIncome || undefined,
    monthlyIncome: values.monthlyIncome || undefined,
    natureOfWork: values.natureOfWork || undefined,
    employerName: values.employerName || undefined,
    employerAddress: values.employerAddress || undefined,
    employerTelephone: values.employerTelephone || undefined,
    spouseSourceOfIncome: values.spouseSourceOfIncome || undefined,
    spouseMonthlyIncome: values.spouseMonthlyIncome || undefined,
    spouseEmployerAddress: values.spouseEmployerAddress || undefined,
    totalCombinedIncome: values.totalCombinedIncome || undefined,
    partyRepresented: values.partyRepresented || undefined,
    venue: values.venue || undefined,
    caseNumber: values.caseNumber || undefined,
    presentStage: values.presentStage || undefined,
    caseNature: values.caseNature || undefined,
    courtDivision: values.courtDivision || undefined,
    courtAddress: values.courtAddress || undefined,
    courtPhoneNumber: values.courtPhoneNumber || undefined,
    presidingOfficer: values.presidingOfficer || undefined,
    adverseParty: values.adverseParty || undefined,
    adversePartyAddress: values.adversePartyAddress || undefined,
    adversePartyCounsel: values.adversePartyCounsel || undefined,
    adversePartyCounselAddress: values.adversePartyCounselAddress || undefined,
    adversePartyCounselPhone: values.adversePartyCounselPhone || undefined,
    appointedDate: values.appointedDate || undefined,
    appointmentTime: values.appointmentTime || undefined,
  });

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateClientInfo(id, buildPayload(editData));
      Alert.alert('Success', 'Client information updated successfully.');
      setIsEditing(false);
      await loadClientInfo();
    } catch (error) {
      console.error('Failed to save:', error);
      Alert.alert('Error', 'Failed to update client information.');
    } finally {
      setSaving(false);
    }
  };

  const handleInterview = async () => {
    try {
      setSaving(true);
      await updateClientInfo(id, buildPayload(editData));
      Alert.alert('Saved', 'Client information saved. Proceeding to interview...');
      router.push({ pathname: '/admin/recommendation', params: { id, showClientInfo: 'true' } });
    } catch (error) {
      console.error('Error saving before interview:', error);
      Alert.alert('Error', 'Failed to save client information.');
    } finally {
      setSaving(false);
    }
  };

  const updateField = useCallback((key, value) => {
    setEditData(prev => {
      const next = { ...prev, [key]: value };
      // Auto-calculate total combined income
      if (key === 'monthlyIncome' || key === 'spouseMonthlyIncome') {
        const mi = parseFloat((key === 'monthlyIncome' ? value : prev.monthlyIncome || '').toString().replace(/,/g, '')) || 0;
        const si = parseFloat((key === 'spouseMonthlyIncome' ? value : prev.spouseMonthlyIncome || '').toString().replace(/,/g, '')) || 0;
        next.totalCombinedIncome = (mi + si) ? String(mi + si) : '';
      }
      // Auto-calculate age from birthday
      if (key === 'birthday') {
        next.age = calculateAge(value);
      }
      return next;
    });
  }, []);

  // Wrapper that also handles sameAsPresent
  const updateFieldWithAddress = useCallback((key, value) => {
    updateField(key, value);
    if (key === 'presentAddress' && sameAsPresent) {
      updateField('permanentAddress', value);
    }
  }, [sameAsPresent, updateField]);

  // Shorthand components using the extracted ones
  const InfoRow = useCallback(({ label, value, field, keyboardType, multiline, editable = true, formatter }) => (
    <InfoRowComponent
      label={label}
      value={value}
      fieldValue={editData[field]}
      field={field}
      keyboardType={keyboardType}
      multiline={multiline}
      editable={editable}
      formatter={formatter}
      isEditing={isEditing}
      onChangeField={field === 'presentAddress' ? updateFieldWithAddress : updateField}
    />
  ), [editData, isEditing, updateField, updateFieldWithAddress]);

  const SelectRow = useCallback(({ label, value, field, options, showPicker, setShowPicker }) => (
    <SelectRowComponent
      label={label}
      value={value}
      fieldValue={editData[field]}
      field={field}
      options={options}
      showPicker={showPicker}
      setShowPicker={setShowPicker}
      isEditing={isEditing}
      onChangeField={updateField}
    />
  ), [editData, isEditing, updateField]);

  const ReviewField = useCallback(({ label, value }) => (
    <ReviewFieldComponent label={label} value={value} />
  ), []);

  // ═══════════════════════════════════════
  // STEP 1: PERSONAL DETAILS
  // ═══════════════════════════════════════
  const renderPersonalInfo = () => (
    <View style={s.stepContent}>
      {/* BASIC INFORMATION */}
      <View style={s.sectionCard}>
        <View style={s.sectionHeader}>
          <View style={[s.sectionIcon, { backgroundColor: PRIMARY_BROWN }]}>
            <Ionicons name="person" size={14} color="#fff" />
          </View>
          <Text style={s.sectionTitle}>BASIC INFORMATION</Text>
        </View>

        <InfoRow label="Name" value={editData.name} field="name"
          formatter={capitalizeWords} />
        <BirthdayRow
          fieldValue={editData.birthday}
          isEditing={isEditing}
          onChangeField={updateField}
          showPicker={showBirthdayPicker}
          setShowPicker={setShowBirthdayPicker}
        />
        <InfoRow label="Age" value={editData.age || calculateAge(editData.birthday)} editable={false} />
        <SelectRow label="Sex" value={editData.sex} field="sex"
          options={GENDER_OPTIONS} showPicker={showSexPicker} setShowPicker={setShowSexPicker} />
        <CivilStatusRow
          fieldValue={editData.civilStatus}
          isEditing={isEditing}
          onChangeField={updateField}
          showPicker={showCivilStatusPicker}
          setShowPicker={setShowCivilStatusPicker}
        />
        <InfoRow label="Citizenship" value={editData.citizenship} field="citizenship" />
        <InfoRow label="Spouse Name" value={editData.spouse} field="spouse" />
      </View>

      {/* CONTACT INFORMATION */}
      <View style={s.sectionCard}>
        <View style={s.sectionHeader}>
          <View style={[s.sectionIcon, { backgroundColor: '#4DABF7' }]}>
            <Ionicons name="call" size={14} color="#fff" />
          </View>
          <Text style={s.sectionTitle}>CONTACT INFORMATION</Text>
        </View>

        <InfoRow label="Contact Number" value={editData.contactNumber} field="contactNumber"
          keyboardType="phone-pad" formatter={formatPhoneNumber} />
        <View style={s.fieldHint}>
          <Text style={s.hintText}>Philippine mobile (10 digits)</Text>
        </View>
        <InfoRow label="Cellphone Number" value={editData.cellphoneNumber} field="cellphoneNumber"
          keyboardType="phone-pad" formatter={formatPhoneNumber} />
        <View style={s.fieldHint}>
          <Text style={s.hintText}>Optional alternate number</Text>
        </View>
      </View>

      {/* ADDRESS */}
      <View style={s.sectionCard}>
        <View style={s.sectionHeader}>
          <View style={[s.sectionIcon, { backgroundColor: '#40C057' }]}>
            <Ionicons name="home" size={14} color="#fff" />
          </View>
          <Text style={s.sectionTitle}>ADDRESS</Text>
        </View>

        <InfoRow label="Present Address" value={editData.presentAddress} field="presentAddress" />
        <InfoRow label="Present Address Telephone Number" value={editData.presentAddressTelephone} field="presentAddressTelephone"
          keyboardType="phone-pad" formatter={formatTelephoneNumber} />

        {isEditing && (
          <View style={s.checkboxRow}>
            <Switch
              value={sameAsPresent}
              onValueChange={(val) => {
                setSameAsPresent(val);
                if (val) {
                  updateField('permanentAddress', editData.presentAddress);
                }
              }}
              trackColor={{ false: '#ddd', true: PRIMARY_GOLD }}
              thumbColor={sameAsPresent ? PRIMARY_BROWN : '#f4f3f4'}
            />
            <Text style={s.checkboxLabel}>Permanent address is same as present</Text>
          </View>
        )}

        <InfoRow label="Permanent Address" value={editData.permanentAddress} field="permanentAddress"
          editable={!sameAsPresent} />
        <InfoRow label="Permanent Address Telephone Number" value={editData.permanentAddressTelephone} field="permanentAddressTelephone"
          keyboardType="phone-pad" formatter={formatTelephoneNumber} />
      </View>

      {/* RELATOR / REPRESENTATIVE */}
      <View style={s.sectionCard}>
        <View style={s.sectionHeader}>
          <View style={[s.sectionIcon, { backgroundColor: '#7950F2' }]}>
            <Ionicons name="people" size={14} color="#fff" />
          </View>
          <Text style={s.sectionTitle}>RELATOR / REPRESENTATIVE</Text>
        </View>

        {isEditing ? (
          <View>
            <Text style={[s.infoLabel, { marginBottom: 8, marginLeft: 2 }]}>Is this through a Relator / Representative?</Text>
            <View style={s.radioGroup}>
              <TouchableOpacity style={[s.radioBtn, editData.throughRelator === 'yes' && s.radioBtnActive]}
                onPress={() => updateField('throughRelator', 'yes')}>
                <View style={[s.radioCircle, editData.throughRelator === 'yes' && s.radioCircleActive]} />
                <Text style={s.radioLabel}>Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.radioBtn, editData.throughRelator === 'no' && s.radioBtnActive]}
                onPress={() => {
                  updateField('throughRelator', 'no');
                  updateField('relatorName', '');
                  updateField('relationshipToClient', '');
                }}>
                <View style={[s.radioCircle, editData.throughRelator === 'no' && s.radioCircleActive]} />
                <Text style={s.radioLabel}>No</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <InfoRow label="Through Relator / Representative" value={editData.throughRelator === 'yes' ? 'Yes' : 'No'} />
        )}

        <InfoRow label="Relator Name" value={editData.relatorName} field="relatorName"
          editable={editData.throughRelator === 'yes'} />
        <InfoRow label="Relationship to Client" value={editData.relationshipToClient} field="relationshipToClient"
          editable={editData.throughRelator === 'yes'} />
      </View>
    </View>
  );

  // ═══════════════════════════════════════
  // STEP 2: FINANCIAL DETAILS
  // ═══════════════════════════════════════
  const renderFinancialInfo = () => (
    <View style={s.stepContent}>
      {/* EMPLOYMENT & INCOME */}
      <View style={s.sectionCard}>
        <View style={s.sectionHeader}>
          <View style={[s.sectionIcon, { backgroundColor: '#40C057' }]}>
            <Ionicons name="cash" size={14} color="#fff" />
          </View>
          <Text style={s.sectionTitle}>EMPLOYMENT & INCOME</Text>
        </View>

        <InfoRow label="Source of Income" value={editData.currentSourceOfIncome} field="currentSourceOfIncome" />
        <InfoRow label="Income / Month (₱)" value={editData.monthlyIncome} field="monthlyIncome" keyboardType="numeric" />
        <InfoRow label="Nature of Work / Business" value={editData.natureOfWork} field="natureOfWork" />
        <InfoRow label="Employer Name" value={editData.employerName} field="employerName" />
        <InfoRow label="Employer / Business Address" value={editData.employerAddress} field="employerAddress" />
        <InfoRow label="Telephone" value={editData.employerTelephone} field="employerTelephone"
          keyboardType="phone-pad" formatter={formatTelephoneNumber} />
      </View>

      {/* SPOUSE'S INFORMATION */}
      <View style={s.sectionCard}>
        <View style={s.sectionHeader}>
          <View style={[s.sectionIcon, { backgroundColor: '#7950F2' }]}>
            <Ionicons name="people" size={14} color="#fff" />
          </View>
          <Text style={s.sectionTitle}>SPOUSE'S INFORMATION</Text>
          <Text style={s.sectionSubtitle}>(if applicable)</Text>
        </View>

        <InfoRow label="Spouse's Source of Income" value={editData.spouseSourceOfIncome} field="spouseSourceOfIncome" />
        <InfoRow label="Spouse's Income / Month (₱)" value={editData.spouseMonthlyIncome} field="spouseMonthlyIncome" keyboardType="numeric" />
        <InfoRow label="Spouse's Employer / Business Address" value={editData.spouseEmployerAddress} field="spouseEmployerAddress" />
      </View>

      {/* TOTAL INCOME */}
      <View style={s.sectionCard}>
        <View style={s.sectionHeader}>
          <View style={[s.sectionIcon, { backgroundColor: '#F59F00' }]}>
            <Ionicons name="wallet" size={14} color="#fff" />
          </View>
          <Text style={s.sectionTitle}>TOTAL INCOME</Text>
        </View>

        <InfoRow label="Total Combined Monthly Income (₱)" value={editData.totalCombinedIncome} editable={false} />
        <View style={s.fieldHint}>
          <Text style={s.hintText}>Automatically calculated from your income and spouse's income</Text>
        </View>
      </View>
    </View>
  );

  // ═══════════════════════════════════════
  // STEP 3: CASE DETAILS
  // ═══════════════════════════════════════
  const renderCaseInfo = () => (
    <View style={s.stepContent}>
      {/* CASE INFORMATION */}
      <View style={s.sectionCard}>
        <View style={s.sectionHeader}>
          <View style={[s.sectionIcon, { backgroundColor: PRIMARY_BROWN }]}>
            <Ionicons name="briefcase" size={14} color="#fff" />
          </View>
          <Text style={s.sectionTitle}>CASE INFORMATION</Text>
        </View>

        <InfoRow label="Party Represented" value={editData.partyRepresented} field="partyRepresented" />
        <InfoRow label="Case / Docket Number" value={editData.caseNumber} field="caseNumber" />
        <InfoRow label="Venue / City" value={editData.venue} field="venue" />
        <InfoRow label="Present Stage" value={editData.presentStage} field="presentStage" />
        <InfoRow label="Nature of Case" value={editData.caseNature} field="caseNature" multiline />
        <View style={s.fieldHint}>
          <Text style={s.hintText}>Provide a brief description of the legal matter</Text>
        </View>
      </View>

      {/* COURT / TRIBUNAL */}
      <View style={s.sectionCard}>
        <View style={s.sectionHeader}>
          <View style={[s.sectionIcon, { backgroundColor: '#4DABF7' }]}>
            <Ionicons name="hammer" size={14} color="#fff" />
          </View>
          <Text style={s.sectionTitle}>COURT / TRIBUNAL</Text>
        </View>

        <InfoRow label="Division" value={editData.courtDivision} field="courtDivision" />
        <InfoRow label="Presiding Officer" value={editData.presidingOfficer} field="presidingOfficer" />
        <InfoRow label="Court Address" value={editData.courtAddress} field="courtAddress" />
        <InfoRow label="Phone Number" value={editData.courtPhoneNumber} field="courtPhoneNumber"
          keyboardType="phone-pad" formatter={formatPhoneNumber} />
      </View>

      {/* ADVERSE PARTY */}
      <View style={s.sectionCard}>
        <View style={s.sectionHeader}>
          <View style={[s.sectionIcon, { backgroundColor: '#FA5252' }]}>
            <Ionicons name="scale" size={14} color="#fff" />
          </View>
          <Text style={s.sectionTitle}>ADVERSE PARTY</Text>
        </View>

        <InfoRow label="Adverse Party(ies)" value={editData.adverseParty} field="adverseParty" />
        <InfoRow label="Address" value={editData.adversePartyAddress} field="adversePartyAddress" />
        <InfoRow label="Counsel" value={editData.adversePartyCounsel} field="adversePartyCounsel" />
        <InfoRow label="Counsel Address" value={editData.adversePartyCounselAddress} field="adversePartyCounselAddress" />
        <InfoRow label="Counsel Phone" value={editData.adversePartyCounselPhone} field="adversePartyCounselPhone"
          keyboardType="phone-pad" formatter={formatPhoneNumber} />
      </View>
    </View>
  );

  // ═══════════════════════════════════════
  // STEP 4: REVIEW
  // ═══════════════════════════════════════
  const renderReview = () => {
    const d = editData;
    const timeLabel = TIME_OPTIONS.find(t => t.value === d.appointmentTime)?.label || d.appointmentTime;
    const appointmentDateStr = d.appointedDate ? new Date(d.appointedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '';

    return (
      <View style={s.stepContent}>
        {/* PERSONAL DETAILS SUMMARY */}
        <View style={s.sectionCard}>
          <View style={s.sectionHeader}>
            <View style={[s.sectionIcon, { backgroundColor: PRIMARY_BROWN }]}>
              <Ionicons name="person" size={14} color="#fff" />
            </View>
            <Text style={s.sectionTitle}>PERSONAL DETAILS</Text>
          </View>
          <ReviewField label="NAME" value={d.name} />
          <ReviewField label="AGE" value={d.age || calculateAge(d.birthday)} />
          <ReviewField label="BIRTHDAY" value={d.birthday ? new Date(d.birthday).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''} />
          <ReviewField label="SEX" value={d.sex} />
          <ReviewField label="CIVIL STATUS" value={d.civilStatus} />
          <ReviewField label="CONTACT NUMBER" value={d.contactNumber} />
          <ReviewField label="PRESENT ADDRESS" value={d.presentAddress} />
          <ReviewField label="PRESENT ADDRESS TELEPHONE" value={d.presentAddressTelephone} />
          <ReviewField label="PERMANENT ADDRESS" value={d.permanentAddress} />
          <ReviewField label="PERMANENT ADDRESS TELEPHONE" value={d.permanentAddressTelephone} />
        </View>

        {/* FINANCIAL DETAILS SUMMARY */}
        <View style={s.sectionCard}>
          <View style={s.sectionHeader}>
            <View style={[s.sectionIcon, { backgroundColor: '#40C057' }]}>
              <Ionicons name="cash" size={14} color="#fff" />
            </View>
            <Text style={s.sectionTitle}>FINANCIAL DETAILS</Text>
          </View>
          <ReviewField label="INCOME SOURCE" value={d.currentSourceOfIncome} />
          <ReviewField label="MONTHLY INCOME" value={d.monthlyIncome ? `₱${Number(d.monthlyIncome).toLocaleString()}` : ''} />
          <ReviewField label="NATURE OF WORK" value={d.natureOfWork} />
          <ReviewField label="EMPLOYER" value={d.employerName} />
          <ReviewField label="EMPLOYER ADDRESS" value={d.employerAddress} />
        </View>

        {/* CASE DETAILS SUMMARY */}
        <View style={s.sectionCard}>
          <View style={s.sectionHeader}>
            <View style={[s.sectionIcon, { backgroundColor: '#4DABF7' }]}>
              <Ionicons name="briefcase" size={14} color="#fff" />
            </View>
            <Text style={s.sectionTitle}>CASE DETAILS</Text>
          </View>
          <ReviewField label="PARTY REPRESENTED" value={d.partyRepresented} />
          <ReviewField label="CASE NUMBER" value={d.caseNumber} />
          <ReviewField label="VENUE" value={d.venue} />
          <ReviewField label="PRESENT STAGE" value={d.presentStage} />
          <ReviewField label="NATURE OF CASE" value={d.caseNature} />
          <ReviewField label="COURT DIVISION" value={d.courtDivision} />
          <ReviewField label="PRESIDING OFFICER" value={d.presidingOfficer} />
          <ReviewField label="COURT ADDRESS" value={d.courtAddress} />
        </View>

        {/* PREFERRED APPOINTMENT */}
        <View style={s.sectionCard}>
          <View style={s.sectionHeader}>
            <View style={[s.sectionIcon, { backgroundColor: '#F59F00' }]}>
              <Ionicons name="calendar" size={14} color="#fff" />
            </View>
            <Text style={s.sectionTitle}>PREFERRED APPOINTMENT</Text>
          </View>
          <Text style={s.appointmentHint}>Select your preferred date and time. The office will confirm availability and contact you.</Text>

          <InfoRow label="Date" value={appointmentDateStr} field="appointedDate" />
          <SelectRow label="Time" value={d.appointmentTime} field="appointmentTime"
            options={TIME_OPTIONS} showPicker={showTimePicker} setShowPicker={setShowTimePicker} />

          {appointmentDateStr && timeLabel ? (
            <View style={s.appointmentConfirm}>
              <Ionicons name="checkmark-circle" size={16} color={ACCENT_TAN} />
              <Text style={s.appointmentConfirmText}>{appointmentDateStr} at {timeLabel}</Text>
            </View>
          ) : null}
        </View>

        {/* DATA PRIVACY NOTICE */}
        <View style={s.privacyNotice}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <Ionicons name="information-circle" size={16} color={ACCENT_TAN} />
            <Text style={s.privacyTitle}>Data Privacy Notice</Text>
          </View>
          <Text style={s.privacyText}>
            Sebastinian Office of Legal Aid (SOLA), College of Law is committed to upholding the Philippine Data Privacy Act which implements the Constitutional right to informational privacy of data subjects. Your personal information is collected and processed in order for us to verify your identity, assess your application, and contact you about your case.
          </Text>
        </View>

        {/* Interview button — matching website logic: show on review step for non-director/non-supervising_lawyer */}
        {!['director', 'supervising_lawyer'].includes(userData?.role) && (
          <TouchableOpacity style={s.interviewBtn} onPress={handleInterview} disabled={saving}>
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={s.interviewBtnText}>Interview</Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const stepRenderers = [renderPersonalInfo, renderFinancialInfo, renderCaseInfo, renderReview];

  if (loading) {
    return (
      <View style={[s.container, s.centerContainer]}>
        <ActivityIndicator size="large" color={PRIMARY_BROWN} />
        <Text style={s.loadingText}>Loading client information...</Text>
      </View>
    );
  }

  if (!clientInfo) {
    return (
      <View style={[s.container, s.centerContainer]}>
        <Ionicons name="alert-circle-outline" size={48} color="#ccc" />
        <Text style={s.emptyTitle}>Client Not Found</Text>
        <TouchableOpacity style={s.backBtnLarge} onPress={() => router.back()}>
          <Text style={s.backBtnLargeText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={CHARCOAL} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={s.headerTitle}>Client's Information Sheet</Text>
          <Text style={s.headerSubtitle} numberOfLines={1}>
            {editData.name || 'Client Details'}
          </Text>
        </View>
        {!isEditing ? (
          <TouchableOpacity style={s.editHeaderBtn} onPress={() => setIsEditing(true)}>
            <Ionicons name="create-outline" size={16} color={PRIMARY_BROWN} />
            <Text style={s.editBtnText}>Edit</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity onPress={() => { setIsEditing(false); loadClientInfo(); }}>
              <Text style={[s.editBtnText, { color: MUTED_OLIVE }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color={PRIMARY_BROWN} />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="save-outline" size={16} color={PRIMARY_BROWN} />
                  <Text style={s.editBtnText}>Save</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Stepper */}
      <View style={s.stepperContainer}>
        {STEPS.map((step, index) => (
          <TouchableOpacity
            key={index}
            style={[s.stepItem, activeStep === index && s.stepItemActive]}
            onPress={() => setActiveStep(index)}
          >
            <View style={[s.stepCircle, activeStep === index && s.stepCircleActive, index < activeStep && s.stepCircleCompleted]}>
              {index < activeStep ? (
                <Ionicons name="checkmark" size={14} color="#fff" />
              ) : (
                <Text style={[s.stepCircleText, activeStep === index && s.stepCircleTextActive]}>
                  {index + 1}
                </Text>
              )}
            </View>
            <Text style={[s.stepLabel, activeStep === index && s.stepLabelActive]}>
              {step}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={s.scrollContent} showsVerticalScrollIndicator={false}>
        {stepRenderers[activeStep]()}

        {/* Navigation buttons */}
        <View style={s.navRow}>
          {activeStep > 0 ? (
            <TouchableOpacity style={s.prevBtn} onPress={() => setActiveStep(activeStep - 1)}>
              <Ionicons name="chevron-back" size={18} color={MUTED_OLIVE} />
              <Text style={s.prevBtnText}>Previous</Text>
            </TouchableOpacity>
          ) : <View />}

          {activeStep < STEPS.length - 1 ? (
            <TouchableOpacity style={s.nextBtn} onPress={() => setActiveStep(activeStep + 1)}>
              <Text style={s.nextBtnText}>Next Step</Text>
              <Ionicons name="chevron-forward" size={18} color="#fff" />
            </TouchableOpacity>
          ) : <View />}
        </View>

        {isEditing && (
          <View style={s.editActions}>
            <TouchableOpacity style={s.cancelBtn} onPress={() => { setIsEditing(false); loadClientInfo(); }}>
              <Text style={s.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveBtnText}>Save Changes</Text>}
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  backBtn: { width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: CHARCOAL },
  headerSubtitle: { fontSize: 12, color: MUTED_OLIVE, marginTop: 1 },
  editHeaderBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: `${PRIMARY_BROWN}10` },
  editBtnText: { fontSize: 14, fontWeight: '600', color: PRIMARY_BROWN },

  // Stepper
  stepperContainer: { flexDirection: 'row', paddingHorizontal: 8, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  stepItem: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  stepItemActive: {},
  stepCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', marginBottom: 4, borderWidth: 2, borderColor: 'transparent' },
  stepCircleActive: { backgroundColor: PRIMARY_BROWN, borderColor: PRIMARY_BROWN },
  stepCircleCompleted: { backgroundColor: PRIMARY_BROWN },
  stepCircleText: { fontSize: 12, fontWeight: '600', color: MUTED_OLIVE },
  stepCircleTextActive: { color: '#fff' },
  stepLabel: { fontSize: 11, color: MUTED_OLIVE },
  stepLabelActive: { color: PRIMARY_BROWN, fontWeight: '600' },

  scrollContent: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  stepContent: {},

  // Section cards (matching website's Paper sections)
  sectionCard: { backgroundColor: '#FAFAFA', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#F0F0F0' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  sectionIcon: { width: 28, height: 28, borderRadius: 7, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 12, fontWeight: '600', color: CHARCOAL, letterSpacing: 0.5 },
  sectionSubtitle: { fontSize: 11, color: MUTED_OLIVE },

  // Info rows
  infoRow: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#f0f0f0' },
  infoLabel: { fontSize: 11, fontWeight: '600', color: MUTED_OLIVE, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  infoValue: { fontSize: 14, color: CHARCOAL },
  editInput: { fontSize: 14, color: CHARCOAL, borderBottomWidth: 1, borderBottomColor: PRIMARY_GOLD, paddingVertical: 4 },

  // Field hints
  fieldHint: { marginTop: -4, marginBottom: 8, marginLeft: 4 },
  hintText: { fontSize: 11, color: MUTED_OLIVE },

  // Select / Picker
  selectBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: PRIMARY_GOLD, paddingVertical: 6 },
  selectBtnText: { fontSize: 14, color: CHARCOAL },
  pickerDropdown: { backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#e0e0e0', marginTop: 4, overflow: 'hidden' },
  pickerOption: { paddingVertical: 10, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  pickerOptionActive: { backgroundColor: `${PRIMARY_BROWN}15` },
  pickerOptionText: { fontSize: 14, color: CHARCOAL },
  pickerOptionTextActive: { fontWeight: '600', color: PRIMARY_BROWN },

  // Checkbox / Switch
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 8, paddingHorizontal: 4 },
  checkboxLabel: { fontSize: 13, fontWeight: '500', color: CHARCOAL, flex: 1 },

  // Radio
  radioGroup: { flexDirection: 'row', gap: 20, marginBottom: 12, paddingHorizontal: 4 },
  radioBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  radioBtnActive: {},
  radioCircle: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#ccc' },
  radioCircleActive: { borderColor: PRIMARY_BROWN, backgroundColor: PRIMARY_BROWN },
  radioLabel: { fontSize: 14, color: CHARCOAL },

  // Review fields
  reviewField: { paddingVertical: 6, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  reviewLabel: { fontSize: 10, fontWeight: '600', color: MUTED_OLIVE, letterSpacing: 0.3, marginBottom: 2 },
  reviewValue: { fontSize: 14, color: CHARCOAL, fontWeight: '500' },

  // Appointment section
  appointmentHint: { fontSize: 12, color: MUTED_OLIVE, marginBottom: 12 },
  appointmentConfirm: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: `${PRIMARY_GOLD}15`, borderWidth: 1, borderColor: `${PRIMARY_GOLD}40`, borderRadius: 8, padding: 10, marginTop: 8 },
  appointmentConfirmText: { fontSize: 13, color: CHARCOAL, fontWeight: '500', flex: 1 },

  // Privacy notice
  privacyNotice: { backgroundColor: `${PRIMARY_GOLD}08`, borderWidth: 1, borderColor: `${PRIMARY_GOLD}30`, borderRadius: 12, padding: 14, marginBottom: 12 },
  privacyTitle: { fontSize: 13, fontWeight: '600', color: CHARCOAL },
  privacyText: { fontSize: 11, color: MUTED_OLIVE, lineHeight: 17 },

  // Interview button
  interviewBtn: { backgroundColor: PRIMARY_BROWN, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginBottom: 12 },
  interviewBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },

  // Nav buttons
  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 8 },
  prevBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: '#E0E0E0', backgroundColor: '#fff' },
  prevBtnText: { fontSize: 14, color: MUTED_OLIVE },
  nextBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10, backgroundColor: PRIMARY_BROWN },
  nextBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },

  // Edit actions
  editActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center', backgroundColor: '#f5f5f5' },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: MUTED_OLIVE },
  saveBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center', backgroundColor: PRIMARY_BROWN },
  saveBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },

  // Misc
  centerContainer: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 14, color: MUTED_OLIVE, marginTop: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: CHARCOAL, marginTop: 12 },
  backBtnLarge: { backgroundColor: PRIMARY_BROWN, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12, marginTop: 16 },
  backBtnLargeText: { fontSize: 14, fontWeight: '600', color: '#fff' },

  // Date picker modal (iOS)
  dateModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  dateModalContent: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: 30 },
  dateModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#eee' },
  dateModalTitle: { fontSize: 16, fontWeight: '600', color: CHARCOAL },
  dateModalDone: { fontSize: 16, fontWeight: '600', color: PRIMARY_BROWN },
});
