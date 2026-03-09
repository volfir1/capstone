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
      <Container size="xl" px={{ base: 'md', sm: 'xl' }}>

        {/* ── Header ── */}
        <Group justify="space-between" mb="lg">
          <Box>
            <Title order={3} fw={700} c={CHARCOAL}>Dashboard</Title>
            <Text size="sm" fw={500} c={MUTED_OLIVE}>Manage legal services platform</Text>
          </Box>
          <ActionIcon
            variant="subtle"
            color="gray"
            onClick={() => { fetchStats(); fetchReviews(); fetchActivityLogs(); }}
            loading={loading}
          >
            <IconRefresh size={18} />
          </ActionIcon>
        </Group>

        {/* ── A. Stats Cards ── */}
        <SimpleGrid cols={{ base: 2, sm: 4 }} spacing={{ base: 'sm', sm: 'md' }} mb="md">
          {[
            { label: 'Total Cases', value: stats.totalCases, icon: IconFiles, color: PRIMARY_BROWN },
            { label: 'Total Users', value: stats.totalUsers, icon: IconUsers, color: PRIMARY_GOLD },
            { label: 'Pending Reviews', value: stats.pendingReviews, icon: IconScale, color: '#F59F00' },
            { label: 'Finalized', value: stats.totalFinalized, icon: IconClipboardCheck, color: MUTED_OLIVE },
          ].map((card) => (
            <Paper key={card.label} p={{ base: 'sm', sm: 'md' }} radius="lg" withBorder>
              <Group gap="sm" wrap="nowrap">
                <Box style={{
                  width: 36,
                  height: 36,
                  flexShrink: 0,
                  borderRadius: 10,
                  background: card.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <card.icon size={18} color="white" />
                </Box>
                <Box style={{ minWidth: 0 }}>
                  <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {card.label}
                  </Text>
                  <Text size="xl" fw={700} c={CHARCOAL}>{card.value}</Text>
                </Box>
              </Group>
            </Paper>
          ))}
        </SimpleGrid>

        {/* ── B. Donut Charts ── */}
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing={{ base: 'sm', sm: 'md' }} mb="xl">
          {[
            { title: 'Legal Services', data: serviceData, total: serviceData.reduce((s, d) => s + d.value, 0) },
            { title: 'Review Pipeline', data: reviewStageData, total: stats.totalReviews },
            { title: 'Finalized Decisions', data: finalizeData, total: stats.totalFinalized },
            { title: 'Users by Role', data: userRoleData, total: stats.totalUsers },
          ].map(chart => (
            <Paper key={chart.title} p={{ base: 'md', sm: 'lg' }} radius="lg" withBorder>
              <Text size="sm" c={MUTED_OLIVE} tt="uppercase" fw={700} mb="md" lts={0.5}>{chart.title}</Text>

              <Stack gap="md" align="center">
                {/* Donut — enlarged */}
                <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 180, height: 180, flexShrink: 0 }}>
                  <DonutChart
                    data={chart.data}
                    size={180}
                    thickness={24}
                    chartLabel={`${chart.total}`}
                  />
                </Box>

                {/* Legend — full width, larger text */}
                <Box style={{
                  width: '100%',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px 16px',
                }}>
                  {chart.title === 'Legal Services' ? (
                    (() => {
                      const courtNames = ['With Record', 'Without Record'];
                      const courtItems = chart.data.filter(d => courtNames.includes(d.name));
                      const otherItems = chart.data.filter(d => !courtNames.includes(d.name));
                      return (
                        <>
                          {otherItems.map(d => (
                            <Group key={d.name} gap={8} wrap="nowrap">
                              <Box style={{ width: 10, height: 10, flexShrink: 0, borderRadius: 3, background: d.color, marginTop: 3 }} />
                              <Text size="sm" c={CHARCOAL} fw={600} style={{ wordBreak: 'break-word' }}>
                                {d.name}: <Text span fw={700} c={CHARCOAL}>{d.value}</Text>
                              </Text>
                            </Group>
                          ))}
                          <Box style={{ gridColumn: '1 / -1', marginTop: 6, paddingTop: 8, borderTop: '1px dashed #E9ECEF' }}>
                            <Text size="xs" fw={700} c={MUTED_OLIVE} mb={6} tt="uppercase" lts={0.3}>Court Representation</Text>
                            <Box style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>
                              {courtItems.map(d => (
                                <Group key={d.name} gap={8} wrap="nowrap">
                                  <Box style={{ width: 10, height: 10, flexShrink: 0, borderRadius: 3, background: d.color, marginTop: 3 }} />
                                  <Text size="sm" c={CHARCOAL} fw={600} style={{ wordBreak: 'break-word' }}>
                                    {d.name}: <Text span fw={700} c={CHARCOAL}>{d.value}</Text>
                                  </Text>
                                </Group>
                              ))}
                            </Box>
                          </Box>
                        </>
                      );
                    })()
                  ) : (
                    chart.data.map(d => (
                      <Group key={d.name} gap={8} wrap="nowrap">
                        <Box style={{ width: 10, height: 10, flexShrink: 0, borderRadius: 3, background: d.color, marginTop: 3 }} />
                        <Text size="sm" c={CHARCOAL} fw={600} style={{ wordBreak: 'break-word' }}>
                          {d.name}: <Text span fw={700} c={CHARCOAL}>{d.value}</Text>
                        </Text>
                      </Group>
                    ))
                  )}
                </Box>
              </Stack>
            </Paper>
          ))}
        </SimpleGrid>

        {/* ── C. Review Queue ── */}
        <Paper shadow="sm" radius="lg" bg="white" withBorder style={{ overflow: 'hidden' }}>
          {/* Header */}
          <Box px={{ base: 'md', sm: 'lg' }} py="md" style={{ borderBottom: '1px solid #F0F0F0', background: '#FAFAFA' }}>
            <Stack gap="sm">
              <Group justify="space-between" align="center">
                <Title order={4} c={CHARCOAL} fw={700} tt="uppercase" lts={0.5}>Review Queue</Title>
              </Group>
              {/* Search always full-width */}
              <TextInput
                placeholder="Search client..."
                leftSection={<IconSearch size={14} />}
                size="xs"
                radius="md"
                value={reviewSearch}
                onChange={(e) => { setReviewSearch(e.currentTarget.value); setReviewPage(1); }}
                style={{ width: '100%' }}
              />
            </Stack>
          </Box>

          <Tabs value={reviewTab} onChange={(v) => { setReviewTab(v); setReviewPage(1); }} variant="pills" p={{ base: 'sm', sm: 'md' }}>
            {/* Scrollable tabs on mobile */}
            <ScrollArea type="scroll" scrollbarSize={0} mb="md">
              <Tabs.List style={{ flexWrap: 'nowrap', whiteSpace: 'nowrap' }}>
                <Tabs.Tab value="supervising" leftSection={<IconScale size={14} />} rightSection={<Badge size="xs" circle color="orange" fw={600}>{supervisingLawyerReviews.length}</Badge>}>
                  Supervising
                </Tabs.Tab>
                <Tabs.Tab value="director" leftSection={<IconClipboardCheck size={14} />} rightSection={<Badge size="xs" circle color="grape" fw={600}>{directorReviews.length}</Badge>}>
                  Director
                </Tabs.Tab>
                <Tabs.Tab value="returned" leftSection={<IconAlertCircle size={14} />} rightSection={<Badge size="xs" circle color="red" fw={600}>{returnedToInternReviews.length}</Badge>}>
                  Returned
                </Tabs.Tab>
              </Tabs.List>
            </ScrollArea>

            {/* Table header — hide date on mobile */}
            <Box px={{ base: 'sm', sm: 'md' }} py={8} bg="#F8F9FA" style={{ borderBottom: '1px solid #EEE' }}>
              <Group wrap="nowrap" gap="md">
                <Text size="xs" fw={600} c={MUTED_OLIVE} style={{ flex: 1 }}>CLIENT NAME</Text>
                {/* Hide on mobile */}
                <Text
                  size="xs"
                  fw={600}
                  c={MUTED_OLIVE}
                  style={{ width: 140, textAlign: 'center' }}
                  visibleFrom="sm"
                >
                  SUBMISSION DATE
                </Text>
                <Text size="xs" fw={600} c={MUTED_OLIVE} style={{ width: 40, textAlign: 'center' }}>VIEW</Text>
              </Group>
            </Box>

            {['supervising', 'director', 'returned'].map(tab => {
              const data = tab === 'supervising' ? supervisingLawyerReviews : tab === 'director' ? directorReviews : returnedToInternReviews;
              const paginated = data.slice((reviewPage - 1) * ITEMS_PER_PAGE, reviewPage * ITEMS_PER_PAGE);
              const bColor = tab === 'supervising' ? PRIMARY_GOLD : tab === 'director' ? '#7950F2' : '#FA5252';
              return (
                <Tabs.Panel key={tab} value={tab}>
                  <Stack gap={0}>
                    {paginated.length > 0 ? paginated.map((r, i) => (
                      <Box key={r._id || r.id}>
                        <Group
                          px={{ base: 'sm', sm: 'md' }}
                          py={{ base: 10, sm: 0 }}
                          h={{ base: 'auto', sm: 44 }}
                          wrap="nowrap"
                          gap="md"
                          style={{
                            cursor: 'pointer',
                            borderLeft: `4px solid ${bColor}`,
                            background: i % 2 === 0 ? 'white' : '#FAFAFA',
                            alignItems: 'center',
                          }}
                          onClick={() => navigate(`/admin/recommendation/${r.caseId}`, { state: { review: r, isViewingExistingReview: true } })}
                        >
                          {/* Client info: name + date stacked on mobile */}
                          <Box style={{ flex: 1, minWidth: 0 }}>
                            <Text fw={600} size="sm" truncate>{r.clientName || 'Unknown'}</Text>
                            {/* Date shown inline below name on mobile only */}
                            <Text
                              size="xs"
                              fw={500}
                              c={MUTED_OLIVE}
                              hiddenFrom="sm"
                            >
                              {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </Text>
                          </Box>
                          {/* Date column: desktop only */}
                          <Box style={{ width: 140, textAlign: 'center' }} visibleFrom="sm">
                            <Text size="xs" fw={500} c={MUTED_OLIVE}>
                              {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </Text>
                          </Box>
                          <Box style={{ width: 40, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
                            <IconChevronRight size={18} color="gray" />
                          </Box>
                        </Group>
                        <Divider color="#F3F4F6" />
                      </Box>
                    )) : (
                      <Center h={100}>
                        <Text c="dimmed" size="sm" fw={500}>No pending reviews</Text>
                      </Center>
                    )}
                  </Stack>
                </Tabs.Panel>
              );
            })}
          </Tabs>

          <Box px={{ base: 'md', sm: 'lg' }} py="xs" style={{ background: '#FAFAFA', borderTop: '1px solid #F0F0F0' }}>
            <Pagination
              total={Math.ceil((reviewTab === 'supervising' ? supervisingLawyerReviews.length : reviewTab === 'director' ? directorReviews.length : returnedToInternReviews.length) / ITEMS_PER_PAGE) || 1}
              value={reviewPage}
              onChange={setReviewPage}
              color={PRIMARY_BROWN}
              size="xs"
              radius="md"
              withEdges={false}
            />
          </Box>
        </Paper>

        {/* ── D. Activity Monitoring ── */}
        <Paper shadow="sm" radius="lg" bg="white" mt="xl" withBorder style={{ overflow: 'hidden' }}>
          {/* Header */}
          <Box px={{ base: 'md', sm: 'lg' }} py="md" style={{ borderBottom: '1px solid #F0F0F0', background: '#FAFAFA' }}>
            <Stack gap="sm">
              {/* Title row */}
              <Group justify="space-between" align="center">
                <Group gap="sm">
                  <Box style={{ width: 32, height: 32, flexShrink: 0, borderRadius: 10, background: CHARCOAL, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IconActivity size={18} color="white" stroke={2} />
                  </Box>
                  <Title order={4} c={CHARCOAL} fw={700} tt="uppercase" lts={0.5}>Activity Monitoring</Title>
                </Group>
                {/* Online badge — only show when on online tab */}
                {activityTab === 'online' && (
                  <Badge size="lg" variant="light" color="green" radius="md" fw={600} leftSection={<IconCircleFilled size={10} style={{ color: '#40C057' }} />}>
                    {onlineUsers.length} Active
                  </Badge>
                )}
              </Group>

              {/* Filters row — only show when on logs tab, stack-friendly */}
              {activityTab === 'logs' && (
                <Group gap="xs" wrap="wrap">
                  <Select
                    placeholder="Period"
                    size="xs"
                    radius="md"
                    value={logPeriod}
                    onChange={(val) => { setLogPeriod(val || 'today'); setLogPage(1); }}
                    data={[
                      { value: 'today', label: 'Today' },
                      { value: 'week', label: 'Last 7 Days' },
                      { value: 'month', label: 'Last 30 Days' },
                    ]}
                    style={{ flex: '1 1 120px', minWidth: 100 }}
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
                    style={{ flex: '1 1 150px', minWidth: 120 }}
                  />
                </Group>
              )}
            </Stack>
          </Box>

          <Tabs value={activityTab} onChange={setActivityTab} variant="pills" p={{ base: 'sm', sm: 'md' }}>
            <Tabs.List mb="md">
              <Tabs.Tab value="logs" leftSection={<IconRotateClockwise size={14} />}>All Activity</Tabs.Tab>
              <Tabs.Tab
                value="online"
                leftSection={<IconUsers size={14} />}
                rightSection={onlineUsers.length > 0 && <Badge size="xs" circle color="green" fw={600}>{onlineUsers.length}</Badge>}
              >
                Currently Online
              </Tabs.Tab>
            </Tabs.List>

            {/* ── Logs Tab ── */}
            <Tabs.Panel value="logs">
              {/* Table header — desktop only */}
              <Box
                px={{ base: 'sm', sm: 'md' }}
                py={8}
                bg="#F8F9FA"
                visibleFrom="sm"
                style={{ borderBottom: '1px solid #EEE', borderRadius: '8px 8px 0 0' }}
              >
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
                          {/* ── Mobile card layout ── */}
                          <Box
                            hiddenFrom="sm"
                            px="sm"
                            py="xs"
                            style={{ background: idx % 2 === 0 ? 'white' : '#FAFAFA' }}
                          >
                            <Group justify="space-between" align="flex-start" wrap="nowrap">
                              <Group gap="xs" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                                <Badge size="xs" variant="light" color={config.color} fw={600} leftSection={config.icon} style={{ flexShrink: 0 }}>
                                  {config.label}
                                </Badge>
                                <Box style={{ minWidth: 0 }}>
                                  <Text size="sm" fw={600} c={CHARCOAL} truncate>{log.userName || log.userEmail || 'Unknown User'}</Text>
                                  <Text size={10} fw={400} c="dimmed" truncate>{log.userEmail}</Text>
                                </Box>
                              </Group>
                              <Box style={{ flexShrink: 0, textAlign: 'right' }}>
                                <Text size="xs" fw={600} c={CHARCOAL}>
                                  {logDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                                <Text size={10} c="dimmed">
                                  {logDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </Text>
                              </Box>
                            </Group>
                            <Box mt={4}>
                              <Badge size="xs" variant="outline" color="gray" radius="sm" fw={500}>{roleName}</Badge>
                            </Box>
                          </Box>

                          {/* ── Desktop row layout ── */}
                          <Group
                            visibleFrom="sm"
                            wrap="nowrap"
                            px="md"
                            h={50}
                            gap="md"
                            style={{ background: idx % 2 === 0 ? 'white' : '#FAFAFA' }}
                          >
                            <Box style={{ width: 60, flexShrink: 0 }}>
                              <Badge size="xs" variant="light" color={config.color} fw={600} leftSection={config.icon}>
                                {config.label}
                              </Badge>
                            </Box>
                            <Box style={{ flex: 1, minWidth: 0 }}>
                              <Text size="sm" fw={600} c={CHARCOAL} truncate>{log.userName || log.userEmail || 'Unknown User'}</Text>
                              <Text size={10} fw={400} c="dimmed" truncate>{log.userEmail}</Text>
                            </Box>
                            <Box style={{ width: 120, textAlign: 'center', flexShrink: 0 }}>
                              <Badge size="xs" variant="outline" color="gray" radius="sm" fw={500}>{roleName}</Badge>
                            </Box>
                            <Box style={{ width: 180, textAlign: 'right', flexShrink: 0 }}>
                              <Group gap={4} justify="flex-end">
                                <Text size="xs" fw={600} c={CHARCOAL}>
                                  {logDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                                <Text size="xs" c="dimmed">•</Text>
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

              <Box px={{ base: 'md', sm: 'lg' }} py="xs" style={{ background: '#FAFAFA', borderTop: '1px solid #F0F0F0' }}>
                <Pagination
                  total={Math.ceil(logTotal / LOG_ITEMS) || 1}
                  value={logPage}
                  onChange={setLogPage}
                  color={PRIMARY_BROWN}
                  size="xs"
                  radius="md"
                  withEdges={false}
                />
              </Box>
            </Tabs.Panel>

            {/* ── Online Tab ── */}
            <Tabs.Panel value="online">
              {/* Table header — desktop only */}
              <Box
                px={{ base: 'sm', sm: 'md' }}
                py={8}
                bg="#F8F9FA"
                visibleFrom="sm"
                style={{ borderBottom: '1px solid #EEE', borderRadius: '8px 8px 0 0' }}
              >
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
                          {/* ── Mobile card layout ── */}
                          <Box
                            hiddenFrom="sm"
                            px="sm"
                            py="xs"
                            style={{ background: idx % 2 === 0 ? 'white' : '#FAFAFA' }}
                          >
                            <Group justify="space-between" align="center" wrap="nowrap">
                              <Group gap="xs" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                                <IconCircleFilled size={10} style={{ color: '#40C057', flexShrink: 0 }} />
                                <Box style={{ minWidth: 0 }}>
                                  <Text size="sm" fw={600} c={CHARCOAL} truncate>{user.userName || 'Unknown User'}</Text>
                                  <Badge size="xs" variant="outline" color="gray" radius="sm" fw={500} mt={2}>{roleName}</Badge>
                                </Box>
                              </Group>
                              <Box style={{ flexShrink: 0, textAlign: 'right' }}>
                                <Text size="xs" fw={600} c={CHARCOAL}>
                                  {seenDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                                <Text size={10} c="dimmed">
                                  {seenDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </Text>
                              </Box>
                            </Group>
                          </Box>

                          {/* ── Desktop row layout ── */}
                          <Group
                            visibleFrom="sm"
                            wrap="nowrap"
                            px="md"
                            h={50}
                            gap="md"
                            style={{ background: idx % 2 === 0 ? 'white' : '#FAFAFA' }}
                          >
                            <Box style={{ width: 40, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
                              <IconCircleFilled size={10} style={{ color: '#40C057' }} />
                            </Box>
                            <Box style={{ flex: 1, minWidth: 0 }}>
                              <Text size="sm" fw={600} c={CHARCOAL} truncate>{user.userName || 'Unknown User'}</Text>
                            </Box>
                            <Box style={{ width: 120, textAlign: 'center', flexShrink: 0 }}>
                              <Badge size="xs" variant="outline" color="gray" radius="sm" fw={500}>{roleName}</Badge>
                            </Box>
                            <Box style={{ width: 180, textAlign: 'right', flexShrink: 0 }}>
                              <Group gap={4} justify="flex-end">
                                <Text size="xs" fw={600} c={CHARCOAL}>
                                  {seenDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                                <Text size="xs" c="dimmed">•</Text>
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
                  <Center h={150}>
                    <Stack gap={4} align="center">
                      <Text size="xs" c="dimmed" fw={500}>No users are currently online</Text>
                    </Stack>
                  </Center>
                )}
              </ScrollArea>

              <Box px={{ base: 'md', sm: 'lg' }} py="sm" style={{ background: '#FAFAFA', borderTop: '1px solid #F0F0F0' }}>
                <Text size="xs" c="dimmed" fs="italic" fw={400}>Activity status is updated every 15 seconds</Text>
              </Box>
            </Tabs.Panel>
          </Tabs>
        </Paper>

      </Container>
    </Box>
  );
}