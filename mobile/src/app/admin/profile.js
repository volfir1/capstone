import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  TextInput, ActivityIndicator, Image, Modal, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from 'context/authContext';
import {
  updateAdminProfile,
  updateAttorneyProfile,
  uploadProfileImageFile,
  fetchUserProfile,
  uploadProfileSignature,
} from '../../api/userApi';
import getEnv from '../../api/environment';
import { PRIMARY_BROWN, PRIMARY_GOLD, CHARCOAL, MUTED_OLIVE, ACCENT_TAN } from 'utils/constants';
import ThemedToast, { useToast } from '../../components/ThemedToast';
import SignatureComposer from '../../components/signature/SignatureComposer';
import AdminSidebarToggle from '../../components/navigation/AdminSidebarToggle';

const { apiUrl } = getEnv();
const SERVER_BASE = apiUrl.replace(/\/api\/?$/, '');

const ATTORNEY_ROLES = ['attorney', 'pao_lawyer', 'legal_volunteer'];

const ROLE_LABELS = {
  secretary: 'Secretary', intern: 'Intern', director: 'Director',
  supervising_lawyer: 'Supervising Lawyer', attorney: 'Attorney',
  pao_lawyer: 'PAO Lawyer', legal_volunteer: 'Legal Volunteer',
};

const SPECIALIZATIONS = [
  'Criminal Law', 'Civil Law', 'Family Law', 'Labor Law', 'Commercial Law',
  'Tax Law', 'Immigration Law', 'Land and Property Law', 'Human Rights',
  'Environmental Law', 'Agrarian Law', 'Administrative Law',
  'Corporate Law', 'Intellectual Property', 'Other',
];

const LANGUAGES = [
  'English', 'Filipino/Tagalog', 'Cebuano', 'Ilocano', 'Hiligaynon',
  'Waray', 'Kapampangan', 'Bikol', 'Pangasinan', 'Other',
];

const CONSULTATION_MODES = ['In-person', 'Virtual', 'Phone'];

export default function AdminProfile() {
  const { userData: authUserData, loading: authLoading, refreshUserData } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [signatureModalVisible, setSignatureModalVisible] = useState(false);
  const [profileImage, setProfileImage] = useState('');
  const [signatureUrl, setSignatureUrl] = useState('');
  const [editedData, setEditedData] = useState({});
  const [multiSelectModal, setMultiSelectModal] = useState(null); // 'specializations' | 'languages' | 'consultationMode'
  const { toast, showToast, hideToast } = useToast();

  const isAttorney = ATTORNEY_ROLES.includes(authUserData?.role);
  const userRole = authUserData?.role || 'secretary';
  const roleLabel = ROLE_LABELS[userRole] || userRole;

  useEffect(() => {
    if (!authUserData) return;
    fetchUserProfile().then(data => {
      if (data?.profileImage) {
        const img = data.profileImage;
        setProfileImage(img.startsWith('/') ? `${SERVER_BASE}${img}` : img);
      }
    }).catch(() => {});

    const base = {
      firstName: authUserData.firstName || '',
      lastName: authUserData.lastName || '',
      email: authUserData.email || '',
      username: authUserData.username || '',
      signatureUrl: authUserData.signatureUrl || '',
      role: authUserData.role || '',
      verified: authUserData.isVerified || false,
      memberSince: authUserData.createdAt ? new Date(authUserData.createdAt).getFullYear().toString() : '',
    };

    setSignatureUrl(authUserData.signatureUrl || '');

    if (isAttorney) {
      setEditedData({
        ...base,
        middleName: authUserData.middleName || '',
        suffix: authUserData.suffix || '',
        prcLicenseNumber: authUserData.prcLicenseNumber || '',
        ibrNumber: authUserData.ibrNumber || '',
        barAdmissionDate: authUserData.barAdmissionDate
          ? new Date(authUserData.barAdmissionDate).toISOString().split('T')[0] : '',
        lawFirm: authUserData.lawFirm || '',
        isPAOLawyer: authUserData.isPAOLawyer || false,
        paoOffice: authUserData.paoOffice || '',
        specializations: authUserData.specializations || [],
        languages: authUserData.languages || [],
        consultationMode: authUserData.consultationMode || [],
        biography: authUserData.biography || '',
        isAvailable: authUserData.isAvailable ?? true,
      });
    } else {
      setEditedData(base);
    }
  }, [authUserData, isAttorney]);

  const completeness = useMemo(() => {
    if (isAttorney) {
      const fields = [
        editedData.firstName, editedData.lastName, editedData.email,
        editedData.prcLicenseNumber, editedData.ibrNumber,
        editedData.barAdmissionDate, editedData.lawFirm,
        editedData.specializations?.length > 0 ? 'filled' : '',
        editedData.languages?.length > 0 ? 'filled' : '',
        editedData.biography,
      ];
      const filled = fields.filter(f => f && (typeof f === 'string' ? f.trim() : true)).length;
      return Math.round((filled / fields.length) * 100);
    }
    const fields = [editedData.firstName, editedData.lastName, editedData.email];
    const filled = fields.filter(f => f && f.trim()).length;
    return Math.round((filled / fields.length) * 100);
  }, [editedData, isAttorney]);

  const handleSave = async () => {
    try {
      setSaving(true);
      if (isAttorney) {
        await updateAttorneyProfile(editedData);
      } else {
        await updateAdminProfile(editedData);
      }
      showToast('success', 'Success', 'Profile updated successfully');
      setIsEditing(false);
      refreshUserData?.();
    } catch (err) {
      showToast('error', 'Error', err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (result.canceled) return;
      setUploadingImage(true);
      const res = await uploadProfileImageFile(result.assets[0].uri);
      const img = res?.profileImage;
      if (!img) {
        throw new Error('Profile image URL not returned');
      }
      setProfileImage(img.startsWith('/') ? `${SERVER_BASE}${img}` : img);
      refreshUserData?.();
      showToast('success', 'Success', 'Profile photo updated');
    } catch (err) {
      showToast('error', 'Error', err.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSignatureSave = async (dataUrl) => {
    try {
      const result = await uploadProfileSignature(dataUrl);
      const nextSignatureUrl = result?.signatureUrl;

      if (!nextSignatureUrl) {
        throw new Error('Signature upload did not return a URL');
      }

      setSignatureUrl(nextSignatureUrl);
      setEditedData((prev) => ({ ...prev, signatureUrl: nextSignatureUrl }));
      await refreshUserData?.();
      showToast('success', 'Signature Saved', 'Your profile signature has been updated.');
      setSignatureModalVisible(false);
      return nextSignatureUrl;
    } catch (err) {
      showToast('error', 'Error', err.response?.data?.message || err.message || 'Failed to upload signature');
      throw err;
    }
  };

  const handleChange = (field, value) => {
    setEditedData(prev => ({ ...prev, [field]: value }));
  };

  const toggleMultiSelect = (field, value) => {
    setEditedData(prev => {
      const current = prev[field] || [];
      return {
        ...prev,
        [field]: current.includes(value) ? current.filter(v => v !== value) : [...current, value],
      };
    });
  };

  if (authLoading) return (
    <View style={s.loadingContainer}>
      <AdminSidebarToggle />
      <ActivityIndicator size="large" color={PRIMARY_BROWN} />
    </View>
  );

  const initials = `${(editedData.firstName || '?')[0]}${(editedData.lastName || '?')[0]}`.toUpperCase();

  return (
    <View style={s.container}>
      <AdminSidebarToggle />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={s.profileCard}>
          <TouchableOpacity style={s.avatarContainer} onPress={handleImageUpload} disabled={uploadingImage}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={s.avatar} />
            ) : (
              <View style={[s.avatar, s.avatarPlaceholder]}>
                <Ionicons name={isAttorney ? 'briefcase' : 'shield-checkmark'} size={40} color="#fff" />
              </View>
            )}
            <View style={s.cameraOverlay}>
              {uploadingImage ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="camera" size={16} color="#fff" />
              )}
            </View>
            {editedData.verified && (
              <View style={s.verifiedBadge}>
                <Ionicons name="shield-checkmark" size={14} color="#fff" />
              </View>
            )}
          </TouchableOpacity>

          <Text style={s.profileName}>
            {editedData.firstName} {isAttorney && editedData.middleName ? `${editedData.middleName} ` : ''}
            {editedData.lastName}{isAttorney && editedData.suffix ? ` ${editedData.suffix}` : ''}
          </Text>
          <Text style={s.profileUsername}>@{editedData.username}</Text>

          <View style={s.badgeRow}>
            <View style={[s.badge, { backgroundColor: `${PRIMARY_BROWN}20` }]}>
              <Text style={[s.badgeText, { color: PRIMARY_BROWN }]}>{roleLabel}</Text>
            </View>
            {isAttorney && editedData.isPAOLawyer && (
              <View style={[s.badge, { backgroundColor: '#00BCD420' }]}>
                <Text style={[s.badgeText, { color: '#00BCD4' }]}>PAO</Text>
              </View>
            )}
            {editedData.memberSince && (
              <View style={[s.badge, { backgroundColor: '#eee' }]}>
                <Text style={[s.badgeText, { color: '#666' }]}>Since {editedData.memberSince}</Text>
              </View>
            )}
          </View>

          {/* Completeness */}
          <View style={s.completenessContainer}>
            <View style={s.completenessHeader}>
              <Text style={s.completenessLabel}>Profile Completeness</Text>
              <Text style={s.completenessValue}>{completeness}%</Text>
            </View>
            <View style={s.progressBg}>
              <View style={[s.progressFill, { width: `${completeness}%`, backgroundColor: completeness === 100 ? '#22c55e' : PRIMARY_GOLD }]} />
            </View>
          </View>

          {!isEditing ? (
            <TouchableOpacity style={s.editBtn} onPress={() => setIsEditing(true)}>
              <Ionicons name="create-outline" size={18} color={PRIMARY_BROWN} />
              <Text style={s.editBtnText}>Edit Profile</Text>
            </TouchableOpacity>
          ) : (
            <View style={s.actionBtns}>
              <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator size="small" color="#fff" /> : (
                  <>
                    <Ionicons name="checkmark" size={18} color="#fff" />
                    <Text style={s.saveBtnText}>Save Changes</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setIsEditing(false)} disabled={saving}>
                <Text style={s.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Personal Information */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Ionicons name="person-outline" size={16} color={ACCENT_TAN} />
            <Text style={s.sectionTitle}>PERSONAL INFORMATION</Text>
          </View>
          <View style={s.fieldGrid}>
            {renderField('First Name', 'firstName')}
            {isAttorney && renderField('Middle Name', 'middleName')}
            {renderField('Last Name', 'lastName')}
            {isAttorney && renderField('Suffix', 'suffix', 'Jr., Sr., III, etc.')}
          </View>
        </View>

        {/* Account Information */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Ionicons name="mail-outline" size={16} color={ACCENT_TAN} />
            <Text style={s.sectionTitle}>ACCOUNT INFORMATION</Text>
          </View>
          <View style={s.fieldGrid}>
            <View style={s.fieldItem}>
              <Text style={s.fieldLabel}>Email Address</Text>
              <Text style={s.fieldValue}>{editedData.email || 'Not set'}</Text>
            </View>
            <View style={s.fieldItem}>
              <Text style={s.fieldLabel}>Username</Text>
              <Text style={s.fieldValue}>{editedData.username || 'Not set'}</Text>
            </View>
            <View style={s.fieldItem}>
              <Text style={s.fieldLabel}>Role</Text>
              <Text style={s.fieldValue}>{roleLabel}</Text>
            </View>
          </View>
        </View>

        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Ionicons name="create-outline" size={16} color={ACCENT_TAN} />
            <Text style={s.sectionTitle}>SIGNATURE</Text>
          </View>

          <View style={s.signaturePreviewBox}>
            {signatureUrl ? (
              <Image source={{ uri: signatureUrl }} style={s.signaturePreviewImage} resizeMode="contain" />
            ) : (
              <Text style={s.notSet}>No signature saved yet</Text>
            )}
          </View>

          <TouchableOpacity style={s.signatureBtn} onPress={() => setSignatureModalVisible(true)}>
            <Ionicons name={signatureUrl ? 'create-outline' : 'add-circle-outline'} size={18} color={PRIMARY_BROWN} />
            <Text style={s.signatureBtnText}>{signatureUrl ? 'Edit Signature' : 'Create Signature'}</Text>
          </TouchableOpacity>
        </View>

        {/* Attorney Professional Credentials */}
        {isAttorney && (
          <>
            <View style={s.section}>
              <View style={s.sectionHeader}>
                <Ionicons name="ribbon-outline" size={16} color={ACCENT_TAN} />
                <Text style={s.sectionTitle}>PROFESSIONAL CREDENTIALS</Text>
              </View>
              <View style={s.fieldGrid}>
                {renderField('PRC License Number', 'prcLicenseNumber')}
                {renderField('IBR Number', 'ibrNumber')}
                {renderField('Bar Admission Date', 'barAdmissionDate', 'YYYY-MM-DD')}
                {renderField('Law Firm / Office', 'lawFirm')}
                {isEditing && (
                  <TouchableOpacity
                    style={s.checkboxRow}
                    onPress={() => handleChange('isPAOLawyer', !editedData.isPAOLawyer)}
                  >
                    <Ionicons name={editedData.isPAOLawyer ? 'checkbox' : 'square-outline'} size={22} color={PRIMARY_BROWN} />
                    <Text style={s.checkboxLabel}>PAO Lawyer</Text>
                  </TouchableOpacity>
                )}
                {editedData.isPAOLawyer && renderField('PAO Office', 'paoOffice')}
              </View>
            </View>

            {/* Specializations & Languages */}
            <View style={s.section}>
              <View style={s.sectionHeader}>
                <Ionicons name="briefcase-outline" size={16} color={ACCENT_TAN} />
                <Text style={s.sectionTitle}>PRACTICE AREAS & LANGUAGES</Text>
              </View>

              <Text style={s.fieldLabel}>Specializations</Text>
              {isEditing ? (
                <TouchableOpacity style={s.multiSelectBtn} onPress={() => setMultiSelectModal('specializations')}>
                  <Text style={s.multiSelectBtnText}>
                    {editedData.specializations?.length > 0
                      ? `${editedData.specializations.length} selected`
                      : 'Select specializations'}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={MUTED_OLIVE} />
                </TouchableOpacity>
              ) : null}
              <View style={s.chipRow}>
                {(editedData.specializations || []).map(sp => (
                  <View key={sp} style={s.chip}>
                    <Text style={s.chipText}>{sp}</Text>
                  </View>
                ))}
                {editedData.specializations?.length === 0 && !isEditing && (
                  <Text style={s.notSet}>Not set</Text>
                )}
              </View>

              <Text style={[s.fieldLabel, { marginTop: 16 }]}>Languages</Text>
              {isEditing ? (
                <TouchableOpacity style={s.multiSelectBtn} onPress={() => setMultiSelectModal('languages')}>
                  <Text style={s.multiSelectBtnText}>
                    {editedData.languages?.length > 0
                      ? `${editedData.languages.length} selected`
                      : 'Select languages'}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={MUTED_OLIVE} />
                </TouchableOpacity>
              ) : null}
              <View style={s.chipRow}>
                {(editedData.languages || []).map(lang => (
                  <View key={lang} style={[s.chip, { backgroundColor: '#E8F5E920' }]}>
                    <Text style={[s.chipText, { color: '#2E7D32' }]}>{lang}</Text>
                  </View>
                ))}
                {editedData.languages?.length === 0 && !isEditing && (
                  <Text style={s.notSet}>Not set</Text>
                )}
              </View>

              <Text style={[s.fieldLabel, { marginTop: 16 }]}>Consultation Mode</Text>
              {isEditing ? (
                <TouchableOpacity style={s.multiSelectBtn} onPress={() => setMultiSelectModal('consultationMode')}>
                  <Text style={s.multiSelectBtnText}>
                    {editedData.consultationMode?.length > 0
                      ? editedData.consultationMode.join(', ')
                      : 'Select modes'}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={MUTED_OLIVE} />
                </TouchableOpacity>
              ) : null}
              <View style={s.chipRow}>
                {(editedData.consultationMode || []).map(mode => (
                  <View key={mode} style={[s.chip, { backgroundColor: '#E3F2FD20' }]}>
                    <Text style={[s.chipText, { color: '#1565C0' }]}>{mode}</Text>
                  </View>
                ))}
                {editedData.consultationMode?.length === 0 && !isEditing && (
                  <Text style={s.notSet}>Not set</Text>
                )}
              </View>
            </View>

            {/* Biography */}
            <View style={s.section}>
              <View style={s.sectionHeader}>
                <Ionicons name="document-text-outline" size={16} color={ACCENT_TAN} />
                <Text style={s.sectionTitle}>BIOGRAPHY</Text>
              </View>
              {isEditing ? (
                <TextInput
                  style={s.textArea}
                  value={editedData.biography || ''}
                  onChangeText={val => handleChange('biography', val)}
                  multiline
                  numberOfLines={4}
                  placeholder="Write a brief biography..."
                  placeholderTextColor="#bbb"
                />
              ) : (
                <Text style={editedData.biography ? s.bioText : s.notSet}>
                  {editedData.biography || 'Not set'}
                </Text>
              )}
            </View>

            {/* Availability */}
            {isEditing && (
              <View style={s.section}>
                <TouchableOpacity
                  style={s.checkboxRow}
                  onPress={() => handleChange('isAvailable', !editedData.isAvailable)}
                >
                  <Ionicons name={editedData.isAvailable ? 'checkbox' : 'square-outline'} size={22} color={editedData.isAvailable ? '#22c55e' : '#999'} />
                  <Text style={[s.checkboxLabel, { color: editedData.isAvailable ? '#22c55e' : '#999' }]}>
                    Available for Consultations
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Multi-Select Modal */}
      <Modal visible={!!multiSelectModal} animationType="slide" presentationStyle="pageSheet">
        <View style={s.modalContainer}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>
              {multiSelectModal === 'specializations' ? 'Specializations' :
               multiSelectModal === 'languages' ? 'Languages' : 'Consultation Mode'}
            </Text>
            <TouchableOpacity onPress={() => setMultiSelectModal(null)}>
              <Ionicons name="close" size={24} color={CHARCOAL} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={multiSelectModal === 'specializations' ? SPECIALIZATIONS :
                  multiSelectModal === 'languages' ? LANGUAGES : CONSULTATION_MODES}
            keyExtractor={item => item}
            renderItem={({ item }) => {
              const selected = (editedData[multiSelectModal] || []).includes(item);
              return (
                <TouchableOpacity
                  style={[s.selectItem, selected && s.selectItemActive]}
                  onPress={() => toggleMultiSelect(multiSelectModal, item)}
                >
                  <Ionicons name={selected ? 'checkbox' : 'square-outline'} size={22} color={selected ? PRIMARY_BROWN : '#ccc'} />
                  <Text style={[s.selectItemText, selected && { color: PRIMARY_BROWN, fontWeight: '600' }]}>{item}</Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>

      <Modal
        visible={signatureModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSignatureModalVisible(false)}
      >
        <View style={s.modalContainer}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Signature</Text>
            <TouchableOpacity onPress={() => setSignatureModalVisible(false)}>
              <Ionicons name="close" size={24} color={CHARCOAL} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={s.signatureModalContent}>
            <SignatureComposer
              initialUrl={signatureUrl || null}
              defaultTypedName={`${editedData.firstName || ''} ${editedData.lastName || ''}`.trim()}
              onSave={handleSignatureSave}
              onClose={() => setSignatureModalVisible(false)}
            />
          </ScrollView>
        </View>
      </Modal>
      <ThemedToast toast={toast} onHide={hideToast} />
    </View>
  );

  function renderField(label, field, placeholder) {
    return (
      <View style={s.fieldItem}>
        <Text style={s.fieldLabel}>{label}</Text>
        {isEditing ? (
          <TextInput
            style={s.input}
            value={editedData[field] || ''}
            onChangeText={val => handleChange(field, val)}
            placeholder={placeholder || label}
            placeholderTextColor="#ccc"
          />
        ) : (
          <Text style={editedData[field] ? s.fieldValue : s.notSet}>
            {editedData[field] || 'Not set'}
          </Text>
        )}
      </View>
    );
  }
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  profileCard: { backgroundColor: '#fff', marginHorizontal: 12, marginTop: 12, borderRadius: 16, padding: 24, alignItems: 'center' },
  avatarContainer: { position: 'relative', marginBottom: 12 },
  avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: PRIMARY_GOLD },
  avatarPlaceholder: { backgroundColor: ACCENT_TAN, justifyContent: 'center', alignItems: 'center' },
  cameraOverlay: { position: 'absolute', bottom: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  verifiedBadge: { position: 'absolute', bottom: 4, left: 4, backgroundColor: PRIMARY_GOLD, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  profileName: { fontSize: 20, fontWeight: '700', color: CHARCOAL, textAlign: 'center' },
  profileUsername: { fontSize: 13, color: MUTED_OLIVE, marginTop: 2 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10, justifyContent: 'center' },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  completenessContainer: { width: '100%', marginTop: 16 },
  completenessHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  completenessLabel: { fontSize: 11, color: MUTED_OLIVE, fontWeight: '500' },
  completenessValue: { fontSize: 11, fontWeight: '600', color: CHARCOAL },
  progressBg: { height: 6, backgroundColor: '#f0f0f0', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  editBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 16, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10, borderWidth: 1, borderColor: PRIMARY_BROWN, gap: 6 },
  editBtnText: { fontSize: 14, color: PRIMARY_BROWN, fontWeight: '600' },
  actionBtns: { width: '100%', marginTop: 16, gap: 8 },
  saveBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: PRIMARY_BROWN, paddingVertical: 12, borderRadius: 10, gap: 6 },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  cancelBtn: { alignItems: 'center', paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: MUTED_OLIVE },
  cancelBtnText: { color: MUTED_OLIVE, fontSize: 14, fontWeight: '600' },
  section: { backgroundColor: '#fff', marginHorizontal: 12, marginTop: 8, borderRadius: 12, padding: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: CHARCOAL, letterSpacing: 0.5 },
  fieldGrid: { gap: 14 },
  fieldItem: { },
  fieldLabel: { fontSize: 11, color: MUTED_OLIVE, fontWeight: '500', marginBottom: 4 },
  fieldValue: { fontSize: 15, fontWeight: '500', color: CHARCOAL },
  notSet: { fontSize: 14, color: '#bbb', fontStyle: 'italic' },
  input: { borderWidth: 1, borderColor: '#E5E0D8', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: CHARCOAL },
  textArea: { borderWidth: 1, borderColor: '#E5E0D8', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: CHARCOAL, minHeight: 100, textAlignVertical: 'top' },
  bioText: { fontSize: 14, color: CHARCOAL, lineHeight: 20 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  checkboxLabel: { fontSize: 14, color: CHARCOAL },
  multiSelectBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#E5E0D8', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8 },
  multiSelectBtnText: { fontSize: 14, color: MUTED_OLIVE },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  chip: { backgroundColor: `${PRIMARY_GOLD}15`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  chipText: { fontSize: 12, color: PRIMARY_BROWN, fontWeight: '500' },
  signaturePreviewBox: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#E5E0D8',
    borderRadius: 10,
    backgroundColor: '#FAFAF7',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: 10,
  },
  signaturePreviewImage: {
    width: '100%',
    height: 96,
  },
  signatureBtn: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: PRIMARY_BROWN,
    borderRadius: 10,
    paddingVertical: 10,
  },
  signatureBtnText: {
    fontSize: 14,
    color: PRIMARY_BROWN,
    fontWeight: '600',
  },
  modalContainer: { flex: 1, backgroundColor: '#F7F8FA' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 50, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalTitle: { fontSize: 18, fontWeight: '600', color: CHARCOAL },
  signatureModalContent: { padding: 16, paddingBottom: 32 },
  selectItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', backgroundColor: '#fff', gap: 12 },
  selectItemActive: { backgroundColor: `${PRIMARY_BROWN}08` },
  selectItemText: { fontSize: 15, color: CHARCOAL },
});
