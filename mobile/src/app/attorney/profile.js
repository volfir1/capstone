import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from 'context/authContext';
import apiClient from '../../api/apiClient';

const PRIMARY_BROWN = '#7D5A3B';
const PRIMARY_GOLD = '#C4AB7D';
const MUTED_OLIVE = '#9BA17B';
const CHARCOAL = '#2C2C2C';
const THEMED_LIGHT_BG = '#FAF8F3';

const AttorneyProfile = () => {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [userData, setUserData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    officeAddress: {
      street: '',
      barangay: '',
      city: '',
      province: '',
      region: '',
      zipCode: '',
    },
    prcLicenseNumber: '',
    ibrNumber: '',
    barAdmissionDate: '',
    lawFirm: '',
    specializations: [],
    biography: '',
  });

  const [editedData, setEditedData] = useState(userData);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/attorney/profile');
      if (response.data.success) {
        const profileData = response.data.data;
        setUserData(profileData);
        setEditedData(profileData);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await apiClient.put('/attorney/profile', editedData);
      if (response.data.success) {
        setUserData(editedData);
        setIsEditing(false);
        Alert.alert('Success', 'Profile updated successfully');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedData(userData);
    setIsEditing(false);
  };

  const handleInputChange = (field, value) => {
    setEditedData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddressChange = (field, value) => {
    setEditedData(prev => ({
      ...prev,
      officeAddress: { ...prev.officeAddress, [field]: value }
    }));
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Profile</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_BROWN} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const displayData = isEditing ? editedData : userData;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        {!isEditing ? (
          <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.editButton}>
            <Ionicons name="create-outline" size={24} color="white" />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>

      <ScrollView style={styles.content}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {userData.firstName?.[0]}{userData.lastName?.[0]}
            </Text>
          </View>
          <Text style={styles.displayName}>
            Atty. {userData.firstName} {userData.middleName} {userData.lastName}
          </Text>
          <View style={styles.roleBadge}>
            <Ionicons name="briefcase" size={16} color="white" />
            <Text style={styles.roleText}>Attorney</Text>
          </View>
          {userData.lawFirm && (
            <Text style={styles.lawFirm}>{userData.lawFirm}</Text>
          )}
        </View>

        {/* Professional Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Professional Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>PRC License Number</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={displayData.prcLicenseNumber}
                onChangeText={(text) => handleInputChange('prcLicenseNumber', text)}
              />
            ) : (
              <Text style={styles.valueText}>{displayData.prcLicenseNumber || 'Not specified'}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>IBR Number</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={displayData.ibrNumber}
                onChangeText={(text) => handleInputChange('ibrNumber', text)}
              />
            ) : (
              <Text style={styles.valueText}>{displayData.ibrNumber || 'Not specified'}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bar Admission Date</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={displayData.barAdmissionDate}
                onChangeText={(text) => handleInputChange('barAdmissionDate', text)}
                placeholder="MM/DD/YYYY"
              />
            ) : (
              <Text style={styles.valueText}>{displayData.barAdmissionDate || 'Not specified'}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Law Firm</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={displayData.lawFirm}
                onChangeText={(text) => handleInputChange('lawFirm', text)}
              />
            ) : (
              <Text style={styles.valueText}>{displayData.lawFirm || 'Not specified'}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Specializations</Text>
            {displayData.specializations && displayData.specializations.length > 0 ? (
              <View style={styles.tagsContainer}>
                {displayData.specializations.map((spec, idx) => (
                  <View key={idx} style={styles.tag}>
                    <Text style={styles.tagText}>{spec}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.valueText}>Not specified</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Biography</Text>
            {isEditing ? (
              <TextInput
                style={[styles.input, styles.textArea]}
                value={displayData.biography}
                onChangeText={(text) => handleInputChange('biography', text)}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            ) : (
              <Text style={styles.valueText}>{displayData.biography || 'Not specified'}</Text>
            )}
          </View>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>First Name</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={displayData.firstName}
                onChangeText={(text) => handleInputChange('firstName', text)}
              />
            ) : (
              <Text style={styles.valueText}>{displayData.firstName}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Middle Name</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={displayData.middleName}
                onChangeText={(text) => handleInputChange('middleName', text)}
              />
            ) : (
              <Text style={styles.valueText}>{displayData.middleName || 'Not specified'}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Last Name</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={displayData.lastName}
                onChangeText={(text) => handleInputChange('lastName', text)}
              />
            ) : (
              <Text style={styles.valueText}>{displayData.lastName}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.emailContainer}>
              <Text style={styles.valueText}>{displayData.email}</Text>
              {userData.verified && (
                <Ionicons name="checkmark-circle" size={18} color={MUTED_OLIVE} />
              )}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={displayData.phoneNumber}
                onChangeText={(text) => handleInputChange('phoneNumber', text)}
                keyboardType="phone-pad"
              />
            ) : (
              <Text style={styles.valueText}>{displayData.phoneNumber || 'Not specified'}</Text>
            )}
          </View>
        </View>

        {/* Office Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Office Address</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Street</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={displayData.officeAddress?.street}
                onChangeText={(text) => handleAddressChange('street', text)}
              />
            ) : (
              <Text style={styles.valueText}>{displayData.officeAddress?.street || 'Not specified'}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Barangay</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={displayData.officeAddress?.barangay}
                onChangeText={(text) => handleAddressChange('barangay', text)}
              />
            ) : (
              <Text style={styles.valueText}>{displayData.officeAddress?.barangay || 'Not specified'}</Text>
            )}
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>City</Text>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={displayData.officeAddress?.city}
                  onChangeText={(text) => handleAddressChange('city', text)}
                />
              ) : (
                <Text style={styles.valueText}>{displayData.officeAddress?.city || 'N/A'}</Text>
              )}
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Zip Code</Text>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={displayData.officeAddress?.zipCode}
                  onChangeText={(text) => handleAddressChange('zipCode', text)}
                  keyboardType="numeric"
                />
              ) : (
                <Text style={styles.valueText}>{displayData.officeAddress?.zipCode || 'N/A'}</Text>
              )}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Province</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={displayData.officeAddress?.province}
                onChangeText={(text) => handleAddressChange('province', text)}
              />
            ) : (
              <Text style={styles.valueText}>{displayData.officeAddress?.province || 'Not specified'}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Region</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={displayData.officeAddress?.region}
                onChangeText={(text) => handleAddressChange('region', text)}
              />
            ) : (
              <Text style={styles.valueText}>{displayData.officeAddress?.region || 'Not specified'}</Text>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        {isEditing && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
              disabled={saving}
            >
              <Ionicons name="close" size={20} color={CHARCOAL} />
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color="white" />
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEMED_LIGHT_BG,
  },
  header: {
    backgroundColor: PRIMARY_BROWN,
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  editButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: MUTED_OLIVE,
  },
  content: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: 'white',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: PRIMARY_BROWN,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '600',
    color: 'white',
  },
  displayName: {
    fontSize: 22,
    fontWeight: '700',
    color: CHARCOAL,
    marginBottom: 8,
    textAlign: 'center',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MUTED_OLIVE,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    marginBottom: 8,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  lawFirm: {
    fontSize: 14,
    color: MUTED_OLIVE,
    fontStyle: 'italic',
  },
  section: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: PRIMARY_BROWN,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: MUTED_OLIVE,
    marginBottom: 8,
  },
  input: {
    backgroundColor: THEMED_LIGHT_BG,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: CHARCOAL,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  valueText: {
    fontSize: 16,
    color: CHARCOAL,
    paddingVertical: 8,
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  tag: {
    backgroundColor: `${PRIMARY_GOLD}20`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: PRIMARY_BROWN,
  },
  row: {
    flexDirection: 'row',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: CHARCOAL,
  },
  saveButton: {
    backgroundColor: PRIMARY_BROWN,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default AttorneyProfile;
