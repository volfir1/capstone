import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/authContext";
import {
  Container,
  Title,
  Paper,
  Text,
  Group,
  Avatar,
  Box,
  Badge,
  Divider,
  ActionIcon,
  SimpleGrid,
  Loader,
  Center,
  Tooltip,
  Skeleton,
} from "@mantine/core";
import {
  IconUser,
  IconSettings,
  IconBell,
  IconShieldCheck,
  IconBriefcase2,
  IconFiles,
  IconCalendar,
  IconClock,
  IconChevronRight,
  IconRefresh,
  IconCalendarEvent,
  IconScale,
  IconFileText,
  IconArrowRight,
  IconCircleCheck,
  IconCircleDot,
  IconCircle,
  IconSend,
  IconGavel,
  IconMail,
} from "@tabler/icons-react";
import { Navigate, useNavigate } from "react-router";
import { Loaders } from "@/components/ui/Loader";
import apiClient from "@config/api/apiClient";
import {
  PRIMARY_GOLD,
  PRIMARY_BROWN,
  MUTED_OLIVE,
  BG,
  CHARCOAL,
  ACCENT_TAN,
} from "@/utils/constants";

const Home = () => {
  const { userData, userLoggedIn, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Live data state
  const [appointments, setAppointments] = useState([]);
  const [finalizedCases, setFinalizedCases] = useState([]);
  const [userCases, setUserCases] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Fetch real data
  const fetchDashboardData = async () => {
    if (!userData) return;
    try {
      setLoadingData(true);
      const uid = userData._id || userData.id;
      const firebaseUid = userData.uid || userData.firebaseUid;

      const [appointmentsResp, finalizedResp, casesResp] = await Promise.all([
        apiClient.get('/clientsinfo').catch(() => ({ data: { data: [] } })),
        apiClient.get(`/finalize/user/${uid}`).catch(() => ({ data: { data: [] } })),
        apiClient.get('/cases/user-cases').catch(() => ({ data: { data: [] } })),
      ]);

      // Filter appointments belonging to this user
      const allAppts = appointmentsResp.data?.data ?? appointmentsResp.data ?? [];
      const userAppts = Array.isArray(allAppts)
        ? allAppts.filter(a =>
            a.firebaseUid === firebaseUid ||
            (a.userId && (a.userId === uid || a.userId?._id === uid))
          )
        : [];
      setAppointments(userAppts);

      const fin = finalizedResp.data?.data ?? finalizedResp.data ?? [];
      setFinalizedCases(Array.isArray(fin) ? fin : []);

      const cases = casesResp.data?.data ?? casesResp.data ?? [];
      setUserCases(Array.isArray(cases) ? cases : []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (userData) fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData]);

  // Derived stats
  const activeCases = finalizedCases.filter(f => f.decision === 'accepted');
  const pendingCases = finalizedCases.filter(f => f.decision === 'pending');
  const upcomingAppointments = appointments
    .filter(a => a.status === 'auto-scheduled' || a.status === 'confirmed')
    .sort((a, b) => new Date(a.appointedDate) - new Date(b.appointedDate));
  const nextAppointment = upcomingAppointments[0];

  // Greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getSummaryLine = () => {
    const parts = [];
    if (upcomingAppointments.length > 0) {
      parts.push(`${upcomingAppointments.length} upcoming appointment${upcomingAppointments.length !== 1 ? 's' : ''}`);
    }
    if (pendingCases.length > 0) {
      parts.push(`${pendingCases.length} pending case${pendingCases.length !== 1 ? 's' : ''}`);
    }
    if (parts.length === 0) return "You're all caught up!";
    return `You have ${parts.join(' and ')}`;
  };

  // Recent activity derived from all data
  const recentActivity = useMemo(() => {
    const items = [];
    // From finalized cases
    finalizedCases.forEach(f => {
      items.push({
        id: f._id || f.id,
        text: f.decision === 'accepted'
          ? `Case "${f.caseTitle || f.clientName || 'Untitled'}" accepted`
          : f.decision === 'rejected'
          ? `Case "${f.caseTitle || f.clientName || 'Untitled'}" was rejected`
          : `Case "${f.caseTitle || f.clientName || 'Untitled'}" pending review`,
        date: f.createdAt ? new Date(f.createdAt) : new Date(),
        icon: f.decision === 'accepted' ? IconCircleCheck : f.decision === 'rejected' ? IconScale : IconClock,
        color: f.decision === 'accepted' ? '#40C057' : f.decision === 'rejected' ? '#FA5252' : '#FCC419',
      });
    });
    // From appointments
    appointments.forEach(a => {
      items.push({
        id: a._id || a.id,
        text: `Appointment ${a.status === 'confirmed' ? 'confirmed' : 'scheduled'} – ${a.fullName || a.name || 'Consultation'}`,
        date: a.createdAt ? new Date(a.createdAt) : new Date(),
        icon: IconCalendarEvent,
        color: '#7950F2',
      });
    });
    return items
      .sort((a, b) => b.date - a.date)
      .slice(0, 5);
  }, [finalizedCases, appointments]);

  // Case progress stages
  const caseProgressStages = [
    { label: 'Submitted', key: 'submitted' },
    { label: 'Under Review', key: 'review' },
    { label: 'Finalized', key: 'finalized' },
    { label: 'Case Active', key: 'active' },
  ];

  const getCaseStage = (caseItem) => {
    if (caseItem.decision === 'accepted') return 'active';
    if (caseItem.decision === 'rejected') return 'finalized';
    if (caseItem.decision === 'pending') return 'review';
    return 'submitted';
  };

  if (authLoading) {
    return (
      <Box bg={BG} mih="100vh" py="xl">
        <Center mih="100vh"><Loader size="lg" color={PRIMARY_BROWN} /></Center>
      </Box>
    );
  }

  if (!userLoggedIn) {
    return <Navigate to="/auth/login" replace={true} />;
  }

  if (!userData) {
    return <Loaders height={window.innerHeight - 100} />;
  }

  const statCards = [
    {
      icon: IconBriefcase2,
      label: 'Active Cases',
      value: activeCases.length,
      subtitle: pendingCases.length > 0 ? `${pendingCases.length} pending` : 'No pending',
      color: '#4DABF7',
      path: '/user/track',
    },
    {
      icon: IconFiles,
      label: 'Total Cases',
      value: finalizedCases.length,
      subtitle: `${activeCases.length} accepted`,
      color: '#40C057',
      path: '/user/track',
    },
    {
      icon: IconBell,
      label: 'Appointments',
      value: upcomingAppointments.length,
      subtitle: nextAppointment
        ? `Next: ${new Date(nextAppointment.appointedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
        : 'None scheduled',
      color: '#7950F2',
      path: '/user/track',
    },
    {
      icon: IconCalendar,
      label: 'All Appointments',
      value: appointments.length,
      subtitle: `${appointments.filter(a => a.status === 'confirmed').length} confirmed`,
      color: '#F59F00',
      path: '/user/track',
    },
  ];

  return (
    <Box bg={BG} mih="100vh" py="xl">
      <style>
        {`
          ::-webkit-scrollbar { width: 8px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: ${MUTED_OLIVE}; border-radius: 4px; }
          ::-webkit-scrollbar-thumb:hover { background: ${PRIMARY_BROWN}; }
          * { scrollbar-width: thin; scrollbar-color: ${MUTED_OLIVE} transparent; }
          .dash-card { transition: box-shadow 0.2s, transform 0.15s; cursor: pointer; }
          .dash-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.1); transform: translateY(-2px); }
          .activity-row { transition: background 0.15s; }
          .activity-row:hover { background: #F9F7F5 !important; }
        `}
      </style>
      <Container size="xl">
        {/* Page Header - Clean, lightweight */}
        <Group justify="space-between" align="flex-start" mb="lg">
          <Box>
            <Group gap="sm" align="center" mb={4}>
              <Title order={3} c={CHARCOAL} lh={1.2}>
                {getGreeting()}, {userData.firstName}!
              </Title>
              {userData.isVerified && (
                <Badge
                  size="sm"
                  variant="light"
                  color="green"
                  leftSection={<IconShieldCheck size={12} />}
                >
                  Verified
                </Badge>
              )}
            </Group>
            <Text size="sm" c={MUTED_OLIVE}>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
              {' · '}
              {loadingData ? '...' : getSummaryLine()}
            </Text>
          </Box>
          <Tooltip label="Refresh data">
            <ActionIcon
              size="md"
              variant="subtle"
              color="gray"
              onClick={fetchDashboardData}
              loading={loadingData}
              radius="md"
            >
              <IconRefresh size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>

        {/* Stat Cards - Color coded, clickable */}
        <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md" mb="md">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <Paper
                key={card.label}
                className="dash-card"
                shadow="xs"
                p="md"
                radius="lg"
                style={{ background: 'white', border: '1px solid #F0F0F0' }}
                onClick={() => navigate(card.path)}
              >
                <Group gap="sm" wrap="nowrap">
                  <Box style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: card.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Icon size={20} color="white" stroke={2.5} />
                  </Box>
                  <Box style={{ minWidth: 0 }}>
                    <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} lts={0.5} lh={1.2}>{card.label}</Text>
                    {loadingData ? (
                      <Skeleton height={24} width={30} mt={2} />
                    ) : (
                      <Text size="1.5rem" fw={700} c={CHARCOAL} lh={1.1}>{card.value}</Text>
                    )}
                  </Box>
                </Group>
                <Text size="xs" c={MUTED_OLIVE} mt={8} truncate>
                  {loadingData ? '' : card.subtitle}
                </Text>
              </Paper>
            );
          })}
        </SimpleGrid>

        {/* Two-column layout: Next Appointment + Recent Activity */}
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" mb="md">
          {/* Next Appointment */}
          <Paper shadow="xs" radius="lg" style={{ background: 'white', border: '1px solid #F0F0F0', overflow: 'hidden' }}>
            <Box px="lg" py={10} style={{ background: '#FAFAFA', borderBottom: '1px solid #F0F0F0' }}>
              <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} lts={0.5}>Next Appointment</Text>
            </Box>
            <Box px="lg" py="md">
              {loadingData ? (
                <Center py="md"><Loader size="sm" color={PRIMARY_BROWN} /></Center>
              ) : nextAppointment ? (
                <Box>
                  <Group gap="sm" mb="sm" align="center">
                    <Box style={{
                      width: 44, height: 44, borderRadius: 10,
                      background: '#7950F2',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <IconCalendarEvent size={22} color="white" />
                    </Box>
                    <Box style={{ flex: 1 }}>
                      <Text size="md" fw={600} c={CHARCOAL}>
                        {new Date(nextAppointment.appointedDate).toLocaleDateString('en-US', {
                          month: 'long', day: 'numeric', year: 'numeric',
                        })}
                        {nextAppointment.appointmentTime ? ` at ${nextAppointment.appointmentTime}` : ''}
                      </Text>
                      <Text size="sm" c={MUTED_OLIVE}>
                        {nextAppointment.appointmentType || nextAppointment.caseNature || 'Consultation'}
                      </Text>
                    </Box>
                  </Group>
                  {nextAppointment.location && (
                    <Text size="sm" c="dimmed" mb="xs">
                      Location: {nextAppointment.location}
                    </Text>
                  )}
                  <Group gap="xs" mt="sm">
                    <Badge size="sm" variant="light" color={nextAppointment.status === 'confirmed' ? 'green' : 'blue'}>
                      {nextAppointment.status === 'confirmed' ? 'Confirmed' : 'Scheduled'}
                    </Badge>
                    <Text
                      size="xs"
                      c={PRIMARY_BROWN}
                      fw={600}
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate('/user/track')}
                    >
                      View Details →
                    </Text>
                  </Group>
                </Box>
              ) : (
                <Box ta="center" py="md">
                  <IconCalendar size={32} color={MUTED_OLIVE} stroke={1.5} style={{ opacity: 0.5, marginBottom: 8 }} />
                  <Text size="sm" c={MUTED_OLIVE}>No upcoming appointments</Text>
                  <Text
                    size="xs"
                    c={PRIMARY_BROWN}
                    fw={600}
                    mt={6}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate('/user/appointment')}
                  >
                    Schedule one →
                  </Text>
                </Box>
              )}
            </Box>
          </Paper>

          {/* Recent Activity */}
          <Paper shadow="xs" radius="lg" style={{ background: 'white', border: '1px solid #F0F0F0', overflow: 'hidden' }}>
            <Box px="lg" py={10} style={{ background: '#FAFAFA', borderBottom: '1px solid #F0F0F0' }}>
              <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} lts={0.5}>Recent Activity</Text>
            </Box>
            <Box>
              {loadingData ? (
                <Center py="xl"><Loader size="sm" color={PRIMARY_BROWN} /></Center>
              ) : recentActivity.length > 0 ? (
                recentActivity.map((item, idx) => {
                  const Icon = item.icon;
                  const timeAgo = (() => {
                    const diff = Date.now() - item.date.getTime();
                    const days = Math.floor(diff / 86400000);
                    if (days === 0) return 'Today';
                    if (days === 1) return 'Yesterday';
                    return `${days}d ago`;
                  })();
                  return (
                    <Box key={item.id || idx}>
                      <Group className="activity-row" wrap="nowrap" px="lg" py="sm" gap="sm" align="center">
                        <Box style={{
                          width: 28, height: 28, borderRadius: 7,
                          background: item.color + '18',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          <Icon size={14} color={item.color} stroke={2.5} />
                        </Box>
                        <Text size="sm" c={CHARCOAL} style={{ flex: 1, minWidth: 0 }} truncate>
                          {item.text}
                        </Text>
                        <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>{timeAgo}</Text>
                      </Group>
                      {idx < recentActivity.length - 1 && <Divider color="#F0F0F0" />}
                    </Box>
                  );
                })
              ) : (
                <Box ta="center" py="lg">
                  <Text size="sm" c={MUTED_OLIVE}>No recent activity</Text>
                </Box>
              )}
            </Box>
          </Paper>
        </SimpleGrid>

        {/* Case Progress Timeline (if user has cases) */}
        {!loadingData && finalizedCases.length > 0 && (
          <Paper shadow="xs" radius="lg" mb="md" style={{ background: 'white', border: '1px solid #F0F0F0', overflow: 'hidden' }}>
            <Box px="lg" py={10} style={{ background: '#FAFAFA', borderBottom: '1px solid #F0F0F0' }}>
              <Group justify="space-between" align="center">
                <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} lts={0.5}>Your Case Progress</Text>
                <Text
                  size="xs"
                  c={PRIMARY_BROWN}
                  fw={600}
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate('/user/track')}
                >
                  View All →
                </Text>
              </Group>
            </Box>
            <Box px="lg" py="md">
              {finalizedCases.slice(0, 3).map((caseItem, cIdx) => {
                const stage = getCaseStage(caseItem);
                const stageIndex = caseProgressStages.findIndex(s => s.key === stage);
                const title = caseItem.caseTitle || caseItem.clientName || 'Untitled Case';
                return (
                  <Box key={caseItem._id || caseItem.id || cIdx} mb={cIdx < Math.min(finalizedCases.length, 3) - 1 ? 'md' : 0}>
                    <Group justify="space-between" align="center" mb={8}>
                      <Text size="sm" fw={600} c={CHARCOAL} truncate style={{ maxWidth: '60%' }}>{title}</Text>
                      <Badge size="sm" variant="light" color={
                        caseItem.decision === 'accepted' ? 'green'
                        : caseItem.decision === 'rejected' ? 'red'
                        : 'yellow'
                      }>
                        {caseItem.decision ? caseItem.decision.charAt(0).toUpperCase() + caseItem.decision.slice(1) : 'Pending'}
                      </Badge>
                    </Group>
                    {/* Horizontal progress steps */}
                    <Group gap={0} wrap="nowrap" style={{ overflow: 'hidden' }}>
                      {caseProgressStages.map((s, sIdx) => {
                        const isCompleted = sIdx <= stageIndex;
                        const isCurrent = sIdx === stageIndex;
                        const isRejected = caseItem.decision === 'rejected' && sIdx === stageIndex;
                        return (
                          <Group key={s.key} gap={4} wrap="nowrap" style={{ flex: 1 }}>
                            <Box style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
                              {isRejected ? (
                                <IconScale size={16} color="#FA5252" stroke={2.5} style={{ flexShrink: 0 }} />
                              ) : isCompleted && !isCurrent ? (
                                <IconCircleCheck size={16} color="#40C057" stroke={2.5} style={{ flexShrink: 0 }} />
                              ) : isCurrent ? (
                                <IconCircleDot size={16} color={PRIMARY_BROWN} stroke={2.5} style={{ flexShrink: 0 }} />
                              ) : (
                                <IconCircle size={16} color="#D0D0D0" stroke={1.5} style={{ flexShrink: 0 }} />
                              )}
                              <Text
                                size="xs"
                                c={isCurrent ? CHARCOAL : isCompleted ? '#40C057' : 'dimmed'}
                                fw={isCurrent ? 600 : 400}
                                truncate
                              >
                                {s.label}
                              </Text>
                            </Box>
                            {sIdx < caseProgressStages.length - 1 && (
                              <Box style={{
                                flex: 1, height: 2, minWidth: 8,
                                background: isCompleted ? '#40C057' : '#E8E8E8',
                                borderRadius: 1,
                              }} />
                            )}
                          </Group>
                        );
                      })}
                    </Group>
                    {cIdx < Math.min(finalizedCases.length, 3) - 1 && <Divider color="#F0F0F0" mt="md" />}
                  </Box>
                );
              })}
            </Box>
          </Paper>
        )}

        {/* Bottom row: Quick Actions + Account Details */}
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          {/* Quick Actions */}
          <Paper shadow="xs" radius="lg" style={{ background: 'white', border: '1px solid #F0F0F0', overflow: 'hidden' }}>
            <Box px="lg" py={10} style={{ background: '#FAFAFA', borderBottom: '1px solid #F0F0F0' }}>
              <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} lts={0.5}>Quick Actions</Text>
            </Box>
            <Box>
              {[
                { icon: IconSend, label: 'Schedule Appointment', desc: 'Book a consultation', path: '/user/appointment', color: '#7950F2' },
                { icon: IconCalendarEvent, label: 'Track Appointments', desc: 'See upcoming appointments', path: '/user/track', color: '#4DABF7' },
              ].map((action, idx, arr) => {
                const Icon = action.icon;
                return (
                  <Box key={action.label}>
                    <Group
                      className="activity-row"
                      wrap="nowrap"
                      align="center"
                      px="lg"
                      py="sm"
                      gap="md"
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(action.path)}
                    >
                      <Box style={{
                        width: 36, height: 36, borderRadius: 9,
                        background: action.color + '15',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <Icon size={18} color={action.color} stroke={2} />
                      </Box>
                      <Box style={{ flex: 1, minWidth: 0 }}>
                        <Text size="sm" fw={600} c={CHARCOAL}>{action.label}</Text>
                        <Text size="xs" c={MUTED_OLIVE}>{action.desc}</Text>
                      </Box>
                      <ActionIcon variant="subtle" color="gray" size="sm" style={{ flexShrink: 0 }}>
                        <IconChevronRight size={16} />
                      </ActionIcon>
                    </Group>
                    {idx < arr.length - 1 && <Divider color="#F0F0F0" />}
                  </Box>
                );
              })}
            </Box>
          </Paper>

          {/* Compact Account Details */}
          <Paper shadow="xs" radius="lg" style={{ background: 'white', border: '1px solid #F0F0F0', overflow: 'hidden' }}>
            <Box px="lg" py={10} style={{ background: '#FAFAFA', borderBottom: '1px solid #F0F0F0' }}>
              <Group justify="space-between" align="center">
                <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} lts={0.5}>Account Details</Text>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="sm"
                  radius="md"
                  onClick={() => navigate('/user/profile')}
                >
                  <IconSettings size={16} />
                </ActionIcon>
              </Group>
            </Box>
            <Box px="lg" py="md">
              <Group gap="md" align="flex-start" wrap="nowrap">
                <Avatar
                  size={48}
                  radius="md"
                  style={{
                    border: `2px solid ${userData.isVerified ? '#40C057' : '#E0E0E0'}`,
                    background: '#FAFAFA',
                    color: PRIMARY_BROWN,
                    flexShrink: 0,
                  }}
                >
                  <Text size="lg" fw={700}>
                    {userData.firstName?.charAt(0)}{userData.lastName?.charAt(0)}
                  </Text>
                </Avatar>
                <Box style={{ flex: 1, minWidth: 0 }}>
                  <Group gap={6} align="center" mb={2}>
                    <Text size="md" fw={600} c={CHARCOAL}>
                      {userData.firstName} {userData.lastName}
                    </Text>
                    {userData.isVerified && (
                      <IconShieldCheck size={16} color="#40C057" stroke={2.5} />
                    )}
                  </Group>
                  <Text size="sm" c={MUTED_OLIVE} truncate>
                    {userData.email}
                  </Text>
                  <Group gap={8} mt={6}>
                    {userData.username && (
                      <Badge size="xs" variant="light" color="gray">@{userData.username}</Badge>
                    )}
                    <Badge size="xs" variant="light" color="gray">
                      <Group gap={4} wrap="nowrap">
                        <IconClock size={10} />
                        Since {new Date(userData.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </Group>
                    </Badge>
                  </Group>
                </Box>
              </Group>

              {/* Quick profile stats */}
              {!loadingData && (
                <>
                  <Divider color="#F0F0F0" my="md" />
                  <SimpleGrid cols={3} spacing="sm">
                    {[
                      { label: 'Cases', value: finalizedCases.length, color: '#4DABF7' },
                      { label: 'Appts', value: appointments.length, color: '#7950F2' },
                      { label: 'Active', value: activeCases.length, color: '#40C057' },
                    ].map((s) => (
                      <Box key={s.label} ta="center">
                        <Text size="lg" fw={700} c={CHARCOAL} lh={1}>{s.value}</Text>
                        <Text size="xs" c={MUTED_OLIVE} mt={2}>{s.label}</Text>
                      </Box>
                    ))}
                  </SimpleGrid>
                </>
              )}
            </Box>
          </Paper>
        </SimpleGrid>
      </Container>
    </Box>
  );
};

export default Home;