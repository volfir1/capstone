import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Container,
  Paper,
  Text,
  Box,
  Group,
  Stack,
  Button,
  ActionIcon,
  TextInput,
  Avatar,
  Divider,
  Grid,
  Badge,
  Progress,
  Loader,
  Center,
  FileButton,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconUser,
  IconMail,
  IconEdit,
  IconCheck,
  IconX,
  IconShieldCheck,
  IconCamera,
  IconRefresh,
} from '@tabler/icons-react';
import { PRIMARY_GOLD, PRIMARY_BROWN, MUTED_OLIVE, BG, CHARCOAL, ACCENT_TAN } from '@utils/constants';
import apiClient from '@config/api/apiClient';
import { uploadToCloudinary } from '@utils/cloudinary';
import { useAuth } from '@context/authContext';
import ProfileSkeleton from '@/components/skeleton/ProfileSkeleton';
import Signature from '@/features/auth/signature/Signature';

export default function ClientProfile() {
  const { refreshUserData } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    role: '',
    verified: false,
    memberSince: '',
    profileImage: '',
  });

  const [editedData, setEditedData] = useState(userData);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/users/profile');
      if (response.data.success) {
        const d = response.data.data;
        const normalizedData = {
          firstName: d.firstName || '',
          lastName: d.lastName || '',
          email: d.email || '',
          username: d.username || '',
          role: d.role || 'user',
          verified: d.isVerified || false,
          memberSince: d.createdAt
            ? new Date(d.createdAt).getFullYear().toString()
            : '',
          profileImage: d.profileImage || '',
        };
        setUserData(normalizedData);
        setEditedData(normalizedData);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to load profile',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const completeness = useMemo(() => {
    const fields = [userData.firstName, userData.lastName, userData.email];
    const filled = fields.filter((f) => f && f.trim()).length;
    return Math.round((filled / fields.length) * 100);
  }, [userData]);

  const handleEdit = () => {
    setIsEditing(true);
    setEditedData(userData);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData(userData);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await apiClient.put('/user/profile', editedData);
      if (response.data.success) {
        setUserData(editedData);
        setIsEditing(false);
        notifications.show({
          title: 'Profile Updated',
          message: 'Your profile has been updated successfully',
          color: 'green',
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      notifications.show({
        title: 'Update Failed',
        message: error.response?.data?.message || 'Failed to update profile',
        color: 'red',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setEditedData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (file) => {
    if (!file) return;
    // Validate file type and size (max 5 MB)
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      return notifications.show({ title: 'Invalid File', message: 'Please upload a JPG, PNG, WebP, or GIF image.', color: 'red' });
    }
    if (file.size > 5 * 1024 * 1024) {
      return notifications.show({ title: 'File Too Large', message: 'Image must be under 5 MB.', color: 'red' });
    }

    try {
      setUploadingImage(true);
      const imageUrl = await uploadToCloudinary(file);
      // Save to backend
      await apiClient.put('/users/profile/image', { profileImage: imageUrl });
      setUserData((prev) => ({ ...prev, profileImage: imageUrl }));
      setEditedData((prev) => ({ ...prev, profileImage: imageUrl }));
      // Sync layout header/navbar avatar
      refreshUserData().catch(() => {});
      notifications.show({ title: 'Photo Updated', message: 'Profile photo uploaded successfully.', color: 'green' });
    } catch (error) {
      console.error('Image upload error:', error);
      notifications.show({ title: 'Upload Failed', message: error.message || 'Failed to upload image.', color: 'red' });
    } finally {
      setUploadingImage(false);
    }
  };

  if (loading) {
    return <ProfileSkeleton />;
  }

  const displayData = isEditing ? editedData : userData;

  const inputStyles = {
    input: { borderColor: '#E5E0D8', '&:focus': { borderColor: PRIMARY_GOLD } },
  };

  return (
    <Box bg={BG} mih="100vh" py="xl">
      <style>{`
        .avatar-upload-overlay { opacity: 0; transition: opacity 0.2s; }
        .avatar-upload-overlay:hover, 
        [style*="cursor: pointer"]:hover .avatar-upload-overlay { opacity: 1 !important; }
      `}</style>
      <Container size="lg">
        <Grid gutter="xl">
          {/* ── Sidebar ── */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Paper shadow="xs" p="xl" radius="lg" bg="white">
              <Stack align="center" gap="md">
                {/* Avatar */}
                <Box style={{ position: 'relative' }}>
                  <FileButton onChange={handleImageUpload} accept="image/png,image/jpeg,image/webp,image/gif">
                    {(props) => (
                      <Box
                        {...props}
                        style={{ position: 'relative', cursor: 'pointer' }}
                      >
                        <Avatar
                          size={140}
                          radius={70}
                          src={userData.profileImage || null}
                          style={{
                            background: PRIMARY_GOLD,
                            border: `4px solid ${PRIMARY_GOLD}`,
                          }}
                        >
                          <IconUser size={70} color="white" />
                        </Avatar>

                        {/* Camera overlay */}
                        <Box
                          style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: '40%',
                            borderBottomLeftRadius: 70,
                            borderBottomRightRadius: 70,
                            background: 'rgba(0,0,0,0.45)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: uploadingImage ? 1 : 0,
                            transition: 'opacity 0.2s',
                            '&:hover': { opacity: 1 },
                          }}
                          className="avatar-upload-overlay"
                        >
                          {uploadingImage ? (
                            <Loader size={20} color="white" />
                          ) : (
                            <IconCamera size={22} color="white" />
                          )}
                        </Box>
                      </Box>
                    )}
                  </FileButton>

                  {userData.verified && (
                    <Box
                      style={{
                        position: 'absolute',
                        bottom: 4,
                        right: 4,
                        width: 34,
                        height: 34,
                        borderRadius: '50%',
                        background: PRIMARY_GOLD,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '3px solid white',
                      }}
                    >
                      <IconShieldCheck size={18} color="white" />
                    </Box>
                  )}
                </Box>

                {/* Name */}
                <Box ta="center">
                  <Text size="xl" fw={700} c={CHARCOAL} mb={2}>
                    {userData.firstName} {userData.lastName}
                  </Text>
                  <Text size="sm" c={MUTED_OLIVE}>
                    @{userData.username}
                  </Text>
                </Box>

                {/* Badges */}
                <Group gap="xs" justify="center">
                  <Badge size="sm" variant="light" color="blue" radius="sm">
                    Client
                  </Badge>
                  {userData.memberSince && (
                    <Badge size="sm" variant="light" color="gray" radius="sm">
                      Since {userData.memberSince}
                    </Badge>
                  )}
                </Group>

                <Divider w="100%" color="#F0F0F0" />

                {/* Profile Completeness */}
                <Box w="100%">
                  <Group justify="space-between" mb={6}>
                    <Text size="xs" fw={500} c={MUTED_OLIVE}>
                      Profile Completeness
                    </Text>
                    <Text size="xs" fw={600} c={CHARCOAL}>
                      {completeness}%
                    </Text>
                  </Group>
                  <Progress
                    value={completeness}
                    size="sm"
                    radius="xl"
                    color={completeness === 100 ? 'green' : PRIMARY_GOLD}
                  />
                </Box>

                <Divider w="100%" color="#F0F0F0" />

                {/* Actions */}
                {!isEditing ? (
                  <Group style={{ width: '100%' }} spacing="xs">
                    <Button
                      variant="outline"
                      leftSection={<IconEdit size={16} />}
                      onClick={handleEdit}
                      style={{ flex: 1, borderColor: PRIMARY_BROWN, color: PRIMARY_BROWN }}
                    >
                      Edit Profile
                    </Button>
                    <ActionIcon variant="default" onClick={() => { fetchUserProfile(); refreshUserData().catch(() => {}); }}>
                      <IconRefresh size={18} />
                    </ActionIcon>
                  </Group>
                ) : (
                  <Stack w="100%" gap="xs">
                    <Button
                      fullWidth
                      leftSection={<IconCheck size={16} />}
                      onClick={handleSave}
                      loading={saving}
                      style={{ background: PRIMARY_BROWN }}
                    >
                      Save Changes
                    </Button>
                    <Button
                      fullWidth
                      variant="outline"
                      leftSection={<IconX size={16} />}
                      onClick={handleCancel}
                      disabled={saving}
                      style={{ borderColor: MUTED_OLIVE, color: MUTED_OLIVE }}
                    >
                      Cancel
                    </Button>
                  </Stack>
                )}
              </Stack>
            </Paper>
          </Grid.Col>

          {/* ── Main Content ── */}
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Stack gap="lg">
              {/* Personal Information */}
              <Paper shadow="xs" p="xl" radius="lg" bg="white">
                <Group mb="lg" gap={8}>
                  <IconUser size={18} color={ACCENT_TAN} stroke={2} />
                  <Text size="sm" fw={600} c={CHARCOAL} tt="uppercase">
                    Personal Information
                  </Text>
                </Group>

                <Grid gutter="lg">
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Text size="xs" c={MUTED_OLIVE} mb={4} fw={500}>
                      First Name
                    </Text>
                    {isEditing ? (
                      <TextInput
                        value={editedData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        styles={inputStyles}
                      />
                    ) : (
                      <Text fw={500} c={displayData.firstName ? CHARCOAL : '#bbb'}>
                        {displayData.firstName || 'Not set'}
                      </Text>
                    )}
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Text size="xs" c={MUTED_OLIVE} mb={4} fw={500}>
                      Last Name
                    </Text>
                    {isEditing ? (
                      <TextInput
                        value={editedData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        styles={inputStyles}
                      />
                    ) : (
                      <Text fw={500} c={displayData.lastName ? CHARCOAL : '#bbb'}>
                        {displayData.lastName || 'Not set'}
                      </Text>
                    )}
                  </Grid.Col>
                </Grid>
              </Paper>

              {/* Account Information */}
              <Paper shadow="xs" p="xl" radius="lg" bg="white">
                <Group mb="lg" gap={8}>
                  <IconMail size={18} color={ACCENT_TAN} stroke={2} />
                  <Text size="sm" fw={600} c={CHARCOAL} tt="uppercase">
                    Account Information
                  </Text>
                </Group>

                <Grid gutter="lg">
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Text size="xs" c={MUTED_OLIVE} mb={4} fw={500}>
                      Email Address
                    </Text>
                    <Text fw={500} c={displayData.email ? CHARCOAL : '#bbb'}>
                      {displayData.email || 'Not set'}
                    </Text>
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Text size="xs" c={MUTED_OLIVE} mb={4} fw={500}>
                      Username
                    </Text>
                    <Text fw={500} c={displayData.username ? CHARCOAL : '#bbb'}>
                      {displayData.username || 'Not set'}
                    </Text>
                  </Grid.Col>
                </Grid>
              </Paper>

              <Paper shadow="xs" p="xl" radius="lg" bg="white">
                <Group mb="md" gap={8}>
                  <IconEdit size={18} color={ACCENT_TAN} stroke={2} />
                  <Text size="sm" fw={600} c={CHARCOAL} tt="uppercase">Signature</Text>
                </Group>
                <Signature onSave={async (dataUrl) => {
                  const toFile = (dataUrl, filename = 'signature.png') => {
                    const arr = dataUrl.split(',');
                    const mime = arr[0].match(/:(.*?);/)[1];
                    const bstr = atob(arr[1]);
                    let n = bstr.length;
                    const u8arr = new Uint8Array(n);
                    while (n--) {
                      u8arr[n] = bstr.charCodeAt(n);
                    }
                    return new File([u8arr], filename, { type: mime });
                  };

                  try {
                    notifications.show({ id: 'signature-uploading', title: 'Uploading', message: 'Uploading signature...', autoClose: false });
                    const file = toFile(dataUrl, `signature-${Date.now()}.png`);
                    const url = await uploadToCloudinary(file, 'signatures');
                    await apiClient.put('/users/profile/signature', { signatureUrl: url });
                    notifications.update({ id: 'signature-uploading', title: 'Uploaded', message: 'Signature saved to your profile.', color: 'green', autoClose: 4000 });
                    refreshUserData().catch(() => {});
                  } catch (err) {
                    console.error('Signature upload failed', err);
                    notifications.update({ id: 'signature-uploading', title: 'Upload Failed', message: err.message || 'Failed to upload signature', color: 'red', autoClose: 4000 });
                  }
                }} />
              </Paper>
            </Stack>
          </Grid.Col>
        </Grid>
      </Container>
    </Box>
  );
}
