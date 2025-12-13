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
  ActionIcon,
  Loader,
  Center,
  Button,
  Modal,
  Select,
  Card,
  Divider,
  ScrollArea,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconArrowLeft,
  IconFileText,
  IconCheck,
  IconX,
} from '@tabler/icons-react';
import { PRIMARY_GOLD, PRIMARY_BROWN, MUTED_OLIVE, THEMED_LIGHT_BG, CHARCOAL } from '@utils/constants';
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

  // Update selectedCase when cases list changes (after assignment)
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
    <Box>
      <Container size="xl" py="xl">
        {/* Header */}
        <Paper p="lg" radius="md" mb="xl" style={{ backgroundColor: 'white' }}>
          <Group>
            <ActionIcon
              size="lg"
              variant="subtle"
              onClick={() => navigate(-1)}
              style={{ color: CHARCOAL }}
            >
              <IconArrowLeft size={24} />
            </ActionIcon>
            <Title order={1} style={{ color: CHARCOAL }}>
              Assign Cases
            </Title>
          </Group>
        </Paper>

        {/* Content */}
        {loading ? (
          <Center py="xl">
            <Stack align="center" spacing="md">
              <Loader size="lg" color={PRIMARY_BROWN} />
              <Text color="dimmed">Loading cases...</Text>
            </Stack>
          </Center>
        ) : cases.length === 0 ? (
          <Center py="xl">
            <Stack align="center" spacing="md">
              <IconFileText size={64} color="#ccc" />
              <Text size="lg" color="dimmed">
                No cases available
              </Text>
            </Stack>
          </Center>
        ) : (
          <Stack spacing="md">
            {cases.map((caseItem) => (
              <Card
                key={caseItem._id}
                shadow="sm"
                padding="lg"
                radius="md"
                withBorder
                style={{
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease',
                  borderColor: '#E8E4DC',
                }}
                onClick={() => handleCasePress(caseItem)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                <Stack spacing="xs">
                  <Group position="apart" align="flex-start">
                    <Box>
                      <Badge
                        size="sm"
                        variant="light"
                        color={PRIMARY_BROWN}
                        mb="xs"
                      >
                        {caseItem.caseNumber}
                      </Badge>
                      <Text size="lg" weight={700} style={{ color: CHARCOAL }}>
                        {caseItem.caseTitle}
                      </Text>
                      <Text size="sm" color="dimmed" mt={4}>
                        {caseItem.caseType}
                      </Text>
                    </Box>
                    {caseItem.attorneyId ? (
                      <Badge color="green" variant="filled">
                        Assigned
                      </Badge>
                    ) : (
                      <Badge color="orange" variant="filled">
                        Unassigned
                      </Badge>
                    )}
                  </Group>
                  {caseItem.attorneyId && (
                    <Text size="xs" style={{ color: PRIMARY_BROWN, fontStyle: 'italic' }} mt="xs">
                      Assigned to: {caseItem.attorneyId.firstName} {caseItem.attorneyId.lastName}
                    </Text>
                  )}
                </Stack>
              </Card>
            ))}
          </Stack>
        )}
      </Container>

      {/* Case Detail Modal */}
      <Modal
        opened={selectedCase !== null}
        onClose={handleCloseModal}
        title={
          <Text size="xl" weight={700} style={{ color: PRIMARY_BROWN }}>
            Case Details
          </Text>
        }
        size="lg"
        centered
      >
        {selectedCase && (
          <ScrollArea style={{ maxHeight: '70vh' }}>
            <Stack spacing="md">
              <Box>
                <Text size="xs" weight={600} color="dimmed" tt="uppercase" mb={4}>
                  Case Number
                </Text>
                <Text size="md" style={{ color: CHARCOAL }}>
                  {selectedCase.caseNumber}
                </Text>
              </Box>

              <Divider />

              <Box>
                <Text size="xs" weight={600} color="dimmed" tt="uppercase" mb={4}>
                  Title
                </Text>
                <Text size="md" style={{ color: CHARCOAL }}>
                  {selectedCase.caseTitle}
                </Text>
              </Box>

              <Box>
                <Text size="xs" weight={600} color="dimmed" tt="uppercase" mb={4}>
                  Type
                </Text>
                <Text size="md" style={{ color: CHARCOAL }}>
                  {selectedCase.caseType}
                </Text>
              </Box>

              <Box>
                <Text size="xs" weight={600} color="dimmed" tt="uppercase" mb={4}>
                  Short Description
                </Text>
                <Text size="md" style={{ color: CHARCOAL }}>
                  {selectedCase.shortDescription}
                </Text>
              </Box>

              <Box>
                <Text size="xs" weight={600} color="dimmed" tt="uppercase" mb={4}>
                  Detailed Description
                </Text>
                <Text size="md" style={{ color: CHARCOAL }}>
                  {selectedCase.detailedDescription}
                </Text>
              </Box>

              <Divider />

              <Box>
                <Text size="xs" weight={600} color="dimmed" tt="uppercase" mb={8}>
                  Assign Attorney
                </Text>
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
                    input: { backgroundColor: THEMED_LIGHT_BG },
                  }}
                />
              </Box>

              <Button
                fullWidth
                size="md"
                onClick={assignAttorneyToCase}
                loading={assigning}
                disabled={assigning}
                style={{ backgroundColor: PRIMARY_BROWN }}
                styles={{
                  root: {
                    '&:hover': {
                      backgroundColor: '#6B4423',
                    },
                  },
                }}
              >
                {assigning ? 'Assigning...' : 'Assign Attorney'}
              </Button>
            </Stack>
          </ScrollArea>
        )}
      </Modal>
    </Box>
  );
}