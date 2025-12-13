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
  Grid,
  Card,
  ActionIcon,
  Loader,
  Center,
  SimpleGrid,
  ThemeIcon,
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
  IconArrowRight,
} from '@tabler/icons-react';
import { PRIMARY_GOLD, PRIMARY_BROWN, MUTED_OLIVE, THEMED_LIGHT_BG, CHARCOAL } from '@utils/constants';
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
      color: '#8B6F47',
      bgColor: '#F5EFE7',
      route: null,
    },
    {
      id: 'users',
      title: 'Total Users',
      count: stats.totalUsers,
      icon: IconUsers,
      color: '#6B8E23',
      bgColor: '#F0F8E8',
      route: null,
    },
    {
      id: 'attorneys',
      title: 'Total Attorneys',
      count: stats.totalAttorneys,
      icon: IconBriefcase,
      color: '#4682B4',
      bgColor: '#E8F4F8',
      route: '/admin/manage-attorneys',
    },
    {
      id: 'unassigned',
      title: 'Unassigned Cases',
      count: stats.unassignedCases,
      icon: IconAlertCircle,
      color: '#D2691E',
      bgColor: '#FFF3E6',
      route: '/admin/assign-cases',
    },
  ];

  const quickActions = [
    {
      id: 'assign',
      title: 'Assign Cases',
      icon: IconUserPlus,
      color: PRIMARY_BROWN,
      route: '/admin/assign-cases',
      enabled: true,
    },
    {
      id: 'verify',
      title: 'Verify Attorneys',
      icon: IconUserCheck,
      color: '#999',
      route: null,
      enabled: false,
    },
    {
      id: 'manage',
      title: 'Manage Users',
      icon: IconUsers,
      color: '#999',
      route: null,
      enabled: false,
    },
  ];

  return (
    <Box>
      <Container size="xl" py="xl">
        {/* Welcome Section */}
        <Paper p="xl" radius="md" mb="xl" style={{ backgroundColor: 'white' }}>
          <Stack spacing="xs">
            <Text size="sm" weight={500} style={{ color: PRIMARY_BROWN }}>
              Welcome back,
            </Text>
            <Title order={1} style={{ color: CHARCOAL }}>
              Administrator
            </Title>
            <Text size="sm" color="dimmed">
              Manage your legal services platform
            </Text>
          </Stack>
        </Paper>

        {/* Dashboard Overview */}
        <Stack spacing="xl">
          {/* Section Header */}
          <Group position="apart" align="center">
            <Title order={2} style={{ color: CHARCOAL }}>
              Dashboard Overview
            </Title>
            <ActionIcon
              size="lg"
              variant="light"
              color={PRIMARY_BROWN}
              onClick={fetchStats}
              loading={loading}
              style={{ backgroundColor: THEMED_LIGHT_BG }}
            >
              <IconRefresh size={20} />
            </ActionIcon>
          </Group>

          {/* Stats Grid */}
          {loading && !stats.totalCases ? (
            <Center py="xl">
              <Loader size="lg" color={PRIMARY_BROWN} />
            </Center>
          ) : (
            <SimpleGrid
              cols={4}
              spacing="lg"
              breakpoints={[
                { maxWidth: 'md', cols: 2 },
                { maxWidth: 'sm', cols: 1 },
              ]}
            >
              {features.map((feature) => {
                const IconComponent = feature.icon;
                const isClickable = !!feature.route;

                return (
                  <Card
                    key={feature.id}
                    shadow="sm"
                    padding="lg"
                    radius="md"
                    withBorder
                    style={{
                      backgroundColor: feature.bgColor,
                      cursor: isClickable ? 'pointer' : 'default',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      position: 'relative',
                      borderColor: '#E8E4DC',
                    }}
                    onClick={() => isClickable && navigate(feature.route)}
                    onMouseEnter={(e) => {
                      if (isClickable) {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (isClickable) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '';
                      }
                    }}
                  >
                    <Stack spacing="md">
                      <Group position="apart">
                        <ThemeIcon
                          size={56}
                          radius="md"
                          style={{ backgroundColor: feature.color }}
                        >
                          <IconComponent size={28} color="white" />
                        </ThemeIcon>
                        {isClickable && (
                          <ActionIcon
                            size="sm"
                            radius="xl"
                            variant="light"
                            style={{ backgroundColor: 'white' }}
                          >
                            <IconArrowRight size={16} color={feature.color} />
                          </ActionIcon>
                        )}
                      </Group>
                      <Box>
                        <Text size={36} weight={700} style={{ color: CHARCOAL, lineHeight: 1 }}>
                          {feature.count}
                        </Text>
                        <Text size="sm" weight={600} color="dimmed" mt={4}>
                          {feature.title}
                        </Text>
                      </Box>
                    </Stack>
                  </Card>
                );
              })}
            </SimpleGrid>
          )}

          {/* Quick Actions */}
          <Box>
            <Title order={2} mb="lg" style={{ color: CHARCOAL }}>
              Quick Actions
            </Title>
            <Stack spacing="md">
              {quickActions.map((action) => {
                const IconComponent = action.icon;
                const isEnabled = action.enabled;

                return (
                  <Paper
                    key={action.id}
                    p="lg"
                    radius="md"
                    shadow="sm"
                    withBorder
                    style={{
                      backgroundColor: 'white',
                      cursor: isEnabled ? 'pointer' : 'default',
                      opacity: isEnabled ? 1 : 0.6,
                      transition: 'transform 0.2s ease',
                      borderColor: '#E8E4DC',
                    }}
                    onClick={() => isEnabled && action.route && navigate(action.route)}
                    onMouseEnter={(e) => {
                      if (isEnabled) {
                        e.currentTarget.style.transform = 'translateX(4px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (isEnabled) {
                        e.currentTarget.style.transform = 'translateX(0)';
                      }
                    }}
                  >
                    <Group position="apart">
                      <Group spacing="md">
                        <ThemeIcon
                          size={48}
                          radius="md"
                          style={{ backgroundColor: THEMED_LIGHT_BG }}
                        >
                          <IconComponent size={24} color={action.color} />
                        </ThemeIcon>
                        <Box>
                          <Text size="md" weight={700} style={{ color: isEnabled ? CHARCOAL : '#999' }}>
                            {action.title}
                          </Text>
                          {!isEnabled && (
                            <Badge size="sm" variant="light" color="gray" mt={4}>
                              Coming Soon
                            </Badge>
                          )}
                        </Box>
                      </Group>
                      {isEnabled && (
                        <IconArrowRight size={20} color={MUTED_OLIVE} />
                      )}
                    </Group>
                  </Paper>
                );
              })}
            </Stack>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}