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
  Avatar,
  Divider,
  Grid,
  Badge,
  ActionIcon,
  Loader,
  Center,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconUser,
  IconMail,
  IconPhone,
  IconMapPin,
  IconEdit,
  IconCheck,
  IconX,
  IconShieldCheck,
} from '@tabler/icons-react';
import { PRIMARY_GOLD, PRIMARY_BROWN, MUTED_OLIVE, THEMED_LIGHT_BG, CHARCOAL } from '@utils/constants';
import apiClient from '@config/api/apiClient';

export default function ClientProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
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
    verified: false,
    memberSince: '',
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
        const profileData = response.data.data;
        // Ensure address object exists
        const normalizedData = {
          ...profileData,
          address: profileData.address || {
            street: '',
            barangay: '',
            city: '',
            province: '',
            region: '',
            zipCode: '',
          }
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
    setEditedData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddressChange = (field, value) => {
    setEditedData(prev => ({
      ...prev,
      address: {
        ...(prev.address || {}),
        [field]: value,
      }
    }));
  };

  if (loading) {
    return (
      <Box bg={THEMED_LIGHT_BG} mih="100vh" py="xl">
        <Center py="xl">
          <Stack align="center" gap="md">
            <Loader size="lg" color={PRIMARY_BROWN} />
            <Text c={MUTED_OLIVE}>Loading profile...</Text>
          </Stack>
        </Center>
      </Box>
    );
  }

  const displayData = isEditing ? editedData : userData;

  return (
    <Box bg={THEMED_LIGHT_BG} mih="100vh" py="xl">
      <style>
        {`
          ::-webkit-scrollbar {
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
                Manage your personal information
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
                      background: PRIMARY_GOLD,
                      border: `4px solid ${PRIMARY_GOLD}`,
                    }}
                  >
                    <IconUser size={60} color="white" />
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
                    {displayData.phoneNumber || 'Not provided'}
                  </Text>
                )}
              </Box>
            </Stack>
          </Box>

          <Divider mb="xl" style={{ borderColor: '#F0F0F0' }} />

          {/* Address Section */}
          {/* <Box>
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
                Address
              </Text>
            </Group>

            <Stack gap="md">
              <Box>
                <Text size="xs" c={MUTED_OLIVE} mb={6} fw={500}>
                  Street Address
                </Text>
                {isEditing ? (
                  <TextInput
                    value={editedData.address?.street || ''}
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
                    {displayData.address?.street || 'Not provided'}
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
                        value={editedData.address?.barangay || ''}
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
                        {displayData.address?.barangay || 'Not provided'}
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
                        value={editedData.address?.city || ''}
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
                        {displayData.address?.city || 'Not provided'}
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
                        value={editedData.address?.province || ''}
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
                        {displayData.address?.province || 'Not provided'}
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
                        value={editedData.address?.zipCode || ''}
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
                        {displayData.address?.zipCode || 'Not provided'}
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
                    value={editedData.address?.region || ''}
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
                    {displayData.address?.region || 'Not provided'}
                  </Text>
                )}
              </Box>
            </Stack>
          </Box> */}

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