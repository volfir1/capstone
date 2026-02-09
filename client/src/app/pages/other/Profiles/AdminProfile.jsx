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
  IconUserShield,
  IconScale,
  IconCertificate,
  IconBriefcase,
} from '@tabler/icons-react';
import { PRIMARY_GOLD, PRIMARY_BROWN, MUTED_OLIVE, BG, CHARCOAL, ACCENT_TAN } from '@utils/constants';
import apiClient from '@config/api/apiClient';
import { useAuth } from '@context/authContext';

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
  const { userData: authUserData, loading: authLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const isAttorney = ATTORNEY_ROLES.includes(authUserData?.role);
  const userRole = authUserData?.role || 'secretary';

  // ── State for regular (User) accounts ──
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    role: '',
    verified: false,
    memberSince: '',
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
  });

  const [editedData, setEditedData] = useState({});

  useEffect(() => {
    if (!authUserData) return;

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
      };
      setAttorneyData(profile);
      setEditedData(profile);
    } else {
      const profile = {
        firstName: authUserData.firstName || '',
        lastName: authUserData.lastName || '',
        email: authUserData.email || '',
        username: authUserData.username || '',
        role: authUserData.role || '',
        verified: authUserData.isVerified || false,
        memberSince: authUserData.createdAt
          ? new Date(authUserData.createdAt).getFullYear().toString()
          : '',
      };
      setUserData(profile);
      setEditedData(profile);
    }
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
    const fields = [userData.firstName, userData.lastName, userData.email];
    const filled = fields.filter((f) => f && f.trim()).length;
    return Math.round((filled / fields.length) * 100);
  }, [isAttorney, userData, attorneyData]);

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
      const endpoint = isAttorney ? '/attorney/profile' : '/admin/profile';
      const response = await apiClient.put(endpoint, editedData);
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

  if (authLoading) {
    return <Loaders height={window.innerHeight} />;
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
      <Container size="lg">
        <Grid gutter="xl">
          {/* ── Sidebar ── */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Paper shadow="xs" p="xl" radius="lg" bg="white">
              <Stack align="center" gap="md">
                {/* Avatar */}
                <Box style={{ position: 'relative' }}>
                  <Avatar
                    size={140}
                    radius={70}
                    style={{
                      background: ACCENT_TAN,
                      border: `4px solid ${PRIMARY_GOLD}`,
                    }}
                  >
                    {avatarIcon}
                  </Avatar>
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
                    {displayData.firstName}{' '}
                    {isAttorney && displayData.middleName ? `${displayData.middleName} ` : ''}
                    {displayData.lastName}
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
