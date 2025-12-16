import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Title,
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
  ActionIcon,
  MultiSelect,
  Checkbox,
  Center
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Loaders } from '@/components/ui/Loader';
import {
  IconUser,
  IconMail,
  IconPhone,
  IconMapPin,
  IconEdit,
  IconCheck,
  IconX,
  IconShieldCheck,
  IconBriefcase,
  IconScale,
  IconCertificate,
  IconLanguage,
} from '@tabler/icons-react';
import { PRIMARY_GOLD, PRIMARY_BROWN, MUTED_OLIVE, THEMED_LIGHT_BG, CHARCOAL, ACCENT_TAN } from '@utils/constants';
import apiClient from '@config/api/apiClient';
import { useAuth } from '@context/authContext';

const SPECIALIZATIONS = [
  { value: 'criminal', label: 'Criminal Law' },
  { value: 'civil', label: 'Civil Law' },
  { value: 'family', label: 'Family Law' },
  { value: 'labor', label: 'Labor Law' },
  { value: 'commercial', label: 'Commercial Law' },
  { value: 'tax', label: 'Tax Law' },
  { value: 'immigration', label: 'Immigration Law' },
  { value: 'property', label: 'Land and Property Law' },
  { value: 'human_rights', label: 'Human Rights' },
  { value: 'environmental', label: 'Environmental Law' },
  { value: 'agrarian', label: 'Agrarian Law' },
  { value: 'administrative', label: 'Administrative Law' },
  { value: 'corporate', label: 'Corporate Law' },
  { value: 'ip', label: 'Intellectual Property' },
  { value: 'other', label: 'Other' },
];

const LANGUAGES = [
  { value: 'english', label: 'English' },
  { value: 'filipino', label: 'Filipino/Tagalog' },
  { value: 'cebuano', label: 'Cebuano' },
  { value: 'ilocano', label: 'Ilocano' },
  { value: 'hiligaynon', label: 'Hiligaynon' },
  { value: 'waray', label: 'Waray' },
  { value: 'kapampangan', label: 'Kapampangan' },
  { value: 'bikol', label: 'Bikol' },
  { value: 'pangasinan', label: 'Pangasinan' },
  { value: 'other', label: 'Other' },
];

export default function AttorneyProfile() {
  const { userData: authUserData, loading: authLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
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
    verified: false,
    memberSince: '',
    prcLicenseNumber: '',
    ibrNumber: '',
    barAdmissionDate: '',
    lawFirm: '',
    specializations: [],
    languages: [],
    consultationMode: [],
    biography: '',
  });

  const [editedData, setEditedData] = useState(userData);

  useEffect(() => {
    if (authUserData) {
      // Map authContext data to profile structure
      const profileData = {
        firstName: authUserData.firstName || '',
        middleName: authUserData.middleName || '',
        lastName: authUserData.lastName || '',
        email: authUserData.email || '',
        phoneNumber: authUserData.phoneNumber || '',
        officeAddress: authUserData.officeAddress || {
          street: '',
          barangay: '',
          city: '',
          province: '',
          region: '',
          zipCode: '',
        },
        verified: authUserData.isVerified || false,
        memberSince: authUserData.createdAt ? new Date(authUserData.createdAt).getFullYear().toString() : '',
        prcLicenseNumber: authUserData.prcLicenseNumber || '',
        ibrNumber: authUserData.ibrNumber || '',
        barAdmissionDate: authUserData.barAdmissionDate ? new Date(authUserData.barAdmissionDate).toLocaleDateString() : '',
        lawFirm: authUserData.lawFirm || '',
        specializations: authUserData.specializations || [],
        languages: authUserData.languages || [],
        consultationMode: authUserData.consultationMode || [],
        biography: authUserData.biography || '',
      };
      
      setUserData(profileData);
      setEditedData(profileData);
    }
  }, [authUserData]);

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
    setEditedData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddressChange = (field, value) => {
    setEditedData(prev => ({
      ...prev,
      officeAddress: {
        ...prev.officeAddress,
        [field]: value,
      }
    }));
  };

  if (authLoading) {
    return <Loaders height={window.innerHeight} />;
  }

  const displayData = isEditing ? editedData : userData;

  return (
    <Box bg={THEMED_LIGHT_BG} mih="100vh" py="xl">
      <style>
        {`
      authL   ::-webkit-scrollbar {
            width: 8px;
          }
          ::-webkit-scrollbar-track {
            background: transparent;
          }
          ::-webkit-scrollbar-thumb {
            background: ${MUTED_OLIVE};
            border-radius: 4px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: ${PRIMARY_BROWN};
          }
          * {
            scrollbar-width: thin;
            scrollbar-color: ${MUTED_OLIVE} transparent;
          }
        `}
      </style>

      <Container size="md">
        {/* Header */}
        <Paper 
          shadow="xs" 
          p="xl" 
          mb="xl" 
          radius="lg"
          style={{ 
            background: PRIMARY_BROWN,
            border: 'none',
          }}
        >
          <Group justify="space-between" align="center">
            <Box>
              <Title order={2} c="white" mb={4}>
                My Profile
              </Title>
              <Text c="rgba(255, 255, 255, 0.9)" size="sm" fw={500}>
                Manage your professional information
              </Text>
            </Box>
            {!isEditing && (
              <ActionIcon
                size="lg"
                variant="white"
                color={PRIMARY_BROWN}
                onClick={handleEdit}
                radius="md"
              >
                <IconEdit size={20} />
              </ActionIcon>
            )}
          </Group>
        </Paper>

        {/* Profile Card */}
        <Paper shadow="xs" p="xl" radius="lg" bg="white" mb="lg">
          {/* Avatar Section */}
          <Box mb="xl">
            <Center>
              <Stack align="center" gap="md">
                <Box style={{ position: 'relative' }}>
                  <Avatar
                    size={120}
                    radius={60}
                    style={{
                      background: PRIMARY_BROWN,
                      border: `4px solid ${PRIMARY_GOLD}`,
                    }}
                  >
                    <IconScale size={60} color="white" />
                  </Avatar>
                  {userData.verified && (
                    <Box
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: `3px solid white`,
                      }}
                    >
                      <Box
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: '50%',
                          background: PRIMARY_GOLD,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <IconShieldCheck size={18} color="white" />
                      </Box>
                    </Box>
                  )}
                </Box>
                <Box ta="center">
                  <Text size="xl" fw={700} c={CHARCOAL} mb={4}>
                    {displayData.firstName} {displayData.middleName} {displayData.lastName}
                  </Text>
                  <Group justify="center" gap="xs" mb={4}>
                    <Badge
                      size="sm"
                      variant="light"
                      style={{
                        background: '#FEF8F0',
                        color: PRIMARY_BROWN,
                      }}
                    >
                      Attorney
                    </Badge>
                    <Badge
                      size="sm"
                      variant="light"
                      style={{
                        background: '#FEF8F0',
                        color: PRIMARY_BROWN,
                      }}
                    >
                      Member since {userData.memberSince}
                    </Badge>
                  </Group>
                </Box>
              </Stack>
            </Center>
          </Box>

          <Divider mb="xl" style={{ borderColor: '#F0F0F0' }} />

          {/* Personal Information Section */}
          <Box mb="xl">
            <Group mb="md" gap="xs">
              <Box
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '8px',
                  background: PRIMARY_BROWN,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconUser size={18} color="white" stroke={2.5} />
              </Box>
              <Text size="sm" fw={600} c={CHARCOAL} tt="uppercase">
                Personal Information
              </Text>
            </Group>

            <Stack gap="md">
              <Grid gutter="md">
                <Grid.Col span={12} md={6}>
                  <Box>
                    <Text size="xs" c={MUTED_OLIVE} mb={6} fw={500}>
                      First Name
                    </Text>
                    {isEditing ? (
                      <TextInput
                        value={editedData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        styles={{
                          input: {
                            borderColor: '#E5E0D8',
                            '&:focus': { borderColor: PRIMARY_GOLD },
                          }
                        }}
                      />
                    ) : (
                      <Text fw={500} c={CHARCOAL}>
                        {displayData.firstName}
                      </Text>
                    )}
                  </Box>
                </Grid.Col>
                <Grid.Col span={12} md={6}>
                  <Box>
                    <Text size="xs" c={MUTED_OLIVE} mb={6} fw={500}>
                      Middle Name
                    </Text>
                    {isEditing ? (
                      <TextInput
                        value={editedData.middleName}
                        onChange={(e) => handleInputChange('middleName', e.target.value)}
                        styles={{
                          input: {
                            borderColor: '#E5E0D8',
                            '&:focus': { borderColor: PRIMARY_GOLD },
                          }
                        }}
                      />
                    ) : (
                      <Text fw={500} c={CHARCOAL}>
                        {displayData.middleName || 'N/A'}
                      </Text>
                    )}
                  </Box>
                </Grid.Col>
              </Grid>

              <Box>
                <Text size="xs" c={MUTED_OLIVE} mb={6} fw={500}>
                  Last Name
                </Text>
                {isEditing ? (
                  <TextInput
                    value={editedData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    styles={{
                      input: {
                        borderColor: '#E5E0D8',
                        '&:focus': { borderColor: PRIMARY_GOLD },
                      }
                    }}
                  />
                ) : (
                  <Text fw={500} c={CHARCOAL}>
                    {displayData.lastName}
                  </Text>
                )}
              </Box>
            </Stack>
          </Box>

          <Divider mb="xl" style={{ borderColor: '#F0F0F0' }} />

          {/* Contact Information Section */}
          <Box mb="xl">
            <Group mb="md" gap="xs">
              <Box
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '8px',
                  background: PRIMARY_GOLD,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconMail size={18} color="white" stroke={2.5} />
              </Box>
              <Text size="sm" fw={600} c={CHARCOAL} tt="uppercase">
                Contact Information
              </Text>
            </Group>

            <Stack gap="md">
              <Box>
                <Group gap="xs" mb={6}>
                  <IconMail size={14} color={MUTED_OLIVE} />
                  <Text size="xs" c={MUTED_OLIVE} fw={500}>
                    Email Address
                  </Text>
                </Group>
                <Text fw={500} c={CHARCOAL}>
                  {displayData.email}
                </Text>
              </Box>

              <Box>
                <Group gap="xs" mb={6}>
                  <IconPhone size={14} color={MUTED_OLIVE} />
                  <Text size="xs" c={MUTED_OLIVE} fw={500}>
                    Phone Number
                  </Text>
                </Group>
                {isEditing ? (
                  <TextInput
                    value={editedData.phoneNumber}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    placeholder="+639171234567"
                    styles={{
                      input: {
                        borderColor: '#E5E0D8',
                        '&:focus': { borderColor: PRIMARY_GOLD },
                      }
                    }}
                  />
                ) : (
                  <Text fw={500} c={CHARCOAL}>
                    {displayData.phoneNumber}
                  </Text>
                )}
              </Box>
            </Stack>
          </Box>

          <Divider mb="xl" style={{ borderColor: '#F0F0F0' }} />

          {/* Office Address Section */}
          {/* <Box mb="xl">
            <Group mb="md" gap="xs">
              <Box
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '8px',
                  background: MUTED_OLIVE,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconMapPin size={18} color="white" stroke={2.5} />
              </Box>
              <Text size="sm" fw={600} c={CHARCOAL} tt="uppercase">
                Office Address
              </Text>
            </Group>

            <Stack gap="md">
              <Box>
                <Text size="xs" c={MUTED_OLIVE} mb={6} fw={500}>
                  Street Address
                </Text>
                {isEditing ? (
                  <TextInput
                    value={editedData.officeAddress.street}
                    onChange={(e) => handleAddressChange('street', e.target.value)}
                    placeholder="Building name, street number"
                    styles={{
                      input: {
                        borderColor: '#E5E0D8',
                        '&:focus': { borderColor: PRIMARY_GOLD },
                      }
                    }}
                  />
                ) : (
                  <Text fw={500} c={CHARCOAL}>
                    {displayData.officeAddress.street || 'Not provided'}
                  </Text>
                )}
              </Box>

              <Grid gutter="md">
                <Grid.Col span={12} md={6}>
                  <Box>
                    <Text size="xs" c={MUTED_OLIVE} mb={6} fw={500}>
                      Barangay
                    </Text>
                    {isEditing ? (
                      <TextInput
                        value={editedData.officeAddress.barangay}
                        onChange={(e) => handleAddressChange('barangay', e.target.value)}
                        placeholder="Barangay name"
                        styles={{
                          input: {
                            borderColor: '#E5E0D8',
                            '&:focus': { borderColor: PRIMARY_GOLD },
                          }
                        }}
                      />
                    ) : (
                      <Text fw={500} c={CHARCOAL}>
                        {displayData.officeAddress.barangay || 'Not provided'}
                      </Text>
                    )}
                  </Box>
                </Grid.Col>
                <Grid.Col span={12} md={6}>
                  <Box>
                    <Text size="xs" c={MUTED_OLIVE} mb={6} fw={500}>
                      City
                    </Text>
                    {isEditing ? (
                      <TextInput
                        value={editedData.officeAddress.city}
                        onChange={(e) => handleAddressChange('city', e.target.value)}
                        placeholder="City name"
                        styles={{
                          input: {
                            borderColor: '#E5E0D8',
                            '&:focus': { borderColor: PRIMARY_GOLD },
                          }
                        }}
                      />
                    ) : (
                      <Text fw={500} c={CHARCOAL}>
                        {displayData.officeAddress.city}
                      </Text>
                    )}
                  </Box>
                </Grid.Col>
              </Grid>

              <Grid gutter="md">
                <Grid.Col span={12} md={8}>
                  <Box>
                    <Text size="xs" c={MUTED_OLIVE} mb={6} fw={500}>
                      Province
                    </Text>
                    {isEditing ? (
                      <TextInput
                        value={editedData.officeAddress.province}
                        onChange={(e) => handleAddressChange('province', e.target.value)}
                        placeholder="Province name"
                        styles={{
                          input: {
                            borderColor: '#E5E0D8',
                            '&:focus': { borderColor: PRIMARY_GOLD },
                          }
                        }}
                      />
                    ) : (
                      <Text fw={500} c={CHARCOAL}>
                        {displayData.officeAddress.province}
                      </Text>
                    )}
                  </Box>
                </Grid.Col>
                <Grid.Col span={12} md={4}>
                  <Box>
                    <Text size="xs" c={MUTED_OLIVE} mb={6} fw={500}>
                      Zip Code
                    </Text>
                    {isEditing ? (
                      <TextInput
                        value={editedData.officeAddress.zipCode}
                        onChange={(e) => handleAddressChange('zipCode', e.target.value)}
                        placeholder="1000"
                        styles={{
                          input: {
                            borderColor: '#E5E0D8',
                            '&:focus': { borderColor: PRIMARY_GOLD },
                          }
                        }}
                      />
                    ) : (
                      <Text fw={500} c={CHARCOAL}>
                        {displayData.officeAddress.zipCode || 'Not provided'}
                      </Text>
                    )}
                  </Box>
                </Grid.Col>
              </Grid>

              <Box>
                <Text size="xs" c={MUTED_OLIVE} mb={6} fw={500}>
                  Region
                </Text>
                {isEditing ? (
                  <TextInput
                    value={editedData.officeAddress.region}
                    onChange={(e) => handleAddressChange('region', e.target.value)}
                    placeholder="e.g., NCR, Region III"
                    styles={{
                      input: {
                        borderColor: '#E5E0D8',
                        '&:focus': { borderColor: PRIMARY_GOLD },
                      }
                    }}
                  />
                ) : (
                  <Text fw={500} c={CHARCOAL}>
                    {displayData.officeAddress.region}
                  </Text>
                )}
              </Box>
            </Stack>
          </Box> */}

          <Divider mb="xl" style={{ borderColor: '#F0F0F0' }} />

          {/* Professional Credentials Section */}
          <Box mb="xl">
            <Group mb="md" gap="xs">
              <Box
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '8px',
                  background: ACCENT_TAN,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconCertificate size={18} color="white" stroke={2.5} />
              </Box>
              <Text size="sm" fw={600} c={CHARCOAL} tt="uppercase">
                Professional Credentials
              </Text>
            </Group>

            <Stack gap="md">
              <Grid gutter="md">
                <Grid.Col span={12} md={6}>
                  <Box>
                    <Text size="xs" c={MUTED_OLIVE} mb={6} fw={500}>
                      PRC License Number
                    </Text>
                    <Text fw={500} c={CHARCOAL}>
                      {displayData.prcLicenseNumber}
                    </Text>
                  </Box>
                </Grid.Col>
                <Grid.Col span={12} md={6}>
                  <Box>
                    <Text size="xs" c={MUTED_OLIVE} mb={6} fw={500}>
                      IBR Number
                    </Text>
                    <Text fw={500} c={CHARCOAL}>
                      {displayData.ibrNumber}
                    </Text>
                  </Box>
                </Grid.Col>
              </Grid>

              <Grid gutter="md">
                <Grid.Col span={12} md={6}>
                  <Box>
                    <Text size="xs" c={MUTED_OLIVE} mb={6} fw={500}>
                      Bar Admission Date
                    </Text>
                    <Text fw={500} c={CHARCOAL}>
                      {displayData.barAdmissionDate}
                    </Text>
                  </Box>
                </Grid.Col>
                <Grid.Col span={12} md={6}>
                  <Box>
                    <Text size="xs" c={MUTED_OLIVE} mb={6} fw={500}>
                      Law Firm / Organization
                    </Text>
                    {isEditing ? (
                      <TextInput
                        value={editedData.lawFirm}
                        onChange={(e) => handleInputChange('lawFirm', e.target.value)}
                        placeholder="Law firm name"
                        styles={{
                          input: {
                            borderColor: '#E5E0D8',
                            '&:focus': { borderColor: PRIMARY_GOLD },
                          }
                        }}
                      />
                    ) : (
                      <Text fw={500} c={CHARCOAL}>
                        {displayData.lawFirm || 'Not provided'}
                      </Text>
                    )}
                  </Box>
                </Grid.Col>
              </Grid>
            </Stack>
          </Box>

          <Divider mb="xl" style={{ borderColor: '#F0F0F0' }} />

          {/* Practice Information Section */}
          <Box mb="xl">
            <Group mb="md" gap="xs">
              <Box
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '8px',
                  background: PRIMARY_BROWN,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconBriefcase size={18} color="white" stroke={2.5} />
              </Box>
              <Text size="sm" fw={600} c={CHARCOAL} tt="uppercase">
                Practice Information
              </Text>
            </Group>

            <Stack gap="md">
              <Box>
                <Text size="xs" c={MUTED_OLIVE} mb={6} fw={500}>
                  Areas of Specialization
                </Text>
                {isEditing ? (
                  <MultiSelect
                    value={editedData.specializations}
                    onChange={(value) => handleInputChange('specializations', value)}
                    data={SPECIALIZATIONS}
                    searchable
                    styles={{
                      input: {
                        borderColor: '#E5E0D8',
                        '&:focus': { borderColor: PRIMARY_GOLD },
                      }
                    }}
                  />
                ) : displayData.specializations && displayData.specializations.length > 0 ? (
                  <Group gap="xs">
                    {displayData.specializations.map((spec) => (
                      <Badge
                        key={spec}
                        size="sm"
                        variant="light"
                        style={{
                          background: '#FEF8F0',
                          color: PRIMARY_BROWN,
                        }}
                      >
                        {SPECIALIZATIONS.find(s => s.value === spec)?.label || spec}
                      </Badge>
                    ))}
                  </Group>
                ) : (
                  <Text fw={500} c={CHARCOAL}>Not provided</Text>
                )}
              </Box>

              <Box>
                <Text size="xs" c={MUTED_OLIVE} mb={6} fw={500}>
                  Languages
                </Text>
                {isEditing ? (
                  <MultiSelect
                    value={editedData.languages}
                    onChange={(value) => handleInputChange('languages', value)}
                    data={LANGUAGES}
                    searchable
                    styles={{
                      input: {
                        borderColor: '#E5E0D8',
                        '&:focus': { borderColor: PRIMARY_GOLD },
                      }
                    }}
                  />
                ) : displayData.languages && displayData.languages.length > 0 ? (
                  <Group gap="xs">
                    {displayData.languages.map((lang) => (
                      <Badge
                        key={lang}
                        size="sm"
                        variant="light"
                        style={{
                          background: '#FEF8F0',
                          color: MUTED_OLIVE,
                        }}
                      >
                        {LANGUAGES.find(l => l.value === lang)?.label || lang}
                      </Badge>
                    ))}
                  </Group>
                ) : (
                  <Text fw={500} c={CHARCOAL}>Not provided</Text>
                )}
              </Box>

              <Box>
                <Text size="xs" c={MUTED_OLIVE} mb={6} fw={500}>
                  Consultation Methods
                </Text>
                {isEditing ? (
                  <Stack gap="xs">
                    <Checkbox
                      label="Online Consultation (Video/Phone)"
                      checked={editedData.consultationMode?.includes('online')}
                      onChange={(e) => {
                        const newValue = e.currentTarget.checked
                          ? [...(editedData.consultationMode || []), 'online']
                          : editedData.consultationMode?.filter((v) => v !== 'online');
                        handleInputChange('consultationMode', newValue);
                      }}
                    />
                    <Checkbox
                      label="In-Person Meeting at Office"
                      checked={editedData.consultationMode?.includes('in-person')}
                      onChange={(e) => {
                        const newValue = e.currentTarget.checked
                          ? [...(editedData.consultationMode || []), 'in-person']
                          : editedData.consultationMode?.filter((v) => v !== 'in-person');
                        handleInputChange('consultationMode', newValue);
                      }}
                    />
                  </Stack>
                ) : displayData.consultationMode && displayData.consultationMode.length > 0 ? (
                  <Group gap="xs">
                    {displayData.consultationMode.includes('online') && (
                      <Badge size="sm" variant="light" style={{ background: '#FEF8F0', color: PRIMARY_BROWN }}>
                        Online Consultation
                      </Badge>
                    )}
                    {displayData.consultationMode.includes('in-person') && (
                      <Badge size="sm" variant="light" style={{ background: '#FEF8F0', color: PRIMARY_BROWN }}>
                        In-Person Meeting
                      </Badge>
                    )}
                  </Group>
                ) : (
                  <Text fw={500} c={CHARCOAL}>Not provided</Text>
                )}
              </Box>

              <Box>
                <Text size="xs" c={MUTED_OLIVE} mb={6} fw={500}>
                  Professional Biography
                </Text>
                {isEditing ? (
                  <Textarea
                    value={editedData.biography}
                    onChange={(e) => handleInputChange('biography', e.target.value)}
                    placeholder="Share your legal background, years of experience, and expertise..."
                    minRows={5}
                    styles={{
                      input: {
                        borderColor: '#E5E0D8',
                        '&:focus': { borderColor: PRIMARY_GOLD },
                      }
                      }}
                  />
                ) : (
                  <Text fw={500} c={CHARCOAL}>
                    {displayData.biography || 'Not provided'}
                  </Text>
                )}
              </Box>
            </Stack>
          </Box>

          {/* Edit Actions */}
          {isEditing && (
            <>
              <Divider my="xl" style={{ borderColor: '#F0F0F0' }} />
              <Group justify="flex-end" gap="md">
                <Button
                  variant="outline"
                  leftIcon={<IconX size={16} />}
                  onClick={handleCancel}
                  disabled={saving}
                  style={{
                    borderColor: MUTED_OLIVE,
                    color: MUTED_OLIVE,
                  }}
                >
                  Cancel
                </Button>
                <Button
                  leftIcon={<IconCheck size={16} />}
                  onClick={handleSave}
                  loading={saving}
                  style={{
                    background: PRIMARY_BROWN,
                  }}
                >
                  Save Changes
                </Button>
              </Group>
            </>
          )}
        </Paper>
      </Container>
    </Box>
  );
}