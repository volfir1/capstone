import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Title,
  Text,
  Box,
  Group,
  Stack,
  Badge,
  ActionIcon,
  Loader,
  Center,
  Button,
  Avatar,
  Divider,
  ThemeIcon,
  Card,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconArrowLeft,
  IconRefresh,
  IconBriefcase,
  IconMail,
  IconPhone,
  IconId,
  IconFileText,
  IconCheck,
  IconX,
  IconCheckbox,
  IconUser,
} from '@tabler/icons-react';
import { PRIMARY_GOLD, PRIMARY_BROWN, MUTED_OLIVE, THEMED_LIGHT_BG, CHARCOAL } from '@utils/constants';
import apiClient from '@config/api/apiClient';

export default function ManageAttorneys() {
  const navigate = useNavigate();
  const [attorneys, setAttorneys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activating, setActivating] = useState(null);

  useEffect(() => {
    fetchAttorneys();
  }, []);

  const fetchAttorneys = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/auth/all-attorneys');

      if (response.data.success) {
        setAttorneys(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching attorneys:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to load attorneys',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleActivateAccount = async (attorneyId) => {
    try {
      setActivating(attorneyId);
      const response = await apiClient.put(`/auth/activate-attorney/${attorneyId}`);

      if (response.data.success) {
        notifications.show({
          title: 'Success',
          message: 'Attorney account activated successfully',
          color: 'green',
        });
        fetchAttorneys();
      }
    } catch (error) {
      console.error('Error activating attorney:', error);
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to activate account',
        color: 'red',
      });
    } finally {
      setActivating(null);
    }
  };

  const confirmActivation = (attorney) => {
    const confirmed = window.confirm(
      `Are you sure you want to activate ${attorney.firstName} ${attorney.lastName}'s account?`
    );
    
    if (confirmed) {
      handleActivateAccount(attorney._id);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'green';
      case 'pending':
        return 'orange';
      case 'suspended':
        return 'red';
      default:
        return 'gray';
    }
  };

  return (
    <Box>
      <Container size="xl" py="xl">
        {/* Header */}
        <Paper p="lg" radius="md" mb="xl" style={{ backgroundColor: 'white' }}>
          <Group position="apart">
            <Group spacing="md">
              <ActionIcon
                size="lg"
                variant="subtle"
                onClick={() => navigate(-1)}
                style={{ color: CHARCOAL }}
              >
                <IconArrowLeft size={24} />
              </ActionIcon>
              <Title order={1} style={{ color: CHARCOAL }}>
                Manage Attorneys
              </Title>
            </Group>
            <ActionIcon
              size="lg"
              variant="light"
              color={PRIMARY_BROWN}
              onClick={fetchAttorneys}
              loading={loading}
              style={{ backgroundColor: THEMED_LIGHT_BG }}
            >
              <IconRefresh size={20} />
            </ActionIcon>
          </Group>
        </Paper>

        {/* Content */}
        {loading ? (
          <Center py="xl">
            <Stack align="center" spacing="md">
              <Loader size="lg" color={PRIMARY_BROWN} />
              <Text color="dimmed">Loading attorneys...</Text>
            </Stack>
          </Center>
        ) : attorneys.length === 0 ? (
          <Center py="xl">
            <Stack align="center" spacing="md">
              <IconBriefcase size={64} color="#ccc" />
              <Text size="lg" color="dimmed">
                No attorneys found
              </Text>
            </Stack>
          </Center>
        ) : (
          <Stack spacing="md">
            {attorneys.map((attorney) => (
              <Card
                key={attorney._id}
                shadow="sm"
                padding="lg"
                radius="md"
                withBorder
                style={{ backgroundColor: 'white', borderColor: '#E8E4DC' }}
              >
                <Stack spacing="md">
                  {/* Header */}
                  <Group position="apart" align="flex-start">
                    <Group spacing="md" align="flex-start">
                      <Avatar
                        size={56}
                        radius="xl"
                        color={PRIMARY_BROWN}
                        style={{ border: `2px solid ${PRIMARY_GOLD}` }}
                      >
                        <IconUser size={28} />
                      </Avatar>
                      <Box>
                        <Text size="lg" weight={700} style={{ color: CHARCOAL }}>
                          {attorney.firstName} {attorney.lastName}
                        </Text>
                        <Group spacing="xs" mt={4}>
                          <IconMail size={14} color={MUTED_OLIVE} />
                          <Text size="sm" color="dimmed">
                            {attorney.email}
                          </Text>
                        </Group>
                        <Badge
                          size="sm"
                          variant="light"
                          color={PRIMARY_BROWN}
                          mt={4}
                          style={{ textTransform: 'capitalize' }}
                        >
                          {attorney.role}
                        </Badge>
                      </Box>
                    </Group>
                    <Badge
                      size="lg"
                      variant="filled"
                      color={getStatusColor(attorney.accountStatus)}
                      style={{ textTransform: 'capitalize' }}
                    >
                      {attorney.accountStatus}
                    </Badge>
                  </Group>

                  <Divider />

                  {/* Details */}
                  <Stack spacing="xs">
                    <Group spacing="sm">
                      <IconId size={16} color={MUTED_OLIVE} />
                      <Text size="sm" color="dimmed">
                        PRC: <strong>{attorney.prcLicenseNumber}</strong>
                      </Text>
                    </Group>
                    <Group spacing="sm">
                      <IconFileText size={16} color={MUTED_OLIVE} />
                      <Text size="sm" color="dimmed">
                        IBR: <strong>{attorney.ibrNumber}</strong>
                      </Text>
                    </Group>
                    <Group spacing="sm">
                      <IconPhone size={16} color={MUTED_OLIVE} />
                      <Text size="sm" color="dimmed">
                        {attorney.phoneNumber}
                      </Text>
                    </Group>
                    {attorney.specializations && attorney.specializations.length > 0 && (
                      <Group spacing="sm">
                        <IconBriefcase size={16} color={MUTED_OLIVE} />
                        <Text size="sm" color="dimmed">
                          {attorney.specializations.join(', ')}
                        </Text>
                      </Group>
                    )}
                  </Stack>

                  <Divider />

                  {/* Verification Info */}
                  <Group position="apart">
                    <Group spacing="xs">
                      <Text size="sm" weight={500} color="dimmed">
                        Email Verified:
                      </Text>
                      <ThemeIcon
                        size="sm"
                        radius="xl"
                        color={attorney.isVerified ? 'green' : 'red'}
                        variant="light"
                      >
                        {attorney.isVerified ? <IconCheck size={14} /> : <IconX size={14} />}
                      </ThemeIcon>
                    </Group>
                    <Group spacing="xs">
                      <Text size="sm" weight={500} color="dimmed">
                        Bar Member:
                      </Text>
                      <ThemeIcon
                        size="sm"
                        radius="xl"
                        color={attorney.isBarMemberActive ? 'green' : 'red'}
                        variant="light"
                      >
                        {attorney.isBarMemberActive ? <IconCheck size={14} /> : <IconX size={14} />}
                      </ThemeIcon>
                    </Group>
                  </Group>

                  {/* Action Buttons */}
                  {attorney.accountStatus === 'pending' && (
                    <Button
                      fullWidth
                      color="green"
                      leftIcon={<IconCheckbox size={18} />}
                      onClick={() => confirmActivation(attorney)}
                      loading={activating === attorney._id}
                      disabled={activating === attorney._id}
                    >
                      Activate Account
                    </Button>
                  )}

                  {attorney.accountStatus === 'active' && (
                    <Paper
                      p="sm"
                      radius="md"
                      style={{ backgroundColor: '#E8F5E9', textAlign: 'center' }}
                    >
                      <Group position="center" spacing="xs">
                        <IconCheck size={20} color="#4CAF50" />
                        <Text size="sm" weight={600} style={{ color: '#4CAF50' }}>
                          Account Active
                        </Text>
                      </Group>
                    </Paper>
                  )}
                </Stack>
              </Card>
            ))}
          </Stack>
        )}
      </Container>
    </Box>
  );
}