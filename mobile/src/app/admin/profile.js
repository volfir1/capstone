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

const AdminProfile = () => {
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
    address: {
      street: '',
      barangay: '',
      city: '',
      province: '',
      region: '',
      zipCode: '',
    },
    adminRole: '',
    department: '',
  });

  const [editedData, setEditedData] = useState(userData);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/admin/profile');
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
      const response = await apiClient.put('/admin/profile', editedData);
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
      address: { ...prev.address, [field]: value }
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
        <Text style={styles.headerTitle}>My Profile</Text>
        {!isEditing ? (
          <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.editButton}>
            <Ionicons name="create-outline" size={24} color="white" />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {userData.firstName?.[0]}{userData.lastName?.[0]}
            </Text>
          </View>
          <Text style={styles.displayName}>
            {userData.firstName} {userData.middleName} {userData.lastName}
          </Text>
          <View style={styles.roleBadge}>
            <Ionicons name="shield-checkmark" size={16} color="white" />
            <Text style={styles.roleText}>{userData.adminRole || 'Administrator'}</Text>
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

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Department</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={displayData.department}
                onChangeText={(text) => handleInputChange('department', text)}
              />
            ) : (
              <Text style={styles.valueText}>{displayData.department || 'Not specified'}</Text>
            )}
          </View>
        </View>

        {/* Address Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Address Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Street</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={displayData.address?.street}
                onChangeText={(text) => handleAddressChange('street', text)}
              />
            ) : (
              <Text style={styles.valueText}>{displayData.address?.street || 'Not specified'}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Barangay</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={displayData.address?.barangay}
                onChangeText={(text) => handleAddressChange('barangay', text)}
              />
            ) : (
              <Text style={styles.valueText}>{displayData.address?.barangay || 'Not specified'}</Text>
            )}
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>City</Text>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={displayData.address?.city}
                  onChangeText={(text) => handleAddressChange('city', text)}
                />
              ) : (
                <Text style={styles.valueText}>{displayData.address?.city || 'N/A'}</Text>
              )}
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Zip Code</Text>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={displayData.address?.zipCode}
                  onChangeText={(text) => handleAddressChange('zipCode', text)}
                  keyboardType="numeric"
                />
              ) : (
                <Text style={styles.valueText}>{displayData.address?.zipCode || 'N/A'}</Text>
              )}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Province</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={displayData.address?.province}
                onChangeText={(text) => handleAddressChange('province', text)}
              />
            ) : (
              <Text style={styles.valueText}>{displayData.address?.province || 'Not specified'}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Region</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={displayData.address?.region}
                onChangeText={(text) => handleAddressChange('region', text)}
              />
            ) : (
              <Text style={styles.valueText}>{displayData.address?.region || 'Not specified'}</Text>
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
  contentContainer: {
    paddingBottom: 20,
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
    fontSize: 24,
    fontWeight: '700',
    color: CHARCOAL,
    marginBottom: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MUTED_OLIVE,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
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

export default AdminProfile;
