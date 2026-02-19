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
  SimpleGrid,
  Modal,
  Card,
  ScrollArea
} from '@mantine/core';
import {
  IconArrowLeft,
  IconCalendar,
  IconClock,
  IconUser,
  IconFolderOpen,
  IconCheck,
  IconFileText,
  IconFolder,
  IconCalendarEvent,
} from '@tabler/icons-react';
import { PRIMARY_GOLD, PRIMARY_BROWN, MUTED_OLIVE, THEMED_LIGHT_BG, CHARCOAL, ACCENT_TAN } from '@utils/constants';
import { CASE_STATUS_STEPS } from '@utils/caseStatusSteps';
import { getCaseTypeLabel } from '@utils/caseTypes';
import apiClient from '@config/api/apiClient';
import { useAuth } from '@context/authContext';
import { CaseInformationSection } from '../other/CaseInformationSection';

export default function TrackCasePage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [caseRecordModalOpen, setCaseRecordModalOpen] = useState(false);
  const [selectedCaseRecord, setSelectedCaseRecord] = useState(null);
  const [isLoadingCaseRecord, setIsLoadingCaseRecord] = useState(false);

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    setIsLoading(true);
    try {
      // Fetch accepted finalized cases (court-case status) for the current user
      const response = await apiClient.get('/finalize');
      
      if (response.data.success) {
        // Filter for court-case status and current user
        const userAcceptedCases = response.data.data.filter(item => 
          (item.status === 'court-case' || item.decision === 'accepted') &&
          item.userId === currentUser?.uid
        );
        
        // Fetch case records for each case to get title and nature
        const casesWithRecords = await Promise.all(
          userAcceptedCases.map(async (caseItem) => {
            try {
              const recordResponse = await apiClient.get(`/caserecords/finalize/${caseItem._id}`);
              if (recordResponse.data.success && recordResponse.data.data) {
                return {
                  ...caseItem,
                  caseRecord: recordResponse.data.data
                };
              }
            } catch (error) {
              console.error(`Error loading case record for ${caseItem._id}:`, error);
            }
            return caseItem;
          })
        );
        
        setCases(casesWithRecords);
      }
    } catch (error) {
      console.error('Error loading cases:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewCaseFolder = async (finalizeId) => {
    setIsLoadingCaseRecord(true);
    setCaseRecordModalOpen(true);
    
    try {
      const response = await apiClient.get(`/caserecords/finalize/${finalizeId}`);
      
      if (response.data.success && response.data.data) {
        setSelectedCaseRecord(response.data.data);
      } else {
        setSelectedCaseRecord(null);
      }
    } catch (error) {
      console.error('Error loading case record:', error);
      setSelectedCaseRecord(null);
    } finally {
      setIsLoadingCaseRecord(false);
    }
  };

  const closeCaseRecordModal = () => {
    setCaseRecordModalOpen(false);
    setSelectedCaseRecord(null);
  };

  const getCurrentStatusIndex = (status) => {
    return CASE_STATUS_STEPS.findIndex(step => step.id === status);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
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

  // Case Card Component (similar to AdviceCard from TrackAppointment)
  const CaseCard = ({ item }) => (
    <Card 
      shadow="xs" 
      padding="xl" 
      radius="lg"
      style={{ 
        border: '1px solid #F0F0F0',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      <Box
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '4px',
          background: `linear-gradient(90deg, ${PRIMARY_GOLD} 0%, ${PRIMARY_BROWN} 100%)`,
        }}
      />
      
      <Group justify="space-between" mb="md">
        <Box style={{ flex: 1 }}>
          <Text fw={700} size="lg" c={CHARCOAL} mb={4}>
            {item.caseRecord?.title || `Appointment for ${item.topic || 'Case'}`}
          </Text>
          <Group gap="xs">
            <IconCalendarEvent size={14} color={MUTED_OLIVE} />
            <Text size="xs" c={MUTED_OLIVE}>
              Accepted: {formatDate(item.updatedAt || item.createdAt)}
            </Text>
          </Group>
        </Box>
        <Badge 
          size="lg"
          radius="md"
          variant="filled"
          style={{ 
            backgroundColor: PRIMARY_BROWN,
            padding: '8px 12px',
          }}
        >
          Accepted
        </Badge>
      </Group>

      <Text size="sm" c={CHARCOAL} mb="lg" style={{ lineHeight: 1.6 }}>
        {item.description || item.shortDescription || 'No description available'}
      </Text>

      {/* Case Details Paper */}
      <Paper 
        p="lg" 
        radius="md" 
        mb="lg"
        style={{ 
          background: `linear-gradient(135deg, ${THEMED_LIGHT_BG} 0%, white 100%)`,
          border: `2px solid ${PRIMARY_GOLD}30`,
        }}
      >
        <Stack gap="sm">
          <Group gap="sm" wrap="nowrap">
            <Box
              style={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                background: `linear-gradient(135deg, ${PRIMARY_GOLD} 0%, ${PRIMARY_BROWN} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <IconFileText size={18} color="white" />
            </Box>
            <Box style={{ flex: 1 }}>
              <Text size="xs" c={MUTED_OLIVE} mb={2}>Nature of the Case</Text>
              <Text fw={600} c={PRIMARY_BROWN} size="sm">
                {item.caseRecord?.nature || 'N/A'}
              </Text>
            </Box>
          </Group>
        </Stack>
      </Paper>

      {/* View Case Folder Button */}
      <Stack gap="sm">
        <Button
          fullWidth
          size="md"
          leftSection={<IconFolder size={18} />}
          onClick={() => handleViewCaseFolder(item._id)}
          style={{
            backgroundColor: 'white',
            borderColor: PRIMARY_BROWN,
            color: PRIMARY_BROWN,
            fontWeight: 600,
          }}
          variant="outline"
        >
          View Case Folder
        </Button>
      </Stack>
    </Card>
  );

  const renderCaseList = () => (
    <Stack gap="lg">
      <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="lg">
        {cases.map((caseItem) => (
          <CaseCard key={caseItem._id} item={caseItem} />
        ))}
      </SimpleGrid>
    </Stack>
  );

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
                Track Cases
              </Title>
              <Text c="rgba(255, 255, 255, 0.9)" size="sm" fw={500}>
                Monitor your accepted cases and view case folders
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
                  No Accepted Cases Yet
                </Title>
                <Text c="dimmed" ta="center">
                  Your accepted cases for court representation will appear here.
                </Text>
              </Stack>
            </Center>
          </Paper>
        ) : (
          renderCaseList()
        )}
      </Container>

      {/* Case Record Modal */}
      <Modal
        opened={caseRecordModalOpen}
        onClose={closeCaseRecordModal}
        title={
          <Text size="xl" fw={700} c={PRIMARY_BROWN}>
            Case Folder
          </Text>
        }
        size="calc(90vw)"
        centered
        styles={{
          body: {
            maxHeight: '80vh',
            overflow: 'auto',
          },
        }}
      >
        {isLoadingCaseRecord ? (
          <Center style={{ minHeight: '300px' }}>
            <Stack align="center" gap="md">
              <Loader size="lg" color={PRIMARY_BROWN} />
              <Text c="dimmed">Loading case record...</Text>
            </Stack>
          </Center>
        ) : selectedCaseRecord ? (
          <ScrollArea style={{ height: '70vh' }}>
            <CaseInformationSection 
              value={selectedCaseRecord} 
              readOnly={true}
            />
          </ScrollArea>
        ) : (
          <Center style={{ minHeight: '300px' }}>
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
                <IconFolderOpen size={40} color={MUTED_OLIVE} />
              </Box>
              <Title order={3} c={PRIMARY_BROWN}>
                No Case Record Available
              </Title>
              <Text c="dimmed" ta="center">
                The case record for this case has not been created yet.
              </Text>
            </Stack>
          </Center>
        )}
      </Modal>
    </Box>
  );
}