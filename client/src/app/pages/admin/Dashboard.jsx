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
  ActionIcon,
  Loader,
  Center,
  SimpleGrid,
  Badge,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconFiles,
  IconUsers,
  IconBriefcase,
  IconAlertCircle,
  IconRefresh,
  IconUserPlus,
  IconUserCheck,
  IconChevronRight,
} from '@tabler/icons-react';
import { PRIMARY_GOLD, PRIMARY_BROWN, MUTED_OLIVE, THEMED_LIGHT_BG, CHARCOAL, ACCENT_TAN } from '@utils/constants';
import apiClient from '@config/api/apiClient';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalCases: 0,
    totalUsers: 0,
    totalAttorneys: 0,
    unassignedCases: 0,
  });
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/cases/admin/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to load dashboard statistics',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const features = [
    {
      id: 'cases',
      title: 'Total Cases',
      count: stats.totalCases,
      icon: IconFiles,
      color: PRIMARY_BROWN,
      route: null,
    },
    {
      id: 'users',
      title: 'Total Users',
      count: stats.totalUsers,
      icon: IconUsers,
      color: PRIMARY_GOLD,
      route: null,
    },
    {
      id: 'attorneys',
      title: 'Total Attorneys',
      count: stats.totalAttorneys,
      icon: IconBriefcase,
      color: MUTED_OLIVE,
      route: '/admin/attorneys',
    },
    {
      id: 'unassigned',
      title: 'Unassigned Cases',
      count: stats.unassignedCases,
      icon: IconAlertCircle,
      color: ACCENT_TAN,
      route: '/admin/assigncase',
    },
  ];

  const quickActions = [
    {
      id: 'assign',
      title: 'Assign Cases',
      description: 'Assign cases to attorneys',
      icon: IconUserPlus,
      color: PRIMARY_BROWN,
      route: '/admin/assigncase',
      enabled: true,
    },
    {
      id: 'verify',
      title: 'Verify Attorneys',
      description: 'Review attorney applications',
      icon: IconUserCheck,
      color: PRIMARY_GOLD,
      route: '/admin/attorneys',
      enabled: true,
    },
    {
      id: 'manage',
      title: 'Manage Users',
      description: 'View and manage users',
      icon: IconUsers,
      color: ACCENT_TAN,
      route: '/admin/users',
      enabled: true,
    },
  ];

  return (
    <Box 
      bg={THEMED_LIGHT_BG} 
      mih="100vh" 
      py="xl"
    >
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
        {/* Welcome Header */}
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
                Administrator Dashboard
              </Title>
              <Text c="rgba(255, 255, 255, 0.9)" size="sm" fw={500}>
                Manage your legal services platform
              </Text>
            </Box>
            <ActionIcon
              size="lg"
              variant="white"
              color={PRIMARY_BROWN}
              onClick={fetchStats}
              loading={loading}
              radius="md"
            >
              <IconRefresh size={20} />
            </ActionIcon>
          </Group>
        </Paper>

        {/* Stats Cards */}
        {loading && !stats.totalCases ? (
          <Center py="xl">
            <Loader size="lg" color={PRIMARY_BROWN} />
          </Center>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg" mb="xl">
            {features.map((feature) => {
              const IconComponent = feature.icon;
              const isClickable = !!feature.route;
              return (
                <Paper
                  key={feature.id}
                  shadow="xs"
                  p="xl"
                  radius="lg"
                  style={{
                    background: 'white',
                    border: '1px solid #F0F0F0',
                    cursor: isClickable ? 'pointer' : 'default',
                  }}
                  onClick={() => isClickable && navigate(feature.route)}
                >
                  <Group justify="space-between" mb="md">
                    <Box
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: '12px',
                        background: feature.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <IconComponent size={24} color="white" stroke={2.5} />
                    </Box>
                  </Group>
                  <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>
                    {feature.title}
                  </Text>
                  <Text size="2rem" fw={700} c={CHARCOAL} lh={1} mb={4}>
                    {feature.count}
                  </Text>
                  {isClickable && (
                    <Text size="xs" c={feature.color} fw={500}>
                      View details
                    </Text>
                  )}
                </Paper>
              );
            })}
          </SimpleGrid>
        )}

        {/* Quick Actions */}
        <Paper shadow="xs" p="xl" radius="lg" bg="white">
          <Group mb="xl" justify="space-between">
            <Box>
              <Title order={3} c={CHARCOAL} mb={4}>Quick Actions</Title>
              <Text size="sm" c={MUTED_OLIVE}>Common administrative tasks</Text>
            </Box>
          </Group>
          <Stack gap="md">
            {quickActions.map((action) => {
              const IconComponent = action.icon;
              const isEnabled = action.enabled;
              return (
                <Paper
                  key={action.id}
                  p="lg"
                  radius="md"
                  style={{
                    border: '1px solid #F0F0F0',
                    cursor: isEnabled ? 'pointer' : 'default',
                    background: 'white',
                    opacity: isEnabled ? 1 : 0.6,
                  }}
                  onClick={() => isEnabled && action.route && navigate(action.route)}
                >
                  <Group justify="space-between">
                    <Group gap="md">
                      <Box
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: '10px',
                          background: action.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <IconComponent size={20} color="white" stroke={2.5} />
                      </Box>
                      <Box>
                        <Text fw={600} c={isEnabled ? CHARCOAL : '#999'} mb={4}>
                          {action.title}
                        </Text>
                        <Text size="xs" c={MUTED_OLIVE}>
                          {action.description}
                        </Text>
                        {!isEnabled && (
                          <Badge size="sm" variant="light" color="gray" mt={4}>
                            Coming Soon
                          </Badge>
                        )}
                      </Box>
                    </Group>
                    {isEnabled && (
                      <ActionIcon 
                        variant="subtle" 
                        color="gray"
                        size="sm"
                      >
                        <IconChevronRight size={18} />
                      </ActionIcon>
                    )}
                  </Group>
                </Paper>
              );
            })}
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}