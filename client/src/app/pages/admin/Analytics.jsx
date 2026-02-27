import React, { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Paper,
  Title,
  Text,
  Box,
  Stack,
  Group,
  Table,
  Badge,
  Select,
  Center,
  Card,
  SimpleGrid,
  Avatar,
  Modal,
  Tabs,
  Progress,
  Button,
  Tooltip,
  Divider,
  ThemeIcon,
  Grid,
  ActionIcon,
} from '@mantine/core';
import {
  IconChartBar,
  IconTrophy,
  IconUser,
  IconGavel,
  IconBriefcase,
  IconDownload,
  IconRefresh,
  IconCalendar,
  IconScale,
  IconFileAnalytics,
  IconUsers,
  IconTrendingUp,
  IconMedal,
  IconFileText,
  IconFileDescription,
  IconArrowRight,
  IconFilter
} from '@tabler/icons-react';
import { AreaChart, DonutChart } from '@mantine/charts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PRIMARY_GOLD, PRIMARY_BROWN, MUTED_OLIVE, BG, CHARCOAL, CATEGORY_COLORS, ACCENT_TAN, THEMED_LIGHT_BG } from '@utils/constants';
import apiClient from '@config/api/apiClient';
import AnalyticsSkeleton from '@components/skeleton/AnalyticsSkeleton';

// Role accent colors
const ROLE_COLORS = {
  intern: { primary: '#228BE6', light: '#E7F5FF', border: '#74C0FC' },
  lawyer: { primary: '#12B886', light: '#E6FCF5', border: '#63E6BE' },
  director: { primary: '#9C36B5', light: '#F3D9FA', border: '#DA77F2' },
};

// Medal icons for top 3
const MEDALS = ['🥇', '🥈', '🥉'];

// Date range options
const DATE_RANGES = [
  { value: 'all', label: 'All Time' },
  { value: '7', label: 'Last 7 Days' },
  { value: '30', label: 'Last 30 Days' },
  { value: '90', label: 'Last 90 Days' },
  { value: '365', label: 'This Year' },
];

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [finalizedCases, setFinalizedCases] = useState([]);
  const [users, setUsers] = useState([]);
  const [caseTypeFilter, setCaseTypeFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [clientAnalytics, setClientAnalytics] = useState(null);
  
  // Modal state
  const [modalOpened, setModalOpened] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userCases, setUserCases] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [finalizedResp, usersResp] = await Promise.all([
        apiClient.get('/finalize'),
        apiClient.get('/users/fetchusers')
      ]);

      const finalized = finalizedResp.data?.data || finalizedResp.data || [];
      const usersData = usersResp.data?.data || usersResp.data || [];

      setFinalizedCases(finalized);
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtered cases with date range + case type
  const filteredCases = useMemo(() => {
    let cases = [...finalizedCases];

    // Date range filter
    if (dateRange !== 'all') {
      const days = parseInt(dateRange);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      cases = cases.filter(c => new Date(c.createdAt) >= cutoff);
    }

    // Case type filter
    if (caseTypeFilter !== 'all') {
      cases = cases.filter(c => {
        const caseType = c.content?.interviewInfo?.caseType;
        return caseType === caseTypeFilter;
      });
    }

    return cases;
  }, [finalizedCases, dateRange, caseTypeFilter]);

  // Personnel Stats (calculated from filtered cases)
  const personnelStats = useMemo(() => {
    const userMap = {};
    users.forEach(user => {
      userMap[user._id] = {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage
      };
    });

    const internCounts = {};
    const supervisingLawyerCounts = {};
    const directorCounts = {};

    filteredCases.forEach(c => {
      const internId = c.content?.interviewInfo?.interviewingInternsId;
      const internName = c.content?.interviewInfo?.interviewingInterns;
      if (internId) {
        if (!internCounts[internId]) {
            internCounts[internId] = { 
                id: internId, 
                name: internName || (userMap[internId] ? `${userMap[internId].firstName} ${userMap[internId].lastName}` : 'Unknown'), 
                profileImage: userMap[internId]?.profileImage,
                count: 0 
            };
        }
        internCounts[internId].count++;
      }

      const lawyerId = c.content?.actionInfo?.supervisingLawyerId;
      const lawyerName = c.content?.actionInfo?.supervisingLawyer;
      if (lawyerId) {
        if (!supervisingLawyerCounts[lawyerId]) {
            supervisingLawyerCounts[lawyerId] = { 
                id: lawyerId, 
                name: lawyerName || (userMap[lawyerId] ? `${userMap[lawyerId].firstName} ${userMap[lawyerId].lastName}` : 'Unknown'), 
                profileImage: userMap[lawyerId]?.profileImage,
                count: 0 
            };
        }
        supervisingLawyerCounts[lawyerId].count++;
      }

      const directorId = c.content?.actionInfo?.directorId;
      const directorName = c.content?.actionInfo?.directorSignature;
      if (directorId) {
        if (!directorCounts[directorId]) {
            directorCounts[directorId] = { 
                id: directorId, 
                name: directorName || (userMap[directorId] ? `${userMap[directorId].firstName} ${userMap[directorId].lastName}` : 'Unknown'), 
                profileImage: userMap[directorId]?.profileImage,
                count: 0 
            };
        }
        directorCounts[directorId].count++;
      }
    });

    return {
        interns: Object.values(internCounts).sort((a, b) => b.count - a.count),
        lawyers: Object.values(supervisingLawyerCounts).sort((a, b) => b.count - a.count),
        directors: Object.values(directorCounts).sort((a, b) => b.count - a.count)
    };
  }, [filteredCases, users]);

  // Summary metrics
  const summaryMetrics = useMemo(() => {
    const total = filteredCases.length;
    const accepted = filteredCases.filter(c => c.decision === 'accepted').length;
    const rejected = filteredCases.filter(c => c.decision === 'rejected').length;
    const pending = filteredCases.filter(c => c.decision === 'pending' || !c.decision).length;
    
    // Calculate unique active users strictly from the calculated stats to ensure consistency
    const uniquePersonnel = new Set();
    personnelStats.interns.forEach(p => uniquePersonnel.add(p.id));
    personnelStats.lawyers.forEach(p => uniquePersonnel.add(p.id));
    personnelStats.directors.forEach(p => uniquePersonnel.add(p.id));

    return { total, accepted, rejected, pending, activeUsers: uniquePersonnel.size };
  }, [filteredCases, personnelStats]);

  // Cases Over Time Trend
  const casesOverTimeData = useMemo(() => {
    const trend = {};
    filteredCases.forEach(c => {
      if (!c.createdAt) return;
      const date = new Date(c.createdAt);
      // Group by Month Year (e.g. "Feb 2024")
      const key = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      // Keep a sortable key for sorting later
      const sortKey = date.toISOString().slice(0, 7); // YYYY-MM
      
      if (!trend[sortKey]) {
        trend[sortKey] = { label: key, count: 0 };
      }
      trend[sortKey].count++;
    });

    return Object.keys(trend).sort().map(key => ({
      date: trend[key].label,
      Cases: trend[key].count
    }));
  }, [filteredCases]);

  // Donut chart data for decisions
  const decisionChartData = useMemo(() => {
    const { accepted, rejected, pending } = summaryMetrics;
    return [
      { name: 'Accepted', value: accepted, color: '#40C057' },
      { name: 'Rejected', value: rejected, color: '#FA5252' },
      { name: 'Pending', value: pending, color: '#FCC419' },
    ].filter(d => d.value > 0);
  }, [summaryMetrics]);

  const handleUserClick = (user, role) => {
    setSelectedUser({ ...user, role });
    
    let cases = [];
    if (role === 'intern') cases = finalizedCases.filter(c => c.content?.interviewInfo?.interviewingInternsId === user.id);
    else if (role === 'supervising lawyer') cases = finalizedCases.filter(c => c.content?.actionInfo?.supervisingLawyerId === user.id);
    else if (role === 'director') cases = finalizedCases.filter(c => c.content?.actionInfo?.directorId === user.id);
    
    setUserCases({
      legalAdvice: cases.filter(c => c.content?.interviewInfo?.caseType === 'legal-advice'),
      legalDocument: cases.filter(c => c.content?.interviewInfo?.caseType === 'legal-document'),
      courtRepresentation: cases.filter(c => c.content?.interviewInfo?.caseType === 'court-representation')
    });
    setModalOpened(true);
  };

  const renderCasesList = (cases, type) => {
    if (cases.length === 0) {
      return (
        <Stack align="center" py="xl" gap="xs">
          <ThemeIcon size="xl" radius="xl" color="gray" variant="light">
            <IconFileAnalytics size={24} />
          </ThemeIcon>
          <Text size="sm" c="dimmed">No {type} cases found.</Text>
        </Stack>
      );
    }

    return (
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Case ID</Table.Th>
            <Table.Th>Client Name</Table.Th>
            <Table.Th>Decision</Table.Th>
            <Table.Th>Date</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {cases.map((c) => (
            <Table.Tr key={c._id}>
              <Table.Td>
                <Text size="sm" fw={500} c={CHARCOAL}>{c.caseId || 'N/A'}</Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm">{c.clientName || c.content?.interviewInfo?.clientName || 'N/A'}</Text>
              </Table.Td>
              <Table.Td>
                <Badge 
                  color={c.decision === 'accepted' ? 'green' : c.decision === 'rejected' ? 'red' : 'yellow'}
                  variant="light"
                  size="sm"
                >
                  {c.decision || 'Pending'}
                </Badge>
              </Table.Td>
              <Table.Td>
                <Text size="sm" c="dimmed">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'N/A'}</Text>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    );
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const now = new Date();
    
    doc.setFontSize(22);
    doc.setTextColor(139, 69, 19);
    doc.text('JustReach Analytics Report', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on ${now.toLocaleDateString()}`, pageWidth / 2, 28, { align: 'center' });

    doc.autoTable = autoTable;

    let y = 40;
    
    doc.setFontSize(14);
    doc.setTextColor(50);
    doc.text('Summary Overview', 14, y);
    y += 5;

    autoTable(doc, {
      startY: y,
      head: [['Metric', 'Value']],
      body: [
        ['Total Cases', summaryMetrics.total],
        ['Active Personnel', summaryMetrics.activeUsers],
        ['Accepted', summaryMetrics.accepted],
        ['Rejected', summaryMetrics.rejected]
      ],
      theme: 'grid',
      headStyles: { fillColor: [139, 69, 19] }
    });
    
    y = doc.lastAutoTable.finalY + 15;

    const sections = [
      { title: 'Top Interns', data: personnelStats.interns },
      { title: 'Top Lawyers', data: personnelStats.lawyers },
      { title: 'Top Directors', data: personnelStats.directors },
    ];

    sections.forEach(({ title, data }) => {
      if (data.length === 0) return;
      
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(14);
      doc.text(title, 14, y);
      y += 5;

      autoTable(doc, {
        startY: y,
        head: [['Rank', 'Name', 'Cases']],
        body: data.slice(0, 10).map((d, i) => [i + 1, d.name, d.count]),
        theme: 'striped',
        headStyles: { fillColor: [139, 69, 19] }
      });
      
      y = doc.lastAutoTable.finalY + 10;
    });

    doc.save(`analytics_report_${now.toISOString().slice(0, 10)}.pdf`);
  };

  const StatCard = ({ title, value, icon: Icon, color, subtext }) => (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Group justify="space-between" align="start">
            <Stack gap={0}>
                <Text size="xs" c={MUTED_OLIVE} fw={700} tt="uppercase" lts={1}>{title}</Text>
                <Text size="2.5rem" fw={800} c={PRIMARY_BROWN} lh={1.1}>{value}</Text>
                {subtext && <Text size="xs" c="dimmed" mt={4}>{subtext}</Text>}
            </Stack>
            <ThemeIcon size={50} radius="md" variant="light" color={color} style={{ backgroundColor: `${color}15` }}>
                <Icon size={28} stroke={1.5} />
            </ThemeIcon>
        </Group>
    </Card>
  );

  const LeaderboardCard = ({ title, icon: Icon, data, roleColor, onUserClick }) => {
    const maxCount = data.length > 0 ? data[0].count : 0;
    
    return (
      <Paper shadow="sm" radius="md" p="lg" withBorder style={{ height: '100%', borderColor: 'rgba(0,0,0,0.08)' }}>
        <Group justify="space-between" mb="lg">
          <Group gap="sm">
            <ThemeIcon size="lg" radius="md" color={roleColor.primary} variant="light" style={{ backgroundColor: roleColor.light }}>
              <Icon size={20} stroke={1.5} />
            </ThemeIcon>
            <Box>
              <Text size="sm" fw={700} c={CHARCOAL} tt="uppercase" lts={0.5}>{title}</Text>
              <Text size="xs" c="dimmed">{data.length} active members</Text>
            </Box>
          </Group>
        </Group>

        {data.length === 0 ? (
          <Center h={150}>
            <Text c="dimmed" size="sm">No activity recorded yet</Text>
          </Center>
        ) : (
          <Stack gap={10}>
            {data.slice(0, 5).map((item, index) => (
              <Group 
                key={item.id} 
                wrap="nowrap" 
                align="center"
                style={{ 
                  cursor: 'pointer',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  transition: 'all 0.2s ease',
                }} 
                onClick={() => onUserClick(item)}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = roleColor.light}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {/* Rank */}
                <Box w={24} style={{ textAlign: 'center' }}>
                  {index < 3 ? (
                    <Text size="lg" style={{ lineHeight: 1 }}>{MEDALS[index]}</Text>
                  ) : (
                    <Text size="xs" c="dimmed" fw={600}>#{index + 1}</Text>
                  )}
                </Box>

                {/* Avatar & Info */}
                <Avatar 
                  src={item.profileImage}
                  size="sm" 
                  radius="xl" 
                  color={roleColor.primary} 
                  variant={index === 0 ? 'filled' : 'light'}
                >
                  <IconUser size={16} />
                </Avatar>

                <Box style={{ flex: 1, minWidth: 0 }}>
                  <Group justify="space-between" mb={4} wrap="nowrap">
                    <Text size="sm" fw={600} c={CHARCOAL} truncate style={{ lineHeight: 1.2 }}>{item.name}</Text>
                    <Text size="xs" fw={700} c={roleColor.primary}>{item.count} Cases</Text>
                  </Group>
                  <Progress 
                    value={(item.count / maxCount) * 100} 
                    size={4} 
                    color={roleColor.primary} 
                    radius="xl" 
                  />
                </Box>
              </Group>
            ))}
          </Stack>
        )}
      </Paper>
    );
  };

  if (loading) {
    return <AnalyticsSkeleton />;
  }

  return (
    <Box bg={BG} mih="100vh" py="xl">
      <Container size="xl">
        
        {/* Header Section */}
        <Stack gap="md" mb="xl">
          <Group justify="space-between" align="flex-end">
            <Box>
              <Group gap="xs" mb={4}>
                <IconChartBar size={28} color={PRIMARY_BROWN} />
                <Title order={2} c={PRIMARY_BROWN}>Performance Analytics</Title>
              </Group>
              <Text c={MUTED_OLIVE} size="sm">Track case statistics and personnel performance</Text>
            </Box>
            
            <Group>
              <Select
                placeholder="Timeframe"
                value={dateRange}
                onChange={(v) => setDateRange(v || 'all')}
                data={DATE_RANGES}
                leftSection={<IconCalendar size={16} />}
                w={160}
                radius="md"
              />
               <Select
                  placeholder="Case Type"
                  value={caseTypeFilter}
                  onChange={(val) => setCaseTypeFilter(val || 'all')}
                  data={[
                    { value: 'all', label: 'All Case Types' },
                    { value: 'court-representation', label: 'For Representation' },
                    { value: 'legal-advice', label: 'Legal Advice' },
                    { value: 'legal-document', label: 'Documents' }
                  ]}
                  leftSection={<IconFilter size={16} />}
                  w={200}
                  radius="md"
                />
              <ActionIcon 
                variant="light" 
                color={PRIMARY_BROWN} 
                size="lg" 
                onClick={fetchData}
                loading={loading}
                radius="md"
                title="Refresh Data"
              >
                <IconRefresh size={20} />
              </ActionIcon>
              <Button 
                leftSection={<IconDownload size={16} />} 
                color={PRIMARY_BROWN} 
                variant="filled" 
                onClick={handleExportPDF}
                radius="md"
              >
                Export
              </Button>
            </Group>
          </Group>
        </Stack>

        {/* Key Metrics Grid */}
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg" mb="xl">
            <StatCard 
                title="Total Cases" 
                value={summaryMetrics.total} 
                icon={IconFileAnalytics} 
                color="blue" 
                subtext="Processed finalized cases"
            />
            <StatCard 
                title="Accepted" 
                value={summaryMetrics.accepted} 
                icon={IconTrendingUp} 
                color="green" 
                subtext={`${((summaryMetrics.accepted / (summaryMetrics.total || 1)) * 100).toFixed(0)}% acceptance rate`}
            />
            <StatCard 
                title="Rejected" 
                value={summaryMetrics.rejected} 
                icon={IconScale} 
                color="red" 
                subtext="Cases declined or referred"
            />
            <StatCard 
                title="Active Team" 
                value={summaryMetrics.activeUsers} 
                icon={IconUsers} 
                color="grape" 
                subtext="Personnel with active cases"
            />
        </SimpleGrid>

        <Grid gutter="lg" mb="xl">
            {/* Case Trend Chart (Replaced Category Distribution) */}
            <Grid.Col span={{ base: 12, md: 8 }}>
                <Card shadow="sm" radius="md" padding="lg" withBorder h="100%">
                    <Group justify="space-between" mb="lg">
                      <Title order={4} c={PRIMARY_BROWN}>Cases Processed Over Time</Title>
                    </Group>
                    {casesOverTimeData.length > 0 ? (
                        <AreaChart
                            h={300}
                            data={casesOverTimeData}
                            dataKey="date"
                            series={[{ name: 'Cases', color: PRIMARY_GOLD }]}
                            curveType="monotone"
                            tickLine="y"
                            gridAxis="xy"
                            withGradient
                        />
                    ) : (
                        <Center h={200}><Text c="dimmed">No data available for trend analysis</Text></Center>
                    )}
                </Card>
            </Grid.Col>

            {/* Decisions Donut */}
            <Grid.Col span={{ base: 12, md: 4 }}>
                <Card shadow="sm" radius="md" padding="lg" withBorder h="100%">
                    <Title order={4} c={PRIMARY_BROWN} mb="lg">Decision Breakdown</Title>
                    <Center h={240}>
                      {decisionChartData.length > 0 ? (
                        <DonutChart 
                            size={180} 
                            thickness={25} 
                            data={decisionChartData} 
                            withLabels 
                            labelsType="percent" 
                            paddingAngle={2}
                            tooltipDataSource="segment"
                        />
                      ) : <Text c="dimmed">No data</Text>}
                    </Center>
                    <Stack gap="xs" mt="md">
                        {decisionChartData.map(d => (
                            <Group key={d.name} justify="space-between">
                                <Group gap="xs">
                                    <Box w={8} h={8} bg={d.color} style={{borderRadius: '50%'}} />
                                    <Text size="sm" c="dimmed">{d.name}</Text>
                                </Group>
                                <Text size="sm" fw={600}>{d.value}</Text>
                            </Group>
                        ))}
                    </Stack>
                </Card>
            </Grid.Col>
        </Grid>

        {/* Personnel Performance Section */}
        <Box mb="sm">
          <Title order={3} c={PRIMARY_BROWN} mb={4}>Top Performers</Title>
          <Text size="sm" c="dimmed">Recognizing the most active contributors</Text>
        </Box>
        
        <Grid gutter="lg">
            <Grid.Col span={{ base: 12, md: 4 }}>
                <LeaderboardCard 
                    title="Interns" 
                    icon={IconUser} 
                    data={personnelStats.interns} 
                    roleColor={ROLE_COLORS.intern} 
                    onUserClick={(u) => handleUserClick(u, 'intern')}
                />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
                <LeaderboardCard 
                    title="Supervising Lawyers" 
                    icon={IconGavel} 
                    data={personnelStats.lawyers} 
                    roleColor={ROLE_COLORS.lawyer} 
                    onUserClick={(u) => handleUserClick(u, 'supervising lawyer')}
                />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
                <LeaderboardCard 
                    title="Directors" 
                    icon={IconBriefcase} 
                    data={personnelStats.directors} 
                    roleColor={ROLE_COLORS.director} 
                    onUserClick={(u) => handleUserClick(u, 'director')}
                />
            </Grid.Col>
        </Grid>

        {/* User Details Modal */}
        <Modal
          opened={modalOpened}
          onClose={() => setModalOpened(false)}
          title={
            <Group>
              <Avatar size="lg" radius="xl" color={PRIMARY_BROWN}>
                {selectedUser?.role === 'intern' ? <IconUser size={24} /> : 
                 selectedUser?.role === 'supervising lawyer' ? <IconGavel size={24} /> : 
                 <IconBriefcase size={24} />}
              </Avatar>
              <Box>
                <Text fw={700} size="lg" c={PRIMARY_BROWN}>
                  {selectedUser?.name}
                </Text>
                <Badge variant="light" color="gray" size="sm">{selectedUser?.role?.toUpperCase()}</Badge>
              </Box>
            </Group>
          }
          size="xl"
          padding="xl"
          radius="md"
        >
          <Stack gap="lg">
             <SimpleGrid cols={3} spacing="md">
              <Card shadow="sm" padding="md" radius="md" bg={`${PRIMARY_BROWN}10`} withBorder style={{ borderColor: `${PRIMARY_BROWN}30` }}>
                <Stack gap="xs" align="center">
                  <IconFileText size={28} color={PRIMARY_BROWN} />
                  <Text size="xs" c={MUTED_OLIVE} fw={700} ta="center" tt="uppercase">Legal Advice</Text>
                  <Text size="xl" fw={800} c={PRIMARY_BROWN}>{userCases.legalAdvice?.length || 0}</Text>
                </Stack>
              </Card>
              <Card shadow="sm" padding="md" radius="md" bg={`${PRIMARY_GOLD}10`} withBorder style={{ borderColor: `${PRIMARY_GOLD}30` }}>
                <Stack gap="xs" align="center">
                  <IconFileDescription size={28} style={{ color: PRIMARY_BROWN }} />
                  <Text size="xs" c={MUTED_OLIVE} fw={700} ta="center" tt="uppercase">Docs Drafted</Text>
                  <Text size="xl" fw={800} c={PRIMARY_BROWN}>{userCases.legalDocument?.length || 0}</Text>
                </Stack>
              </Card>
              <Card shadow="sm" padding="md" radius="md" bg={`${MUTED_OLIVE}10`} withBorder style={{ borderColor: `${MUTED_OLIVE}30` }}>
                <Stack gap="xs" align="center">
                  <IconScale size={28} color={MUTED_OLIVE} />
                  <Text size="xs" c={MUTED_OLIVE} fw={700} ta="center" tt="uppercase">Represented</Text>
                  <Text size="xl" fw={800} c={PRIMARY_BROWN}>{userCases.courtRepresentation?.length || 0}</Text>
                </Stack>
              </Card>
            </SimpleGrid>
            
            <Divider />
            
             <Tabs defaultValue="legalAdvice" variant="pills" color="brown" radius="md">
              <Tabs.List grow mb="md">
                <Tabs.Tab value="legalAdvice" leftSection={<IconFileText size={16} />}>
                  Legal Advice
                </Tabs.Tab>
                <Tabs.Tab value="legalDocument" leftSection={<IconFileDescription size={16} />}>
                  Drafting
                </Tabs.Tab>
                <Tabs.Tab value="courtRepresentation" leftSection={<IconScale size={16} />}>
                  Representation
                </Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="legalAdvice">
                {renderCasesList(userCases.legalAdvice || [], 'legal advice')}
              </Tabs.Panel>
              <Tabs.Panel value="legalDocument">
                {renderCasesList(userCases.legalDocument || [], 'document drafting')}
              </Tabs.Panel>
              <Tabs.Panel value="courtRepresentation">
                {renderCasesList(userCases.courtRepresentation || [], 'court representation')}
              </Tabs.Panel>
            </Tabs>
          </Stack>
        </Modal>

      </Container>
    </Box>
  );
}
