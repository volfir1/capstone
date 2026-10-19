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
  ActionIcon,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Loaders } from '@/components/ui/Loader';
import ProfileSkeleton from '@/components/skeleton/ProfileSkeleton';
import {
  IconUser,
  IconMail,
  IconEdit,
  IconCheck,
  IconX,
  IconShieldCheck,
  IconUserShield,
  IconScale,
  IconCertificate,
  IconBriefcase,
  IconCamera,
  IconRefresh,
} from '@tabler/icons-react';
import { PRIMARY_GOLD, PRIMARY_BROWN, MUTED_OLIVE, BG, CHARCOAL, ACCENT_TAN } from '@utils/constants';
import apiClient from '@config/api/apiClient';
import { useAuth } from '@context/authContext';
import { uploadToCloudinary } from '@utils/cloudinary';
import Signature from '@/features/auth/signature/Signature';

// ── Role display helpers ──
const ROLE_LABELS = {
  secretary: 'Secretary',
  intern: 'Intern',
  director: 'Director',
  supervising_lawyer: 'Supervising Lawyer',
  attorney: 'Attorney',
  pao_lawyer: 'PAO Lawyer',
  legal_volunteer: 'Legal Volunteer',
};

const ROLE_COLORS = {
  secretary: 'orange',
  intern: 'blue',
  director: 'violet',
  supervising_lawyer: 'teal',
  attorney: 'teal',
  pao_lawyer: 'cyan',
  legal_volunteer: 'green',
};

const ATTORNEY_ROLES = ['attorney', 'pao_lawyer', 'legal_volunteer'];
const INTERN_ROLE = 'intern';

// ── Attorney-specific option arrays ──
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

export default function AdminProfile() {
  const { userData: authUserData, loading: authLoading, refreshUserData } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [profileImage, setProfileImage] = useState('');

  const isAttorney = ATTORNEY_ROLES.includes(authUserData?.role);
  const isIntern = authUserData?.role === INTERN_ROLE;
  const userRole = authUserData?.role || 'secretary';

  // ── State for regular (User) accounts ──
  const [userData, setUserData] = useState({
    givenName: '',
    familyName: '',
    maternalName: '',
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    role: '',
    verified: false,
    memberSince: '',
    signatureUrl: '',
    // Intern-specific fields
    metroManilaAddress: '',
    provincialAddress: '',
    dateOfBirth: '',
    placeOfBirth: '',
    nationality: '',
    sex: '',
    civilStatus: '',
    telephoneNo: '',
    religiousAffiliations: '',
    fathersName: '',
    mothersName: '',
    wifesName: '',
    husbandsName: '',
    gradeSchool: '',
    highSchool: '',
    college: '',
    course: '',
    honorsReceived: '',
    affiliation: '',
    schoolLastAttended: '',
    employer: '',
  });

  // ── Extended state for attorney accounts ──
  const [attorneyData, setAttorneyData] = useState({
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
    paoOffice: '',
    specializations: [],
    languages: [],
    consultationMode: [],
    biography: '',
    isAvailable: true,
    accountStatus: '',
    signatureUrl: '',
  });

  const [editedData, setEditedData] = useState({});

  useEffect(() => {
    if (!authUserData) return;

    // Fetch complete profile data from API to get all fields including intern-specific ones
    apiClient.get('/users/profile').then((res) => {
      const apiProfileData = res.data?.data || {};
      
      // Update profile image if available
      if (apiProfileData.profileImage) setProfileImage(apiProfileData.profileImage);

      // Merge API data with authUserData
      const mergedData = { ...authUserData, ...apiProfileData };

      if (isAttorney) {
        const profile = {
          firstName: mergedData.firstName || '',
          middleName: mergedData.middleName || '',
          lastName: mergedData.lastName || '',
          suffix: mergedData.suffix || '',
          email: mergedData.email || '',
          username: mergedData.username || '',
          role: mergedData.role || '',
          verified: mergedData.isVerified || false,
          memberSince: mergedData.createdAt
            ? new Date(mergedData.createdAt).getFullYear().toString()
            : '',
          prcLicenseNumber: mergedData.prcLicenseNumber || '',
          ibrNumber: mergedData.ibrNumber || '',
          barAdmissionDate: mergedData.barAdmissionDate
            ? new Date(mergedData.barAdmissionDate).toLocaleDateString()
            : '',
          lawFirm: mergedData.lawFirm || '',
          isPAOLawyer: mergedData.isPAOLawyer || false,
          paoOffice: mergedData.paoOffice || '',
          specializations: mergedData.specializations || [],
          languages: mergedData.languages || [],
          consultationMode: mergedData.consultationMode || [],
          biography: mergedData.biography || '',
          isAvailable: mergedData.isAvailable ?? true,
          accountStatus: mergedData.accountStatus || '',
          signatureUrl: mergedData.signatureUrl || '',
        };
        setAttorneyData(profile);
        setEditedData(profile);
      } else {
        const profile = {
          givenName: mergedData.givenName || mergedData.firstName || '',
          familyName: mergedData.familyName || mergedData.lastName || '',
          maternalName: mergedData.maternalName || '',
          firstName: mergedData.firstName || '',
          lastName: mergedData.lastName || '',
          email: mergedData.email || '',
          username: mergedData.username || '',
          role: mergedData.role || '',
          verified: mergedData.isVerified || false,
          memberSince: mergedData.createdAt
            ? new Date(mergedData.createdAt).getFullYear().toString()
            : '',
          signatureUrl: mergedData.signatureUrl || '',
          // Intern-specific fields
          metroManilaAddress: mergedData.metroManilaAddress || '',
          provincialAddress: mergedData.provincialAddress || '',
          dateOfBirth: mergedData.dateOfBirth ? new Date(mergedData.dateOfBirth).toISOString().split('T')[0] : '',
          placeOfBirth: mergedData.placeOfBirth || '',
          nationality: mergedData.nationality || '',
          sex: mergedData.sex || '',
          civilStatus: mergedData.civilStatus || '',
          telephoneNo: mergedData.telephoneNo || '',
          religiousAffiliations: mergedData.religiousAffiliations || '',
          fathersName: mergedData.fathersName || '',
          mothersName: mergedData.mothersName || '',
          wifesName: mergedData.wifesName || '',
          husbandsName: mergedData.husbandsName || '',
          gradeSchool: mergedData.gradeSchool || '',
          highSchool: mergedData.highSchool || '',
          college: mergedData.college || '',
          course: mergedData.course || '',
          honorsReceived: mergedData.honorsReceived || '',
          affiliation: mergedData.affiliation || '',
          schoolLastAttended: mergedData.schoolLastAttended || '',
          employer: mergedData.employer || '',
        };
        setUserData(profile);
        setEditedData(profile);
      }
    }).catch((error) => {
      console.error('Error fetching profile data:', error);
      // Fallback to authUserData if API fails
      if (isAttorney) {
        const profile = {
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
          paoOffice: authUserData.paoOffice || '',
          specializations: authUserData.specializations || [],
          languages: authUserData.languages || [],
          consultationMode: authUserData.consultationMode || [],
          biography: authUserData.biography || '',
          isAvailable: authUserData.isAvailable ?? true,
          accountStatus: authUserData.accountStatus || '',
          signatureUrl: authUserData.signatureUrl || '',
        };
        setAttorneyData(profile);
        setEditedData(profile);
      } else {
        const profile = {
          givenName: authUserData.givenName || authUserData.firstName || '',
          familyName: authUserData.familyName || authUserData.lastName || '',
          maternalName: authUserData.maternalName || '',
          firstName: authUserData.firstName || '',
          lastName: authUserData.lastName || '',
          email: authUserData.email || '',
          username: authUserData.username || '',
          role: authUserData.role || '',
          verified: authUserData.isVerified || false,
          memberSince: authUserData.createdAt
            ? new Date(authUserData.createdAt).getFullYear().toString()
            : '',
          signatureUrl: authUserData.signatureUrl || '',
          // Intern-specific fields
          metroManilaAddress: authUserData.metroManilaAddress || '',
          provincialAddress: authUserData.provincialAddress || '',
          dateOfBirth: authUserData.dateOfBirth ? new Date(authUserData.dateOfBirth).toISOString().split('T')[0] : '',
          placeOfBirth: authUserData.placeOfBirth || '',
          nationality: authUserData.nationality || '',
          sex: authUserData.sex || '',
          civilStatus: authUserData.civilStatus || '',
          telephoneNo: authUserData.telephoneNo || '',
          religiousAffiliations: authUserData.religiousAffiliations || '',
          fathersName: authUserData.fathersName || '',
          mothersName: authUserData.mothersName || '',
          wifesName: authUserData.wifesName || '',
          husbandsName: authUserData.husbandsName || '',
          gradeSchool: authUserData.gradeSchool || '',
          highSchool: authUserData.highSchool || '',
          college: authUserData.college || '',
          course: authUserData.course || '',
          honorsReceived: authUserData.honorsReceived || '',
          affiliation: authUserData.affiliation || '',
          schoolLastAttended: authUserData.schoolLastAttended || '',
          employer: authUserData.employer || '',
        };
        setUserData(profile);
        setEditedData(profile);
      }
    });
  }, [authUserData, isAttorney]);

  // ── Completeness ──
  const completeness = useMemo(() => {
    if (isAttorney) {
      const fields = [
        attorneyData.firstName,
        attorneyData.lastName,
        attorneyData.email,
        attorneyData.prcLicenseNumber,
        attorneyData.ibrNumber,
        attorneyData.barAdmissionDate,
        attorneyData.lawFirm,
        attorneyData.specializations?.length > 0 ? 'filled' : '',
        attorneyData.languages?.length > 0 ? 'filled' : '',
        attorneyData.biography,
      ];
      const filled = fields.filter((f) => f && (typeof f === 'string' ? f.trim() : true)).length;
      return Math.round((filled / fields.length) * 100);
    }
    if (isIntern) {
      const fields = [
        userData.givenName || userData.firstName,
        userData.familyName || userData.lastName,
        userData.email,
        userData.dateOfBirth,
        userData.placeOfBirth,
        userData.nationality,
        userData.sex,
        userData.civilStatus,
      ];
      const filled = fields.filter((f) => f && (typeof f === 'string' ? f.trim() : true)).length;
      return Math.round((filled / fields.length) * 100);
    }
    const fields = [userData.firstName, userData.lastName, userData.email];
    const filled = fields.filter((f) => f && f.trim()).length;
    return Math.round((filled / fields.length) * 100);
  }, [isAttorney, isIntern, userData, attorneyData]);

  // ── Handlers ──
  const profileData = isAttorney ? attorneyData : userData;
  const displayData = isEditing ? editedData : profileData;

  const handleEdit = () => {
    setIsEditing(true);
    setEditedData(profileData);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData(profileData);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await apiClient.put('/users/profile', editedData);
      if (response.data.success) {
        if (isAttorney) {
          setAttorneyData(editedData);
        } else {
          setUserData(editedData);
        }
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

  const handleSignatureSave = async (dataUrl) => {
    try {
      notifications.show({
        id: 'signature-uploading',
        title: 'Uploading',
        message: 'Uploading signature...',
        autoClose: false,
      });

      const res = await apiClient.post('/users/profile/signature/upload', { dataUrl });
      const signatureUrl = res?.data?.data?.signatureUrl;

      if (!signatureUrl) {
        throw new Error('Signature upload did not return a URL');
      }

      if (isAttorney) {
        setAttorneyData((prev) => ({ ...prev, signatureUrl }));
      } else {
        setUserData((prev) => ({ ...prev, signatureUrl }));
      }
      setEditedData((prev) => ({ ...prev, signatureUrl }));

      notifications.update({
        id: 'signature-uploading',
        title: 'Uploaded',
        message: 'Signature saved to your profile.',
        color: 'green',
        autoClose: 4000,
      });

      refreshUserData().catch(() => {});
      return signatureUrl;
    } catch (err) {
      console.error('Signature upload failed', err);
      notifications.update({
        id: 'signature-uploading',
        title: 'Upload Failed',
        message: err.response?.data?.message || err.message || 'Failed to upload signature',
        color: 'red',
        autoClose: 4000,
      });
      throw err;
    }
  };

  if (authLoading) {
    return <ProfileSkeleton />;
  }

  const inputStyles = {
    input: { borderColor: '#E5E0D8', '&:focus': { borderColor: PRIMARY_GOLD } },
  };

  const roleLabel = ROLE_LABELS[userRole] || userRole;
  const roleBadgeColor = ROLE_COLORS[userRole] || 'gray';
  const avatarIcon = isAttorney
    ? <IconScale size={70} color="white" />
    : <IconUserShield size={70} color="white" />;

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
                          {avatarIcon}
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

                  {displayData.verified && (
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
                    {isIntern ? (displayData.givenName || displayData.firstName) : displayData.firstName}{' '}
                    {isIntern && displayData.maternalName ? `${displayData.maternalName} ` : ''}
                    {isAttorney && displayData.middleName ? `${displayData.middleName} ` : ''}
                    {isIntern ? (displayData.familyName || displayData.lastName) : displayData.lastName}
                    {isAttorney && displayData.suffix ? ` ${displayData.suffix}` : ''}
                  </Text>
                  <Text size="sm" c={MUTED_OLIVE}>
                    @{displayData.username}
                  </Text>
                </Box>

                {/* Badges */}
                <Group gap="xs" justify="center">
                  <Badge size="sm" variant="light" color={roleBadgeColor} radius="sm">
                    {roleLabel}
                  </Badge>
                  {isAttorney && displayData.isPAOLawyer && (
                    <Badge size="sm" variant="light" color="cyan" radius="sm">
                      PAO
                    </Badge>
                  )}
                  {displayData.memberSince && (
                    <Badge size="sm" variant="light" color="gray" radius="sm">
                      Since {displayData.memberSince}
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
                    <ActionIcon variant="default" onClick={() => { refreshUserData().catch(() => {}); }}>
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
                  {/* Given Name / First Name */}
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Text size="xs" c={MUTED_OLIVE} mb={4} fw={500}>
                      {isIntern ? 'Given Name' : 'First Name'}
                    </Text>
                    {isEditing ? (
                      <TextInput
                        value={isIntern ? editedData.givenName : editedData.firstName}
                        onChange={(e) => handleInputChange(isIntern ? 'givenName' : 'firstName', e.target.value)}
                        styles={inputStyles}
                      />
                    ) : (
                      <Text fw={500} c={isIntern ? (displayData.givenName || displayData.firstName) : displayData.firstName ? CHARCOAL : '#bbb'}>
                        {isIntern ? (displayData.givenName || displayData.firstName || 'Not set') : (displayData.firstName || 'Not set')}
                      </Text>
                    )}
                  </Grid.Col>

                  {/* Maternal Name — intern only */}
                  {isIntern && (
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <Text size="xs" c={MUTED_OLIVE} mb={4} fw={500}>
                        Maternal Name
                      </Text>
                      {isEditing ? (
                        <TextInput
                          value={editedData.maternalName}
                          onChange={(e) => handleInputChange('maternalName', e.target.value)}
                          styles={inputStyles}
                        />
                      ) : (
                        <Text fw={500} c={displayData.maternalName ? CHARCOAL : '#bbb'}>
                          {displayData.maternalName || 'Not set'}
                        </Text>
                      )}
                    </Grid.Col>
                  )}

                  {/* Middle Name — attorney only */}
                  {isAttorney && (
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <Text size="xs" c={MUTED_OLIVE} mb={4} fw={500}>
                        Middle Name
                      </Text>
                      {isEditing ? (
                        <TextInput
                          value={editedData.middleName}
                          onChange={(e) => handleInputChange('middleName', e.target.value)}
                          styles={inputStyles}
                        />
                      ) : (
                        <Text fw={500} c={displayData.middleName ? CHARCOAL : '#bbb'}>
                          {displayData.middleName || 'Not set'}
                        </Text>
                      )}
                    </Grid.Col>
                  )}

                  {/* Family Name / Last Name */}
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Text size="xs" c={MUTED_OLIVE} mb={4} fw={500}>
                      {isIntern ? 'Family Name' : 'Last Name'}
                    </Text>
                    {isEditing ? (
                      <TextInput
                        value={isIntern ? editedData.familyName : editedData.lastName}
                        onChange={(e) => handleInputChange(isIntern ? 'familyName' : 'lastName', e.target.value)}
                        styles={inputStyles}
                      />
                    ) : (
                      <Text fw={500} c={isIntern ? (displayData.familyName || displayData.lastName) : displayData.lastName ? CHARCOAL : '#bbb'}>
                        {isIntern ? (displayData.familyName || displayData.lastName || 'Not set') : (displayData.lastName || 'Not set')}
                      </Text>
                    )}
                  </Grid.Col>

                  {/* Suffix — attorney only */}
                  {isAttorney && (
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <Text size="xs" c={MUTED_OLIVE} mb={4} fw={500}>
                        Suffix
                      </Text>
                      {isEditing ? (
                        <TextInput
                          value={editedData.suffix}
                          onChange={(e) => handleInputChange('suffix', e.target.value)}
                          placeholder="Jr., Sr., III, etc."
                          styles={inputStyles}
                        />
                      ) : (
                        <Text fw={500} c={displayData.suffix ? CHARCOAL : '#bbb'}>
                          {displayData.suffix || 'Not set'}
                        </Text>
                      )}
                    </Grid.Col>
                  )}

                  {/* Intern-specific additional fields */}
                  {isIntern && (
                    <>
                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <Text size="xs" c={MUTED_OLIVE} mb={4} fw={500}>
                          Metro Manila Address
                        </Text>
                        {isEditing ? (
                          <TextInput
                            value={editedData.metroManilaAddress}
                            onChange={(e) => handleInputChange('metroManilaAddress', e.target.value)}
                            styles={inputStyles}
                          />
                        ) : (
                          <Text fw={500} c={displayData.metroManilaAddress ? CHARCOAL : '#bbb'}>
                            {displayData.metroManilaAddress || 'Not set'}
                          </Text>
                        )}
                      </Grid.Col>

                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <Text size="xs" c={MUTED_OLIVE} mb={4} fw={500}>
                          Provincial Address
                        </Text>
                        {isEditing ? (
                          <TextInput
                            value={editedData.provincialAddress}
                            onChange={(e) => handleInputChange('provincialAddress', e.target.value)}
                            styles={inputStyles}
                          />
                        ) : (
                          <Text fw={500} c={displayData.provincialAddress ? CHARCOAL : '#bbb'}>
                            {displayData.provincialAddress || 'Not set'}
                          </Text>
                        )}
                      </Grid.Col>

                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <Text size="xs" c={MUTED_OLIVE} mb={4} fw={500}>
                          Date of Birth
                        </Text>
                        {isEditing ? (
                          <TextInput
                            type="date"
                            value={editedData.dateOfBirth}
                            onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                            styles={inputStyles}
                          />
                        ) : (
                          <Text fw={500} c={displayData.dateOfBirth ? CHARCOAL : '#bbb'}>
                            {displayData.dateOfBirth || 'Not set'}
                          </Text>
                        )}
                      </Grid.Col>

                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <Text size="xs" c={MUTED_OLIVE} mb={4} fw={500}>
                          Place of Birth
                        </Text>
                        {isEditing ? (
                          <TextInput
                            value={editedData.placeOfBirth}
                            onChange={(e) => handleInputChange('placeOfBirth', e.target.value)}
                            styles={inputStyles}
                          />
                        ) : (
                          <Text fw={500} c={displayData.placeOfBirth ? CHARCOAL : '#bbb'}>
                            {displayData.placeOfBirth || 'Not set'}
                          </Text>
                        )}
                      </Grid.Col>

                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <Text size="xs" c={MUTED_OLIVE} mb={4} fw={500}>
                          Nationality
                        </Text>
                        {isEditing ? (
                          <TextInput
                            value={editedData.nationality}
                            onChange={(e) => handleInputChange('nationality', e.target.value)}
                            styles={inputStyles}
                          />
                        ) : (
                          <Text fw={500} c={displayData.nationality ? CHARCOAL : '#bbb'}>
                            {displayData.nationality || 'Not set'}
                          </Text>
                        )}
                      </Grid.Col>

                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <Text size="xs" c={MUTED_OLIVE} mb={4} fw={500}>
                          Sex
                        </Text>
                        {isEditing ? (
                          <TextInput
                            value={editedData.sex}
                            onChange={(e) => handleInputChange('sex', e.target.value)}
                            styles={inputStyles}
                          />
                        ) : (
                          <Text fw={500} c={displayData.sex ? CHARCOAL : '#bbb'}>
                            {displayData.sex || 'Not set'}
                          </Text>
                        )}
                      </Grid.Col>

                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <Text size="xs" c={MUTED_OLIVE} mb={4} fw={500}>
                          Civil Status
                        </Text>
                        {isEditing ? (
                          <TextInput
                            value={editedData.civilStatus}
                            onChange={(e) => handleInputChange('civilStatus', e.target.value)}
                            styles={inputStyles}
                          />
                        ) : (
                          <Text fw={500} c={displayData.civilStatus ? CHARCOAL : '#bbb'}>
                            {displayData.civilStatus || 'Not set'}
                          </Text>
                        )}
                      </Grid.Col>

                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <Text size="xs" c={MUTED_OLIVE} mb={4} fw={500}>
                          Telephone No.
                        </Text>
                        {isEditing ? (
                          <TextInput
                            value={editedData.telephoneNo}
                            onChange={(e) => handleInputChange('telephoneNo', e.target.value)}
                            styles={inputStyles}
                          />
                        ) : (
                          <Text fw={500} c={displayData.telephoneNo ? CHARCOAL : '#bbb'}>
                            {displayData.telephoneNo || 'Not set'}
                          </Text>
                        )}
                      </Grid.Col>

                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <Text size="xs" c={MUTED_OLIVE} mb={4} fw={500}>
                          Religious Affiliations
                        </Text>
                        {isEditing ? (
                          <TextInput
                            value={editedData.religiousAffiliations}
                            onChange={(e) => handleInputChange('religiousAffiliations', e.target.value)}
                            styles={inputStyles}
                          />
                        ) : (
                          <Text fw={500} c={displayData.religiousAffiliations ? CHARCOAL : '#bbb'}>
                            {displayData.religiousAffiliations || 'Not set'}
                          </Text>
                        )}
                      </Grid.Col>

                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <Text size="xs" c={MUTED_OLIVE} mb={4} fw={500}>
                          Father's Name
                        </Text>
                        {isEditing ? (
                          <TextInput
                            value={editedData.fathersName}
                            onChange={(e) => handleInputChange('fathersName', e.target.value)}
                            styles={inputStyles}
                          />
                        ) : (
                          <Text fw={500} c={displayData.fathersName ? CHARCOAL : '#bbb'}>
                            {displayData.fathersName || 'Not set'}
                          </Text>
                        )}
                      </Grid.Col>

                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <Text size="xs" c={MUTED_OLIVE} mb={4} fw={500}>
                          Mother's Name
                        </Text>
                        {isEditing ? (
                          <TextInput
                            value={editedData.mothersName}
                            onChange={(e) => handleInputChange('mothersName', e.target.value)}
                            styles={inputStyles}
                          />
                        ) : (
                          <Text fw={500} c={displayData.mothersName ? CHARCOAL : '#bbb'}>
                            {displayData.mothersName || 'Not set'}
                          </Text>
                        )}
                      </Grid.Col>

                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <Text size="xs" c={MUTED_OLIVE} mb={4} fw={500}>
                          Wife's Name
                        </Text>
                        {isEditing ? (
                          <TextInput
                            value={editedData.wifesName}
                            onChange={(e) => handleInputChange('wifesName', e.target.value)}
                            styles={inputStyles}
                          />
                        ) : (
                          <Text fw={500} c={displayData.wifesName ? CHARCOAL : '#bbb'}>
                            {displayData.wifesName || 'Not set'}
                          </Text>
                        )}
                      </Grid.Col>

                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <Text size="xs" c={MUTED_OLIVE} mb={4} fw={500}>
                          Husband's Name
                        </Text>
                        {isEditing ? (
                          <TextInput
                            value={editedData.husbandsName}
                            onChange={(e) => handleInputChange('husbandsName', e.target.value)}
                            styles={inputStyles}
                          />
                        ) : (
                          <Text fw={500} c={displayData.husbandsName ? CHARCOAL : '#bbb'}>
                            {displayData.husbandsName || 'Not set'}
                          </Text>
                        )}
                      </Grid.Col>

                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <Text size="xs" c={MUTED_OLIVE} mb={4} fw={500}>
                          Grade School
                        </Text>
                        {isEditing ? (
                          <TextInput
                            value={editedData.gradeSchool}
                            onChange={(e) => handleInputChange('gradeSchool', e.target.value)}
                            styles={inputStyles}
                          />
                        ) : (
                          <Text fw={500} c={displayData.gradeSchool ? CHARCOAL : '#bbb'}>
                            {displayData.gradeSchool || 'Not set'}
                          </Text>
                        )}
                      </Grid.Col>

                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <Text size="xs" c={MUTED_OLIVE} mb={4} fw={500}>
                          High School
                        </Text>
                        {isEditing ? (
                          <TextInput
                            value={editedData.highSchool}
                            onChange={(e) => handleInputChange('highSchool', e.target.value)}
                            styles={inputStyles}
                          />
                        ) : (
                          <Text fw={500} c={displayData.highSchool ? CHARCOAL : '#bbb'}>
                            {displayData.highSchool || 'Not set'}
                          </Text>
                        )}
                      </Grid.Col>

                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <Text size="xs" c={MUTED_OLIVE} mb={4} fw={500}>
                          College
                        </Text>
                        {isEditing ? (
                          <TextInput
                            value={editedData.college}
                            onChange={(e) => handleInputChange('college', e.target.value)}
                            styles={inputStyles}
                          />
                        ) : (
                          <Text fw={500} c={displayData.college ? CHARCOAL : '#bbb'}>
                            {displayData.college || 'Not set'}
                          </Text>
                        )}
                      </Grid.Col>

                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <Text size="xs" c={MUTED_OLIVE} mb={4} fw={500}>
                          Course
                        </Text>
                        {isEditing ? (
                          <TextInput
                            value={editedData.course}
                            onChange={(e) => handleInputChange('course', e.target.value)}
                            styles={inputStyles}
                          />
                        ) : (
                          <Text fw={500} c={displayData.course ? CHARCOAL : '#bbb'}>
                            {displayData.course || 'Not set'}
                          </Text>
                        )}
                      </Grid.Col>

                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <Text size="xs" c={MUTED_OLIVE} mb={4} fw={500}>
                          Honors Received
                        </Text>
                        {isEditing ? (
                          <TextInput
                            value={editedData.honorsReceived}
                            onChange={(e) => handleInputChange('honorsReceived', e.target.value)}
                            styles={inputStyles}
                          />
                        ) : (
                          <Text fw={500} c={displayData.honorsReceived ? CHARCOAL : '#bbb'}>
                            {displayData.honorsReceived || 'Not set'}
                          </Text>
                        )}
                      </Grid.Col>

                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <Text size="xs" c={MUTED_OLIVE} mb={4} fw={500}>
                          Affiliation
                        </Text>
                        {isEditing ? (
                          <TextInput
                            value={editedData.affiliation}
                            onChange={(e) => handleInputChange('affiliation', e.target.value)}
                            styles={inputStyles}
                          />
                        ) : (
                          <Text fw={500} c={displayData.affiliation ? CHARCOAL : '#bbb'}>
                            {displayData.affiliation || 'Not set'}
                          </Text>
                        )}
                      </Grid.Col>

                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <Text size="xs" c={MUTED_OLIVE} mb={4} fw={500}>
                          School Last Attended (if transferee)
                        </Text>
                        {isEditing ? (
                          <TextInput
                            value={editedData.schoolLastAttended}
                            onChange={(e) => handleInputChange('schoolLastAttended', e.target.value)}
                            styles={inputStyles}
                          />
                        ) : (
                          <Text fw={500} c={displayData.schoolLastAttended ? CHARCOAL : '#bbb'}>
                            {displayData.schoolLastAttended || 'Not set'}
                          </Text>
                        )}
                      </Grid.Col>

                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <Text size="xs" c={MUTED_OLIVE} mb={4} fw={500}>
                          Employer (if working)
                        </Text>
                        {isEditing ? (
                          <TextInput
                            value={editedData.employer}
                            onChange={(e) => handleInputChange('employer', e.target.value)}
                            styles={inputStyles}
                          />
                        ) : (
                          <Text fw={500} c={displayData.employer ? CHARCOAL : '#bbb'}>
                            {displayData.employer || 'Not set'}
                          </Text>
                        )}
                      </Grid.Col>
                    </>
                  )}
                </Grid>
              </Paper>

              {/* Contact / Account Information */}
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

                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Text size="xs" c={MUTED_OLIVE} mb={4} fw={500}>
                      Role
                    </Text>
                    <Text fw={500} c={CHARCOAL}>
                      {roleLabel}
                    </Text>
                  </Grid.Col>

                  {isAttorney && (
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <Text size="xs" c={MUTED_OLIVE} mb={4} fw={500}>
                        Account Status
                      </Text>
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
                  )}
                </Grid>
              </Paper>

              {/* ── Attorney-only sections below ── */}
              <Paper shadow="xs" p="xl" radius="lg" bg="white">
                <Group mb="md" gap={8}>
                  <IconEdit size={18} color={ACCENT_TAN} stroke={2} />
                  <Text size="sm" fw={600} c={CHARCOAL} tt="uppercase">Signature</Text>
                </Group>
                <Signature
                  initialUrl={displayData.signatureUrl}
                  defaultTypedName={`${displayData.firstName || ''} ${displayData.lastName || ''}`.trim()}
                  onSave={handleSignatureSave}
                />

                {displayData.signatureUrl && (
                  <Box mt="md">
                    <Text size="xs" c={MUTED_OLIVE} mb={4} fw={500}>Saved Signature</Text>
                    <Box mt="xs">
                      <img
                        src={displayData.signatureUrl}
                        alt="Saved signature"
                        style={{ maxWidth: 360, maxHeight: 180, border: '1px solid #eee', borderRadius: 6 }}
                      />
                    </Box>
                  </Box>
                )}
              </Paper>

              {isAttorney && (
                <>
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
                        <Text size="xs" c={MUTED_OLIVE} mb={4} fw={500}>
                          PRC License Number
                        </Text>
                        <Text fw={500} c={displayData.prcLicenseNumber ? CHARCOAL : '#bbb'}>
                          {displayData.prcLicenseNumber || 'Not set'}
                        </Text>
                      </Grid.Col>

                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <Text size="xs" c={MUTED_OLIVE} mb={4} fw={500}>
                          IBR Number
                        </Text>
                        <Text fw={500} c={displayData.ibrNumber ? CHARCOAL : '#bbb'}>
                          {displayData.ibrNumber || 'Not set'}
                        </Text>
                      </Grid.Col>

                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <Text size="xs" c={MUTED_OLIVE} mb={4} fw={500}>
                          Bar Admission Date
                        </Text>
                        <Text fw={500} c={displayData.barAdmissionDate ? CHARCOAL : '#bbb'}>
                          {displayData.barAdmissionDate || 'Not set'}
                        </Text>
                      </Grid.Col>

                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <Text size="xs" c={MUTED_OLIVE} mb={4} fw={500}>
                          Law Firm / Organization
                        </Text>
                        {isEditing ? (
                          <TextInput
                            value={editedData.lawFirm}
                            onChange={(e) => handleInputChange('lawFirm', e.target.value)}
                            placeholder="Law firm name"
                            styles={inputStyles}
                          />
                        ) : (
                          <Text fw={500} c={displayData.lawFirm ? CHARCOAL : '#bbb'}>
                            {displayData.lawFirm || 'Not set'}
                          </Text>
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
                      {/* Specializations */}
                      <Box>
                        <Text size="xs" c={MUTED_OLIVE} mb={4} fw={500}>
                          Areas of Specialization
                        </Text>
                        {isEditing ? (
                          <MultiSelect
                            value={editedData.specializations}
                            onChange={(value) => handleInputChange('specializations', value)}
                            data={SPECIALIZATIONS}
                            searchable
                            styles={inputStyles}
                          />
                        ) : displayData.specializations?.length > 0 ? (
                          <Group gap="xs">
                            {displayData.specializations.map((spec) => (
                              <Badge key={spec} size="sm" variant="light" color="blue" radius="sm">
                                {spec}
                              </Badge>
                            ))}
                          </Group>
                        ) : (
                          <Text fw={500} c="#bbb">Not set</Text>
                        )}
                      </Box>

                      {/* Languages */}
                      <Box>
                        <Text size="xs" c={MUTED_OLIVE} mb={4} fw={500}>
                          Languages
                        </Text>
                        {isEditing ? (
                          <MultiSelect
                            value={editedData.languages}
                            onChange={(value) => handleInputChange('languages', value)}
                            data={LANGUAGES}
                            searchable
                            styles={inputStyles}
                          />
                        ) : displayData.languages?.length > 0 ? (
                          <Group gap="xs">
                            {displayData.languages.map((lang) => (
                              <Badge key={lang} size="sm" variant="light" color="grape" radius="sm">
                                {lang}
                              </Badge>
                            ))}
                          </Group>
                        ) : (
                          <Text fw={500} c="#bbb">Not set</Text>
                        )}
                      </Box>

                      {/* Consultation Methods */}
                      <Box>
                        <Text size="xs" c={MUTED_OLIVE} mb={4} fw={500}>
                          Consultation Methods
                        </Text>
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
                              <Badge size="sm" variant="light" color="cyan" radius="sm">
                                Online Consultation
                              </Badge>
                            )}
                            {displayData.consultationMode.includes('in-person') && (
                              <Badge size="sm" variant="light" color="orange" radius="sm">
                                In-Person Meeting
                              </Badge>
                            )}
                          </Group>
                        ) : (
                          <Text fw={500} c="#bbb">Not set</Text>
                        )}
                      </Box>

                      {/* Biography */}
                      <Box>
                        <Text size="xs" c={MUTED_OLIVE} mb={4} fw={500}>
                          Professional Biography
                        </Text>
                        {isEditing ? (
                          <Textarea
                            value={editedData.biography}
                            onChange={(e) => handleInputChange('biography', e.target.value)}
                            placeholder="Share your legal background, experience, and expertise..."
                            minRows={5}
                            styles={inputStyles}
                          />
                        ) : (
                          <Text
                            fw={500}
                            c={displayData.biography ? CHARCOAL : '#bbb'}
                            style={{ whiteSpace: 'pre-wrap' }}
                          >
                            {displayData.biography || 'Not set'}
                          </Text>
                        )}
                      </Box>
                    </Stack>
                  </Paper>
                </>
              )}
            </Stack>
          </Grid.Col>
        </Grid>
      </Container>
    </Box>
  );
}
