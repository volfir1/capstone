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
  Avatar,
  Divider,
  Grid,
  Badge,
  Progress,
  Loader,
  Center,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconUser,
  IconMail,
  IconEdit,
  IconCheck,
  IconX,
  IconShieldCheck,
} from '@tabler/icons-react';
import { PRIMARY_GOLD, PRIMARY_BROWN, MUTED_OLIVE, BG, CHARCOAL, ACCENT_TAN } from '@utils/constants';
import apiClient from '@config/api/apiClient';

export default function ClientProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    role: '',
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

  if (loading) {
    return (
      <Box bg={BG} mih="100vh" py="xl">
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

  const inputStyles = {
    input: { borderColor: '#E5E0D8', '&:focus': { borderColor: PRIMARY_GOLD } },
  };

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
                      background: PRIMARY_GOLD,
                      border: `4px solid ${PRIMARY_GOLD}`,
                    }}
                  >
                    <IconUser size={70} color="white" />
                  </Avatar>
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
            </Stack>
          </Grid.Col>
        </Grid>
      </Container>
    </Box>
  );
}
