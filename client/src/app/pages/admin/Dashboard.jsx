import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  RingProgress,
  TextInput,
  Tabs,
  Select,
  Modal,
  Textarea,
} from '@mantine/core';
import { DonutChart } from '@mantine/charts';
import '@mantine/charts/styles.css';
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
  IconEye,
  IconScale,
  IconClipboardCheck,
  IconSearch,
  IconFilter,
  IconLogin,
  IconLogout,
  IconCircleFilled,
  IconActivity,
} from '@tabler/icons-react';
import { PRIMARY_GOLD, PRIMARY_BROWN, MUTED_OLIVE, BG, CHARCOAL, ACCENT_TAN } from '@utils/constants';
import apiClient from '@config/api/apiClient';
import { useAuth } from '@/context/authContext';
import { useLocation } from 'react-router-dom';

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
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [finalized, setFinalized] = useState([]);
  const [loadingFinalized, setLoadingFinalized] = useState(false);
  const [caseRecordsMap, setCaseRecordsMap] = useState({});
  // Assign modal state
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignMessage, setAssignMessage] = useState('');
  const [assignSelected, setAssignSelected] = useState(null);
  const [assignees, setAssignees] = useState([]);
  const [assigneeLoading, setAssigneeLoading] = useState(false);
  const [assigningCaseId, setAssigningCaseId] = useState(null);
  const [assignedCases, setAssignedCases] = useState([]);
  const [assignedTab, setAssignedTab] = useState('pending');
  const [markLoadingId, setMarkLoadingId] = useState(null);
  const [assignModalRoleTab, setAssignModalRoleTab] = useState('intern');
  const [assignModalSearch, setAssignModalSearch] = useState('');
  const [slPage, setSlPage] = useState(1);
  const [dirPage, setDirPage] = useState(1);
  const [retPage, setRetPage] = useState(1);
  const [finPage, setFinPage] = useState(1);
  const [finalizedTab, setFinalizedTab] = useState('all');
  const ITEMS_PER_PAGE = 5;
  const { userData, loading: authLoading } = useAuth();
  const location = useLocation();

  // Search & filter state
  const [reviewSearch, setReviewSearch] = useState('');
  const [reviewStageFilter, setReviewStageFilter] = useState('all');
  const [finalizedSearch, setFinalizedSearch] = useState('');
  const [finalizedDecisionFilter, setFinalizedDecisionFilter] = useState('all');
  const [finalizedServiceFilter, setFinalizedServiceFilter] = useState('all');

  // Activity log state
  const [activityLogs, setActivityLogs] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logPage, setLogPage] = useState(1);
  const [logTotal, setLogTotal] = useState(0);
  const [logPeriod, setLogPeriod] = useState('today');
  const [logActionFilter, setLogActionFilter] = useState('all');
  const activityPollRef = useRef(null);
  const LOG_ITEMS = 10;

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

  // Activity log fetch
  const fetchActivityLogs = useCallback(async () => {
    try {
      setLoadingLogs(true);
      const params = new URLSearchParams({ page: logPage, limit: LOG_ITEMS, period: logPeriod });
      if (logActionFilter !== 'all') params.append('action', logActionFilter);
      const res = await apiClient.get(`/activity-logs?${params.toString()}`);
      if (res.data.success) {
        setActivityLogs(res.data.data);
        setLogTotal(res.data.total);
        setOnlineUsers(res.data.onlineUsers || []);
      }
    } catch (err) {
      console.error('Activity logs error:', err);
    } finally {
      setLoadingLogs(false);
    }
  }, [logPage, logPeriod, logActionFilter]);

  // Poll activity logs every 15 seconds
  useEffect(() => {
    fetchActivityLogs();
    activityPollRef.current = setInterval(fetchActivityLogs, 15000);
    return () => clearInterval(activityPollRef.current);
  }, [fetchActivityLogs]);

  useEffect(() => {
    // Fetch reviews for all admin roles
    if (userData && (userData.role === 'attorney' || userData.role === 'secretary' || userData.role === 'intern' || userData.role === 'pao_lawyer' || userData.role === 'legal_volunteer' || userData.role === 'supervising_lawyer' || userData.role === 'director')) {
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

  // Filter reviews by search + stage
  const searchFilteredReviews = reviews.filter(r => {
    const name = (r.content?.interviewInfo?.clientName || r.clientName || '').toLowerCase();
    const role = (r.reviewerRole || '').toLowerCase();
    const q = reviewSearch.toLowerCase().trim();
    if (q && !name.includes(q) && !role.includes(q)) return false;
    return true;
  });

  const getStageFilteredReviews = (stage) => {
    return searchFilteredReviews.filter(r => {
      if (stage === 'supervising_lawyer') return r.reviewStage === 'supervising_lawyer' || !r.reviewStage;
      return r.reviewStage === stage;
    });
  };

  const allFilteredReviews = reviewStageFilter === 'all'
    ? searchFilteredReviews
    : searchFilteredReviews.filter(r => {
        if (reviewStageFilter === 'supervising_lawyer') return r.reviewStage === 'supervising_lawyer' || !r.reviewStage;
        return r.reviewStage === reviewStageFilter;
      });

  const supervisingLawyerReviews = getStageFilteredReviews('supervising_lawyer');
  const directorReviews = getStageFilteredReviews('director');
  const returnedToInternReviews = getStageFilteredReviews('returned_to_intern');

  // Filter finalized by search + decision + service type
  const filteredFinalized = finalized.filter(f => {
    const name = (f.clientName || f.content?.interviewInfo?.clientName || '').toLowerCase();
    const title = (f.caseTitle || f.content?.caseInfo?.caseTitle || f.content?.caseInfo?.title || '').toLowerCase();
    const q = finalizedSearch.toLowerCase().trim();
    if (q && !name.includes(q) && !title.includes(q)) return false;
    if (finalizedDecisionFilter !== 'all' && f.decision !== finalizedDecisionFilter) return false;
    if (finalizedServiceFilter !== 'all') {
      // Use the same classification as FinalizedCases.jsx
      const flag = f.content?.interviewInfo?.forLegalAdvice;
      const isLA = flag === true || flag === 'true' || flag === 1 || flag === '1';
      const caseType = f.content?.interviewInfo?.caseType || '';
      const isDoc = caseType === 'legal-document';

      if (finalizedServiceFilter === 'legal-advice' && !isLA) return false;
      if (finalizedServiceFilter === 'legal-document' && !isDoc) return false;
      if (finalizedServiceFilter === 'court-representation' && (isLA || isDoc)) return false;
    }
    return true;
  });

  // Finalized tab filtering: 'all' or 'done'
  // 'done' should show every finalized record marked as completed across accounts.
  const isMarkedDone = (f) => {
    if (!f) return false;
    const v = f.assignedCompleted;
    return v === true || v === 'true' || v === 1 || v === '1';
  };

  // Show 'All' = not-done items (including assigned but not completed),
  // 'Done' = items marked completed. Apply the same search/decision/service filters.
  const displayedFinalized = filteredFinalized.filter((f) => {
    if (finalizedTab === 'all') return !isMarkedDone(f);
    return isMarkedDone(f);
  });

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

  // Fetch eligible assignees when modal opens (exclude current user and role 'user')
  const fetchAssignees = async () => {
    try {
      setAssigneeLoading(true);
      // try specific endpoint first
      let res;
      try {
        res = await apiClient.get('/users/eligibleAssignees');
      } catch (err) {
        // fallback to generic users list
        res = await apiClient.get('/users');
      }
      const data = res.data?.data ?? res.data ?? [];
      const list = Array.isArray(data) ? data : [];
      const filtered = list.filter(u => {
        const role = (u.role || '').toLowerCase();
        const id = u._id || u.id;
        if (!id) return false;
        if (userData && (userData._id === id || userData.id === id)) return false; // exclude current user
        if (role === 'user') return false; // exclude plain users
        return true;
      });
      setAssignees(filtered);
    } catch (err) {
      console.error('fetchAssignees error', err);
      setAssignees([]);
    } finally {
      setAssigneeLoading(false);
    }
  };

  useEffect(() => {
    if (assignModalOpen) fetchAssignees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignModalOpen]);

  const handleDoAssign = async () => {
    if (!assigningCaseId) return;
    if (!assignSelected) {
      notifications.show({ title: 'Select user', message: 'Please select a user to assign', color: 'yellow' });
      return;
    }
    try {
      setAssignLoading(true);
      await apiClient.post(`/cases/${assigningCaseId}/assign`, { assigneeId: assignSelected, message: assignMessage });
      notifications.show({ title: 'Assigned', message: 'Case assigned successfully', color: 'teal' });
      setAssignModalOpen(false);
      setAssignSelected(null);
      setAssignMessage('');
      setAssigningCaseId(null);
      fetchFinalized();
      try { await fetchAssignedCases(); } catch (e) { console.warn('refresh assigned after assign failed', e); }
    } catch (err) {
      console.error('Assignment failed', err);
      notifications.show({ title: 'Error', message: 'Assignment failed', color: 'red' });
    } finally {
      setAssignLoading(false);
    }
  };

  // Fetch finalize documents assigned to current user from server
  const fetchAssignedCases = useCallback(async () => {
    if (!userData) return;
    try {
      const res = await apiClient.get('/finalize/assigned');
      const data = res.data?.data ?? res.data ?? [];
      const list = Array.isArray(data) ? data : [];

      // Only keep items assigned to current user (server may return broader set)
      const userId = userData?._id || userData?.id;
      const firebaseUid = userData?.firebaseUid || userData?.uid;
      const email = userData?.email;
      const filtered = list.filter((f) => {
        const assigned = f.assignedTo || f.content?.interviewInfo?.assignedTo || f.content?.caseInfo?.assignedTo;
        if (!assigned) return false;
        if (typeof assigned === 'string') {
          return assigned === userId || assigned === firebaseUid || assigned === email;
        }
        if (typeof assigned === 'object') {
          return (
            assigned._id === userId ||
            assigned.id === userId ||
            assigned.firebaseUid === firebaseUid ||
            assigned.email === email ||
            assigned.userId === userId
          );
        }
        return false;
      });

      // Enrich each finalize with any linked Case document (if available)
      const enriched = await Promise.all(filtered.map(async (f) => {
        const out = { ...f };
        try {
          const linked = f.linkedCaseId || null;
          if (linked) {
            const caseResp = await apiClient.get(`/cases/${linked}`);
            out._case = caseResp.data?.data ?? caseResp.data ?? null;
          }
        } catch (err) {
          // ignore; leave _case undefined
        }
        return out;
      }));

      setAssignedCases(enriched);
    } catch (err) {
      console.error('fetchAssignedCases error', err);
      setAssignedCases([]);
    }
  }, [userData]);

  useEffect(() => {
    if (userData) fetchAssignedCases();
  }, [userData, fetchAssignedCases]);

  // Mark assigned case/finalize as completed. If a linked Case exists, call the Case complete endpoint.
  const handleMarkDone = async (caseId, finalizeId) => {
    if (!caseId && !finalizeId) return;
    const loadingId = finalizeId || caseId;
    try {
      setMarkLoadingId(loadingId);
      if (caseId) {
        await apiClient.post(`/cases/${caseId}/complete`);
      } else {
        await apiClient.post(`/finalize/${finalizeId}/complete`);
      }
      notifications.show({ title: 'Marked Done', message: 'Case marked as done', color: 'teal' });
        // refresh lists and show finished tab
        await fetchFinalized();
        await fetchAssignedCases();
        setAssignedTab('finished');
    } catch (err) {
      console.error('Mark done error', err);
      notifications.show({ title: 'Error', message: 'Failed to mark case as done', color: 'red' });
    } finally {
      setMarkLoadingId(null);
    }
  };

  // Chart data derived from live stats
  const serviceData = [
    { name: 'Legal Advice', value: stats.serviceBreakdown?.legalAdvice || 0, color: '#4DABF7' },
    { name: 'Legal Drafting', value: stats.serviceBreakdown?.legalDrafting || 0, color: PRIMARY_GOLD },
    { name: 'With Record', value: stats.serviceBreakdown?.courtWithRecord || 0, color: '#40C057' },
    { name: 'Without Record', value: stats.serviceBreakdown?.courtWithoutRecord || 0, color: '#FCC419' },
  ].filter(d => d.value > 0);
  const totalServices = serviceData.reduce((sum, d) => sum + d.value, 0);

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

  // Show loading screen while authenticating
  if (authLoading) {
    return (
      <Box bg={BG} mih="100vh" py="xl">
        <Center mih="100vh">
          <Loader size="lg" color={PRIMARY_BROWN} />
        </Center>
      </Box>
    );
  }

  return (
    <Box 
      bg={BG} 
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
          .review-row:hover {
            background: #F9F7F5 !important;
          }
        `}
      </style>
      <Container size="xl">
        {/* Page Header */}
        <Group justify="space-between" align="center" mb="lg">
          <Box>
            <Title order={3} c={CHARCOAL} lh={1.2}>
              Dashboard
            </Title>
            <Text size="sm" c={MUTED_OLIVE} mt={2}>
              Manage your legal services platform
            </Text>
          </Box>
          <Tooltip label="Refresh data">
            <ActionIcon
              size="md"
              variant="subtle"
              color="gray"
              onClick={() => { fetchStats(); fetchReviews(); fetchFinalized(); }}
              loading={loading}
              radius="md"
            >
              <IconRefresh size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>

        {/* Stats Overview */}
        {loading && !stats.totalCases ? (
          <Center py="xl">
            <Loader size="lg" color={PRIMARY_BROWN} />
          </Center>
        ) : (
          <>
            {/* Top row: 4 key metric cards */}
            <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md" mb="md">
              {[
                { label: 'Total Cases', value: stats.totalCases, icon: IconFiles, color: PRIMARY_BROWN },
                { label: 'Total Users', value: stats.totalUsers, icon: IconUsers, color: PRIMARY_GOLD },
                { label: 'Pending Reviews', value: stats.pendingReviews, icon: IconScale, color: '#F59F00' },
                { label: 'Finalized', value: stats.totalFinalized, icon: IconClipboardCheck, color: MUTED_OLIVE },
              ].map((card) => {
                const Icon = card.icon;
                return (
                  <Paper key={card.label} shadow="xs" p="md" radius="lg" style={{ background: 'white', border: '1px solid #F0F0F0' }}>
                    <Group gap="sm" wrap="nowrap">
                      <Box style={{ width: 40, height: 40, borderRadius: 10, background: card.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={20} color="white" stroke={2.5} />
                      </Box>
                      <Box>
                        <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} lts={0.5} lh={1.2}>{card.label}</Text>
                        <Text size="1.5rem" fw={700} c={CHARCOAL} lh={1.1}>{card.value}</Text>
                      </Box>
                    </Group>
                  </Paper>
                );
              })}
            </SimpleGrid>

            {/* Your Assigned Cases (Pending / Finished tabs) */}
            <Paper shadow="xs" radius="lg" bg="white" mt="md" mb="md" style={{ overflow: 'hidden' }}>
              <Box px="lg" py={10} style={{ background: '#FAFAFA', borderBottom: '1px solid #F0F0F0' }}>
                <Group justify="space-between" align="center">
                  <Text size="sm" fw={600} c={MUTED_OLIVE} tt="uppercase" lts={0.5}>Your Assigned Cases</Text>
                  <Text size="xs" c="dimmed">Assigned to you</Text>
                </Group>
              </Box>
              <Box px="lg" py="sm">
                <Tabs defaultValue={assignedTab} onTabChange={setAssignedTab} keepMounted={false}>
                  <Tabs.List>
                    <Tabs.Tab value="pending">Pending</Tabs.Tab>
                    <Tabs.Tab value="finished">Finished</Tabs.Tab>
                  </Tabs.List>

                  {['pending', 'finished'].map((tabKey) => {
                    const list = assignedCases.filter(a => !!a); // ensure array
                    const items = tabKey === 'pending'
                      ? list.filter(a => !a.assignedCompleted)
                      : list.filter(a => a.assignedCompleted);

                    return (
                      <Tabs.Panel key={tabKey} value={tabKey} pt="sm">
                        {items.length ? (
                          items.slice(0, 5).map((f) => {
                            const finalizeId = f._id || f.id;
                            const caseDoc = f._case || null;
                            const clientName = caseDoc?.userId?.firstName ? `${caseDoc.userId.firstName} ${caseDoc.userId.lastName || ''}`.trim() : (f.clientName || f.content?.interviewInfo?.clientName || '');
                            const caseTitle = caseDoc?.caseTitle || f.caseTitle || f.content?.caseInfo?.caseTitle || f.content?.caseInfo?.title || '';
                            const displayTitle = caseTitle && caseTitle !== clientName ? caseTitle : (clientName || 'Untitled Case');
                            const assignedBy = f.assignedBy || f.assignedFrom || f.content?.assignedBy;
                            const assignerName = assignedBy && typeof assignedBy === 'object' ? (assignedBy.name || assignedBy.fullName || assignedBy.displayName || assignedBy.email) : assignedBy;
                            const assignerRole = assignedBy && typeof assignedBy === 'object' ? (assignedBy.role || assignedBy.userRole || '') : '';
                            const linkedCaseId = caseDoc?._id || f.linkedCaseId || null;
                            const loadingKey = markLoadingId === (finalizeId || linkedCaseId);

                            return (
                              <div key={finalizeId}>
                                <Group align="center" position="apart" px={4} py={8} style={{ gap: 12 }}>
                                  <Box style={{ flex: 1, minWidth: 0 }}>
                                    <Text size="sm" fw={600} c={CHARCOAL} truncate>{displayTitle}</Text>
                                    <Text size="xs" c="dimmed">Assigned by: {assignerName || 'Unknown'}{assignerRole ? ` (${assignerRole.replace(/_/g, ' ')})` : ''}</Text>
                                    {caseDoc && (
                                      <Text size="xs" c="dimmed">Assigned to case: {caseDoc.caseTitle || (caseDoc._id || '').toString()}</Text>
                                    )}
                                  </Box>
                                  <Button size="xs" color="green" loading={loadingKey} onClick={() => handleMarkDone(linkedCaseId, finalizeId)} disabled={tabKey === 'finished'}>Mark as Done</Button>
                                </Group>
                                <Divider color="#EDEDED" />
                              </div>
                            );
                          })
                        ) : (
                          <Text size="sm" c="dimmed">No cases here.</Text>
                        )}
                      </Tabs.Panel>
                    );
                  })}
                </Tabs>
              </Box>
            </Paper>

            {/* Chart row */}
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" mb="xl">
              {/* Legal Services Donut */}
              <Paper shadow="xs" p="md" radius="lg" style={{ background: 'white', border: '1px solid #F0F0F0' }}>
                <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} lts={0.5} mb="sm">Legal Services</Text>
                {serviceData.length > 0 ? (
                  <Group gap="md" wrap="nowrap" align="center" style={{ minWidth: 0, minHeight: 0 }}>
                    <DonutChart data={serviceData} size={100} thickness={18} tooltipDataSource="segment" chartLabel={`${totalServices}`} width={120} height={120} aspect={undefined} style={{ minWidth: 0, minHeight: 0 }} />
                    <Box style={{ flex: 1 }}>
                      {/* Legal Advice & Legal Drafting */}
                      <Box style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px' }}>
                        {serviceData.filter(d => d.name === 'Legal Advice' || d.name === 'Legal Drafting').map(d => (
                          <Group key={d.name} gap={6} wrap="nowrap">
                            <Box style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                            <Text size="sm" c={CHARCOAL} truncate>{d.name}: <b>{d.value}</b></Text>
                          </Group>
                        ))}
                      </Box>
                      {/* Court Representation header + sub-items */}
                      {(stats.serviceBreakdown?.courtWithRecord > 0 || stats.serviceBreakdown?.courtWithoutRecord > 0) && (
                        <Box mt={8}>
                          <Text size="sm" c={CHARCOAL} fw={600}>Court Representation: <b>{(stats.serviceBreakdown?.courtWithRecord || 0) + (stats.serviceBreakdown?.courtWithoutRecord || 0)}</b></Text>
                          <Box mt={6} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
                            {serviceData.filter(d => d.name === 'With Record' || d.name === 'Without Record').map(d => (
                              <Group key={d.name} gap={6} wrap="nowrap">
                                <Box style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                                <Text size="sm" c={CHARCOAL}>{d.name}: <b>{d.value}</b></Text>
                              </Group>
                            ))}
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </Group>
                ) : (
                  <Text size="sm" c="dimmed" ta="center" py="sm">No finalized services yet</Text>
                )}
              </Paper>

              {/* Review Pipeline Donut */}
              <Paper shadow="xs" p="md" radius="lg" style={{ background: 'white', border: '1px solid #F0F0F0' }}>
                <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} lts={0.5} mb="sm">Review Pipeline</Text>
                {reviewStageData.length > 0 ? (
                  <Group gap="md" wrap="nowrap" align="center" style={{ minWidth: 0, minHeight: 0 }}>
                    <DonutChart data={reviewStageData} size={100} thickness={18} tooltipDataSource="segment" chartLabel={`${stats.totalReviews}`} width={120} height={120} aspect={undefined} style={{ minWidth: 0, minHeight: 0 }} />
                    <Box style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px' }}>
                      {reviewStageData.map(d => (
                        <Group key={d.name} gap={6} wrap="nowrap">
                          <Box style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                          <Text size="sm" c={CHARCOAL}>{d.name}: <b>{d.value}</b></Text>
                        </Group>
                      ))}
                    </Box>
                  </Group>
                ) : (
                  <Text size="sm" c="dimmed" ta="center" py="sm">No reviews yet</Text>
                )}
              </Paper>

              {/* Finalized Decisions Donut */}
              <Paper shadow="xs" p="md" radius="lg" style={{ background: 'white', border: '1px solid #F0F0F0' }}>
                <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} lts={0.5} mb="sm">Finalized Decisions</Text>
                {finalizeData.length > 0 ? (
                  <Group gap="md" wrap="nowrap" align="center" style={{ minWidth: 0, minHeight: 0 }}>
                    <DonutChart data={finalizeData} size={100} thickness={18} tooltipDataSource="segment" chartLabel={`${stats.totalFinalized}`} width={120} height={120} aspect={undefined} style={{ minWidth: 0, minHeight: 0 }} />
                    <Box style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px' }}>
                      {finalizeData.map(d => (
                        <Group key={d.name} gap={6} wrap="nowrap">
                          <Box style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                          <Text size="sm" c={CHARCOAL}>{d.name}: <b>{d.value}</b></Text>
                        </Group>
                      ))}
                    </Box>
                  </Group>
                ) : (
                  <Text size="sm" c="dimmed" ta="center" py="sm">No finalized records yet</Text>
                )}
              </Paper>

              {/* User Roles Donut */}
              <Paper shadow="xs" p="md" radius="lg" style={{ background: 'white', border: '1px solid #F0F0F0' }}>
                <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} lts={0.5} mb="sm">Users by Role</Text>
                {userRoleData.length > 0 ? (
                  <Group gap="md" wrap="nowrap" align="center" style={{ minWidth: 0, minHeight: 0 }}>
                    <DonutChart data={userRoleData} size={100} thickness={18} tooltipDataSource="segment" chartLabel={`${stats.totalUsers}`} width={120} height={120} aspect={undefined} style={{ minWidth: 0, minHeight: 0 }} />
                    <Box style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px' }}>
                      {userRoleData.map(d => (
                        <Group key={d.name} gap={6} wrap="nowrap">
                          <Box style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                          <Text size="sm" c={CHARCOAL}>{d.name}: <b>{d.value}</b></Text>
                        </Group>
                      ))}
                    </Box>
                  </Group>
                ) : (
                  <Text size="sm" c="dimmed" ta="center" py="sm">No users yet</Text>
                )}
              </Paper>
            </SimpleGrid>
          </>
        )}

        {/* Case Reviews - Consolidated compact view */}
        {userData && (userData.role === 'attorney' || userData.role === 'secretary' || userData.role === 'pao_lawyer' || userData.role === 'legal_volunteer' || userData.role === 'intern' || userData.role === 'supervising_lawyer' || userData.role === 'director') && (
          <Paper shadow="xs" radius="lg" bg="white" mt="xl" style={{ overflow: 'hidden' }}>
            {/* Reviews Search & Filter Bar */}
            <Box px="lg" py="sm" style={{ borderBottom: '1px solid #F0F0F0' }}>
              <Group gap="sm" wrap="nowrap">
                <TextInput
                  placeholder="Search reviews by client name..."
                  leftSection={<IconSearch size={16} />}
                  size="sm"
                  radius="md"
                  value={reviewSearch}
                  onChange={(e) => { setReviewSearch(e.currentTarget.value); setSlPage(1); setDirPage(1); setRetPage(1); }}
                  style={{ flex: 1 }}
                  styles={{ input: { border: '1px solid #E0E0E0', fontSize: '13px' } }}
                />
                <Select
                  placeholder="Stage"
                  size="sm"
                  radius="md"
                  value={reviewStageFilter}
                  onChange={(val) => { setReviewStageFilter(val || 'all'); setSlPage(1); setDirPage(1); setRetPage(1); }}
                  data={[
                    { value: 'all', label: 'All Stages' },
                    { value: 'supervising_lawyer', label: 'Supervising' },
                    { value: 'director', label: 'Director' },
                    { value: 'returned_to_intern', label: 'Returned' },
                  ]}
                  leftSection={<IconFilter size={16} />}
                  style={{ width: 160 }}
                  styles={{ input: { border: '1px solid #E0E0E0', fontSize: '13px' } }}
                  allowDeselect={false}
                />
              </Group>
            </Box>
            {loadingReviews ? (
              <Center py="xl"><Loader size="sm" color={PRIMARY_BROWN} /></Center>
            ) : (
              <Box style={{ display: 'flex', flexDirection: 'column' }}>
                {/* Supervising Lawyer Section */}
                {(reviewStageFilter === 'all' || reviewStageFilter === 'supervising_lawyer') && (
                <Box style={{ order: userData.role === 'director' ? 2 : 1 }}>
                <Box px="lg" py={10} style={{ background: '#FAFAFA', borderBottom: '1px solid #F0F0F0' }}>
                  <Group justify="space-between" align="center">
                    <Text size="sm" fw={600} c={MUTED_OLIVE} tt="uppercase" lts={0.5}>Pending Supervising Lawyer Review</Text>
                    <Badge size="sm" circle variant="filled" style={{ backgroundColor: PRIMARY_GOLD, color: PRIMARY_BROWN }}>
                      {supervisingLawyerReviews.length}
                    </Badge>
                  </Group>
                </Box>
                {supervisingLawyerReviews.length ? (
                  <>
                    {supervisingLawyerReviews.slice((slPage - 1) * ITEMS_PER_PAGE, slPage * ITEMS_PER_PAGE).map((r, idx) => {
                      const submitterName = r.content?.interviewInfo?.clientName || r.clientName || 'Unknown Client';
                      const role = (r.reviewerRole || 'intern').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                      return (
                        <Box key={r._id || r.id || r.caseId}>
                          <Group
                            className="review-row"
                            wrap="nowrap"
                            align="center"
                            px="lg"
                            py="sm"
                            gap="md"
                            style={{ cursor: 'pointer', transition: 'background 0.15s' }}
                            onClick={() => navigate(`/admin/recommendation/${r.caseId}`, { state: { review: r, isViewingExistingReview: true } })}
                          >
                            <Box style={{ flex: 1, minWidth: 0 }}>
                              <Group gap={8} align="center" wrap="nowrap">
                                <Text size="md" fw={600} c={CHARCOAL} truncate>{submitterName}</Text>
                                <Text size="sm" c={MUTED_OLIVE}>·</Text>
                                <Text size="sm" c={MUTED_OLIVE} truncate>{role}</Text>
                              </Group>
                            </Box>
                            <Divider orientation="vertical" color="#DEDEDE" />
                            <Text size="sm" c="dimmed" style={{ flexShrink: 0, minWidth: 75, textAlign: 'right' }}>
                              {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}
                            </Text>
                            <Divider orientation="vertical" color="#DEDEDE" />
                            <Badge size="sm" variant="light" color="orange" style={{ flexShrink: 0 }}>
                              Supervising
                            </Badge>
                            {userData.role === 'intern' && (
                              <Badge size="sm" variant="light" color="blue" style={{ flexShrink: 0 }}>Edit</Badge>
                            )}
                            <Divider orientation="vertical" color="#DEDEDE" />
                            <ActionIcon variant="subtle" color="gray" size="sm" style={{ flexShrink: 0 }}>
                              <IconChevronRight size={16} />
                            </ActionIcon>
                          </Group>
                          {idx < Math.min(ITEMS_PER_PAGE, supervisingLawyerReviews.length - (slPage - 1) * ITEMS_PER_PAGE) - 1 && <Divider color="#E0E0E0" />}
                        </Box>
                      );
                    })}
                    {supervisingLawyerReviews.length > ITEMS_PER_PAGE && (
                      <Group justify="center" py="xs">
                        <Pagination
                          size="sm"
                          total={Math.ceil(supervisingLawyerReviews.length / ITEMS_PER_PAGE)}
                          value={slPage}
                          onChange={setSlPage}
                          color={PRIMARY_BROWN}
                        />
                      </Group>
                    )}
                  </>
                ) : (
                  <Text size="sm" c={MUTED_OLIVE} px="lg" py="sm">
                    {reviewSearch ? 'No matching reviews found' : (userData.role === 'intern' ? 'No submissions pending supervising lawyer review' : 'No reviews pending')}
                  </Text>
                )}
                </Box>
                )}

                {/* Director Section */}
                {(reviewStageFilter === 'all' || reviewStageFilter === 'director') && (
                <Box style={{ order: userData.role === 'director' ? 1 : 2 }}>
                <Box px="lg" py={10} mt="sm" style={{ background: '#FAFAFA', borderTop: '1px solid #E8E8E8', borderBottom: '1px solid #F0F0F0' }}>
                  <Group justify="space-between" align="center">
                    <Text size="sm" fw={600} c={MUTED_OLIVE} tt="uppercase" lts={0.5}>Pending Director Review</Text>
                    <Badge size="sm" circle variant="filled" style={{ backgroundColor: ACCENT_TAN, color: 'white' }}>
                      {directorReviews.length}
                    </Badge>
                  </Group>
                </Box>
                {directorReviews.length ? (
                  <>
                    {directorReviews.slice((dirPage - 1) * ITEMS_PER_PAGE, dirPage * ITEMS_PER_PAGE).map((r, idx) => {
                      const submitterName = r.content?.interviewInfo?.clientName || r.clientName || 'Unknown Client';
                      const role = (r.reviewerRole || 'intern').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                      return (
                        <Box key={r._id || r.id || r.caseId}>
                          <Group
                            className="review-row"
                            wrap="nowrap"
                            align="center"
                            px="lg"
                            py="sm"
                            gap="md"
                            style={{ cursor: 'pointer', transition: 'background 0.15s' }}
                            onClick={() => navigate(`/admin/recommendation/${r.caseId}`, { state: { review: r, isViewingExistingReview: true } })}
                          >
                            <Box style={{ flex: 1, minWidth: 0 }}>
                              <Group gap={8} align="center" wrap="nowrap">
                                <Text size="md" fw={600} c={CHARCOAL} truncate>{submitterName}</Text>
                                <Text size="sm" c={MUTED_OLIVE}>·</Text>
                                <Text size="sm" c={MUTED_OLIVE} truncate>{role}</Text>
                              </Group>
                            </Box>
                            <Divider orientation="vertical" color="#DEDEDE" />
                            <Text size="sm" c="dimmed" style={{ flexShrink: 0, minWidth: 75, textAlign: 'right' }}>
                              {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}
                            </Text>
                            <Divider orientation="vertical" color="#DEDEDE" />
                            <Badge size="sm" variant="light" color="grape" style={{ flexShrink: 0 }}>
                              Director
                            </Badge>
                            {userData.role === 'intern' && (
                              <Badge size="sm" variant="light" color="blue" style={{ flexShrink: 0 }}>Edit</Badge>
                            )}
                            <Divider orientation="vertical" color="#DEDEDE" />
                            <ActionIcon variant="subtle" color="gray" size="sm" style={{ flexShrink: 0 }}>
                              <IconChevronRight size={16} />
                            </ActionIcon>
                          </Group>
                          {idx < Math.min(ITEMS_PER_PAGE, directorReviews.length - (dirPage - 1) * ITEMS_PER_PAGE) - 1 && <Divider color="#E0E0E0" />}
                        </Box>
                      );
                    })}
                    {directorReviews.length > ITEMS_PER_PAGE && (
                      <Group justify="center" py="xs">
                        <Pagination
                          size="sm"
                          total={Math.ceil(directorReviews.length / ITEMS_PER_PAGE)}
                          value={dirPage}
                          onChange={setDirPage}
                          color={PRIMARY_BROWN}
                        />
                      </Group>
                    )}
                  </>
                ) : (
                  <Text size="sm" c={MUTED_OLIVE} px="lg" py="sm">
                    {reviewSearch ? 'No matching reviews found' : (userData.role === 'intern' ? 'No submissions pending director review' : 'No reviews pending')}
                  </Text>
                )}
                </Box>
                )}

                {/* Returned to Intern Section - Visible to interns, secretary, supervising lawyers, and directors */}
                {(userData.role === 'intern' || userData.role === 'secretary' || userData.role === 'supervising_lawyer' || userData.role === 'director') && (reviewStageFilter === 'all' || reviewStageFilter === 'returned_to_intern') && (
                  <Box style={{ order: (userData.role === 'intern' || userData.role === 'secretary') ? 0 : 3 }}>
                    <Box px="lg" py={10} mt="sm" style={{ background: '#FAFAFA', borderTop: '1px solid #E8E8E8', borderBottom: '1px solid #F0F0F0' }}>
                      <Group justify="space-between" align="center">
                        <Text size="sm" fw={600} c={MUTED_OLIVE} tt="uppercase" lts={0.5}>Returned for Revision</Text>
                        <Badge size="sm" circle variant="filled" style={{ backgroundColor: '#DC2626', color: 'white' }}>
                          {returnedToInternReviews.length}
                        </Badge>
                      </Group>
                    </Box>
                    {returnedToInternReviews.length ? (
                      <>
                        {returnedToInternReviews.slice((retPage - 1) * ITEMS_PER_PAGE, retPage * ITEMS_PER_PAGE).map((r, idx) => {
                          const submitterName = r.content?.interviewInfo?.clientName || r.clientName || 'Unknown Client';
                          const role = (r.reviewerRole || 'intern').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                          return (
                            <Box key={r._id || r.id || r.caseId}>
                              <Group
                                className="review-row"
                                wrap="nowrap"
                                align="center"
                                px="lg"
                                py="sm"
                                gap="md"
                                style={{ cursor: 'pointer', transition: 'background 0.15s', background: '#FFF8F8' }}
                                onClick={() => navigate(`/admin/recommendation/${r.caseId}`, { state: { review: r, isViewingExistingReview: true } })}
                              >
                                <Box style={{ flex: 1, minWidth: 0 }}>
                                  <Group gap={8} align="center" wrap="nowrap">
                                    <Text size="md" fw={600} c={CHARCOAL} truncate>{submitterName}</Text>
                                    <Text size="sm" c={MUTED_OLIVE}>·</Text>
                                    <Text size="sm" c={MUTED_OLIVE} truncate>{role}</Text>
                                  </Group>
                                </Box>
                                <Divider orientation="vertical" color="#DEDEDE" />
                                <Text size="sm" c="dimmed" style={{ flexShrink: 0, minWidth: 75, textAlign: 'right' }}>
                                  {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}
                                </Text>
                                <Divider orientation="vertical" color="#DEDEDE" />
                                <Badge size="sm" variant="light" color="red" style={{ flexShrink: 0 }}>
                                  Returned
                                </Badge>
                                <Divider orientation="vertical" color="#DEDEDE" />
                                <ActionIcon variant="subtle" color="gray" size="sm" style={{ flexShrink: 0 }}>
                                  <IconChevronRight size={16} />
                                </ActionIcon>
                              </Group>
                              {idx < Math.min(ITEMS_PER_PAGE, returnedToInternReviews.length - (retPage - 1) * ITEMS_PER_PAGE) - 1 && <Divider color="#E0E0E0" />}
                            </Box>
                          );
                        })}
                        {returnedToInternReviews.length > ITEMS_PER_PAGE && (
                          <Group justify="center" py="xs">
                            <Pagination
                              size="sm"
                              total={Math.ceil(returnedToInternReviews.length / ITEMS_PER_PAGE)}
                              value={retPage}
                              onChange={setRetPage}
                              color={PRIMARY_BROWN}
                            />
                          </Group>
                        )}
                      </>
                    ) : (
                      <Text size="sm" c={MUTED_OLIVE} px="lg" py="sm">{reviewSearch ? 'No matching reviews found' : 'No cases returned for revision'}</Text>
                    )}
                  </Box>
                )}
              </Box>
            )}
          </Paper>
        )}

        {/* Finalized Records */}
        <Paper shadow="xs" radius="lg" bg="white" mt="xl" style={{ overflow: 'hidden' }}>
          <Tabs value={finalizedTab} onTabChange={setFinalizedTab} keepMounted={false}>
            <Box px="lg" py={10} style={{ background: '#FAFAFA', borderBottom: '1px solid #F0F0F0' }}>
              <Group justify="space-between" align="center">
                <Text size="sm" fw={600} c={MUTED_OLIVE} tt="uppercase" lts={0.5}>Finalized Records</Text>
                <Group align="center" spacing={8} style={{ position: 'relative' }}>
                  <Tabs.List style={{ position: 'relative', zIndex: 3, pointerEvents: 'auto', display: 'inline-flex' }}>
                    <Tabs.Tab value="all" style={{ cursor: 'pointer', pointerEvents: 'auto' }} onClick={() => setFinalizedTab('all')}>All</Tabs.Tab>
                    <Tabs.Tab value="done" style={{ cursor: 'pointer', pointerEvents: 'auto' }} onClick={() => setFinalizedTab('done')}>Done</Tabs.Tab>
                  </Tabs.List>
                  <Badge size="sm" circle variant="filled" style={{ backgroundColor: MUTED_OLIVE, color: 'white', position: 'relative', zIndex: 2, pointerEvents: 'none' }}>
                    {displayedFinalized.length}
                  </Badge>
                </Group>
              </Group>
            </Box>
            {/* Finalized Search & Filter Bar */}
            <Box px="lg" py="sm" style={{ borderBottom: '1px solid #F0F0F0' }}>
            <Group gap="sm" wrap="nowrap">
              <TextInput
                placeholder="Search by case title or client name..."
                leftSection={<IconSearch size={16} />}
                size="sm"
                radius="md"
                value={finalizedSearch}
                onChange={(e) => { setFinalizedSearch(e.currentTarget.value); setFinPage(1); }}
                style={{ flex: 1 }}
                styles={{ input: { border: '1px solid #E0E0E0', fontSize: '13px' } }}
              />
              <Select
                placeholder="Decision"
                size="sm"
                radius="md"
                value={finalizedDecisionFilter}
                onChange={(val) => { setFinalizedDecisionFilter(val || 'all'); setFinPage(1); }}
                data={[
                  { value: 'all', label: 'All Decisions' },
                  { value: 'accepted', label: 'Accepted' },
                  { value: 'rejected', label: 'Rejected' },
                  { value: 'pending', label: 'Pending' },
                ]}
                leftSection={<IconFilter size={16} />}
                style={{ width: 160 }}
                styles={{ input: { border: '1px solid #E0E0E0', fontSize: '13px' } }}
                allowDeselect={false}
              />
              <Select
                placeholder="Service"
                size="sm"
                radius="md"
                value={finalizedServiceFilter}
                onChange={(val) => { setFinalizedServiceFilter(val || 'all'); setFinPage(1); }}
                data={[
                  { value: 'all', label: 'All Services' },
                  { value: 'legal-advice', label: 'Legal Advice' },
                  { value: 'legal-document', label: 'Legal Drafting' },
                  { value: 'court-representation', label: 'Court Representation' },
                ]}
                leftSection={<IconFilter size={16} />}
                style={{ width: 180 }}
                styles={{ input: { border: '1px solid #E0E0E0', fontSize: '13px' } }}
                allowDeselect={false}
              />
            </Group>
          </Box>

          {loadingFinalized ? (
            <Center py="xl"><Loader size="sm" color={PRIMARY_BROWN} /></Center>
          ) : (
            displayedFinalized.length ? (
              <>
                {displayedFinalized.slice((finPage - 1) * ITEMS_PER_PAGE, finPage * ITEMS_PER_PAGE).map((f, idx) => {
                  const recordId = f._id || f.id;
                  const hasRecord = recordId ? caseRecordsMap[recordId] : false;
                  const clientName = f.clientName || f.content?.interviewInfo?.clientName || '';
                  const caseTitle = f.caseTitle || f.content?.caseInfo?.caseTitle || f.content?.caseInfo?.title || '';
                  const displayTitle = caseTitle && caseTitle !== clientName
                    ? caseTitle
                    : (clientName || 'Untitled Case');
                  const finalizedBy = (f.finalizedRole || f.finalizedBy || 'staff').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                  const finalizedDate = f.createdAt ? new Date(f.createdAt).toLocaleDateString() : '';
                  const daysAgo = f.createdAt ? Math.floor((Date.now() - new Date(f.createdAt).getTime()) / 86400000) : null;
                  const timeLabel = daysAgo !== null
                    ? (daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo}d ago`)
                    : '';
                  const assignedTo = f.assignedTo || f.content?.interviewInfo?.assignedTo || f.content?.caseInfo?.assignedTo;

                  return (
                    <Box key={f._id || f.id || f.caseId}>
                      <Group
                        className="review-row"
                        wrap="nowrap"
                        align="center"
                        px="lg"
                        py="sm"
                        gap="md"
                        style={{ cursor: 'pointer', transition: 'background 0.15s' }}
                        onClick={() => navigate('/admin/recommendation', { state: { review: f } })}
                      >
                        <Box style={{ flex: 1, minWidth: 0 }}>
                          <Group gap={8} align="center" wrap="nowrap">
                            <Text size="md" fw={600} c={CHARCOAL} truncate>{displayTitle}</Text>
                            {clientName && clientName !== displayTitle && (
                              <>
                                <Text size="sm" c={MUTED_OLIVE}>·</Text>
                                <Text size="sm" c={MUTED_OLIVE} truncate>{clientName}</Text>
                              </>
                            )}
                          </Group>
                          <Group gap={6} mt={2}>
                            <Text size="sm" c="dimmed">
                              {finalizedDate}{timeLabel ? ` (${timeLabel})` : ''} by {finalizedBy}
                            </Text>
                            {assignedTo && (
                              <>
                                <Text size="sm" c={MUTED_OLIVE} ml={8}>
                                  Assigned: {assignedTo && typeof assignedTo === 'object' ? (assignedTo.name || assignedTo.email || assignedTo.id) : (assignedTo || '—')}{assignedTo && typeof assignedTo === 'object' && (assignedTo.role || assignedTo.userRole) ? ` (${(assignedTo.role || assignedTo.userRole).replace(/_/g, ' ')})` : ''}
                                </Text>
                                {f.assignedBy && (
                                  <Text size="sm" c={MUTED_OLIVE} ml={8}>
                                    Assigned by: {typeof f.assignedBy === 'object' ? (f.assignedBy.name || f.assignedBy.email || f.assignedBy.id) : f.assignedBy}{f.assignedBy && typeof f.assignedBy === 'object' && (f.assignedBy.role || f.assignedBy.userRole) ? ` (${(f.assignedBy.role || f.assignedBy.userRole).replace(/_/g, ' ')})` : ''}
                                  </Text>
                                )}
                              </>
                            )}
                          </Group>
                        </Box>
                        <Divider orientation="vertical" color="#DEDEDE" />
                        <Badge size="sm" variant="light" color={hasRecord ? 'teal' : 'gray'} style={{ flexShrink: 0 }}>
                          {hasRecord ? 'Recorded' : 'No Record'}
                        </Badge>
                        <Divider orientation="vertical" color="#DEDEDE" />
                        <Badge size="sm" variant="light" color={f.decision === 'accepted' ? 'green' : f.decision === 'denied' ? 'red' : 'yellow'} style={{ flexShrink: 0 }}>
                          {f.decision ? f.decision.charAt(0).toUpperCase() + f.decision.slice(1) : 'Pending'}
                        </Badge>
                        <Divider orientation="vertical" color="#DEDEDE" />
                        <ActionIcon variant="subtle" color="gray" size="sm" style={{ flexShrink: 0 }}>
                          <IconChevronRight size={16} />
                        </ActionIcon>
                        {(userData && (userData.role === 'secretary' || userData.role === 'director')) && (
                        <ActionIcon
                          variant="light"
                          color="blue"
                          size="sm"
                          style={{ marginLeft: 8 }}
                            onClick={(e) => {
                            e.stopPropagation();
                            // Prefer linkedCaseId (reference to Case), then caseId (string),
                            // fall back to finalize _id only if no case reference exists.
                            const rid = f.linkedCaseId || f.caseId || f._id || f.id || recordId;
                            setAssigningCaseId(rid);
                            setAssignSelected(null);
                            setAssignMessage('');
                            setAssignModalSearch('');
                            setAssignModalRoleTab('intern');
                            setAssignModalOpen(true);
                          }}
                        >
                          <IconUserPlus size={16} />
                        </ActionIcon>
                        )}
                      </Group>
                      {idx < Math.min(ITEMS_PER_PAGE, displayedFinalized.length - (finPage - 1) * ITEMS_PER_PAGE) - 1 && <Divider color="#E0E0E0" />}
                    </Box>
                  );
                })}
                {displayedFinalized.length > ITEMS_PER_PAGE && (
                  <Group justify="center" py="xs">
                    <Pagination
                      size="sm"
                      total={Math.ceil(displayedFinalized.length / ITEMS_PER_PAGE)}
                      value={finPage}
                      onChange={setFinPage}
                      color={PRIMARY_BROWN}
                    />
                  </Group>
                )}
              </>
            ) : (
              <Text size="sm" c={MUTED_OLIVE} px="lg" py="sm">{finalizedSearch || finalizedDecisionFilter !== 'all' || finalizedServiceFilter !== 'all' ? 'No matching records found' : 'No finalized records found'}</Text>
            )
          )}
          </Tabs>
        </Paper>

        {(userData && (userData.role === 'secretary' || userData.role === 'director')) && (
        <Modal
          opened={assignModalOpen}
          onClose={() => { setAssignModalOpen(false); setAssignSelected(null); setAssignMessage(''); setAssigningCaseId(null); }}
          title="Assign Case"
          size="lg"
        >
          <Text size="sm" c="dimmed" mb="sm">Select a staff member to assign this case to (yourself and plain users are excluded).</Text>
          <TextInput
            placeholder="Search assignees by name or email"
            size="sm"
            radius="md"
            value={assignModalSearch}
            onChange={(e) => setAssignModalSearch(e.currentTarget.value)}
            mb="sm"
            leftSection={<IconSearch size={14} />}
          />

          {assigneeLoading ? (
            <Center py="lg"><Loader size="sm" color={PRIMARY_BROWN} /></Center>
          ) : (
            <Tabs defaultValue={assignModalRoleTab} onTabChange={(v) => setAssignModalRoleTab(v)} keepMounted={false}>
              <Tabs.List>
                <Tabs.Tab value="intern">Intern</Tabs.Tab>
                <Tabs.Tab value="supervising_lawyer">Supervising</Tabs.Tab>
                <Tabs.Tab value="director">Director</Tabs.Tab>
                <Tabs.Tab value="secretary">Secretary</Tabs.Tab>
              </Tabs.List>

              {['intern', 'supervising_lawyer', 'director', 'secretary'].map((roleKey) => (
                <Tabs.Panel key={roleKey} value={roleKey} pt="sm">
                  <div style={{ maxHeight: 220, overflowY: 'auto', marginBottom: 12 }}>
                    {assignees.filter(u => {
                      const r = (u.role || '').toLowerCase();
                      const q = assignModalSearch.toLowerCase().trim();
                      const name = (u.fullName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.displayName || u.name || u.username || '').toLowerCase();
                      const email = (u.email || u.userEmail || u.gmail || '').toLowerCase();
                      // role matching
                      if (roleKey === 'intern' && !r.includes('intern')) return false;
                      if (roleKey === 'supervising_lawyer' && !(r.includes('supervising') || r.includes('supervising_lawyer'))) return false;
                      if (roleKey === 'director' && !r.includes('director')) return false;
                      if (roleKey === 'secretary' && !r.includes('secretary')) return false;
                      if (q && !name.includes(q) && !email.includes(q)) return false;
                      return true;
                    }).length ? assignees.filter(u => {
                      const r = (u.role || '').toLowerCase();
                      const q = assignModalSearch.toLowerCase().trim();
                      const name = (u.fullName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.displayName || u.name || u.username || '').toLowerCase();
                      const email = (u.email || u.userEmail || u.gmail || '').toLowerCase();
                      if (roleKey === 'intern' && !r.includes('intern')) return false;
                      if (roleKey === 'supervising_lawyer' && !(r.includes('supervising') || r.includes('supervising_lawyer'))) return false;
                      if (roleKey === 'director' && !r.includes('director')) return false;
                      if (roleKey === 'secretary' && !r.includes('secretary')) return false;
                      if (q && !name.includes(q) && !email.includes(q)) return false;
                      return true;
                    }).map((u) => {
                      const id = u._id || u.id;
                      const name = u.fullName || ((u.firstName || u.lastName) ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : (u.displayName || u.name || u.username || u.email || 'Staff'));
                      const email = u.email || u.userEmail || u.gmail || '';
                      const role = (u.role || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                      return (
                        <Paper
                          key={id}
                          withBorder
                          p="xs"
                          radius="md"
                          onClick={() => setAssignSelected(id)}
                          style={{ cursor: 'pointer', marginBottom: 8, background: assignSelected === id ? '#F1F8FF' : 'white' }}
                        >
                          <Group position="apart">
                            <div>
                              <Text fw={600}>{name}</Text>
                              {email && <Text size="xs" c="dimmed">{email}</Text>}
                            </div>
                            <Text size="xs" c="dimmed">{role}</Text>
                          </Group>
                        </Paper>
                      );
                    }) : (
                      <Text size="sm" c="dimmed">No eligible assignees found.</Text>
                    )}
                  </div>
                </Tabs.Panel>
              ))}
            </Tabs>
          )}

          <Textarea
            placeholder="Optional message to assignee"
            value={assignMessage}
            onChange={(e) => setAssignMessage(e.currentTarget.value)}
            mb="sm"
            minRows={3}
          />

          <Group position="right">
            <Button variant="default" onClick={() => { setAssignModalOpen(false); setAssignSelected(null); setAssignMessage(''); setAssigningCaseId(null); }}>Cancel</Button>
            <Button onClick={handleDoAssign} loading={assignLoading} color="blue">Assign</Button>
          </Group>
        </Modal>
        )}

        {/* ── Activity Log Monitoring ── */}
        <Paper shadow="xs" radius="lg" bg="white" mt="xl" style={{ overflow: 'hidden' }}>
          {/* Header */}
          <Box px="lg" py="sm" style={{ borderBottom: '1px solid #F0F0F0' }}>
            <Group justify="space-between" align="center">
              <Group gap={8} align="center">
                <Box style={{ width: 28, height: 28, borderRadius: 8, background: CHARCOAL, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconActivity size={15} color="white" stroke={2.5} />
                </Box>
                <Text size="sm" fw={700} c={CHARCOAL} tt="uppercase" lts={0.5}>Activity Log</Text>
                {onlineUsers.length > 0 && (
                  <Badge size="sm" variant="light" color="green" leftSection={<IconCircleFilled size={8} style={{ color: '#40C057' }} />}>
                    {onlineUsers.length} Online
                  </Badge>
                )}
              </Group>
              <Group gap={6}>
                <Tooltip label="Refresh logs">
                  <ActionIcon size="sm" variant="subtle" color="gray" onClick={fetchActivityLogs} loading={loadingLogs} radius="md">
                    <IconRefresh size={14} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Group>
          </Box>

          {/* Online Users Strip */}
          {onlineUsers.length > 0 && (
            <Box px="lg" py={8} style={{ background: '#F0FFF4', borderBottom: '1px solid #E8F5E9' }}>
              <Group gap={12} wrap="wrap">
                <Text size="xs" c={MUTED_OLIVE} fw={600}>Currently Online:</Text>
                {onlineUsers.map((u) => {
                  const roleName = (u.userRole || 'user').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                  return (
                    <Group key={u._id} gap={4} wrap="nowrap">
                      <IconCircleFilled size={6} style={{ color: '#40C057' }} />
                      <Text size="xs" fw={600} c={CHARCOAL}>{u.userName || u.userEmail || 'Unknown'}</Text>
                      <Text size="xs" c={MUTED_OLIVE}>({roleName})</Text>
                    </Group>
                  );
                })}
              </Group>
            </Box>
          )}

          {/* Filters */}
          <Box px="lg" py="sm" style={{ borderBottom: '1px solid #F0F0F0' }}>
            <Group gap="sm" wrap="nowrap">
              <Select
                placeholder="Period"
                size="sm"
                radius="md"
                value={logPeriod}
                onChange={(val) => { setLogPeriod(val || 'today'); setLogPage(1); }}
                data={[
                  { value: 'today', label: 'Today' },
                  { value: 'week', label: 'Last 7 Days' },
                  { value: 'month', label: 'Last 30 Days' },
                ]}
                leftSection={<IconFilter size={16} />}
                style={{ width: 160 }}
                styles={{ input: { border: '1px solid #E0E0E0', fontSize: '13px' } }}
                allowDeselect={false}
              />
              <Select
                placeholder="Action"
                size="sm"
                radius="md"
                value={logActionFilter}
                onChange={(val) => { setLogActionFilter(val || 'all'); setLogPage(1); }}
                data={[
                  { value: 'all', label: 'All Actions' },
                  { value: 'login', label: 'Logins Only' },
                  { value: 'logout', label: 'Logouts Only' },
                ]}
                leftSection={<IconFilter size={16} />}
                style={{ width: 160 }}
                styles={{ input: { border: '1px solid #E0E0E0', fontSize: '13px' } }}
                allowDeselect={false}
              />
              <Box style={{ flex: 1 }} />
              <Text size="xs" c={MUTED_OLIVE}>{logTotal} total entries</Text>
            </Group>
          </Box>

          {/* Log Entries */}
          {loadingLogs && activityLogs.length === 0 ? (
            <Center py="xl"><Loader size="sm" color={PRIMARY_BROWN} /></Center>
          ) : activityLogs.length > 0 ? (
            <>
              {/* Table Header */}
              <Group wrap="nowrap" px="lg" py={8} style={{ background: '#FAFAFA', borderBottom: '1px solid #F0F0F0' }}>
                <Text size="xs" fw={600} c={MUTED_OLIVE} style={{ width: 60 }}>Action</Text>
                <Text size="xs" fw={600} c={MUTED_OLIVE} style={{ flex: 1 }}>User</Text>
                <Text size="xs" fw={600} c={MUTED_OLIVE} style={{ width: 100 }}>Role</Text>
                <Text size="xs" fw={600} c={MUTED_OLIVE} style={{ width: 160, textAlign: 'right' }}>Date & Time</Text>
              </Group>

              {activityLogs.map((log, idx) => {
                const isLogin = log.action === 'login';
                const roleName = (log.userRole || 'user').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                const logDate = new Date(log.createdAt);
                const dateStr = logDate.toLocaleDateString();
                const timeStr = logDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                const now = new Date();
                const isToday = logDate.toDateString() === now.toDateString();

                return (
                  <Box key={log._id}>
                    <Group
                      className="review-row"
                      wrap="nowrap"
                      px="lg"
                      py={10}
                      style={{ transition: 'background 0.15s' }}
                    >
                      {/* Action Badge */}
                      <Box style={{ width: 60, flexShrink: 0 }}>
                        <Badge
                          size="sm"
                          variant="light"
                          color={isLogin ? 'green' : 'red'}
                          leftSection={isLogin ? <IconLogin size={12} /> : <IconLogout size={12} />}
                        >
                          {isLogin ? 'In' : 'Out'}
                        </Badge>
                      </Box>

                      {/* User Info */}
                      <Box style={{ flex: 1, minWidth: 0 }}>
                        <Text size="sm" fw={600} c={CHARCOAL} truncate>
                          {log.userName || log.userEmail || 'Unknown User'}
                        </Text>
                        {log.userEmail && log.userName && (
                          <Text size="xs" c={MUTED_OLIVE} truncate>{log.userEmail}</Text>
                        )}
                      </Box>

                      {/* Role */}
                      <Box style={{ width: 100, flexShrink: 0 }}>
                        <Badge size="xs" variant="outline" color="gray" style={{ textTransform: 'capitalize' }}>
                          {roleName}
                        </Badge>
                      </Box>

                      {/* Date & Time */}
                      <Box style={{ width: 160, flexShrink: 0, textAlign: 'right' }}>
                        <Text size="sm" fw={500} c={CHARCOAL}>{timeStr}</Text>
                        <Text size="xs" c={MUTED_OLIVE}>{isToday ? 'Today' : dateStr}</Text>
                      </Box>
                    </Group>
                    {idx < activityLogs.length - 1 && <Divider color="#F0F0F0" />}
                  </Box>
                );
              })}

              {logTotal > LOG_ITEMS && (
                <Group justify="center" py="xs" style={{ borderTop: '1px solid #F0F0F0' }}>
                  <Pagination
                    size="sm"
                    total={Math.ceil(logTotal / LOG_ITEMS)}
                    value={logPage}
                    onChange={setLogPage}
                    color={PRIMARY_BROWN}
                  />
                </Group>
              )}
            </>
          ) : (
            <Center py={40}>
              <Stack align="center" gap={8}>
                <IconActivity size={32} color="#D5D5D5" stroke={1.5} />
                <Text size="sm" c="#B0B0B0">No activity logs for this period</Text>
              </Stack>
            </Center>
          )}
        </Paper>

      </Container>
    </Box>
  );
}