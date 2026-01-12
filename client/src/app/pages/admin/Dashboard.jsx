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
  const [caseRecordsMap, setCaseRecordsMap] = useState({});
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
    // Fetch reviews for all admin roles
    if (userData && (userData.role === 'attorney' || userData.role === 'secretary' || userData.role === 'intern' || userData.role === 'pao_lawyer' || userData.role === 'legal_volunteer')) {
      fetchReviews();
      fetchFinalized();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData, location]);

  const fetchReviews = async () => {
    try {
      setLoadingReviews(true);
      // fetch all reviews (server can filter by query if needed)
      const resp = await apiClient.get('/reviews');
      const data = resp.data?.data ?? resp.data ?? [];
      const reviewsArray = Array.isArray(data) ? data : [];
      
      // Fetch user details for each review to get reviewer names
      const reviewsWithNames = await Promise.all(
        reviewsArray.map(async (review) => {
          if (review.reviewerId) {
            try {
              const userResp = await apiClient.get(`/users/${review.reviewerId}`);
              const user = userResp.data?.data ?? userResp.data;
              // Priority: displayName (Google) → fullName (manual) → role fallback
              const reviewerName = user?.displayName || user?.fullName || user?.username || review.reviewerRole || 'Staff';
              return { ...review, reviewerName };
            } catch (err) {
              console.error(`Failed to fetch user ${review.reviewerId}:`, err);
              return { ...review, reviewerName: review.reviewerRole || 'Staff' };
            }
          }
          return { ...review, reviewerName: review.reviewerRole || 'Staff' };
        })
      );
      
      setReviews(reviewsWithNames);
    } catch (err) {
      console.error('Error fetching reviews', err);
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  }

  const fetchFinalized = async () => {
    try {
      setLoadingFinalized(true);
      const resp = await apiClient.get('/finalize');
      const data = resp.data?.data ?? resp.data ?? [];
      const finalizedArray = Array.isArray(data) ? data : [];

      // Determine which accepted finalized items already have case records
      const accepted = finalizedArray.filter(f => f.decision === 'accepted');
      const recordsMap = {};

      await Promise.all(
        accepted.map(async (caseData) => {
          const key = caseData._id || caseData.id;
          if (!key) return;
          try {
            const caseRecordResp = await apiClient.get(`/caserecords/finalize/${key}`);
            recordsMap[key] = !!caseRecordResp.data;
          } catch (err) {
            recordsMap[key] = false;
          }
        })
      );

      setCaseRecordsMap(recordsMap);
      setFinalized(finalizedArray);
    } catch (err) {
      console.error('Error fetching finalized records', err);
      setFinalized([]);
      setCaseRecordsMap({});
    } finally {
      setLoadingFinalized(false);
    }
  }

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

        {/* Submitted For Review - Visible to all admin roles */}
        {userData && (userData.role === 'attorney' || userData.role === 'secretary' || userData.role === 'pao_lawyer' || userData.role === 'legal_volunteer' || userData.role === 'intern') && (
          <Paper shadow="xs" p="xl" radius="lg" bg="white" mt="xl">
            <Group position="apart" mb="5">
              <Box>
                <Title order={4}>Submitted For Review</Title>
                <Text size="sm" c={MUTED_OLIVE}>
                  {userData.role === 'intern' 
                    ? 'Your submissions awaiting review by attorney/secretary (view only)'
                    : 'Recent review submissions from interns (click to finalize)'}
                </Text>
              </Box>
            </Group>

            <Stack>
              {loadingReviews ? (
                <Center><Loader /></Center>
              ) : (
                reviews.length ? reviews.map((r) => {
                  // Get submitter name with priority: displayName (Google) -> fullName (manual) -> clientName (fallback)
                  const submitterName = r.content?.interviewInfo?.clientName || r.clientName || 'Unknown Client';
                  const submittedBy = r.reviewerName || 'Staff';
                  
                  return (
                    <Paper
                      key={r._id || r.id || r.caseId}
                      p="md"
                      radius="md"
                      withBorder
                      style={{ 
                        cursor: 'pointer', 
                        borderRadius: 12, 
                        border: '1px solid #E6D9CC', 
                        background: '#FBF7F4'
                      }}
                      onClick={() => navigate(`/admin/recommendation/${r.caseId}`, { state: { review: r, isViewingExistingReview: true } })}
                    >
                      <Group wrap="nowrap" align="flex-start">
                        <Box style={{ width: 52, height: 52, borderRadius: 12, background: PRIMARY_BROWN, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                          <IconFiles size={20} />
                        </Box>
                        <Box style={{ flex: 1 }}>
                          <Text fw={700} mb={4}>
                            {submitterName}
                          </Text>
                          <Text size="xs" c={MUTED_OLIVE} mb={6}>
                            Submitted by: {submittedBy} ({r.reviewerRole || 'Intern'})
                          </Text>
                          <Group spacing="xs">
                            <Badge size="sm" variant="light" color="gray">
                              {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'No Date'}
                            </Badge>
                            {r.caseId && r.caseId !== 'new-case' && (
                              <Badge size="sm" variant="filled" style={{ backgroundColor: PRIMARY_GOLD, color: CHARCOAL }}>
                                {r.caseId}
                              </Badge>
                            )}
                            {userData.role === 'intern' && (
                              <Badge size="sm" variant="light" color="blue">
                                Can Edit
                              </Badge>
                            )}
                          </Group>
                        </Box>
                        <ActionIcon>
                          <IconChevronRight />
                        </ActionIcon>
                      </Group>
                    </Paper>
                  );
                }) : (
                  <Text size="sm" c={MUTED_OLIVE}>
                    {userData.role === 'intern' 
                      ? 'You have no submissions pending review'
                      : 'No reviews pending finalization'}
                  </Text>
                )
              )}
            </Stack>
          </Paper>
        )}

        {/* Finalized Records */}
        <Paper shadow="xs" p="xl" radius="lg" bg="white" mt="xl">
          <Group position="apart" mb="md">
            <Box>
              <Title order={4}>Finalized Records</Title>
              <Text size="sm" c={MUTED_OLIVE}>Recently finalized case records (click to open)</Text>
            </Box>
          </Group>

          <Stack>
            {loadingFinalized ? (
              <Center><Loader /></Center>
            ) : (
              finalized.length ? finalized.map((f) => {
                const recordId = f._id || f.id;
                const hasRecord = recordId ? caseRecordsMap[recordId] : false;
                const clientName = f.clientName || f.content?.interviewInfo?.clientName || '';
                const displayTitle = hasRecord
                  ? (f.caseTitle || f.content?.caseInfo?.caseTitle || f.content?.caseInfo?.title || f.caseId || clientName)
                  : (clientName || f.caseId || 'Without record');

                return (
                <Paper
                  key={f._id || f.id || f.caseId}
                  p="md"
                  radius="md"
                  withBorder
                  style={{ cursor: 'pointer', borderRadius: 12, border: '1px solid #E6D9CC', background: '#F7FBF9' }}
                  onClick={() => navigate('/admin/recommendation', { state: { review: f } })}
                >
                  <Group noWrap align="flex-start">
                    <Box style={{ width: 52, height: 52, borderRadius: 12, background: MUTED_OLIVE, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                      <IconBriefcase size={20} />
                    </Box>
                    <Box style={{ flex: 1 }}>
                      <Text fw={700}>{displayTitle}</Text>
                      <Text size="xs" c={MUTED_OLIVE}>{clientName}</Text>
                      <Group spacing="xs" mt={6}>
                        <Text size="xs" c="dimmed">Finalized: {f.createdAt ? new Date(f.createdAt).toLocaleDateString() : ''}</Text>
                        <Text size="xs" c="dimmed">By: {f.finalizedRole || f.finalizedBy}</Text>
                      </Group>
                    </Box>
                    <ActionIcon>
                      <IconChevronRight />
                    </ActionIcon>
                  </Group>
                </Paper>
              );}) : (
                <Text size="sm" c={MUTED_OLIVE}>No finalized records found</Text>
              )
            )}
          </Stack>
        </Paper>

        {/* Quick Actions */}
        <Paper shadow="xs" p="xl" mt="xl" radius="lg" bg="white">
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