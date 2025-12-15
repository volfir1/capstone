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
  Grid,
  Divider,
  Timeline,
  Avatar,
  Button,
  SimpleGrid
} from '@mantine/core';
import {
  IconArrowLeft,
  IconCalendar,
  IconClock,
  IconUser,
  IconFolderOpen,
  IconCheck,
  IconFileText,
} from '@tabler/icons-react';
import { PRIMARY_GOLD, PRIMARY_BROWN, MUTED_OLIVE, THEMED_LIGHT_BG, CHARCOAL, ACCENT_TAN } from '@utils/constants';
import { CASE_STATUS_STEPS } from '@utils/caseStatusSteps';
import { getCaseTypeLabel } from '@utils/caseTypes';
import apiClient from '@config/api/apiClient';

export default function TrackCasePage() {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/cases/user-cases');
      
      if (response.data.success) {
        const transformedCases = response.data.data.map(caseItem => ({
          id: caseItem._id,
          title: caseItem.caseTitle,
          type: caseItem.caseType,
          status: caseItem.attorneyId ? 'attorney_assigned' : 'pending',
          shortDescription: caseItem.shortDescription,
          createdAt: caseItem.createdAt,
          assignedAttorney: caseItem.attorneyId ? {
            name: `Atty. ${caseItem.attorneyId.firstName} ${caseItem.attorneyId.lastName}`,
            specialization: caseItem.attorneyId.specializations?.[0] || 'General Law',
          } : null,
          lastUpdated: caseItem.updatedAt || caseItem.createdAt,
          caseNumber: caseItem.caseNumber,
          detailedDescription: caseItem.detailedDescription,
        }));
        
        setCases(transformedCases);
      }
    } catch (error) {
      console.error('Error loading cases:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentStatusIndex = (status) => {
    return CASE_STATUS_STEPS.findIndex(step => step.id === status);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
      case 'in_review':
        return PRIMARY_GOLD;
      case 'attorney_assigned':
      case 'in_progress':
        return PRIMARY_BROWN;
      case 'completed':
        return MUTED_OLIVE;
      case 'rejected':
        return '#E74C3C';
      default:
        return ACCENT_TAN;
    }
  };

  const renderCaseList = () => (
    <Stack gap="lg">
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
        {cases.map((caseItem) => {
          const currentStepIndex = getCurrentStatusIndex(caseItem.status);
          const statusStep = CASE_STATUS_STEPS[currentStepIndex];
          
          return (
            <Paper
              key={caseItem.id}
              shadow="xs"
              p="lg"
              radius="lg"
              style={{ 
                cursor: 'pointer',
                backgroundColor: 'white',
                border: '1px solid #F0F0F0',
              }}
              onClick={() => setSelectedCase(caseItem)}
            >
              <Stack gap="md">
                <Group justify="space-between" align="flex-start">
                  <Box style={{ flex: 1 }}>
                    <Text fw={600} size="md" c={PRIMARY_BROWN} mb={4}>
                      {caseItem.title}
                    </Text>
                    <Text size="sm" c={MUTED_OLIVE}>
                      {getCaseTypeLabel(caseItem.type)}
                    </Text>
                  </Box>
                  <Badge
                    size="sm"
                    radius="sm"
                    style={{ 
                      backgroundColor: getStatusColor(caseItem.status),
                      color: 'white'
                    }}
                  >
                    {statusStep?.label}
                  </Badge>
                </Group>
                
                <Text size="sm" c="dimmed" lineClamp={2}>
                  {caseItem.shortDescription}
                </Text>
                
                <Divider color="#F0F0F0" />
                
                <Group gap="xs">
                  <IconCalendar size={16} color={MUTED_OLIVE} />
                  <Text size="xs" c="dimmed">
                    Filed: {formatDate(caseItem.createdAt)}
                  </Text>
                </Group>
              </Stack>
            </Paper>
          );
        })}
      </SimpleGrid>
    </Stack>
  );

  const renderCaseDetails = () => {
    if (!selectedCase) return null;
    
    const currentStepIndex = getCurrentStatusIndex(selectedCase.status);
    
    return (
      <Stack gap="lg">
        <Button
          variant="subtle"
          leftSection={<IconArrowLeft size={20} />}
          onClick={() => setSelectedCase(null)}
          c={PRIMARY_BROWN}
          style={{ width: 'fit-content' }}
        >
          Back to Cases
        </Button>

        {/* Case Info Card */}
        <Paper shadow="xs" p="xl" radius="lg" bg="white">
          <Stack gap="lg">
            <Group justify="space-between" align="flex-start">
              <Box style={{ flex: 1 }}>
                <Title order={2} c={PRIMARY_BROWN} mb={8}>
                  {selectedCase.title}
                </Title>
                {selectedCase.caseNumber && (
                  <Text size="sm" c="dimmed">
                    Case #{selectedCase.caseNumber}
                  </Text>
                )}
              </Box>
              <Badge
                size="lg"
                radius="sm"
                style={{ 
                  backgroundColor: getStatusColor(selectedCase.status),
                  color: 'white'
                }}
              >
                {CASE_STATUS_STEPS[currentStepIndex]?.label}
              </Badge>
            </Group>

            <Box>
              <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>
                Case Type
              </Text>
              <Text fw={500} c={CHARCOAL}>
                {getCaseTypeLabel(selectedCase.type)}
              </Text>
            </Box>

            <Divider color="#F0F0F0" />

            <Box>
              <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={8}>
                Short Description
              </Text>
              <Text size="sm" c={CHARCOAL}>
                {selectedCase.shortDescription}
              </Text>
            </Box>

            {selectedCase.detailedDescription && (
              <>
                <Divider color="#F0F0F0" />
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
              </>
            )}

            <Divider color="#F0F0F0" />

            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
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
                    <IconCalendar size={16} color="white" />
                  </Box>
                  <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600}>
                    Filed
                  </Text>
                </Group>
                <Text fw={500} c={CHARCOAL} ml={40}>
                  {formatDate(selectedCase.createdAt)}
                </Text>
              </Box>

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
                    <IconClock size={16} color="white" />
                  </Box>
                  <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600}>
                    Last Updated
                  </Text>
                </Group>
                <Text fw={500} c={CHARCOAL} ml={40}>
                  {formatDate(selectedCase.lastUpdated)}
                </Text>
              </Box>
            </SimpleGrid>

            {selectedCase.assignedAttorney && (
              <>
                <Divider color="#F0F0F0" />
                <Paper 
                  p="md" 
                  style={{ 
                    backgroundColor: `${PRIMARY_GOLD}10`,
                    border: `1px solid ${PRIMARY_GOLD}`
                  }}
                >
                  <Group gap="md">
                    <Avatar size={48} radius="md" color={PRIMARY_BROWN}>
                      <IconUser size={24} />
                    </Avatar>
                    <Box>
                      <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600}>
                        Assigned Attorney
                      </Text>
                      <Text fw={600} c={PRIMARY_BROWN}>
                        {selectedCase.assignedAttorney.name}
                      </Text>
                      <Text size="sm" c={MUTED_OLIVE}>
                        {selectedCase.assignedAttorney.specialization}
                      </Text>
                    </Box>
                  </Group>
                </Paper>
              </>
            )}
          </Stack>
        </Paper>

        {/* Progress Timeline */}
        <Paper shadow="xs" p="xl" radius="lg" bg="white">
          <Title order={3} mb="xl" c={PRIMARY_BROWN}>
            Case Progress
          </Title>
          <Timeline 
            active={currentStepIndex} 
            bulletSize={32}
            lineWidth={2}
            color={PRIMARY_BROWN}
          >
            {CASE_STATUS_STEPS.map((step, index) => {
              const isCompleted = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const isUpcoming = index > currentStepIndex;
              
              return (
                <Timeline.Item
                  key={step.id}
                  bullet={isCompleted ? <IconCheck size={16} /> : null}
                  title={
                    <Text 
                      fw={isCurrent ? 700 : 500}
                      c={isCurrent ? PRIMARY_BROWN : isUpcoming ? MUTED_OLIVE : PRIMARY_BROWN}
                    >
                      {step.label}
                    </Text>
                  }
                >
                  <Text size="sm" c="dimmed" mt={4}>
                    {step.description}
                  </Text>
                </Timeline.Item>
              );
            })}
          </Timeline>
        </Paper>
      </Stack>
    );
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
              <IconFileText size={24} color={PRIMARY_BROWN} stroke={2.5} />
            </Box>
            <Box>
              <Title order={2} c="white" mb={4}>
                {selectedCase ? 'Case Details' : 'Track Cases'}
              </Title>
              <Text c="rgba(255, 255, 255, 0.9)" size="sm" fw={500}>
                {selectedCase ? 'View your case information and progress' : 'Monitor the status of your submitted cases'}
              </Text>
            </Box>
          </Group>
        </Paper>

        {/* Content */}
        {isLoading ? (
          <Center style={{ minHeight: '400px' }}>
            <Stack align="center" gap="md">
              <Loader size="lg" color={PRIMARY_BROWN} />
              <Text c="dimmed">Loading your cases...</Text>
            </Stack>
          </Center>
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
                  <IconFolderOpen size={40} color={PRIMARY_GOLD} />
                </Box>
                <Title order={2} c={PRIMARY_BROWN}>
                  No Cases Found
                </Title>
                <Text c="dimmed" ta="center">
                  You haven't submitted any cases yet.
                </Text>
                <Button
                  mt="md"
                  color={PRIMARY_BROWN}
                  onClick={() => navigate('/submitcase')}
                  style={{ backgroundColor: PRIMARY_BROWN }}
                >
                  Submit Your First Case
                </Button>
              </Stack>
            </Center>
          </Paper>
        ) : selectedCase ? (
          renderCaseDetails()
        ) : (
          renderCaseList()
        )}
      </Container>
    </Box>
  );
}