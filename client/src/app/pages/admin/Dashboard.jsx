import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  Divider,
  Tooltip,
  Pagination,
  TextInput,
  Tabs,
  Select,
  Modal,
  Textarea,
  SegmentedControl,
  ScrollArea,
} from '@mantine/core';
import { DonutChart } from '@mantine/charts';
import '@mantine/charts/styles.css';
import { notifications } from '@mantine/notifications';
import {
  IconFiles,
  IconUsers,
  IconAlertCircle,
  IconRefresh,
  IconUserPlus,
  IconChevronRight,
  IconScale,
  IconClipboardCheck,
  IconSearch,
  IconFilter,
  IconRotateClockwise,
  IconActivity,
  IconLogin,
  IconLogout,
  IconCircleFilled,
  IconPlus,
  IconEdit,
  IconCheck,
  IconX,
  IconClock,
} from '@tabler/icons-react';
import { PRIMARY_GOLD, PRIMARY_BROWN, MUTED_OLIVE, BG, CHARCOAL, ACCENT_TAN } from '@utils/constants';
import apiClient from '@config/api/apiClient';
import { useAuth } from '@/context/authContext';
import { useLocation } from 'react-router-dom';
import DashboardSkeleton from '@/components/skeleton/DashboardSkeleton';
import { getSocket } from '@/config/socket';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalCases: 0,
    totalUsers: 0,
    totalAttorneys: 0,
    roleBreakdown: {},
    serviceBreakdown: {},
    totalReviews: 0,
    pendingReviews: 0,
    reviewBreakdown: {},
    totalFinalized: 0,
    finalizeBreakdown: {},
  });
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);


  const [reviewTab, setReviewTab] = useState('supervising');
  const [reviewPage, setReviewPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const { userData, loading: authLoading } = useAuth();
  const location = useLocation();

  const [reviewSearch, setReviewSearch] = useState('');


  // Activity log state
  const [activityLogs, setActivityLogs] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logPage, setLogPage] = useState(1);
  const [logTotal, setLogTotal] = useState(0);
  const [logPeriod, setLogPeriod] = useState('today');
  const [logActionFilter, setLogActionFilter] = useState('all');
  const [activityTab, setActivityTab] = useState('logs');
  const activityPollRef = useRef(null);
  const LOG_ITEMS = 10;

  useEffect(() => {
    if (userData) {
      if (userData.role === 'director') setReviewTab('director');
      else if (userData.role === 'supervising_lawyer') setReviewTab('supervising');
      else if (userData.role === 'intern' || userData.role === 'secretary') setReviewTab('returned');
    }
  }, [userData]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/cases/admin/stats');
      if (response.data.success) setStats(response.data.data);
    } catch (error) {
      console.error('Error stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityLogs = useCallback(async () => {
    try {
      setLoadingLogs(true);
      const params = new URLSearchParams({ page: logPage, limit: LOG_ITEMS, period: logPeriod });
      if (logActionFilter !== 'all') params.append('action', logActionFilter);
      const res = await apiClient.get(`/activity-logs?${params.toString()}`);
      if (res.data.success) {
        setActivityLogs(res.data.data || []);
        setLogTotal(res.data.total || 0);
        setOnlineUsers(res.data.onlineUsers || []);
      }
    } catch (err) {
      console.error('Activity logs error:', err);
    } finally {
      setLoadingLogs(false);
    }
  }, [logPage, logPeriod, logActionFilter]);

  useEffect(() => {
    fetchActivityLogs();
    activityPollRef.current = setInterval(fetchActivityLogs, 15000);
    return () => clearInterval(activityPollRef.current);
  }, [fetchActivityLogs]);

  const fetchReviews = async () => {
    try {
      setLoadingReviews(true);
      const resp = await apiClient.get('/reviews');
      const data = resp.data?.data ?? resp.data ?? [];
      setReviews(Array.isArray(data) ? data : []);
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    if (userData) {
      fetchStats();
      fetchReviews();
    }
  }, [userData, location]);

  // Real-time: refresh review list when a new review is pushed via Socket.IO
  useEffect(() => {
    const socket = getSocket();
    const handleNewReview = () => {
      fetchReviews();
      fetchStats();
    };
    socket.on('new-review', handleNewReview);
    return () => { socket.off('new-review', handleNewReview); };
  }, []);

  const searchFilteredReviews = useMemo(() => {
    return reviews.filter(r => {
      const name = (r.content?.interviewInfo?.clientName || r.clientName || '').toLowerCase();
      const q = reviewSearch.toLowerCase().trim();
      return !q || name.includes(q);
    });
  }, [reviews, reviewSearch]);

  const supervisingLawyerReviews = useMemo(() => searchFilteredReviews.filter(r => r.reviewStage === 'supervising_lawyer' || !r.reviewStage), [searchFilteredReviews]);
  const directorReviews = useMemo(() => searchFilteredReviews.filter(r => r.reviewStage === 'director'), [searchFilteredReviews]);
  const returnedToInternReviews = useMemo(() => searchFilteredReviews.filter(r => r.reviewStage === 'returned_to_intern'), [searchFilteredReviews]);



  const serviceData = [
    { name: 'Legal Advice', value: stats.serviceBreakdown?.legalAdvice || 0, color: '#4DABF7' },
    { name: 'Legal Drafting', value: stats.serviceBreakdown?.legalDrafting || 0, color: PRIMARY_GOLD },
    { name: 'With Record', value: stats.serviceBreakdown?.courtWithRecord || 0, color: '#40C057' },
    { name: 'Without Record', value: stats.serviceBreakdown?.courtWithoutRecord || 0, color: '#FCC419' },
  ].filter(d => d.value > 0);

  const reviewStageData = [
    { name: 'Supervising', value: stats.reviewBreakdown?.supervising_lawyer || 0, color: '#F59F00' },
    { name: 'Director', value: stats.reviewBreakdown?.director || 0, color: '#7950F2' },
    { name: 'Completed', value: stats.reviewBreakdown?.completed || 0, color: '#40C057' },
    { name: 'Returned', value: stats.reviewBreakdown?.returned_to_intern || 0, color: '#FA5252' },
  ].filter(d => d.value > 0);

  const finalizeData = [
    { name: 'Accepted', value: stats.finalizeBreakdown?.accepted || 0, color: '#40C057' },
    { name: 'Rejected', value: stats.finalizeBreakdown?.rejected || 0, color: '#FA5252' },
    { name: 'Pending', value: stats.finalizeBreakdown?.pending || 0, color: '#FCC419' },
  ].filter(d => d.value > 0);

  const userRoleData = [
    { name: 'Clients', value: stats.roleBreakdown?.user || 0, color: PRIMARY_GOLD },
    { name: 'Interns', value: stats.roleBreakdown?.intern || 0, color: '#4DABF7' },
    { name: 'Sup. Lawyers', value: stats.roleBreakdown?.supervising_lawyer || 0, color: MUTED_OLIVE },
    { name: 'Directors', value: stats.roleBreakdown?.director || 0, color: '#7950F2' },
    { name: 'Secretaries', value: stats.roleBreakdown?.secretary || 0, color: ACCENT_TAN },
  ].filter(d => d.value > 0);

  if (authLoading || (loading && stats.totalCases === 0)) return <DashboardSkeleton />;

  return (
    <Box bg={BG} mih="100vh" py="xl">
      <Container size="xl">
        <Group justify="space-between" mb="lg">
          <Box><Title order={3} fw={700} c={CHARCOAL}>Dashboard</Title><Text size="sm" fw={500} c={MUTED_OLIVE}>Manage legal services platform</Text></Box>
          <ActionIcon variant="subtle" color="gray" onClick={() => { fetchStats(); fetchReviews(); fetchFinalized(); fetchActivityLogs(); }} loading={loading}><IconRefresh size={18} /></ActionIcon>
        </Group>

        <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md" mb="md">
          {[
            { label: 'Total Cases', value: stats.totalCases, icon: IconFiles, color: PRIMARY_BROWN },
            { label: 'Total Users', value: stats.totalUsers, icon: IconUsers, color: PRIMARY_GOLD },
            { label: 'Pending Reviews', value: stats.pendingReviews, icon: IconScale, color: '#F59F00' },
            { label: 'Finalized', value: stats.totalFinalized, icon: IconClipboardCheck, color: MUTED_OLIVE },
          ].map((card) => (
            <Paper key={card.label} p="md" radius="lg" withBorder>
              <Group gap="sm">
                <Box style={{ width: 40, height: 40, borderRadius: 10, background: card.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><card.icon size={20} color="white" /></Box>
                <Box><Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600}>{card.label}</Text><Text size="xl" fw={700} c={CHARCOAL}>{card.value}</Text></Box>
              </Group>
            </Paper>
          ))}
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" mb="xl">
          {[
            { title: 'Legal Services', data: serviceData, total: serviceData.reduce((s, d) => s + d.value, 0) },
            { title: 'Review Pipeline', data: reviewStageData, total: stats.totalReviews },
            { title: 'Finalized Decisions', data: finalizeData, total: stats.totalFinalized },
            { title: 'Users by Role', data: userRoleData, total: stats.totalUsers }
          ].map(chart => (
            <Paper key={chart.title} p="md" radius="lg" withBorder style={{ minHeight: 180, overflow: 'visible' }}>
              <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb="sm">{chart.title}</Text>
              <Group gap="md" wrap="nowrap">
                <Box style={{ flex: '0 0 160px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <DonutChart data={chart.data} size={120} thickness={18} chartLabel={`${chart.total}`} />
                </Box>
                <Box style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px' }}>
                  {chart.title === 'Legal Services' ? (
                    (() => {
                      const courtNames = ['With Record', 'Without Record'];
                      const courtItems = chart.data.filter(d => courtNames.includes(d.name));
                      const otherItems = chart.data.filter(d => !courtNames.includes(d.name));
                      return (
                        <>
                          {otherItems.map(d => (
                            <Group key={d.name} gap={6} wrap="nowrap">
                              <Box style={{ width: 8, height: 8, borderRadius: 2, background: d.color }} />
                              <Text size="xs" c={CHARCOAL} truncate fw={500}>{d.name}: {d.value}</Text>
                            </Group>
                          ))}

                          <Box style={{ gridColumn: '1 / -1', marginTop: 6 }}>
                            <Text size="xs" fw={700} c={CHARCOAL}>Court Representation:</Text>
                            <Box style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', marginTop: 6 }}>
                              {courtItems.map(d => (
                                <Group key={d.name} gap={6} wrap="nowrap">
                                  <Box style={{ width: 8, height: 8, borderRadius: 2, background: d.color }} />
                                  <Text size="xs" c={CHARCOAL} truncate fw={500}>{d.name}: {d.value}</Text>
                                </Group>
                              ))}
                            </Box>
                          </Box>
                        </>
                      );
                    })()
                  ) : (
                    chart.data.map(d => (
                      <Group key={d.name} gap={6} wrap="nowrap">
                        <Box style={{ width: 8, height: 8, borderRadius: 2, background: d.color }} />
                        <Text size="xs" c={CHARCOAL} truncate fw={500}>{d.name}: {d.value}</Text>
                      </Group>
                    ))
                  )}
                </Box>
              </Group>
            </Paper>
          ))}
        </SimpleGrid>

        {/* Review Queue */}
        <Paper shadow="sm" radius="lg" bg="white" withBorder style={{ overflow: 'hidden' }}>
          <Box px="lg" py="md" style={{ borderBottom: '1px solid #F0F0F0', background: '#FAFAFA' }}>
            <Group justify="space-between">
              <Title order={4} c={CHARCOAL} fw={700} tt="uppercase" lts={0.5}>Review Queue</Title>
              <TextInput placeholder="Search client..." leftSection={<IconSearch size={14} />} size="xs" radius="md" value={reviewSearch} onChange={(e) => { setReviewSearch(e.currentTarget.value); setReviewPage(1); }} w={250} />
            </Group>
          </Box>
          <Tabs value={reviewTab} onChange={(v) => { setReviewTab(v); setReviewPage(1); }} variant="pills" p="md">
            <Tabs.List mb="md">
              <Tabs.Tab value="supervising" leftSection={<IconScale size={14} />} rightSection={<Badge size="xs" circle color="orange" fw={600}>{supervisingLawyerReviews.length}</Badge>}>Supervising</Tabs.Tab>
              <Tabs.Tab value="director" leftSection={<IconClipboardCheck size={14} />} rightSection={<Badge size="xs" circle color="grape" fw={600}>{directorReviews.length}</Badge>}>Director</Tabs.Tab>
              <Tabs.Tab value="returned" leftSection={<IconAlertCircle size={14} />} rightSection={<Badge size="xs" circle color="red" fw={600}>{returnedToInternReviews.length}</Badge>}>Returned</Tabs.Tab>
            </Tabs.List>
            <Box px="md" py={8} bg="#F8F9FA" style={{ borderBottom: '1px solid #EEE' }}>
              <Group wrap="nowrap" gap="md">
                <Text size="xs" fw={600} c={MUTED_OLIVE} style={{ flex: 1 }}>CLIENT NAME</Text>
                <Text size="xs" fw={600} c={MUTED_OLIVE} style={{ width: 150, textAlign: 'center' }}>SUBMISSION DATE</Text>
                <Text size="xs" fw={600} c={MUTED_OLIVE} style={{ width: 40, textAlign: 'center' }}>VIEW</Text>
              </Group>
            </Box>
            {['supervising', 'director', 'returned'].map(tab => {
              const data = tab === 'supervising' ? supervisingLawyerReviews : tab === 'director' ? directorReviews : returnedToInternReviews;
              const paginated = data.slice((reviewPage - 1) * ITEMS_PER_PAGE, reviewPage * ITEMS_PER_PAGE);
              const bColor = tab === 'supervising' ? PRIMARY_GOLD : tab === 'director' ? '#7950F2' : '#FA5252';
              return (
                <Tabs.Panel key={tab} value={tab}>
                  <Stack gap={0}>{paginated.length > 0 ? paginated.map((r, i) => (
                    <Box key={r._id || r.id}>
                      <Group px="md" h={44} wrap="nowrap" gap="md" style={{ cursor: 'pointer', borderLeft: `4px solid ${bColor}`, background: i % 2 === 0 ? 'white' : '#FAFAFA' }} onClick={() => navigate(`/admin/recommendation/${r.caseId}`, { state: { review: r, isViewingExistingReview: true } })}>
                        <Box style={{ flex: 1, minWidth: 0 }}><Text fw={600} size="sm" truncate>{r.clientName || 'Unknown'}</Text></Box>
                        <Box style={{ width: 150, textAlign: 'center' }}><Text size="xs" fw={500} c={MUTED_OLIVE}>{new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text></Box>
                        <Box style={{ width: 40, display: 'flex', justifyContent: 'center' }}><IconChevronRight size={18} color="gray" /></Box>
                      </Group>
                      <Divider color="#F3F4F6" />
                    </Box>
                  )) : <Center h={100}><Text c="dimmed" size="sm" fw={500}>No pending reviews</Text></Center>}</Stack>
                </Tabs.Panel>
              );
            })}
          </Tabs>
          <Box px="lg" py="xs" style={{ background: '#FAFAFA', borderTop: '1px solid #F0F0F0' }}><Pagination total={Math.ceil((reviewTab === 'supervising' ? supervisingLawyerReviews.length : reviewTab === 'director' ? directorReviews.length : returnedToInternReviews.length) / ITEMS_PER_PAGE) || 1} value={reviewPage} onChange={setReviewPage} color={PRIMARY_BROWN} size="xs" radius="md" withEdges /></Box>
        </Paper>

        {/* ── Activity Monitoring ── */}
        <Paper shadow="sm" radius="lg" bg="white" mt="xl" withBorder style={{ overflow: 'hidden' }}>
          <Box px="lg" py="md" style={{ borderBottom: '1px solid #F0F0F0', background: '#FAFAFA' }}>
            <Group justify="space-between" align="center">
              <Group gap="sm">
                <Box style={{ width: 32, height: 32, borderRadius: 10, background: CHARCOAL, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconActivity size={18} color="white" stroke={2} />
                </Box>
                <Title order={4} c={CHARCOAL} fw={700} tt="uppercase" lts={0.5}>Activity Monitoring</Title>
              </Group>
              <Group gap="xs">
                {activityTab === 'logs' && (
                  <>
                    <Select
                      placeholder="Period"
                      size="xs"
                      radius="md"
                      value={logPeriod}
                      onChange={(val) => { setLogPeriod(val || 'today'); setLogPage(1); }}
                      data={[{ value: 'today', label: 'Today' }, { value: 'week', label: 'Last 7 Days' }, { value: 'month', label: 'Last 30 Days' }]}
                      w={120}
                    />
                    <Select
                      placeholder="Action"
                      size="xs"
                      radius="md"
                      value={logActionFilter}
                      onChange={(val) => { setLogActionFilter(val || 'all'); setLogPage(1); }}
                      data={[
                        { value: 'all', label: 'All Actions' },
                        { value: 'login', label: 'Login' },
                        { value: 'logout', label: 'Logout' },
                        { value: 'case_created', label: 'Case Created' },
                        { value: 'case_updated', label: 'Case Updated' },
                        { value: 'case_assigned', label: 'Case Assigned' },
                        { value: 'review_submitted', label: 'Review Submitted' },
                        { value: 'finalize_decision', label: 'Decision Finalized' },
                      ]}
                      w={150}
                    />
                  </>
                )}
                {activityTab === 'online' && (
                  <Badge size="lg" variant="light" color="green" radius="md" fw={600} leftSection={<IconCircleFilled size={10} style={{ color: '#40C057' }} />}>
                    {onlineUsers.length} Users Active
                  </Badge>
                )}
              </Group>
            </Group>
          </Box>

          <Tabs value={activityTab} onChange={setActivityTab} variant="pills" p="md">
            <Tabs.List mb="md">
              <Tabs.Tab value="logs" leftSection={<IconRotateClockwise size={14} />}>All Activity</Tabs.Tab>
              <Tabs.Tab value="online" leftSection={<IconUsers size={14} />} rightSection={onlineUsers.length > 0 && <Badge size="xs" circle color="green" fw={600}>{onlineUsers.length}</Badge>}>Currently Online</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="logs">
              <Box px="md" py={8} bg="#F8F9FA" style={{ borderBottom: '1px solid #EEE', borderRadius: '8px 8px 0 0' }}>
                <Group wrap="nowrap" gap="md">
                  <Text size="xs" fw={600} c={MUTED_OLIVE} style={{ width: 60 }}>ACTION</Text>
                  <Text size="xs" fw={600} c={MUTED_OLIVE} style={{ flex: 1 }}>USER</Text>
                  <Text size="xs" fw={600} c={MUTED_OLIVE} style={{ width: 120, textAlign: 'center' }}>ROLE</Text>
                  <Text size="xs" fw={600} c={MUTED_OLIVE} style={{ width: 180, textAlign: 'right' }}>TIMESTAMP</Text>
                </Group>
              </Box>

              <ScrollArea mah={400}>
                {loadingLogs && activityLogs.length === 0 ? (
                  <Center py="xl"><Loader size="sm" color={PRIMARY_BROWN} /></Center>
                ) : activityLogs.length > 0 ? (
                  <Stack gap={0}>
                    {activityLogs.map((log, idx) => {
                      const getActionConfig = (action) => {
                        switch (action) {
                          case 'login': return { label: 'IN', color: 'green', icon: <IconLogin size={10} /> };
                          case 'logout': return { label: 'OUT', color: 'red', icon: <IconLogout size={10} /> };
                          case 'case_created': return { label: 'NEW', color: 'blue', icon: <IconPlus size={10} /> };
                          case 'case_updated': return { label: 'UPD', color: 'orange', icon: <IconEdit size={10} /> };
                          case 'case_assigned': return { label: 'ASG', color: 'indigo', icon: <IconUserPlus size={10} /> };
                          case 'review_submitted': return { label: 'REV', color: 'teal', icon: <IconClipboardCheck size={10} /> };
                          case 'finalize_decision': return { label: 'FIN', color: 'grape', icon: <IconScale size={10} /> };
                          default: return { label: 'ACT', color: 'gray', icon: <IconActivity size={10} /> };
                        }
                      };
                      const config = getActionConfig(log.action);
                      const roleName = (log.userRole || 'user').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                      const logDate = new Date(log.createdAt);
                      return (
                        <Box key={log._id}>
                          <Group wrap="nowrap" px="md" h={50} gap="md" style={{ background: idx % 2 === 0 ? 'white' : '#FAFAFA' }}>
                            <Box style={{ width: 60 }}>
                              <Badge size="xs" variant="light" color={config.color} fw={600} leftSection={config.icon}>
                                {config.label}
                              </Badge>
                            </Box>
                            <Box style={{ flex: 1, minWidth: 0 }}>
                              <Text size="sm" fw={600} c={CHARCOAL} truncate>{log.userName || log.userEmail || 'Unknown User'}</Text>
                              <Text size={10} fw={400} c="dimmed" truncate>{log.userEmail}</Text>
                            </Box>
                            <Box style={{ width: 120, textAlign: 'center' }}>
                              <Badge size="xs" variant="outline" color="gray" radius="sm" fw={500}>{roleName}</Badge>
                            </Box>
                            <Box style={{ width: 180, textAlign: 'right' }}>
                              <Group gap={4} justify="flex-end">
                                <Text size="xs" fw={600} c={CHARCOAL}>
                                  {logDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                                <Text size="xs" c="dimmed" fw={400}>•</Text>
                                <Text size="xs" c="dimmed" fw={500}>
                                  {logDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </Text>
                              </Group>
                            </Box>
                          </Group>
                          <Divider color="#F3F4F6" />
                        </Box>
                      );
                    })}
                  </Stack>
                ) : (
                  <Center h={150}><Text size="xs" c="dimmed" fw={500}>No activity entries found</Text></Center>
                )}
              </ScrollArea>

              <Box px="lg" py="xs" style={{ background: '#FAFAFA', borderTop: '1px solid #F0F0F0' }}>
                <Pagination total={Math.ceil(logTotal / LOG_ITEMS) || 1} value={logPage} onChange={setLogPage} color={PRIMARY_BROWN} size="xs" radius="md" withEdges />
              </Box>
            </Tabs.Panel>

            <Tabs.Panel value="online">
              <Box px="md" py={8} bg="#F8F9FA" style={{ borderBottom: '1px solid #EEE', borderRadius: '8px 8px 0 0' }}>
                <Group wrap="nowrap" gap="md">
                  <Text size="xs" fw={600} c={MUTED_OLIVE} style={{ width: 40, textAlign: 'center' }}>STATUS</Text>
                  <Text size="xs" fw={600} c={MUTED_OLIVE} style={{ flex: 1 }}>ACTIVE USER</Text>
                  <Text size="xs" fw={600} c={MUTED_OLIVE} style={{ width: 120, textAlign: 'center' }}>ROLE</Text>
                  <Text size="xs" fw={600} c={MUTED_OLIVE} style={{ width: 180, textAlign: 'right' }}>LAST LOGIN</Text>
                </Group>
              </Box>

              <ScrollArea mah={400}>
                {onlineUsers.length > 0 ? (
                  <Stack gap={0}>
                    {onlineUsers.map((user, idx) => {
                      const roleName = (user.userRole || 'user').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                      const seenDate = new Date(user.lastSeen);
                      return (
                        <Box key={user._id}>
                          <Group wrap="nowrap" px="md" h={50} gap="md" style={{ background: idx % 2 === 0 ? 'white' : '#FAFAFA' }}>
                            <Box style={{ width: 40, display: 'flex', justifyContent: 'center' }}>
                              <IconCircleFilled size={10} style={{ color: '#40C057' }} />
                            </Box>
                            <Box style={{ flex: 1, minWidth: 0 }}>
                              <Text size="sm" fw={600} c={CHARCOAL} truncate>{user.userName || 'Unknown User'}</Text>
                            </Box>
                            <Box style={{ width: 120, textAlign: 'center' }}>
                              <Badge size="xs" variant="outline" color="gray" radius="sm" fw={500}>{roleName}</Badge>
                            </Box>
                            <Box style={{ width: 180, textAlign: 'right' }}>
                              <Group gap={4} justify="flex-end">
                                <Text size="xs" fw={600} c={CHARCOAL}>
                                  {seenDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                                <Text size="xs" c="dimmed" fw={400}>•</Text>
                                <Text size="xs" c="dimmed" fw={500}>
                                  {seenDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </Text>
                              </Group>
                            </Box>
                          </Group>
                          <Divider color="#F3F4F6" />
                        </Box>
                      );
                    })}
                  </Stack>
                ) : (
                  <Center h={150}><Stack gap={4} align="center"><Text size="xs" c="dimmed" fw={500}>No users are currently online</Text></Stack></Center>
                )}
              </ScrollArea>
              <Box px="lg" py="sm" style={{ background: '#FAFAFA', borderTop: '1px solid #F0F0F0' }}>
                <Text size="xs" c="dimmed" italic fw={400}>Activity status is updated every 15 seconds</Text>
              </Box>
            </Tabs.Panel>
          </Tabs>
        </Paper>
      </Container>
    </Box>
  );
}

