import React, { useState, useEffect } from 'react';
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
  Divider,
} from '@mantine/core';
import { IconChartBar, IconTrophy, IconUser, IconGavel, IconBriefcase, IconFileText, IconScale, IconFileDescription } from '@tabler/icons-react';
import { PRIMARY_GOLD, PRIMARY_BROWN, MUTED_OLIVE, THEMED_LIGHT_BG, CHARCOAL, NATURE_OF_CASE_OPTIONS } from '@utils/constants';
import apiClient from '@config/api/apiClient';

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [finalizedCases, setFinalizedCases] = useState([]);
  const [users, setUsers] = useState([]);
  const [caseTypeFilter, setCaseTypeFilter] = useState('all');
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

  useEffect(() => {
    if (finalizedCases.length > 0 && users.length > 0) {
      calculateStats();
    }
  }, [finalizedCases, users, caseTypeFilter]);

  const calculateStats = () => {
    // Filter cases by type if selected
    let filteredCases = finalizedCases;
    if (caseTypeFilter !== 'all') {
      filteredCases = finalizedCases.filter(c => {
        const caseType = c.content?.interviewInfo?.caseType;
        return caseType === caseTypeFilter;
      });
    }

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
    } else if (role === 'supervising_lawyer') {
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

  const renderStatsCard = (title, icon, data, color, role) => (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="md">
        <Group justify="space-between">
          <Group gap="xs">
            {icon}
            <Title order={4} c={PRIMARY_BROWN}>{title}</Title>
          </Group>
          <Badge size="lg" color={color} variant="light">
            {data.length} Total
          </Badge>
        </Group>

        {data.length === 0 ? (
          <Text size="sm" c="dimmed" ta="center" py="xl">
            No data available
          </Text>
        ) : (
          <>
            {/* Top Performer */}
            {data[0] && (
              <Paper p="md" radius="md" style={{ backgroundColor: `${PRIMARY_GOLD}15`, border: `2px solid ${PRIMARY_GOLD}` }}>
                <Group justify="space-between" align="center">
                  <Group gap="sm">
                    <Avatar size="lg" radius="xl" color={PRIMARY_BROWN}>
                      <IconTrophy size={24} />
                    </Avatar>
                    <Box>
                      <Text fw={700} size="md" c={PRIMARY_BROWN}>
                        {data[0].name}
                      </Text>
                      <Text size="xs" c={MUTED_OLIVE}>
                        Top Performer
                      </Text>
                    </Box>
                  </Group>
                  <Badge size="xl" color="yellow" variant="filled">
                    {data[0].count} cases
                  </Badge>
                </Group>
              </Paper>
            )}

            {/* Table of all users */}
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Rank</Table.Th>
                  <Table.Th>Name</Table.Th>
                  <Table.Th style={{ textAlign: 'right' }}>Cases Handled</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {data.map((item, index) => (
                  <Table.Tr 
                    key={item.id}
                    onClick={() => handleUserClick(item, role)}
                    style={{ cursor: 'pointer' }}
                  >
                    <Table.Td>
                      <Badge 
                        size="lg" 
                        color={index === 0 ? 'yellow' : index === 1 ? 'gray' : index === 2 ? 'orange' : 'blue'}
                        variant={index < 3 ? 'filled' : 'light'}
                      >
                        #{index + 1}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text fw={index < 3 ? 600 : 400}>{item.name}</Text>
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'right' }}>
                      <Badge size="md" color={color} variant="light">
                        {item.count}
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </>
        )}
      </Stack>
    </Card>
  );

  if (loading) {
    return (
      <Box style={{ minHeight: '100vh', backgroundColor: THEMED_LIGHT_BG, paddingTop: '80px' }}>
        <Container size="xl" py="xl">
          <Center style={{ minHeight: '60vh' }}>
            <Loader size="xl" color={PRIMARY_BROWN} />
          </Center>
        </Container>
      </Box>
    );
  }

  return (
    <Box style={{ minHeight: '100vh', backgroundColor: THEMED_LIGHT_BG, paddingTop: '80px' }}>
      <Container size="xl" py="xl">
        <Paper shadow="md" radius="lg" p="xl" mb="xl">
          <Stack gap="xl">
            <Group justify="space-between" align="center">
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
              <Select
                placeholder="Filter by Case Type"
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
                style={{ minWidth: 250 }}
                styles={{
                  input: {
                    borderRadius: '8px',
                    border: `1px solid ${PRIMARY_GOLD}`,
                    '&:focus': {
                      borderColor: PRIMARY_BROWN,
                    }
                  }
                }}
              />
            </Group>

            {/* Summary Cards */}
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
              <Card shadow="sm" padding="lg" radius="md" style={{ backgroundColor: `${PRIMARY_BROWN}10` }}>
                <Group gap="md">
                  <Avatar size="xl" radius="md" color={PRIMARY_BROWN}>
                    <IconUser size={32} />
                  </Avatar>
                  <Box>
                    <Text size="xs" c={MUTED_OLIVE} fw={600}>INTERNS</Text>
                    <Text size="xl" fw={700} c={PRIMARY_BROWN}>{internsStats.length}</Text>
                    <Text size="xs" c="dimmed">Active contributors</Text>
                  </Box>
                </Group>
              </Card>
              <Card shadow="sm" padding="lg" radius="md" style={{ backgroundColor: `${PRIMARY_GOLD}10` }}>
                <Group gap="md">
                  <Avatar size="xl" radius="md" color={PRIMARY_GOLD} style={{ color: PRIMARY_BROWN }}>
                    <IconGavel size={32} />
                  </Avatar>
                  <Box>
                    <Text size="xs" c={MUTED_OLIVE} fw={600}>SUPERVISING LAWYERS</Text>
                    <Text size="xl" fw={700} c={PRIMARY_BROWN}>{supervisingLawyersStats.length}</Text>
                    <Text size="xs" c="dimmed">Active reviewers</Text>
                  </Box>
                </Group>
              </Card>
              <Card shadow="sm" padding="lg" radius="md" style={{ backgroundColor: `${MUTED_OLIVE}10` }}>
                <Group gap="md">
                  <Avatar size="xl" radius="md" color={MUTED_OLIVE}>
                    <IconBriefcase size={32} />
                  </Avatar>
                  <Box>
                    <Text size="xs" c={MUTED_OLIVE} fw={600}>DIRECTORS</Text>
                    <Text size="xl" fw={700} c={PRIMARY_BROWN}>{directorsStats.length}</Text>
                    <Text size="xs" c="dimmed">Decision makers</Text>
                  </Box>
                </Group>
              </Card>
            </SimpleGrid>
          </Stack>
        </Paper>

        {/* Stats Tables */}
        <Stack gap="xl">
          {renderStatsCard(
            'Interns Performance',
            <IconUser size={24} color={PRIMARY_BROWN} />,
            internsStats,
            'blue',
            'intern'
          )}
          
          {renderStatsCard(
            'Supervising Lawyers Performance',
            <IconGavel size={24} color={PRIMARY_BROWN} />,
            supervisingLawyersStats,
            'teal',
            'supervising_lawyer'
          )}
          
          {renderStatsCard(
            'Directors Performance',
            <IconBriefcase size={24} color={PRIMARY_BROWN} />,
            directorsStats,
            'grape',
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
                 selectedUser?.role === 'supervising_lawyer' ? <IconGavel size={24} /> : 
                 <IconBriefcase size={24} />}
              </Avatar>
              <Box>
                <Text fw={700} size="lg" c={PRIMARY_BROWN}>
                  {selectedUser?.name}
                </Text>
                <Text size="sm" c={MUTED_OLIVE}>
                  {selectedUser?.role === 'intern' ? 'Intern' : 
                   selectedUser?.role === 'supervising_lawyer' ? 'Supervising Lawyer' : 
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
