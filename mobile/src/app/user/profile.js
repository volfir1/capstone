import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  Image, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from 'context/authContext';
import { updateUserProfile, updateProfileImage } from '../../api/userApi';
import { PRIMARY_BROWN, PRIMARY_GOLD, CHARCOAL, MUTED_OLIVE } from 'utils/constants';

export default function UserProfile() {
  const router = useRouter();
  const { userData, currentUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', username: '',
  });

  useEffect(() => {
    if (userData) {
      setForm({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || currentUser?.email || '',
        username: userData.username || '',
      });
    }
  }, [userData]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateUserProfile({
        firstName: form.firstName,
        lastName: form.lastName,
        username: form.username,
      });
      Alert.alert('Success', 'Profile updated successfully');
      setEditing(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleImagePick = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Please allow access to your photos');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadImage = async (asset) => {
    try {
      setUploading(true);
      const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
      
      if (!cloudName || !uploadPreset) {
        Alert.alert('Error', 'Cloudinary settings not configured');
        return;
      }

      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        type: 'image/jpeg',
        name: 'profile.jpg',
      });
      formData.append('upload_preset', uploadPreset);
      formData.append('folder', 'profile_images');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: 'POST', body: formData }
      );
      const data = await response.json();
      
      if (data.secure_url) {
        await updateProfileImage(data.secure_url);
        Alert.alert('Success', 'Profile image updated');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  // Profile completeness
  const fields = [form.firstName, form.lastName, form.email, form.username, userData?.profileImage];
  const filled = fields.filter(f => f && f.trim?.()).length;
  const completeness = Math.round((filled / fields.length) * 100);

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={24} color={CHARCOAL} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Profile</Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={() => editing ? handleSave() : setEditing(true)} disabled={saving}>
          <Text style={s.editBtn}>{editing ? (saving ? 'Saving...' : 'Save') : 'Edit'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={s.avatarSection}>
          <TouchableOpacity onPress={handleImagePick} disabled={uploading}>
            {userData?.profileImage ? (
              <Image source={{ uri: userData.profileImage }} style={s.avatar} />
            ) : (
              <View style={s.avatarPlaceholder}>
                <Ionicons name="person" size={40} color="#fff" />
              </View>
            )}
            <View style={s.cameraIcon}>
              {uploading ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="camera" size={14} color="#fff" />}
            </View>
          </TouchableOpacity>
          <Text style={s.avatarName}>{form.firstName} {form.lastName}</Text>
          <Text style={s.avatarEmail}>{form.email}</Text>
        </View>

        {/* Completeness */}
        <View style={s.completeness}>
          <View style={s.completenessHeader}>
            <Text style={s.completenessLabel}>Profile Completeness</Text>
            <Text style={s.completenessValue}>{completeness}%</Text>
          </View>
          <View style={s.progressBar}>
            <View style={[s.progressFill, { width: `${completeness}%` }]} />
          </View>
        </View>

        {/* Form */}
        <View style={s.formSection}>
          <Text style={s.formLabel}>First Name</Text>
          <TextInput
            style={[s.input, !editing && s.inputDisabled]}
            value={form.firstName}
            onChangeText={v => setForm(p => ({ ...p, firstName: v }))}
            editable={editing}
          />

          <Text style={s.formLabel}>Last Name</Text>
          <TextInput
            style={[s.input, !editing && s.inputDisabled]}
            value={form.lastName}
            onChangeText={v => setForm(p => ({ ...p, lastName: v }))}
            editable={editing}
          />

          <Text style={s.formLabel}>Email</Text>
          <TextInput
            style={[s.input, s.inputDisabled]}
            value={form.email}
            editable={false}
          />

          <Text style={s.formLabel}>Username</Text>
          <TextInput
            style={[s.input, !editing && s.inputDisabled]}
            value={form.username}
            onChangeText={v => setForm(p => ({ ...p, username: v }))}
            editable={editing}
          />
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingBottom: 12, paddingHorizontal: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: CHARCOAL },
  editBtn: { fontSize: 15, color: PRIMARY_BROWN, fontWeight: '600' },
  avatarSection: { alignItems: 'center', paddingVertical: 24, backgroundColor: '#fff', marginBottom: 8 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: PRIMARY_BROWN },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: PRIMARY_BROWN, justifyContent: 'center', alignItems: 'center' },
  cameraIcon: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: CHARCOAL, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  avatarName: { fontSize: 20, fontWeight: '700', color: CHARCOAL, marginTop: 12 },
  avatarEmail: { fontSize: 13, color: MUTED_OLIVE, marginTop: 4 },
  completeness: { backgroundColor: '#fff', marginHorizontal: 12, padding: 16, borderRadius: 12, marginBottom: 8 },
  completenessHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  completenessLabel: { fontSize: 13, color: MUTED_OLIVE },
  completenessValue: { fontSize: 13, color: PRIMARY_BROWN, fontWeight: '600' },
  progressBar: { height: 6, backgroundColor: '#eee', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: PRIMARY_BROWN, borderRadius: 3 },
  formSection: { backgroundColor: '#fff', marginHorizontal: 12, padding: 16, borderRadius: 12 },
  formLabel: { fontSize: 12, color: MUTED_OLIVE, fontWeight: '600', marginBottom: 6, marginTop: 12, textTransform: 'uppercase' },
  input: { backgroundColor: '#f9f9f9', borderRadius: 10, padding: 12, fontSize: 14, color: CHARCOAL, borderWidth: 1, borderColor: '#eee' },
  inputDisabled: { backgroundColor: '#f0f0f0', color: '#999' },
});
