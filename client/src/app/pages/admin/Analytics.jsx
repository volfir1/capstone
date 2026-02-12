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
  Loader,
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
  RingProgress,
} from '@mantine/core';
import {
  IconChartBar,
  IconTrophy,
  IconUser,
  IconGavel,
  IconBriefcase,
  IconDownload,
  IconCalendar,
  IconScale,
  IconFileAnalytics,
  IconUsers,
  IconTrendingUp,
  IconMedal,
  IconFileText,
  IconFileDescription,
} from '@tabler/icons-react';
import { BarChart, DonutChart } from '@mantine/charts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PRIMARY_GOLD, PRIMARY_BROWN, MUTED_OLIVE, BG, CHARCOAL, CATEGORY_COLORS } from '@utils/constants';
import apiClient from '@config/api/apiClient';

// Role accent colors
const ROLE_COLORS = {
  intern: { primary: '#228BE6', light: '#E7F5FF', border: '#74C0FC' },
  lawyer: { primary: '#12B886', light: '#E6FCF5', border: '#63E6BE' },
  director: { primary: '#9C36B5', light: '#F3D9FA', border: '#DA77F2' },
};

// Medal icons for top 3
const MEDALS = ['🥇', '🥈', '🥉'];

// Performance color coding
const getPerformanceColor = (count, maxCount) => {
  if (maxCount === 0) return 'gray';
  const ratio = count / maxCount;
  if (ratio >= 0.7) return 'green';
  if (ratio >= 0.3) return 'orange';
  return 'gray';
};

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
  const [internsStats, setInternsStats] = useState([]);
  const [supervisingLawyersStats, setSupervisingLawyersStats] = useState([]);
  const [directorsStats, setDirectorsStats] = useState([]);
  
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

  // Summary metrics
  const summaryMetrics = useMemo(() => {
    const total = filteredCases.length;
    const accepted = filteredCases.filter(c => c.decision === 'accepted').length;
    const rejected = filteredCases.filter(c => c.decision === 'rejected').length;
    const pending = filteredCases.filter(c => c.decision === 'pending' || !c.decision).length;
    const uniquePersonnel = new Set();
    filteredCases.forEach(c => {
      if (c.content?.interviewInfo?.interviewingInternsId) uniquePersonnel.add(c.content.interviewInfo.interviewingInternsId);
      if (c.content?.actionInfo?.supervisingLawyerId) uniquePersonnel.add(c.content.actionInfo.supervisingLawyerId);
      if (c.content?.actionInfo?.directorId) uniquePersonnel.add(c.content.actionInfo.directorId);
    });
    return { total, accepted, rejected, pending, activeUsers: uniquePersonnel.size };
  }, [filteredCases]);

  // Category distribution for chart
  const { categoryChartData, categorySeries } = useMemo(() => {
    const counts = {};
    filteredCases.forEach(c => {
      const cat = c.content?.caseInfo?.nature || c.category || 'Other';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    // Each category becomes a separate data point with its own key
    const data = sorted.map(([name, value]) => {
      const label = name.length > 20 ? name.substring(0, 18) + '\u2026' : name;
      return { category: label, [label]: value };
    });
    const series = sorted.map(([name]) => {
      const label = name.length > 20 ? name.substring(0, 18) + '\u2026' : name;
      const mantineColor = CATEGORY_COLORS[name] || 'blue';
      return { name: label, color: `${mantineColor}.6` };
    });
    return { categoryChartData: data, categorySeries: series };
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

  useEffect(() => {
    if (filteredCases.length > 0 && users.length > 0) {
      calculateStats();
    } else if (filteredCases.length === 0) {
      setInternsStats([]);
      setSupervisingLawyersStats([]);
      setDirectorsStats([]);
    }
  }, [filteredCases, users]);

  const calculateStats = () => {
    // Create user lookup map
    const userMap = {};
    users.forEach(user => {
      userMap[user._id] = {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      };
    });

    // Count cases by intern
    const internCounts = {};
    filteredCases.forEach(c => {
      const internId = c.content?.interviewInfo?.interviewingInternsId;
      const internName = c.content?.interviewInfo?.interviewingInterns;
      if (internId) {
        if (!internCounts[internId]) {
          internCounts[internId] = {
            id: internId,
            name: internName || (userMap[internId] ? `${userMap[internId].firstName} ${userMap[internId].lastName}` : 'Unknown'),
            count: 0
          };
        }
        internCounts[internId].count++;
      }
    });

    // Count cases by supervising lawyer
    const supervisingLawyerCounts = {};
    filteredCases.forEach(c => {
      const lawyerId = c.content?.actionInfo?.supervisingLawyerId;
      const lawyerName = c.content?.actionInfo?.supervisingLawyer;
      if (lawyerId) {
        if (!supervisingLawyerCounts[lawyerId]) {
          supervisingLawyerCounts[lawyerId] = {
            id: lawyerId,
            name: lawyerName || (userMap[lawyerId] ? `${userMap[lawyerId].firstName} ${userMap[lawyerId].lastName}` : 'Unknown'),
            count: 0
          };
        }
        supervisingLawyerCounts[lawyerId].count++;
      }
    });

    // Count cases by director
    const directorCounts = {};
    filteredCases.forEach(c => {
      const directorId = c.content?.actionInfo?.directorId;
      const directorName = c.content?.actionInfo?.directorSignature;
      if (directorId) {
        if (!directorCounts[directorId]) {
          directorCounts[directorId] = {
            id: directorId,
            name: directorName || (userMap[directorId] ? `${userMap[directorId].firstName} ${userMap[directorId].lastName}` : 'Unknown'),
            count: 0
          };
        }
        directorCounts[directorId].count++;
      }
    });

    // Convert to arrays and sort by count (descending)
    const internsList = Object.values(internCounts).sort((a, b) => b.count - a.count);
    const lawyersList = Object.values(supervisingLawyerCounts).sort((a, b) => b.count - a.count);
    const directorsList = Object.values(directorCounts).sort((a, b) => b.count - a.count);

    setInternsStats(internsList);
    setSupervisingLawyersStats(lawyersList);
    setDirectorsStats(directorsList);
  };

  const handleUserClick = (user, role) => {
    setSelectedUser({ ...user, role });
    
    // Filter cases based on role
    let cases = [];
    if (role === 'intern') {
      cases = finalizedCases.filter(c => c.content?.interviewInfo?.interviewingInternsId === user.id);
    } else if (role === 'supervising lawyer') {
      cases = finalizedCases.filter(c => c.content?.actionInfo?.supervisingLawyerId === user.id);
    } else if (role === 'director') {
      cases = finalizedCases.filter(c => c.content?.actionInfo?.directorId === user.id);
    }
    
    // Categorize by case type
    const categorizedCases = {
      legalAdvice: cases.filter(c => c.content?.interviewInfo?.caseType === 'legal-advice'),
      legalDocument: cases.filter(c => c.content?.interviewInfo?.caseType === 'legal-document'),
      courtRepresentation: cases.filter(c => c.content?.interviewInfo?.caseType === 'court-representation')
    };
    
    setUserCases(categorizedCases);
    setModalOpened(true);
  };

  const renderCasesList = (cases, type) => {
    if (cases.length === 0) {
      return (
        <Text size="sm" c="dimmed" ta="center" py="xl">
          No {type} cases handled
        </Text>
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
                <Text size="sm" fw={500}>{c.caseId || 'N/A'}</Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm">{c.clientName || c.content?.interviewInfo?.clientName || 'N/A'}</Text>
              </Table.Td>
              <Table.Td>
                <Badge 
                  color={c.decision === 'accepted' ? 'green' : c.decision === 'rejected' ? 'red' : 'blue'}
                  variant="light"
                >
                  {c.decision || 'N/A'}
                </Badge>
              </Table.Td>
              <Table.Td>
                <Text size="sm">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'N/A'}</Text>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    );
  };

  // PDF Export
  const handleExportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // -- Header --
    doc.setFontSize(20);
    doc.setTextColor(139, 69, 19); // PRIMARY_BROWN
    doc.text('Analytics Report', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on ${dateStr}`, pageWidth / 2, 28, { align: 'center' });

    const filters = [];
    if (dateRange !== 'all') {
      const label = DATE_RANGES.find(d => d.value === dateRange)?.label || dateRange;
      filters.push(label);
    }
    if (caseTypeFilter !== 'all') {
      filters.push(`Case Type: ${caseTypeFilter}`);
    }
    if (filters.length > 0) {
      doc.text(`Filters: ${filters.join(' | ')}`, pageWidth / 2, 34, { align: 'center' });
    }

    doc.autoTable = autoTable;

    // -- Summary --
    let y = filters.length > 0 ? 44 : 38;
    doc.setFontSize(12);
    doc.setTextColor(50);
    doc.text('Summary', 14, y);
    y += 2;

    autoTable(doc, {
      startY: y,
      head: [['Total Cases', 'Active Personnel', 'Accepted', 'Rejected']],
      body: [[summaryMetrics.total, summaryMetrics.activeUsers, summaryMetrics.accepted, summaryMetrics.rejected]],
      theme: 'grid',
      headStyles: { fillColor: [139, 69, 19], textColor: 255, fontStyle: 'bold', halign: 'center' },
      bodyStyles: { halign: 'center', fontSize: 11, fontStyle: 'bold' },
      margin: { left: 14, right: 14 },
    });

    y = doc.lastAutoTable.finalY + 10;

    // -- Personnel Overview --
    doc.setFontSize(12);
    doc.setTextColor(50);
    doc.text('Personnel Overview', 14, y);
    y += 2;

    autoTable(doc, {
      startY: y,
      head: [['Role', 'Active Count']],
      body: [
        ['Interns', internsStats.length],
        ['Supervising Lawyers', supervisingLawyersStats.length],
        ['Directors', directorsStats.length],
      ],
      theme: 'striped',
      headStyles: { fillColor: [139, 69, 19], textColor: 255, fontStyle: 'bold' },
      bodyStyles: { fontSize: 10 },
      columnStyles: { 1: { halign: 'center' } },
      margin: { left: 14, right: 14 },
    });

    // -- Leaderboard tables --
    const sections = [
      { title: 'Interns Performance', data: internsStats },
      { title: 'Supervising Lawyers Performance', data: supervisingLawyersStats },
      { title: 'Directors Performance', data: directorsStats },
    ];

    sections.forEach(({ title, data }) => {
      if (data.length === 0) return;
      y = doc.lastAutoTable.finalY + 12;

      // Check if we need a new page
      if (y > doc.internal.pageSize.getHeight() - 40) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(12);
      doc.setTextColor(50);
      doc.text(title, 14, y);
      y += 2;

      autoTable(doc, {
        startY: y,
        head: [['Rank', 'Name', 'Cases Handled']],
        body: data.map((item, i) => [i + 1, item.name, item.count]),
        theme: 'striped',
        headStyles: { fillColor: [139, 69, 19], textColor: 255, fontStyle: 'bold' },
        bodyStyles: { fontSize: 10 },
        columnStyles: {
          0: { halign: 'center', cellWidth: 25 },
          2: { halign: 'center', cellWidth: 35 },
        },
        margin: { left: 14, right: 14 },
      });
    });

    // -- Footer --
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `JustReach Legal Services - Analytics Report | Page ${i} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 8,
        { align: 'center' }
      );
    }

    doc.save(`analytics_report_${now.toISOString().slice(0, 10)}.pdf`);
  };

  // Render leaderboard section
  const renderLeaderboard = (title, icon, data, roleColor, roleName) => {
    const maxCount = data.length > 0 ? data[0].count : 0;
    const totalCases = data.reduce((sum, d) => sum + d.count, 0);

    return (
      <Card shadow="sm" padding="lg" radius="md" withBorder style={{ borderLeft: `4px solid ${roleColor.primary}` }}>
        <Stack gap="md">
          {/* Header */}
          <Group justify="space-between" align="center">
            <Group gap="xs">
              <ThemeIcon size="lg" radius="md" color={roleColor.primary} variant="light">
                {icon}
              </ThemeIcon>
              <Box>
                <Title order={4} c={PRIMARY_BROWN}>{title}</Title>
                <Text size="xs" c="dimmed">
                  {data.length} active {roleName.toLowerCase()}{data.length !== 1 ? 's' : ''} &middot; {totalCases} case{totalCases !== 1 ? 's' : ''} total
                </Text>
              </Box>
            </Group>
          </Group>

          {data.length === 0 ? (
            <Paper p="xl" radius="md" style={{ backgroundColor: '#f8f9fa' }}>
              <Text size="sm" c="dimmed" ta="center">
                No data available for this period
              </Text>
            </Paper>
          ) : (
            <>
              {/* Leaderboard List */}
              <Stack gap={0}>
                {data.slice(0, data.length > 3 ? data.length : 3).map((item, index) => (
                  <Group
                    key={item.id}
                    justify="space-between"
                    align="center"
                    wrap="nowrap"
                    py="sm"
                    px="md"
                    style={{
                      borderBottom: index < data.length - 1 ? '1px solid #f0f0f0' : 'none',
                      backgroundColor: index === 0 ? '#fafafa' : 'transparent',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleUserClick(item, roleName)}
                  >
                    <Group gap="md" wrap="nowrap" style={{ flex: 1 }}>
                      <Text size="sm" fw={600} c="dimmed" style={{ width: 28, textAlign: 'center' }}>
                        {index < 3 ? MEDALS[index] : `#${index + 1}`}
                      </Text>
                      <Box style={{ flex: 1 }}>
                        <Text fw={index === 0 ? 600 : 400} size="sm" c={CHARCOAL}>
                          {item.name}
                        </Text>
                        {/* Inline progress bar */}
                        <Progress
                          value={maxCount > 0 ? (item.count / maxCount) * 100 : 0}
                          color={roleColor.primary}
                          size={4}
                          radius="xl"
                          mt={4}
                        />
                      </Box>
                    </Group>
                    <Text size="sm" fw={600} c={PRIMARY_BROWN} style={{ whiteSpace: 'nowrap' }}>
                      {item.count} {item.count === 1 ? 'case' : 'cases'}
                    </Text>
                  </Group>
                ))}
              </Stack>
            </>
          )}
        </Stack>
      </Card>
    );
  };

  if (loading) {
    return (
      <Box bg={BG} mih="100vh" py="xl">
        <Container size="xl" py="xl">
          <Center style={{ minHeight: '60vh' }}>
            <Loader size="xl" color={PRIMARY_BROWN} />
          </Center>
        </Container>
      </Box>
    );
  }

  return (
    <Box bg={BG} mih="100vh" py="xl">
      <Container size="xl" py="xl">
        {/* Header */}
        <Paper shadow="md" radius="lg" p="xl" mb="xl">
          <Stack gap="xl">
            <Group justify="space-between" align="flex-start" wrap="wrap">
              <Group gap="md">
                <IconChartBar size={32} color={PRIMARY_BROWN} />
                <Box>
                  <Title order={1} c={PRIMARY_BROWN}>
                    Analytics Dashboard
                  </Title>
                  <Text size="sm" c={MUTED_OLIVE}>
                    Performance metrics and case statistics
                  </Text>
                </Box>
              </Group>
              <Group gap="sm" wrap="wrap">
                <Select
                  placeholder="Date Range"
                  value={dateRange}
                  onChange={(val) => setDateRange(val || 'all')}
                  data={DATE_RANGES}
                  leftSection={<IconCalendar size={16} />}
                  style={{ minWidth: 160 }}
                  styles={{
                    input: {
                      borderRadius: '8px',
                      border: `1px solid ${PRIMARY_GOLD}`,
                    }
                  }}
                />
                <Select
                  placeholder="Case Type"
                  value={caseTypeFilter}
                  onChange={(val) => setCaseTypeFilter(val || 'all')}
                  data={[
                    { value: 'all', label: 'All Case Types' },
                    { value: 'court-representation', label: 'For Representation' },
                    { value: 'legal-advice', label: 'Legal Advice Only' },
                    { value: 'legal-document', label: 'Drafting of Legal Documents' }
                  ]}
                  clearable
                  onClear={() => setCaseTypeFilter('all')}
                  style={{ minWidth: 200 }}
                  styles={{
                    input: {
                      borderRadius: '8px',
                      border: `1px solid ${PRIMARY_GOLD}`,
                    }
                  }}
                />
                <Tooltip label="Export analytics as PDF">
                  <Button
                    variant="light"
                    color={PRIMARY_BROWN}
                    leftSection={<IconDownload size={16} />}
                    onClick={handleExportPDF}
                    radius="md"
                  >
                    Export PDF
                  </Button>
                </Tooltip>
              </Group>
            </Group>

            {/* Summary Metrics Row */}
            <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
              <Card shadow="xs" padding="md" radius="md" withBorder>
                <Group gap="sm" align="center" wrap="nowrap">
                  <ThemeIcon size="lg" radius="md" color="blue" variant="light">
                    <IconFileAnalytics size={20} />
                  </ThemeIcon>
                  <Stack gap={0} align="center" style={{ flex: 1 }}>
                    <Text size="2rem" fw={800} c={PRIMARY_BROWN} lh={1.1}>
                      {summaryMetrics.total}
                    </Text>
                    <Text size="xs" c="dimmed" fw={500}>Total Cases</Text>
                  </Stack>
                </Group>
              </Card>
              <Card shadow="xs" padding="md" radius="md" withBorder>
                <Group gap="sm" align="center" wrap="nowrap">
                  <ThemeIcon size="lg" radius="md" color="teal" variant="light">
                    <IconUsers size={20} />
                  </ThemeIcon>
                  <Stack gap={0} align="center" style={{ flex: 1 }}>
                    <Text size="2rem" fw={800} c={PRIMARY_BROWN} lh={1.1}>
                      {summaryMetrics.activeUsers}
                    </Text>
                    <Text size="xs" c="dimmed" fw={500}>Active Personnel</Text>
                  </Stack>
                </Group>
              </Card>
              <Card shadow="xs" padding="md" radius="md" withBorder>
                <Group gap="sm" align="center" wrap="nowrap">
                  <ThemeIcon size="lg" radius="md" color="green" variant="light">
                    <IconTrendingUp size={20} />
                  </ThemeIcon>
                  <Stack gap={0} align="center" style={{ flex: 1 }}>
                    <Text size="2rem" fw={800} c="green" lh={1.1}>
                      {summaryMetrics.accepted}
                    </Text>
                    <Text size="xs" c="dimmed" fw={500}>Accepted</Text>
                  </Stack>
                </Group>
              </Card>
              <Card shadow="xs" padding="md" radius="md" withBorder>
                <Group gap="sm" align="center" wrap="nowrap">
                  <ThemeIcon size="lg" radius="md" color="red" variant="light">
                    <IconScale size={20} />
                  </ThemeIcon>
                  <Stack gap={0} align="center" style={{ flex: 1 }}>
                    <Text size="2rem" fw={800} c="red.7" lh={1.1}>
                      {summaryMetrics.rejected}
                    </Text>
                    <Text size="xs" c="dimmed" fw={500}>Rejected</Text>
                  </Stack>
                </Group>
              </Card>
            </SimpleGrid>

            {/* Role Stats Cards */}
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
              <Card shadow="xs" padding="md" radius="md" withBorder>
                <Group gap="sm" align="center" wrap="nowrap">
                  <ThemeIcon size="lg" radius="md" color="blue" variant="light">
                    <IconUser size={20} />
                  </ThemeIcon>
                  <Stack gap={0} align="center" style={{ flex: 1 }}>
                    <Text size="2rem" fw={800} c={PRIMARY_BROWN} lh={1.1}>
                      {internsStats.length}
                    </Text>
                    <Text size="xs" c="dimmed" fw={500}>Interns</Text>
                  </Stack>
                </Group>
              </Card>
              <Card shadow="xs" padding="md" radius="md" withBorder>
                <Group gap="sm" align="center" wrap="nowrap">
                  <ThemeIcon size="lg" radius="md" color="teal" variant="light">
                    <IconGavel size={20} />
                  </ThemeIcon>
                  <Stack gap={0} align="center" style={{ flex: 1 }}>
                    <Text size="2rem" fw={800} c={PRIMARY_BROWN} lh={1.1}>
                      {supervisingLawyersStats.length}
                    </Text>
                    <Text size="xs" c="dimmed" fw={500}>Supervising Lawyers</Text>
                  </Stack>
                </Group>
              </Card>
              <Card shadow="xs" padding="md" radius="md" withBorder>
                <Group gap="sm" align="center" wrap="nowrap">
                  <ThemeIcon size="lg" radius="md" color="grape" variant="light">
                    <IconBriefcase size={20} />
                  </ThemeIcon>
                  <Stack gap={0} align="center" style={{ flex: 1 }}>
                    <Text size="2rem" fw={800} c={PRIMARY_BROWN} lh={1.1}>
                      {directorsStats.length}
                    </Text>
                    <Text size="xs" c="dimmed" fw={500}>Directors</Text>
                  </Stack>
                </Group>
              </Card>
            </SimpleGrid>
          </Stack>
        </Paper>

        {/* Charts Row */}
        {filteredCases.length > 0 && (
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl" mb="xl">
            {/* Case Category Distribution */}
            {categoryChartData.length > 0 && (
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Stack gap="md">
                  <Title order={4} c={PRIMARY_BROWN}>Cases by Category</Title>
                  <BarChart
                    h={280}
                    data={categoryChartData}
                    dataKey="category"
                    series={categorySeries}
                    tickLine="y"
                    gridAxis="y"
                    barProps={{ radius: [4, 4, 0, 0] }}
                  />
                </Stack>
              </Card>
            )}
            {/* Decision Distribution */}
            {decisionChartData.length > 0 && (
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Stack gap="md">
                  <Title order={4} c={PRIMARY_BROWN}>Case Decisions</Title>
                  <Center>
                    <DonutChart
                      data={decisionChartData}
                      size={200}
                      thickness={30}
                      tooltipDataSource="segment"
                      paddingAngle={2}
                    />
                  </Center>
                  <Group justify="center" gap="lg" mt="xs">
                    {decisionChartData.map(d => (
                      <Group key={d.name} gap={6}>
                        <Box style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: d.color }} />
                        <Text size="sm" c="dimmed">{d.name}: {d.value}</Text>
                      </Group>
                    ))}
                  </Group>
                </Stack>
              </Card>
            )}
          </SimpleGrid>
        )}

        {/* Leaderboards */}
        <Stack gap="xl">
          {renderLeaderboard(
            'Interns Performance',
            <IconUser size={20} />,
            internsStats,
            ROLE_COLORS.intern,
            'intern'
          )}
          
          {renderLeaderboard(
            'Supervising Lawyers Performance',
            <IconGavel size={20} />,
            supervisingLawyersStats,
            ROLE_COLORS.lawyer,
            'supervising lawyer'
          )}
          
          {renderLeaderboard(
            'Directors Performance',
            <IconBriefcase size={20} />,
            directorsStats,
            ROLE_COLORS.director,
            'director'
          )}
        </Stack>

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
                <Text size="sm" c={MUTED_OLIVE}>
                  {selectedUser?.role === 'intern' ? 'Intern' : 
                   selectedUser?.role === 'supervising lawyer' ? 'Supervising Lawyer' : 
                   'Director'}
                </Text>
              </Box>
            </Group>
          }
          size="xl"
          styles={{
            title: { width: '100%' }
          }}
        >
          <Stack gap="lg">
            {/* Summary Stats */}
            <SimpleGrid cols={3} spacing="md">
              <Card shadow="sm" padding="md" radius="md" style={{ backgroundColor: `${PRIMARY_BROWN}10` }}>
                <Stack gap="xs" align="center">
                  <IconFileText size={32} color={PRIMARY_BROWN} />
                  <Text size="xs" c={MUTED_OLIVE} fw={600} ta="center">LEGAL ADVICE</Text>
                  <Text size="xl" fw={700} c={PRIMARY_BROWN}>{userCases.legalAdvice?.length || 0}</Text>
                </Stack>
              </Card>
              <Card shadow="sm" padding="md" radius="md" style={{ backgroundColor: `${PRIMARY_GOLD}10` }}>
                <Stack gap="xs" align="center">
                  <IconFileDescription size={32} style={{ color: PRIMARY_BROWN }} />
                  <Text size="xs" c={MUTED_OLIVE} fw={600} ta="center">DOCUMENT DRAFTING</Text>
                  <Text size="xl" fw={700} c={PRIMARY_BROWN}>{userCases.legalDocument?.length || 0}</Text>
                </Stack>
              </Card>
              <Card shadow="sm" padding="md" radius="md" style={{ backgroundColor: `${MUTED_OLIVE}10` }}>
                <Stack gap="xs" align="center">
                  <IconScale size={32} color={MUTED_OLIVE} />
                  <Text size="xs" c={MUTED_OLIVE} fw={600} ta="center">COURT REPRESENTATION</Text>
                  <Text size="xl" fw={700} c={PRIMARY_BROWN}>{userCases.courtRepresentation?.length || 0}</Text>
                </Stack>
              </Card>
            </SimpleGrid>

            <Divider />

            {/* Cases by Type */}
            <Tabs defaultValue="legalAdvice" variant="pills">
              <Tabs.List>
                <Tabs.Tab value="legalAdvice" leftSection={<IconFileText size={16} />}>
                  Legal Advice ({userCases.legalAdvice?.length || 0})
                </Tabs.Tab>
                <Tabs.Tab value="legalDocument" leftSection={<IconFileDescription size={16} />}>
                  Document Drafting ({userCases.legalDocument?.length || 0})
                </Tabs.Tab>
                <Tabs.Tab value="courtRepresentation" leftSection={<IconScale size={16} />}>
                  Court Representation ({userCases.courtRepresentation?.length || 0})
                </Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="legalAdvice" pt="lg">
                {renderCasesList(userCases.legalAdvice || [], 'legal advice')}
              </Tabs.Panel>

              <Tabs.Panel value="legalDocument" pt="lg">
                {renderCasesList(userCases.legalDocument || [], 'document drafting')}
              </Tabs.Panel>

              <Tabs.Panel value="courtRepresentation" pt="lg">
                {renderCasesList(userCases.courtRepresentation || [], 'court representation')}
              </Tabs.Panel>
            </Tabs>
          </Stack>
        </Modal>
      </Container>
    </Box>
  );
}
