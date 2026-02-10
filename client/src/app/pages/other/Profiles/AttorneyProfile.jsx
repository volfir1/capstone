import React, { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Paper,
  Text,
  Box,
  Group,
  Stack,
  Button,
  TextInput,
  Textarea,
  Avatar,
  Divider,
  Grid,
  Badge,
  Progress,
  MultiSelect,
  Checkbox,
  FileButton,
  Loader,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Loaders } from '@/components/ui/Loader';
import {
  IconUser,
  IconMail,
  IconEdit,
  IconCheck,
  IconX,
  IconShieldCheck,
  IconScale,
  IconCertificate,
  IconBriefcase,
  IconCamera,
} from '@tabler/icons-react';
import { PRIMARY_GOLD, PRIMARY_BROWN, MUTED_OLIVE, BG, CHARCOAL, ACCENT_TAN } from '@utils/constants';
import apiClient from '@config/api/apiClient';
import { useAuth } from '@context/authContext';
import { uploadToCloudinary } from '@utils/cloudinary';

const ROLE_LABELS = {
  attorney: 'Attorney',
  pao_lawyer: 'PAO Lawyer',
  legal_volunteer: 'Legal Volunteer',
};

// Values must match the Attorney model enum exactly
const SPECIALIZATIONS = [
  { value: 'Criminal Law', label: 'Criminal Law' },
  { value: 'Civil Law', label: 'Civil Law' },
  { value: 'Family Law', label: 'Family Law' },
  { value: 'Labor Law', label: 'Labor Law' },
  { value: 'Commercial Law', label: 'Commercial Law' },
  { value: 'Tax Law', label: 'Tax Law' },
  { value: 'Immigration Law', label: 'Immigration Law' },
  { value: 'Land and Property Law', label: 'Land and Property Law' },
  { value: 'Human Rights', label: 'Human Rights' },
  { value: 'Environmental Law', label: 'Environmental Law' },
  { value: 'Agrarian Law', label: 'Agrarian Law' },
  { value: 'Administrative Law', label: 'Administrative Law' },
  { value: 'Corporate Law', label: 'Corporate Law' },
  { value: 'Intellectual Property', label: 'Intellectual Property' },
  { value: 'Other', label: 'Other' },
];

const LANGUAGES = [
  { value: 'English', label: 'English' },
  { value: 'Filipino/Tagalog', label: 'Filipino/Tagalog' },
  { value: 'Cebuano', label: 'Cebuano' },
  { value: 'Ilocano', label: 'Ilocano' },
  { value: 'Hiligaynon', label: 'Hiligaynon' },
  { value: 'Waray', label: 'Waray' },
  { value: 'Kapampangan', label: 'Kapampangan' },
  { value: 'Bikol', label: 'Bikol' },
  { value: 'Pangasinan', label: 'Pangasinan' },
  { value: 'Other', label: 'Other' },
];

export default function AttorneyProfile() {
  const { userData: authUserData, loading: authLoading, refreshUserData } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [profileImage, setProfileImage] = useState('');

  const [userData, setUserData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    email: '',
    username: '',
    role: '',
    verified: false,
    memberSince: '',
    prcLicenseNumber: '',
    ibrNumber: '',
    barAdmissionDate: '',
    lawFirm: '',
    isPAOLawyer: false,
    specializations: [],
    languages: [],
    consultationMode: [],
    biography: '',
    accountStatus: '',
  });

  const [editedData, setEditedData] = useState(userData);

  useEffect(() => {
    if (authUserData) {
      // Fetch profileImage from API
      apiClient.get('/users/profile').then((res) => {
        if (res.data?.data?.profileImage) setProfileImage(res.data.data.profileImage);
      }).catch(() => {});

      const profileData = {
        firstName: authUserData.firstName || '',
        middleName: authUserData.middleName || '',
        lastName: authUserData.lastName || '',
        suffix: authUserData.suffix || '',
        email: authUserData.email || '',
        username: authUserData.username || '',
        role: authUserData.role || '',
        verified: authUserData.isVerified || false,
        memberSince: authUserData.createdAt
          ? new Date(authUserData.createdAt).getFullYear().toString()
          : '',
        prcLicenseNumber: authUserData.prcLicenseNumber || '',
        ibrNumber: authUserData.ibrNumber || '',
        barAdmissionDate: authUserData.barAdmissionDate
          ? new Date(authUserData.barAdmissionDate).toLocaleDateString()
          : '',
        lawFirm: authUserData.lawFirm || '',
        isPAOLawyer: authUserData.isPAOLawyer || false,
        specializations: authUserData.specializations || [],
        languages: authUserData.languages || [],
        consultationMode: authUserData.consultationMode || [],
        biography: authUserData.biography || '',
        accountStatus: authUserData.accountStatus || '',
      };
      setUserData(profileData);
      setEditedData(profileData);
    }
  }, [authUserData]);

  const completeness = useMemo(() => {
    const fields = [
      userData.firstName,
      userData.lastName,
      userData.email,
      userData.prcLicenseNumber,
      userData.ibrNumber,
      userData.barAdmissionDate,
      userData.lawFirm,
      userData.specializations?.length > 0 ? 'filled' : '',
      userData.languages?.length > 0 ? 'filled' : '',
      userData.biography,
    ];
    const filled = fields.filter((f) => f && (typeof f === 'string' ? f.trim() : true)).length;
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
      const response = await apiClient.put('/attorney/profile', editedData);
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
      await apiClient.put('/users/profile/image', { profileImage: imageUrl });
      setProfileImage(imageUrl);
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

  if (authLoading) {
    return <Loaders height={window.innerHeight} />;
  }

  const displayData = isEditing ? editedData : userData;
  const roleLabel = ROLE_LABELS[userData.role] || 'Attorney';

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
                <Box style={{ position: 'relative' }}>
                  <FileButton onChange={handleImageUpload} accept="image/png,image/jpeg,image/webp,image/gif">
                    {(props) => (
                      <Box {...props} style={{ position: 'relative', cursor: 'pointer' }}>
                        <Avatar
                          size={140}
                          radius={70}
                          src={profileImage || null}
                          style={{
                            background: ACCENT_TAN,
                            border: `4px solid ${PRIMARY_GOLD}`,
                          }}
                        >
                          <IconScale size={70} color="white" />
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

                <Box ta="center">
                  <Text size="xl" fw={700} c={CHARCOAL} mb={2}>
                    {userData.firstName}{' '}
                    {userData.middleName ? `${userData.middleName} ` : ''}
                    {userData.lastName}
                    {userData.suffix ? ` ${userData.suffix}` : ''}
                  </Text>
                  <Text size="sm" c={MUTED_OLIVE}>
                    @{userData.username}
                  </Text>
                </Box>

                <Group gap="xs" justify="center">
                  <Badge size="sm" variant="light" color="teal" radius="sm">
                    {roleLabel}
                  </Badge>
                  {userData.isPAOLawyer && (
                    <Badge size="sm" variant="light" color="cyan" radius="sm">
                      PAO
                    </Badge>
                  )}
                  {userData.memberSince && (
                    <Badge size="sm" variant="light" color="gray" radius="sm">
                      Since {userData.memberSince}
                    </Badge>
                  )}
                </Group>

                <Divider w="100%" color="#F0F0F0" />

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

                {!isEditing ? (
                  <Button
                    fullWidth
                    variant="outline"
                    leftSection={<IconEdit size={16} />}
                    onClick={handleEdit}
                    style={{ borderColor: PRIMARY_BROWN, color: PRIMARY_BROWN }}
                  >
                    Edit Profile
                  </Button>
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
                    <Text size="xs" c={MUTED_OLIVE} mb={4} fw={500}>First Name</Text>
                    {isEditing ? (
                      <TextInput value={editedData.firstName} onChange={(e) => handleInputChange('firstName', e.target.value)} styles={inputStyles} />
                    ) : (
                      <Text fw={500} c={displayData.firstName ? CHARCOAL : '#bbb'}>{displayData.firstName || 'Not set'}</Text>
                    )}
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Text size="xs" c={MUTED_OLIVE} mb={4} fw={500}>Middle Name</Text>
                    {isEditing ? (
                      <TextInput value={editedData.middleName} onChange={(e) => handleInputChange('middleName', e.target.value)} styles={inputStyles} />
                    ) : (
                      <Text fw={500} c={displayData.middleName ? CHARCOAL : '#bbb'}>{displayData.middleName || 'Not set'}</Text>
                    )}
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Text size="xs" c={MUTED_OLIVE} mb={4} fw={500}>Last Name</Text>
                    {isEditing ? (
                      <TextInput value={editedData.lastName} onChange={(e) => handleInputChange('lastName', e.target.value)} styles={inputStyles} />
                    ) : (
                      <Text fw={500} c={displayData.lastName ? CHARCOAL : '#bbb'}>{displayData.lastName || 'Not set'}</Text>
                    )}
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Text size="xs" c={MUTED_OLIVE} mb={4} fw={500}>Suffix</Text>
                    {isEditing ? (
                      <TextInput value={editedData.suffix} onChange={(e) => handleInputChange('suffix', e.target.value)} placeholder="Jr., Sr., III, etc." styles={inputStyles} />
                    ) : (
                      <Text fw={500} c={displayData.suffix ? CHARCOAL : '#bbb'}>{displayData.suffix || 'Not set'}</Text>
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
                    <Text size="xs" c={MUTED_OLIVE} mb={4} fw={500}>Email Address</Text>
                    <Text fw={500} c={displayData.email ? CHARCOAL : '#bbb'}>{displayData.email || 'Not set'}</Text>
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Text size="xs" c={MUTED_OLIVE} mb={4} fw={500}>Username</Text>
                    <Text fw={500} c={displayData.username ? CHARCOAL : '#bbb'}>{displayData.username || 'Not set'}</Text>
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Text size="xs" c={MUTED_OLIVE} mb={4} fw={500}>Role</Text>
                    <Text fw={500} c={CHARCOAL}>{roleLabel}</Text>
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Text size="xs" c={MUTED_OLIVE} mb={4} fw={500}>Account Status</Text>
                    <Badge
                      size="sm"
                      variant="light"
                      color={displayData.accountStatus === 'active' ? 'green' : 'yellow'}
                      radius="sm"
                    >
                      {displayData.accountStatus
                        ? displayData.accountStatus.charAt(0).toUpperCase() + displayData.accountStatus.slice(1)
                        : 'Not set'}
                    </Badge>
                  </Grid.Col>
                </Grid>
              </Paper>

              {/* Professional Credentials */}
              <Paper shadow="xs" p="xl" radius="lg" bg="white">
                <Group mb="lg" gap={8}>
                  <IconCertificate size={18} color={ACCENT_TAN} stroke={2} />
                  <Text size="sm" fw={600} c={CHARCOAL} tt="uppercase">
                    Professional Credentials
                  </Text>
                </Group>

                <Grid gutter="lg">
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Text size="xs" c={MUTED_OLIVE} mb={4} fw={500}>PRC License Number</Text>
                    <Text fw={500} c={displayData.prcLicenseNumber ? CHARCOAL : '#bbb'}>{displayData.prcLicenseNumber || 'Not set'}</Text>
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Text size="xs" c={MUTED_OLIVE} mb={4} fw={500}>IBR Number</Text>
                    <Text fw={500} c={displayData.ibrNumber ? CHARCOAL : '#bbb'}>{displayData.ibrNumber || 'Not set'}</Text>
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Text size="xs" c={MUTED_OLIVE} mb={4} fw={500}>Bar Admission Date</Text>
                    <Text fw={500} c={displayData.barAdmissionDate ? CHARCOAL : '#bbb'}>{displayData.barAdmissionDate || 'Not set'}</Text>
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Text size="xs" c={MUTED_OLIVE} mb={4} fw={500}>Law Firm / Organization</Text>
                    {isEditing ? (
                      <TextInput value={editedData.lawFirm} onChange={(e) => handleInputChange('lawFirm', e.target.value)} placeholder="Law firm name" styles={inputStyles} />
                    ) : (
                      <Text fw={500} c={displayData.lawFirm ? CHARCOAL : '#bbb'}>{displayData.lawFirm || 'Not set'}</Text>
                    )}
                  </Grid.Col>
                </Grid>
              </Paper>

              {/* Practice Information */}
              <Paper shadow="xs" p="xl" radius="lg" bg="white">
                <Group mb="lg" gap={8}>
                  <IconBriefcase size={18} color={ACCENT_TAN} stroke={2} />
                  <Text size="sm" fw={600} c={CHARCOAL} tt="uppercase">
                    Practice Information
                  </Text>
                </Group>

                <Stack gap="lg">
                  <Box>
                    <Text size="xs" c={MUTED_OLIVE} mb={4} fw={500}>Areas of Specialization</Text>
                    {isEditing ? (
                      <MultiSelect value={editedData.specializations} onChange={(v) => handleInputChange('specializations', v)} data={SPECIALIZATIONS} searchable styles={inputStyles} />
                    ) : displayData.specializations?.length > 0 ? (
                      <Group gap="xs">
                        {displayData.specializations.map((s) => (
                          <Badge key={s} size="sm" variant="light" color="blue" radius="sm">{s}</Badge>
                        ))}
                      </Group>
                    ) : (
                      <Text fw={500} c="#bbb">Not set</Text>
                    )}
                  </Box>

                  <Box>
                    <Text size="xs" c={MUTED_OLIVE} mb={4} fw={500}>Languages</Text>
                    {isEditing ? (
                      <MultiSelect value={editedData.languages} onChange={(v) => handleInputChange('languages', v)} data={LANGUAGES} searchable styles={inputStyles} />
                    ) : displayData.languages?.length > 0 ? (
                      <Group gap="xs">
                        {displayData.languages.map((l) => (
                          <Badge key={l} size="sm" variant="light" color="grape" radius="sm">{l}</Badge>
                        ))}
                      </Group>
                    ) : (
                      <Text fw={500} c="#bbb">Not set</Text>
                    )}
                  </Box>

                  <Box>
                    <Text size="xs" c={MUTED_OLIVE} mb={4} fw={500}>Consultation Methods</Text>
                    {isEditing ? (
                      <Stack gap="xs">
                        <Checkbox
                          label="Online Consultation (Video/Phone)"
                          checked={editedData.consultationMode?.includes('online')}
                          onChange={(e) => {
                            const val = e.currentTarget.checked
                              ? [...(editedData.consultationMode || []), 'online']
                              : editedData.consultationMode?.filter((v) => v !== 'online');
                            handleInputChange('consultationMode', val);
                          }}
                        />
                        <Checkbox
                          label="In-Person Meeting at Office"
                          checked={editedData.consultationMode?.includes('in-person')}
                          onChange={(e) => {
                            const val = e.currentTarget.checked
                              ? [...(editedData.consultationMode || []), 'in-person']
                              : editedData.consultationMode?.filter((v) => v !== 'in-person');
                            handleInputChange('consultationMode', val);
                          }}
                        />
                      </Stack>
                    ) : displayData.consultationMode?.length > 0 ? (
                      <Group gap="xs">
                        {displayData.consultationMode.includes('online') && (
                          <Badge size="sm" variant="light" color="cyan" radius="sm">Online Consultation</Badge>
                        )}
                        {displayData.consultationMode.includes('in-person') && (
                          <Badge size="sm" variant="light" color="orange" radius="sm">In-Person Meeting</Badge>
                        )}
                      </Group>
                    ) : (
                      <Text fw={500} c="#bbb">Not set</Text>
                    )}
                  </Box>

                  <Box>
                    <Text size="xs" c={MUTED_OLIVE} mb={4} fw={500}>Professional Biography</Text>
                    {isEditing ? (
                      <Textarea
                        value={editedData.biography}
                        onChange={(e) => handleInputChange('biography', e.target.value)}
                        placeholder="Share your legal background, experience, and expertise..."
                        minRows={5}
                        styles={inputStyles}
                      />
                    ) : (
                      <Text fw={500} c={displayData.biography ? CHARCOAL : '#bbb'} style={{ whiteSpace: 'pre-wrap' }}>
                        {displayData.biography || 'Not set'}
                      </Text>
                    )}
                  </Box>
                </Stack>
              </Paper>
            </Stack>
          </Grid.Col>
        </Grid>
      </Container>
    </Box>
  );
}
