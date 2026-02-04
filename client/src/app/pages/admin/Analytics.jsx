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
} from '@mantine/core';
import { IconChartBar, IconTrophy, IconUser, IconGavel, IconBriefcase } from '@tabler/icons-react';
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

  const renderStatsCard = (title, icon, data, color) => (
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
                  <Table.Tr key={item.id}>
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
            'blue'
          )}
          
          {renderStatsCard(
            'Supervising Lawyers Performance',
            <IconGavel size={24} color={PRIMARY_BROWN} />,
            supervisingLawyersStats,
            'teal'
          )}
          
          {renderStatsCard(
            'Directors Performance',
            <IconBriefcase size={24} color={PRIMARY_BROWN} />,
            directorsStats,
            'grape'
          )}
        </Stack>
      </Container>
    </Box>
  );
}
