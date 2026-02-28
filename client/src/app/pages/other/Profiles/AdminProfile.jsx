import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Container, Paper, Text, Box, Group, Stack,
  Button, TextInput, Avatar, Divider, Grid,
  Badge, Progress, FileButton, Loader, ActionIcon,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import ProfileSkeleton from '@/components/skeleton/ProfileSkeleton';
import {
  IconUser, IconMail, IconEdit, IconCheck,
  IconX, IconShieldCheck, IconUserShield, IconCamera, IconRefresh,
} from '@tabler/icons-react';
import { PRIMARY_GOLD, PRIMARY_BROWN, MUTED_OLIVE, BG, CHARCOAL, ACCENT_TAN, ROLE_COLORS, ROLE_LABELS } from '@utils/constants';
import apiClient from '@config/api/apiClient';
import { useAuth } from '@context/authContext';
import { uploadToCloudinary } from '@utils/cloudinary';
import Signature from '@/features/auth/signature/Signature';

// ── Constants ──

const INPUT_STYLES = {
  input: { borderColor: '#E5E0D8', '&:focus': { borderColor: PRIMARY_GOLD } },
};

const INITIAL_PROFILE = {
  firstName: '', lastName: '', email: '',
  username: '', role: '', verified: false,
  memberSince: '', signatureUrl: '',
};

// ── Sub-components ──

function SectionHeader({ icon: Icon, title }) {
  return (
    <Group mb="lg" gap={8}>
      <Icon size={18} color={ACCENT_TAN} stroke={2} />
      <Text size="sm" fw={600} c={CHARCOAL} tt="uppercase">{title}</Text>
    </Group>
  );
}

function ProfileField({ label, field, value, isEditing, editedValue, onChange }) {
  return (
    <Grid.Col span={{ base: 12, sm: 6 }}>
      <Text size="xs" c={MUTED_OLIVE} mb={4} fw={500}>{label}</Text>
      {isEditing && onChange ? (
        <TextInput
          value={editedValue ?? ''}
          onChange={(e) => onChange(field, e.target.value)}
          styles={INPUT_STYLES}
        />
      ) : (
        <Text fw={500} c={value ? CHARCOAL : '#bbb'}>{value || 'Not set'}</Text>
      )}
    </Grid.Col>
  );
}

// ── Main Component ──
export default function AdminProfile() {
  const { userData: authUserData, loading: authLoading, refreshUserData } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [profileImage, setProfileImage] = useState('');
  const [profile, setProfile] = useState(INITIAL_PROFILE);
  const [editedData, setEditedData] = useState(INITIAL_PROFILE);

  const displayData = isEditing ? editedData : profile;
  const userRole = authUserData?.role || 'secretary';
  const roleLabel = ROLE_LABELS[userRole] || userRole;
  const roleBadgeColor = ROLE_COLORS[userRole] || 'gray';

  useEffect(() => {
    if (!authUserData) return;

    apiClient.get('/users/profile')
      .then((res) => { if (res.data?.data?.profileImage) setProfileImage(res.data.data.profileImage); })
      .catch(() => { });

    const built = {
      firstName: authUserData.firstName || '',
      lastName: authUserData.lastName || '',
      email: authUserData.email || '',
      username: authUserData.username || '',
      role: authUserData.role || '',
      verified: authUserData.isVerified || false,
      memberSince: authUserData.createdAt ? new Date(authUserData.createdAt).getFullYear().toString() : '',
      signatureUrl: authUserData.signatureUrl || '',
    };
    setProfile(built);
    setEditedData(built);
  }, [authUserData]);

  const completeness = useMemo(() => {
    const fields = [profile.firstName, profile.lastName, profile.email];
    return Math.round((fields.filter((f) => f?.trim()).length / fields.length) * 100);
  }, [profile]);

  const handleInputChange = useCallback((field, value) => {
    setEditedData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleEdit = () => { setIsEditing(true); setEditedData(profile); };
  const handleCancel = () => { setIsEditing(false); setEditedData(profile); };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { data } = await apiClient.put('/admin/profile', editedData);
      if (data.success) {
        setProfile(editedData);
        setIsEditing(false);
        notifications.show({ title: 'Profile Updated', message: 'Your profile has been updated successfully.', color: 'green' });
      }
    } catch (err) {
      notifications.show({ title: 'Update Failed', message: err.response?.data?.message || 'Failed to update profile', color: 'red' });
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (file) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type))
      return notifications.show({ title: 'Invalid File', message: 'Please upload a JPG, PNG, WebP, or GIF.', color: 'red' });
    if (file.size > 5 * 1024 * 1024)
      return notifications.show({ title: 'File Too Large', message: 'Image must be under 5 MB.', color: 'red' });
    try {
      setUploadingImage(true);
      const imageUrl = await uploadToCloudinary(file);
      await apiClient.put('/users/profile/image', { profileImage: imageUrl });
      setProfileImage(imageUrl);
      refreshUserData().catch(() => { });
      notifications.show({ title: 'Photo Updated', message: 'Profile photo uploaded successfully.', color: 'green' });
    } catch (err) {
      notifications.show({ title: 'Upload Failed', message: err.message || 'Failed to upload image.', color: 'red' });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSignatureSave = async (dataUrl) => {
    try {
      notifications.show({ id: 'sig', title: 'Uploading', message: 'Uploading signature...', autoClose: false });
      const res = await apiClient.post('/users/profile/signature/upload', { dataUrl });
      notifications.update({ id: 'sig', title: 'Uploaded', message: 'Signature saved.', color: 'green', autoClose: 4000 });
      refreshUserData().catch(() => { });
      return res?.data?.data?.signatureUrl;
    } catch (err) {
      notifications.update({ id: 'sig', title: 'Upload Failed', message: err.message || 'Failed to upload signature', color: 'red', autoClose: 4000 });
    }
  };

  if (authLoading) return <ProfileSkeleton />;

  return (
    <Box bg={BG} mih="100vh" py="xl">
      <style>{`
        .avatar-overlay { opacity: 0; transition: opacity 0.2s; }
        [style*="cursor: pointer"]:hover .avatar-overlay { opacity: 1 !important; }
      `}</style>

      <Container size="lg">
        <Grid gutter="xl">

          {/* ── Sidebar ── */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Paper shadow="xs" p="xl" radius="lg" bg="white">
              <Stack align="center" gap="md">

                {/* Avatar with upload */}
                <Box style={{ position: 'relative' }}>
                  <FileButton onChange={handleImageUpload} accept="image/png,image/jpeg,image/webp,image/gif">
                    {(props) => (
                      <Box {...props} style={{ position: 'relative', cursor: 'pointer' }}>
                        <Avatar size={140} radius={70} src={profileImage || null}
                          style={{ background: ACCENT_TAN, border: `4px solid ${PRIMARY_GOLD}` }}>
                          <IconUserShield size={70} color="white" />
                        </Avatar>
                        <Box className="avatar-overlay" style={{
                          position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%',
                          borderBottomLeftRadius: 70, borderBottomRightRadius: 70,
                          background: 'rgba(0,0,0,0.45)', display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                        }}>
                          {uploadingImage ? <Loader size={20} color="white" /> : <IconCamera size={22} color="white" />}
                        </Box>
                      </Box>
                    )}
                  </FileButton>

                  {displayData.verified && (
                    <Box style={{
                      position: 'absolute', bottom: 4, right: 4, width: 34, height: 34,
                      borderRadius: '50%', background: PRIMARY_GOLD, border: '3px solid white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <IconShieldCheck size={18} color="white" />
                    </Box>
                  )}
                </Box>

                {/* Name & username */}
                <Box ta="center">
                  <Text size="xl" fw={700} c={CHARCOAL} mb={2}>
                    {displayData.firstName} {displayData.lastName}
                  </Text>
                  <Text size="sm" c={MUTED_OLIVE}>@{displayData.username}</Text>
                </Box>

                {/* Badges */}
                <Group gap="xs" justify="center">
                  <Badge size="sm" variant="light" color={roleBadgeColor} radius="sm">{roleLabel}</Badge>
                  {displayData.memberSince && (
                    <Badge size="sm" variant="light" color="gray" radius="sm">Since {displayData.memberSince}</Badge>
                  )}
                </Group>

                <Divider w="100%" color="#F0F0F0" />

                {/* Completeness */}
                <Box w="100%">
                  <Group justify="space-between" mb={6}>
                    <Text size="xs" fw={500} c={MUTED_OLIVE}>Profile Completeness</Text>
                    <Text size="xs" fw={600} c={CHARCOAL}>{completeness}%</Text>
                  </Group>
                  <Progress value={completeness} size="sm" radius="xl"
                    color={completeness === 100 ? 'green' : PRIMARY_GOLD} />
                </Box>

                <Divider w="100%" color="#F0F0F0" />

                {/* Edit / Save / Cancel */}
                {!isEditing ? (
                  <Group style={{ width: '100%' }} spacing="xs">
                    <Button variant="outline" leftSection={<IconEdit size={16} />} onClick={handleEdit}
                      style={{ flex: 1, borderColor: PRIMARY_BROWN, color: PRIMARY_BROWN }}>
                      Edit Profile
                    </Button>
                    <ActionIcon variant="default" onClick={() => refreshUserData().catch(() => { })}>
                      <IconRefresh size={18} />
                    </ActionIcon>
                  </Group>
                ) : (
                  <Stack w="100%" gap="xs">
                    <Button fullWidth leftSection={<IconCheck size={16} />} onClick={handleSave}
                      loading={saving} style={{ background: PRIMARY_BROWN }}>
                      Save Changes
                    </Button>
                    <Button fullWidth variant="outline" leftSection={<IconX size={16} />}
                      onClick={handleCancel} disabled={saving}
                      style={{ borderColor: MUTED_OLIVE, color: MUTED_OLIVE }}>
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
                <SectionHeader icon={IconUser} title="Personal Information" />
                <Grid gutter="lg">
                  <ProfileField label="First Name" field="firstName"
                    value={displayData.firstName} isEditing={isEditing}
                    editedValue={editedData.firstName} onChange={handleInputChange} />
                  <ProfileField label="Last Name" field="lastName"
                    value={displayData.lastName} isEditing={isEditing}
                    editedValue={editedData.lastName} onChange={handleInputChange} />
                </Grid>
              </Paper>

              {/* Account Information */}
              <Paper shadow="xs" p="xl" radius="lg" bg="white">
                <SectionHeader icon={IconMail} title="Account Information" />
                <Grid gutter="lg">
                  <ProfileField label="Email Address" field="email" value={displayData.email} />
                  <ProfileField label="Username" field="username" value={displayData.username} />
                  <ProfileField label="Role" field="role" value={roleLabel} />
                </Grid>
              </Paper>

              {/* Signature */}
              <Paper shadow="xs" p="xl" radius="lg" bg="white">
                <SectionHeader icon={IconEdit} title="Signature" />
                <Signature initialUrl={displayData.signatureUrl} onSave={handleSignatureSave} />
                {displayData.signatureUrl && (
                  <Box mt="md">
                    <Text size="xs" c={MUTED_OLIVE} mb={4} fw={500}>Saved Signature</Text>
                    <img src={displayData.signatureUrl} alt="Saved signature"
                      style={{ maxWidth: 360, maxHeight: 180, border: '1px solid #eee', borderRadius: 6 }} />
                  </Box>
                )}
              </Paper>

            </Stack>
          </Grid.Col>

        </Grid>
      </Container>
    </Box>
  );
}