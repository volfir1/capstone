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
  Button,
  Tabs,
  ThemeIcon,
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
  IconClock,
  IconCheck,
  IconFileCheck,
  IconLayoutDashboard,
  IconChecklist,
  IconFileDescription,
} from '@tabler/icons-react';
import { PRIMARY_GOLD, PRIMARY_BROWN, MUTED_OLIVE, THEMED_LIGHT_BG, CHARCOAL, ACCENT_TAN } from '@utils/constants';
import apiClient from '@config/api/apiClient';
import { useAuth } from '@/context/authContext';
import { useLocation } from 'react-router-dom';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalCases: 0,
    totalUsers: 0,
    totalAttorneys: 0,
    unassignedCases: 0,
  });
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [finalized, setFinalized] = useState([]);
  const [loadingFinalized, setLoadingFinalized] = useState(false);
  const { userData } = useAuth();
  const location = useLocation();

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (userData && (userData.role === 'attorney' || userData.role === 'secretary')) {
      fetchReviews();
      fetchFinalized();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData, location]);

  const fetchReviews = async () => {
    try {
      setLoadingReviews(true);
      const resp = await apiClient.get('/reviews');
      const data = resp.data?.data ?? resp.data ?? [];
      setReviews(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching reviews', err);
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  const fetchFinalized = async () => {
    try {
      setLoadingFinalized(true);
      const resp = await apiClient.get('/finalize');
      const data = resp.data?.data ?? resp.data ?? [];
      setFinalized(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching finalized records', err);
      setFinalized([]);
    } finally {
      setLoadingFinalized(false);
    }
  };

  const statsCards = [
    {
      id: 'cases',
      title: 'Total Cases',
      count: stats.totalCases,
      icon: IconFiles,
      color: PRIMARY_BROWN,
      route: null,
      subtitle: 'Active cases',
    },
    {
      id: 'users',
      title: 'Total Users',
      count: stats.totalUsers,
      icon: IconUsers,
      color: PRIMARY_GOLD,
      route: null,
      subtitle: 'Registered users',
    },
    {
      id: 'attorneys',
      title: 'Attorneys',
      count: stats.totalAttorneys,
      icon: IconBriefcase,
      color: MUTED_OLIVE,
      route: '/admin/attorneys',
      subtitle: 'Verified attorneys',
    },
    {
      id: 'unassigned',
      title: 'Pending Assignment',
      count: stats.unassignedCases,
      icon: IconAlertCircle,
      color: ACCENT_TAN,
      route: '/admin/assigncase',
      subtitle: 'Requires attention',
    },
  ];

  const quickActions = [
    {
      id: 'assign',
      title: 'Assign Cases',
      description: 'Allocate cases to available attorneys',
      icon: IconUserPlus,
      color: PRIMARY_BROWN,
      route: '/admin/assigncase',
      enabled: true,
    },
    {
      id: 'verify',
      title: 'Verify Attorneys',
      description: 'Review and approve attorney applications',
      icon: IconUserCheck,
      color: PRIMARY_GOLD,
      route: '/admin/attorneys',
      enabled: true,
    },
    {
      id: 'manage',
      title: 'Manage Users',
      description: 'Oversee user accounts and permissions',
      icon: IconUsers,
      color: MUTED_OLIVE,
      route: '/admin/users',
      enabled: true,
    },
  ];

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <Box 
      bg={THEMED_LIGHT_BG} 
      mih="100vh" 
      py="xl"
      style={{
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      <style>
        {`
          ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
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
            <Group gap="md">
              <ThemeIcon size="xl" radius="md" variant="white" color={PRIMARY_BROWN}>
                <IconLayoutDashboard size={26} />
              </ThemeIcon>
              <Box>
                <Title order={2} c="white">
                  Administrator Dashboard
                </Title>
                <Text c="rgba(255, 255, 255, 0.9)" size="sm" fw={500} mt={4}>
                  Welcome back, {userData?.firstName || 'Admin'}
                </Text>
              </Box>
            </Group>
            <ActionIcon
              size="xl"
              variant="white"
              color={PRIMARY_BROWN}
              onClick={fetchStats}
              loading={loading}
              radius="md"
            >
              <IconRefresh size={22} />
            </ActionIcon>
          </Group>
        </Paper>

        {/* Stats Cards */}
        {loading && !stats.totalCases ? (
          <Center py="xl">
            <Stack align="center" gap="md">
              <Loader size="lg" color={PRIMARY_BROWN} />
              <Text size="sm" c={MUTED_OLIVE}>Loading dashboard data...</Text>
            </Stack>
          </Center>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg" mb="xl">
            {statsCards.map((stat) => {
              const IconComponent = stat.icon;
              const isClickable = !!stat.route;
              return (
                <Paper
                  key={stat.id}
                  shadow="xs"
                  p="xl"
                  radius="lg"
                  style={{
                    background: 'white',
                    border: '1px solid #E8E8E8',
                    cursor: isClickable ? 'pointer' : 'default',
                  }}
                  onClick={() => isClickable && navigate(stat.route)}
                >
                  <Group justify="space-between" mb="lg" wrap="nowrap">
                    <Box
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: '12px',
                        background: stat.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <IconComponent size={28} color="white" stroke={2.5} />
                    </Box>
                  </Group>
                  
                  <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={700} mb={6}>
                    {stat.title}
                  </Text>
                  
                  <Text size="2.5rem" fw={700} c={CHARCOAL} lh={1} mb={8}>
                    {stat.count}
                  </Text>
                  
                  <Text size="xs" c="dimmed">
                    {stat.subtitle}
                  </Text>
                  
                  {isClickable && (
                    <Text size="xs" c={stat.color} fw={600} mt="md">
                      View details →
                    </Text>
                  )}
                </Paper>
              );
            })}
          </SimpleGrid>
        )}

        {/* Case Management Tabs */}
        <Paper shadow="xs" radius="lg" p={0} mb="xl" style={{ overflow: 'hidden', border: '1px solid #E8E8E8' }}>
          <Tabs defaultValue="reviews" color={PRIMARY_BROWN}>
            <Box px="xl" pt="xl" pb="md" style={{ borderBottom: '1px solid #E8E8E8', background: 'white' }}>
              <Group justify="space-between" mb="lg">
                <Box>
                  <Title order={3} c={CHARCOAL} mb={4}>Case Management</Title>
                  <Text size="sm" c={MUTED_OLIVE}>Track submissions and finalized records</Text>
                </Box>
                <Button
                  size="sm"
                  variant="light"
                  color={PRIMARY_BROWN}
                  leftSection={<IconRefresh size={16} />}
                  onClick={() => {
                    fetchReviews();
                    fetchFinalized();
                  }}
                  loading={loadingReviews || loadingFinalized}
                >
                  Refresh
                </Button>
              </Group>
              
              <Tabs.List>
                <Tabs.Tab 
                  value="reviews" 
                  leftSection={<IconChecklist size={16} />}
                >
                  For Review ({reviews.length})
                </Tabs.Tab>
                <Tabs.Tab 
                  value="finalized" 
                  leftSection={<IconFileCheck size={16} />}
                >
                  Finalized ({finalized.length})
                </Tabs.Tab>
              </Tabs.List>
            </Box>

            <Box p="xl" style={{ background: '#FAFAFA', minHeight: '300px' }}>
              {/* Reviews Tab */}
              <Tabs.Panel value="reviews">
                <Stack gap="md">
                  {loadingReviews ? (
                    <Center py="xl">
                      <Stack align="center" gap="sm">
                        <Loader size="md" color={PRIMARY_BROWN} />
                        <Text size="sm" c={MUTED_OLIVE}>Loading reviews...</Text>
                      </Stack>
                    </Center>
                  ) : reviews.length ? (
                    reviews.map((r, idx) => (
                      <Paper
                        key={r._id || r.id || idx}
                        p="lg"
                        radius="md"
                        shadow="xs"
                        style={{ 
                          cursor: 'pointer', 
                          border: '1px solid #E6D9CC', 
                          background: 'white',
                        }}
                        onClick={() => navigate('/admin/recommendation', { state: { review: r } })}
                      >
                        <Group wrap="nowrap" align="flex-start">
                          <ThemeIcon 
                            size={56} 
                            radius="md" 
                            color={PRIMARY_BROWN}
                          >
                            <IconFileDescription size={26} stroke={2} />
                          </ThemeIcon>
                          
                          <Box style={{ flex: 1, minWidth: 0 }}>
                            <Group justify="space-between" mb={8} wrap="nowrap">
                              <Text fw={700} size="md" c={CHARCOAL} style={{ wordBreak: 'break-word' }}>
                                {r.content?.caseInfo?.title || r.caseTitle || r.caseId || 'Untitled Case'}
                              </Text>
                              <IconChevronRight size={20} color={PRIMARY_BROWN} style={{ flexShrink: 0 }} />
                            </Group>
                            
                            {(r.content?.interviewInfo?.clientName || r.clientName) && (
                              <Text size="sm" c={MUTED_OLIVE} mb={8}>
                                Client: {r.content?.interviewInfo?.clientName || r.clientName}
                              </Text>
                            )}
                            
                            <Group gap={8} mt={10}>
                              {r.priority && (
                                <Badge 
                                  size="sm" 
                                  color={r.priority === 'high' ? 'red' : r.priority === 'medium' ? PRIMARY_GOLD : PRIMARY_BROWN}
                                  tt="capitalize"
                                >
                                  {r.priority}
                                </Badge>
                              )}
                              <Badge size="sm" variant="light" color="gray" leftSection={<IconClock size={12} />}>
                                {formatDate(r.createdAt)}
                              </Badge>
                              {r.reviewerRole && (
                                <Badge size="sm" variant="outline" color={MUTED_OLIVE} tt="capitalize">
                                  {r.reviewerRole}
                                </Badge>
                              )}
                            </Group>
                          </Box>
                        </Group>
                      </Paper>
                    ))
                  ) : (
                    <Center py="xl">
                      <Stack align="center" gap="sm">
                        <ThemeIcon size={64} radius="xl" variant="light" color={MUTED_OLIVE}>
                          <IconChecklist size={32} />
                        </ThemeIcon>
                        <Text size="sm" c={MUTED_OLIVE} fw={500}>No reviews pending</Text>
                        <Text size="xs" c="dimmed">Submitted cases will appear here</Text>
                      </Stack>
                    </Center>
                  )}
                </Stack>
              </Tabs.Panel>

              {/* Finalized Tab */}
              <Tabs.Panel value="finalized">
                <Stack gap="md">
                  {loadingFinalized ? (
                    <Center py="xl">
                      <Stack align="center" gap="sm">
                        <Loader size="md" color={PRIMARY_BROWN} />
                        <Text size="sm" c={MUTED_OLIVE}>Loading finalized records...</Text>
                      </Stack>
                    </Center>
                  ) : finalized.length ? (
                    finalized.map((f, idx) => (
                      <Paper
                        key={f._id || f.id || idx}
                        p="lg"
                        radius="md"
                        shadow="xs"
                        style={{ 
                          cursor: 'pointer', 
                          border: '1px solid #D4E4DB', 
                          background: 'white',
                        }}
                        onClick={() => navigate('/admin/recommendation', { state: { review: f } })}
                      >
                        <Group wrap="nowrap" align="flex-start">
                          <ThemeIcon 
                            size={56} 
                            radius="md" 
                            color={MUTED_OLIVE}
                          >
                            <IconCheck size={26} stroke={2.5} />
                          </ThemeIcon>
                          
                          <Box style={{ flex: 1, minWidth: 0 }}>
                            <Group justify="space-between" mb={8} wrap="nowrap">
                              <Text fw={700} size="md" c={CHARCOAL} style={{ wordBreak: 'break-word' }}>
                                {f.caseTitle || f.content?.caseInfo?.title || f.caseId || 'Untitled Case'}
                              </Text>
                              <IconChevronRight size={20} color={MUTED_OLIVE} style={{ flexShrink: 0 }} />
                            </Group>
                            
                            {(f.clientName || f.content?.interviewInfo?.clientName) && (
                              <Text size="sm" c={MUTED_OLIVE} mb={8}>
                                Client: {f.clientName || f.content?.interviewInfo?.clientName}
                              </Text>
                            )}
                            
                            <Group gap={8} mt={10}>
                              <Badge size="sm" color={MUTED_OLIVE} leftSection={<IconCheck size={12} />}>
                                Completed
                              </Badge>
                              <Badge size="sm" variant="light" color="gray" leftSection={<IconClock size={12} />}>
                                {formatDate(f.createdAt)}
                              </Badge>
                              {(f.finalizedRole || f.finalizedBy) && (
                                <Badge size="sm" variant="outline" color={MUTED_OLIVE} tt="capitalize">
                                  By: {f.finalizedRole || f.finalizedBy}
                                </Badge>
                              )}
                            </Group>
                          </Box>
                        </Group>
                      </Paper>
                    ))
                  ) : (
                    <Center py="xl">
                      <Stack align="center" gap="sm">
                        <ThemeIcon size={64} radius="xl" variant="light" color={MUTED_OLIVE}>
                          <IconFileCheck size={32} />
                        </ThemeIcon>
                        <Text size="sm" c={MUTED_OLIVE} fw={500}>No finalized records</Text>
                        <Text size="xs" c="dimmed">Completed cases will appear here</Text>
                      </Stack>
                    </Center>
                  )}
                </Stack>
              </Tabs.Panel>
            </Box>
          </Tabs>
        </Paper>

        {/* Quick Actions */}
        <Paper shadow="xs" p="xl" radius="lg" bg="white" style={{ border: '1px solid #E8E8E8' }}>
          <Box mb="xl">
            <Title order={3} c={CHARCOAL} mb={4}>
              Quick Actions
            </Title>
            <Text size="sm" c={MUTED_OLIVE}>
              Streamline your administrative workflow
            </Text>
          </Box>
          
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
            {quickActions.map((action) => {
              const IconComponent = action.icon;
              const isEnabled = action.enabled;
              return (
                <Paper
                  key={action.id}
                  p="lg"
                  radius="md"
                  style={{
                    border: `2px solid ${isEnabled ? action.color : '#E8E8E8'}`,
                    cursor: isEnabled ? 'pointer' : 'not-allowed',
                    background: 'white',
                    opacity: isEnabled ? 1 : 0.6,
                  }}
                  onClick={() => isEnabled && action.route && navigate(action.route)}
                >
                  <Stack gap="md">
                    <Group justify="space-between">
                      <Box
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: '12px',
                          background: action.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <IconComponent size={24} color="white" stroke={2.5} />
                      </Box>
                      {isEnabled && (
                        <IconChevronRight size={20} color={action.color} />
                      )}
                    </Group>
                    
                    <Box>
                      <Text fw={700} c={isEnabled ? CHARCOAL : '#999'} mb={4} size="md">
                        {action.title}
                      </Text>
                      <Text size="xs" c={MUTED_OLIVE} lh={1.5}>
                        {action.description}
                      </Text>
                      {!isEnabled && (
                        <Badge size="sm" variant="light" color="gray" mt={8}>
                          Coming Soon
                        </Badge>
                      )}
                    </Box>
                  </Stack>
                </Paper>
              );
            })}
          </SimpleGrid>
        </Paper>
      </Container>
    </Box>
  );
}