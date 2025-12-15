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
  SimpleGrid,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconRefresh,
  IconBriefcase,
  IconMail,
  IconPhone,
  IconId,
  IconFileText,
  IconCheck,
  IconX,
  IconUser,
  IconShield,
} from '@tabler/icons-react';
import { PRIMARY_GOLD, PRIMARY_BROWN, MUTED_OLIVE, THEMED_LIGHT_BG, CHARCOAL, ACCENT_TAN } from '@utils/constants';
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
        return MUTED_OLIVE;
      case 'pending':
        return PRIMARY_GOLD;
      case 'suspended':
        return '#E74C3C';
      default:
        return ACCENT_TAN;
    }
  };

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
      <Container size="xl">
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
            <Group gap="md" align="center">
              <Box
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '12px',
                  background: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconShield size={24} color={PRIMARY_BROWN} stroke={2.5} />
              </Box>
              <Box>
                <Title order={2} c="white" mb={4}>
                  Manage Attorneys
                </Title>
                <Text c="rgba(255, 255, 255, 0.9)" size="sm" fw={500}>
                  Review and activate attorney accounts
                </Text>
              </Box>
            </Group>
            <ActionIcon
              size="lg"
              variant="white"
              color={PRIMARY_BROWN}
              onClick={fetchAttorneys}
              loading={loading}
              radius="md"
            >
              <IconRefresh size={20} />
            </ActionIcon>
          </Group>
        </Paper>

        {/* Content */}
        {loading ? (
          <Paper shadow="xs" p="xl" radius="lg" bg="white">
            <Center style={{ minHeight: '400px' }}>
              <Stack align="center" gap="md">
                <Loader size="lg" color={PRIMARY_BROWN} />
                <Text c="dimmed">Loading attorneys...</Text>
              </Stack>
            </Center>
          </Paper>
        ) : attorneys.length === 0 ? (
          <Paper shadow="xs" p="xl" radius="lg" bg="white">
            <Center style={{ minHeight: '400px' }}>
              <Stack align="center" gap="md">
                <Box
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: THEMED_LIGHT_BG,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <IconBriefcase size={40} color={PRIMARY_GOLD} />
                </Box>
                <Title order={2} c={PRIMARY_BROWN}>
                  No Attorneys Found
                </Title>
                <Text c="dimmed" ta="center">
                  There are no attorney accounts to display
                </Text>
              </Stack>
            </Center>
          </Paper>
        ) : (
          <Stack gap="lg">
            {attorneys.map((attorney) => (
              <Paper
                key={attorney._id}
                shadow="xs"
                p="xl"
                radius="lg"
                style={{ backgroundColor: 'white', border: '1px solid #F0F0F0' }}
              >
                <Stack gap="lg">
                  {/* Header */}
                  <Group justify="space-between" align="flex-start">
                    <Group gap="md" align="flex-start">
                      <Avatar
                        size={64}
                        radius="md"
                        color={PRIMARY_BROWN}
                        style={{ border: `3px solid ${PRIMARY_GOLD}` }}
                      >
                        <IconUser size={32} />
                      </Avatar>
                      <Box>
                        <Text size="lg" fw={700} c={CHARCOAL}>
                          {attorney.firstName} {attorney.lastName}
                        </Text>
                        <Group gap="xs" mt={4}>
                          <IconMail size={14} color={MUTED_OLIVE} />
                          <Text size="sm" c="dimmed">
                            {attorney.email}
                          </Text>
                        </Group>
                        <Badge
                          size="sm"
                          radius="sm"
                          mt={8}
                          style={{
                            backgroundColor: PRIMARY_BROWN,
                            color: 'white',
                            textTransform: 'capitalize',
                          }}
                        >
                          {attorney.role}
                        </Badge>
                      </Box>
                    </Group>
                    <Badge
                      size="lg"
                      radius="sm"
                      style={{
                        backgroundColor: getStatusColor(attorney.accountStatus),
                        color: 'white',
                        textTransform: 'capitalize',
                      }}
                    >
                      {attorney.accountStatus}
                    </Badge>
                  </Group>

                  <Divider color="#F0F0F0" />

                  {/* Details */}
                  <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                    <Box>
                      <Group gap="xs" mb={8}>
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
                          <IconId size={16} color="white" />
                        </Box>
                        <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600}>
                          PRC License
                        </Text>
                      </Group>
                      <Text fw={500} c={CHARCOAL} ml={40}>
                        {attorney.prcLicenseNumber}
                      </Text>
                    </Box>

                    <Box>
                      <Group gap="xs" mb={8}>
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
                          <IconFileText size={16} color="white" />
                        </Box>
                        <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600}>
                          IBR Number
                        </Text>
                      </Group>
                      <Text fw={500} c={CHARCOAL} ml={40}>
                        {attorney.ibrNumber}
                      </Text>
                    </Box>

                    <Box>
                      <Group gap="xs" mb={8}>
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
                          <IconPhone size={16} color="white" />
                        </Box>
                        <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600}>
                          Phone Number
                        </Text>
                      </Group>
                      <Text fw={500} c={CHARCOAL} ml={40}>
                        {attorney.phoneNumber}
                      </Text>
                    </Box>

                    {attorney.specializations && attorney.specializations.length > 0 && (
                      <Box>
                        <Group gap="xs" mb={8}>
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
                            <IconBriefcase size={16} color="white" />
                          </Box>
                          <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600}>
                            Specializations
                          </Text>
                        </Group>
                        <Text fw={500} c={CHARCOAL} ml={40}>
                          {attorney.specializations.join(', ')}
                        </Text>
                      </Box>
                    )}
                  </SimpleGrid>

                  <Divider color="#F0F0F0" />

                  {/* Verification Info */}
                  <Group justify="space-around">
                    <Paper
                      p="md"
                      radius="md"
                      style={{
                        backgroundColor: attorney.isVerified ? `${MUTED_OLIVE}10` : `${ACCENT_TAN}10`,
                        border: `1px solid ${attorney.isVerified ? MUTED_OLIVE : ACCENT_TAN}`,
                        flex: 1,
                      }}
                    >
                      <Group gap="xs" justify="center">
                        <Box
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: attorney.isVerified ? MUTED_OLIVE : ACCENT_TAN,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {attorney.isVerified ? <IconCheck size={16} color="white" /> : <IconX size={16} color="white" />}
                        </Box>
                        <Box>
                          <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600}>
                            Email Verified
                          </Text>
                          <Text size="sm" fw={600} c={CHARCOAL}>
                            {attorney.isVerified ? 'Yes' : 'No'}
                          </Text>
                        </Box>
                      </Group>
                    </Paper>

                    <Paper
                      p="md"
                      radius="md"
                      style={{
                        backgroundColor: attorney.isBarMemberActive ? `${MUTED_OLIVE}10` : `${ACCENT_TAN}10`,
                        border: `1px solid ${attorney.isBarMemberActive ? MUTED_OLIVE : ACCENT_TAN}`,
                        flex: 1,
                      }}
                    >
                      <Group gap="xs" justify="center">
                        <Box
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: attorney.isBarMemberActive ? MUTED_OLIVE : ACCENT_TAN,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {attorney.isBarMemberActive ? <IconCheck size={16} color="white" /> : <IconX size={16} color="white" />}
                        </Box>
                        <Box>
                          <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600}>
                            Bar Member
                          </Text>
                          <Text size="sm" fw={600} c={CHARCOAL}>
                            {attorney.isBarMemberActive ? 'Active' : 'Inactive'}
                          </Text>
                        </Box>
                      </Group>
                    </Paper>
                  </Group>

                  {/* Action Buttons */}
                  {attorney.accountStatus === 'pending' && (
                    <Button
                      fullWidth
                      size="md"
                      leftSection={<IconCheck size={18} />}
                      onClick={() => confirmActivation(attorney)}
                      loading={activating === attorney._id}
                      disabled={activating === attorney._id}
                      style={{
                        backgroundColor: MUTED_OLIVE,
                      }}
                    >
                      Activate Account
                    </Button>
                  )}
                  {attorney.accountStatus === 'active' && (
                    <Paper
                      p="md"
                      radius="md"
                      style={{ backgroundColor: `${MUTED_OLIVE}10`, border: `1px solid ${MUTED_OLIVE}` }}
                    >
                      <Group justify="center" gap="xs">
                        <IconCheck size={20} color={MUTED_OLIVE} />
                        <Text size="sm" fw={600} c={MUTED_OLIVE}>
                          Account Active
                        </Text>
                      </Group>
                    </Paper>
                  )}
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </Container>
    </Box>
  );
}