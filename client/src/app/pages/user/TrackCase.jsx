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
  Card,
  Loader,
  Center,
  ActionIcon,
  Grid,
  Divider,
  Timeline,
  Avatar,
  Button,
  SimpleGrid
} from '@mantine/core';
import {
  IconArrowLeft,
  IconChevronRight,
  IconCalendar,
  IconClock,
  IconUser,
  IconFolderOpen,
  IconCheck
} from '@tabler/icons-react';
import { PRIMARY_GOLD, PRIMARY_BROWN, MUTED_OLIVE, THEMED_LIGHT_BG, CHARCOAL } from '@utils/constants';
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
        return '#5A8F5A';
      case 'rejected':
        return '#D64545';
      default:
        return MUTED_OLIVE;
    }
  };

  const renderCaseList = () => (
    <Stack spacing="lg">
      <SimpleGrid cols={1} spacing="md" breakpoints={[{ minWidth: 768, cols: 2 }]}>
        {cases.map((caseItem) => {
          const currentStepIndex = getCurrentStatusIndex(caseItem.status);
          const statusStep = CASE_STATUS_STEPS[currentStepIndex];
          
          return (
            <Card
              key={caseItem.id}
              shadow="sm"
              padding="lg"
              radius="md"
              withBorder
              style={{ 
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                backgroundColor: 'white',
                borderColor: '#E8E4DC'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '';
              }}
              onClick={() => setSelectedCase(caseItem)}
            >
              <Stack spacing="sm">
                <Group position="apart" align="flex-start">
                  <Box style={{ flex: 1 }}>
                    <Text weight={600} size="lg" style={{ color: PRIMARY_BROWN }}>
                      {caseItem.title}
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

                <Text size="sm" weight={500} style={{ color: MUTED_OLIVE }}>
                  {getCaseTypeLabel(caseItem.type)}
                </Text>

                <Text size="sm" color="dimmed" lineClamp={2}>
                  {caseItem.shortDescription}
                </Text>

                <Group position="apart" mt="xs">
                  <Group spacing="xs">
                    <IconCalendar size={16} color={MUTED_OLIVE} />
                    <Text size="xs" color="dimmed">
                      Filed: {formatDate(caseItem.createdAt)}
                    </Text>
                  </Group>
                  <IconChevronRight size={20} color={MUTED_OLIVE} />
                </Group>
              </Stack>
            </Card>
          );
        })}
      </SimpleGrid>
    </Stack>
  );

  const renderCaseDetails = () => {
    if (!selectedCase) return null;
    
    const currentStepIndex = getCurrentStatusIndex(selectedCase.status);
    
    return (
      <Stack spacing="lg">
        <Button
          variant="subtle"
          leftIcon={<IconArrowLeft size={20} />}
          onClick={() => setSelectedCase(null)}
          style={{ 
            color: PRIMARY_BROWN,
            width: 'fit-content'
          }}
        >
          Back to Cases
        </Button>

        <Paper p="xl" radius="md" withBorder style={{ backgroundColor: 'white', borderColor: '#E8E4DC' }}>
          <Stack spacing="md">
            <Group position="apart" align="flex-start">
              <Box style={{ flex: 1 }}>
                <Title order={2} style={{ color: PRIMARY_BROWN }}>
                  {selectedCase.title}
                </Title>
                {selectedCase.caseNumber && (
                  <Text size="sm" color="dimmed" mt={4}>
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

            <Text weight={500} style={{ color: MUTED_OLIVE }}>
              {getCaseTypeLabel(selectedCase.type)}
            </Text>

            <Text size="sm" color="dimmed">
              {selectedCase.shortDescription}
            </Text>

            {selectedCase.detailedDescription && (
              <Box mt="md">
                <Text weight={600} size="sm" mb="xs" style={{ color: PRIMARY_BROWN }}>
                  Full Description:
                </Text>
                <Paper p="md" style={{ backgroundColor: THEMED_LIGHT_BG }}>
                  <Text size="sm" style={{ color: CHARCOAL }}>
                    {selectedCase.detailedDescription}
                  </Text>
                </Paper>
              </Box>
            )}

            <Divider my="sm" />

            <Grid gutter="md">
              <Grid.Col span={6}>
                <Group spacing="xs">
                  <IconCalendar size={18} color={MUTED_OLIVE} />
                  <Box>
                    <Text size="xs" color="dimmed">Filed</Text>
                    <Text size="sm" weight={500}>{formatDate(selectedCase.createdAt)}</Text>
                  </Box>
                </Group>
              </Grid.Col>
              <Grid.Col span={6}>
                <Group spacing="xs">
                  <IconClock size={18} color={MUTED_OLIVE} />
                  <Box>
                    <Text size="xs" color="dimmed">Last Updated</Text>
                    <Text size="sm" weight={500}>{formatDate(selectedCase.lastUpdated)}</Text>
                  </Box>
                </Group>
              </Grid.Col>
            </Grid>

            {selectedCase.assignedAttorney && (
              <Paper 
                p="md" 
                mt="md" 
                style={{ 
                  backgroundColor: THEMED_LIGHT_BG,
                  borderLeft: `4px solid ${PRIMARY_GOLD}`
                }}
              >
                <Group spacing="md">
                  <Avatar size="lg" radius="xl" color={PRIMARY_BROWN}>
                    <IconUser size={24} />
                  </Avatar>
                  <Box>
                    <Text weight={600} style={{ color: PRIMARY_BROWN }}>
                      {selectedCase.assignedAttorney.name}
                    </Text>
                    <Text size="sm" color="dimmed">
                      {selectedCase.assignedAttorney.specialization}
                    </Text>
                  </Box>
                </Group>
              </Paper>
            )}
          </Stack>
        </Paper>

        <Paper p="xl" radius="md" withBorder style={{ backgroundColor: 'white', borderColor: '#E8E4DC' }}>
          <Title order={3} mb="xl" style={{ color: PRIMARY_BROWN }}>
            Case Progress
          </Title>

          <Timeline 
            active={currentStepIndex} 
            bulletSize={32}
            lineWidth={3}
            color={PRIMARY_GOLD}
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
                      weight={isCurrent ? 700 : 500}
                      style={{ 
                        color: isCurrent ? PRIMARY_BROWN : isUpcoming ? MUTED_OLIVE : PRIMARY_BROWN
                      }}
                    >
                      {step.label}
                    </Text>
                  }
                >
                  <Text size="sm" color="dimmed" mt={4}>
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
    <Box style={{ minHeight: '100vh', backgroundColor: '#F9F6F1', padding: '2rem' }}>
      <Container size="lg">
        <Paper p="xl" radius="lg" shadow="sm" style={{ backgroundColor: 'white', marginBottom: '2rem' }}>
          <Group position="apart" align="center">
            <Group spacing="md">
              <ActionIcon
                size="lg"
                variant="subtle"
                onClick={() => navigate(-1)}
                style={{ color: PRIMARY_BROWN }}
              >
                <IconArrowLeft size={24} />
              </ActionIcon>
              <Title order={1} style={{ color: PRIMARY_BROWN }}>
                {selectedCase ? 'Case Details' : 'Track Cases'}
              </Title>
            </Group>
          </Group>
        </Paper>

        {isLoading ? (
          <Center style={{ minHeight: '400px' }}>
            <Stack align="center" spacing="md">
              <Loader size="lg" color={PRIMARY_BROWN} />
              <Text color="dimmed">Loading your cases...</Text>
            </Stack>
          </Center>
        ) : cases.length === 0 ? (
          <Center style={{ minHeight: '400px' }}>
            <Stack align="center" spacing="md">
              <IconFolderOpen size={80} color={PRIMARY_GOLD} />
              <Title order={2} style={{ color: PRIMARY_BROWN }}>
                No Cases Found
              </Title>
              <Text color="dimmed" align="center">
                You haven't submitted any cases yet.
              </Text>
            </Stack>
          </Center>
        ) : selectedCase ? (
          renderCaseDetails()
        ) : (
          renderCaseList()
        )}
      </Container>
    </Box>
  );
}