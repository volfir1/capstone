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
  Badge,
  Loader,
  Center,
  Button,
  Modal,
  Select,
  Divider,
  ScrollArea,
  SimpleGrid,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconFileText,
  IconUserPlus,
  IconCalendar,
  IconUser,
} from '@tabler/icons-react';
import { PRIMARY_GOLD, PRIMARY_BROWN, MUTED_OLIVE, THEMED_LIGHT_BG, CHARCOAL, ACCENT_TAN } from '@utils/constants';
import apiClient from '@config/api/apiClient';

export default function AssignCases() {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [attorneys, setAttorneys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [selectedAttorney, setSelectedAttorney] = useState('');

  useEffect(() => {
    fetchCases();
    fetchAttorneys();
  }, []);

  // Update selectedCase when cases list changes (after assignment).
  useEffect(() => {
    if (selectedCase && cases.length > 0) {
      const updatedCase = cases.find(c => c._id === selectedCase._id);
      if (updatedCase) {
        setSelectedCase(updatedCase);
        setSelectedAttorney(updatedCase.attorneyId?._id || '');
      }
    }
  }, [cases, selectedCase]);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/cases/admin/all-cases');
      if (response.data.success) {
        setCases(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching cases:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to load cases',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAttorneys = async () => {
    try {
      const response = await apiClient.get('/cases/admin/attorneys');
      if (response.data.success) {
        setAttorneys(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching attorneys:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to load attorneys',
        color: 'red',
      });
    }
  };

  const assignAttorneyToCase = async () => {
    if (!selectedAttorney) {
      notifications.show({
        title: 'Error',
        message: 'Please select an attorney',
        color: 'red',
      });
      return;
    }

    try {
      setAssigning(true);
      const response = await apiClient.put(`/cases/admin/assign/${selectedCase._id}`, {
        attorneyId: selectedAttorney,
      });

      if (response.data.success) {
        notifications.show({
          title: 'Success',
          message: 'Attorney assigned successfully',
          color: 'green',
        });
        await fetchCases();
        handleCloseModal();
      }
    } catch (error) {
      console.error('Error assigning attorney:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to assign attorney',
        color: 'red',
      });
    } finally {
      setAssigning(false);
    }
  };

  const handleCasePress = (caseItem) => {
    setSelectedCase(caseItem);
    setSelectedAttorney(caseItem.attorneyId?._id || '');
  };

  const handleCloseModal = () => {
    setSelectedCase(null);
    setSelectedAttorney('');
  };

  return (
    <Box bg={THEMED_LIGHT_BG} mih="100vh" py="xl">
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
        {/* Header */}
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
          <Group gap="md" align="center">
            <Box
              style={{
                width: 48,
                height: 48,
                borderRadius: '12px',
                background: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconUserPlus size={24} color={PRIMARY_BROWN} stroke={2.5} />
            </Box>
            <Box>
              <Title order={2} c="white" mb={4}>
                Assign Cases
              </Title>
              <Text c="rgba(255, 255, 255, 0.9)" size="sm" fw={500}>
                Assign attorneys to pending cases
              </Text>
            </Box>
          </Group>
        </Paper>

        {/* Content */}
        {loading ? (
          <Paper shadow="xs" p="xl" radius="lg" bg="white">
            <Center style={{ minHeight: '400px' }}>
              <Stack align="center" gap="md">
                <Loader size="lg" color={PRIMARY_BROWN} />
                <Text c="dimmed">Loading cases...</Text>
              </Stack>
            </Center>
          </Paper>
        ) : cases.length === 0 ? (
          <Paper shadow="xs" p="xl" radius="lg" bg="white">
            <Center style={{ minHeight: '400px' }}>
              <Stack align="center" gap="md">
                <Box
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: THEMED_LIGHT_BG,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <IconFileText size={40} color={PRIMARY_GOLD} />
                </Box>
                <Title order={2} c={PRIMARY_BROWN}>
                  No Cases Available
                </Title>
                <Text c="dimmed" ta="center">
                  There are no cases to assign at this time
                </Text>
              </Stack>
            </Center>
          </Paper>
        ) : (
          <Stack gap="lg">
            {cases.map((caseItem) => (
              <Paper
                key={caseItem._id}
                shadow="xs"
                p="lg"
                radius="lg"
                style={{
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  border: '1px solid #F0F0F0',
                }}
                onClick={() => handleCasePress(caseItem)}
              >
                <Group justify="space-between" align="flex-start">
                  <Box style={{ flex: 1 }}>
                    <Group gap="xs" mb={8}>
                      <Badge
                        size="sm"
                        radius="sm"
                        style={{
                          backgroundColor: PRIMARY_BROWN,
                          color: 'white',
                        }}
                      >
                        {caseItem.caseNumber}
                      </Badge>
                      {caseItem.attorneyId ? (
                        <Badge
                          size="sm"
                          radius="sm"
                          style={{
                            backgroundColor: MUTED_OLIVE,
                            color: 'white',
                          }}
                        >
                          Assigned
                        </Badge>
                      ) : (
                        <Badge
                          size="sm"
                          radius="sm"
                          style={{
                            backgroundColor: PRIMARY_GOLD,
                            color: 'white',
                          }}
                        >
                          Unassigned
                        </Badge>
                      )}
                    </Group>
                    <Text size="md" fw={700} c={CHARCOAL} mb={4}>
                      {caseItem.caseTitle}
                    </Text>
                    <Text size="sm" c={MUTED_OLIVE} mb={8}>
                      {caseItem.caseType}
                    </Text>
                    {caseItem.attorneyId && (
                      <Group gap="xs">
                        <Box
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: '6px',
                            background: PRIMARY_GOLD,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <IconUser size={14} color="white" />
                        </Box>
                        <Text size="xs" c={PRIMARY_BROWN} fw={600}>
                          Assigned to: {caseItem.attorneyId.firstName} {caseItem.attorneyId.lastName}
                        </Text>
                      </Group>
                    )}
                  </Box>
                </Group>
              </Paper>
            ))}
          </Stack>
        )}
      </Container>

      {/* Case Detail Modal */}
      <Modal
        opened={selectedCase !== null}
        onClose={handleCloseModal}
        title={
          <Title order={3} c={CHARCOAL}>
            Case Details
          </Title>
        }
        size="lg"
        centered
        styles={{
          header: {
            borderBottom: '1px solid #F0F0F0',
            paddingBottom: '16px',
          },
          body: {
            padding: '24px',
          },
        }}
      >
        {selectedCase && (
          <Stack gap="lg">
              <Box>
                <Group gap="xs" mb={8}>
                  <Box
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '8px',
                      background: PRIMARY_BROWN,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <IconFileText size={16} color="white" />
                  </Box>
                  <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600}>
                    Case Number
                  </Text>
                </Group>
                <Text fw={500} c={CHARCOAL} ml={40}>
                  {selectedCase.caseNumber}
                </Text>
              </Box>

              <Divider color="#F0F0F0" />

              <Box>
                <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={8}>
                  Title
                </Text>
                <Text fw={600} c={CHARCOAL}>
                  {selectedCase.caseTitle}
                </Text>
              </Box>

              <Box>
                <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={8}>
                  Type
                </Text>
                <Text fw={500} c={CHARCOAL}>
                  {selectedCase.caseType}
                </Text>
              </Box>

              <Divider color="#F0F0F0" />

              <Box>
                <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={8}>
                  Short Description
                </Text>
                <Paper p="md" style={{ backgroundColor: THEMED_LIGHT_BG, border: '1px solid #F0F0F0' }}>
                  <Text size="sm" c={CHARCOAL}>
                    {selectedCase.shortDescription}
                  </Text>
                </Paper>
              </Box>

              <Box>
                <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={8}>
                  Detailed Description
                </Text>
                <Paper p="md" style={{ backgroundColor: THEMED_LIGHT_BG, border: '1px solid #F0F0F0' }}>
                  <Text size="sm" c={CHARCOAL}>
                    {selectedCase.detailedDescription}
                  </Text>
                </Paper>
              </Box>

              <Divider color="#F0F0F0" />

              <Box>
                <Group gap="xs" mb={8}>
                  <Box
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '8px',
                      background: PRIMARY_GOLD,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <IconUser size={16} color="white" />
                  </Box>
                  <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600}>
                    Assign Attorney
                  </Text>
                </Group>
                <Select
                  placeholder="Select an attorney..."
                  value={selectedAttorney}
                  onChange={setSelectedAttorney}
                  data={attorneys.map((attorney) => ({
                    value: attorney._id,
                    label: `${attorney.firstName} ${attorney.lastName}`,
                  }))}
                  size="md"
                  styles={{
                    input: {
                      borderColor: '#E0E0E0',
                      '&:focus': {
                        borderColor: PRIMARY_BROWN,
                      },
                    },
                  }}
                />
              </Box>

              <Button
                fullWidth
                size="md"
                onClick={assignAttorneyToCase}
                loading={assigning}
                disabled={assigning}
                style={{
                  backgroundColor: PRIMARY_BROWN,
                }}
              >
                {assigning ? 'Assigning...' : 'Assign Attorney'}
              </Button>
            </Stack>
        )}
      </Modal>
    </Box>
  );
}