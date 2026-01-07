import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Tabs, 
  Card, 
  Text, 
  Badge, 
  Group, 
  Button, 
  ThemeIcon, 
  SimpleGrid, 
  Container, 
  Title,
  Paper,
  Timeline,
  Divider,
  Box,
  Stack,
  ActionIcon,
  Modal,
  Loader,
  Center,
  Alert,
  Grid,
  Stepper,
  Textarea,
  Table,
  TextInput,
} from '@mantine/core';
import { 
  IconGavel, 
  IconMessage2, 
  IconFileDescription, 
  IconClock, 
  IconCheck, 
  IconMapPin,
  IconScale,
  IconCalendarEvent,
  IconUser,
  IconEye,
  IconDownload,
  IconAlertCircle,
  IconCheckbox,
  IconArrowRight,
  IconX,
  IconFileText,
  IconChevronLeft,
  IconChevronRight,
  IconCircleCheck,
} from '@tabler/icons-react';
import { useAuth } from '@/context/authContext';
import { CaseInformationSection } from '@/app/pages/other/CaseInformationSection';

// Importing your colors
import { 
  PRIMARY_GOLD, 
  PRIMARY_BROWN, 
  MUTED_OLIVE, 
  THEMED_LIGHT_BG, 
  CHARCOAL, 
  ACCENT_TAN 
} from '@utils/constants';

export default function AppointmentTracker() {
  const navigate = useNavigate();
  const { currentUser, userData, loading: authLoading } = useAuth();
  const [forAppointmentData, setForAppointmentData] = useState([])
  const [legalAdviceData, setLegalAdviceData] = useState([])
  const [representationData, setRepresentationData] = useState([])
  const [rejectedData, setRejectedData] = useState([])
  const [loadingAppointments, setLoadingAppointments] = useState(false)
  
  // Case Record Modal states
  const [caseRecordModalOpened, setCaseRecordModalOpened] = useState(false)
  const [caseRecordData, setCaseRecordData] = useState({})
  const [loadingCaseRecord, setLoadingCaseRecord] = useState(false)
  const [caseRecordError, setCaseRecordError] = useState(null)
  
  // Appointment Details Modal states
  const [appointmentModalOpened, setAppointmentModalOpened] = useState(false)
  const [appointmentDetails, setAppointmentDetails] = useState(null)
  const [loadingAppointment, setLoadingAppointment] = useState(false)
  
  // Review Modal states
  const [reviewModalOpened, setReviewModalOpened] = useState(false)
  const [reviewData, setReviewData] = useState(null)
  const [loadingReview, setLoadingReview] = useState(false)
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    // Wait for auth to load and user to be available
    if (authLoading || !currentUser) {
      return;
    }

    let mounted = true
    const load = async () => {
      setLoadingAppointments(true)
      try {
        const { default: apiClient } = await import('@config/api/apiClient')
        const resp = await apiClient.get('/clientsinfo')
        const docs = resp?.data || []
        
        console.log('Fetched appointments for current user:', docs.length, 'records');
        console.log('First appointment data:', docs[0]);
        
        const appointmentsList = []
        const legalAdviceList = []
        const courtCasesList = []
        const rejectedList = []
        
        const docsArray = Array.isArray(docs) ? docs : [];
        docsArray.forEach((d, idx) => {
          const appointed = d.appointedDate || d.appointmentDate || d.caseDetails?.appointedDate
          const dateOnly = appointed ? new Date(appointed).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'TBD'
          const timeOnly = d.appointmentTime || d.appointedTime || ''
          
          // Convert 24-hour time to 12-hour format with AM/PM
          let displayTime = timeOnly;
          if (timeOnly && typeof timeOnly === 'string' && timeOnly.match(/^\d{2}:\d{2}$/)) {
            const timeParts = timeOnly.split(':');
            const hours = timeParts[0];
            const minutes = timeParts[1];
            const hour = parseInt(hours, 10);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
            displayTime = `${displayHour}:${minutes} ${ampm}`;
          }
          
          const status = d.status || 'auto-scheduled'
          
          console.log(`Processing appointment ${idx + 1}:`, { 
            id: d._id, 
            status, 
            appointed, 
            timeOnly,
            displayTime,
            fullData: d
          });
          
          // Priority for name: displayName (Google) → fullName (manual) → clientName (appointment form)
          const displayName = userData?.displayName || userData?.fullName || d.fullName || (d.personal && (d.personal.fullName || `${d.personal.firstName || ''} ${d.personal.lastName || ''}`.trim())) || 'Client';
          
          const baseItem = {
            id: d._id || idx,
            type: 'Initial Interview',
            submittedDate: d.createdAt ? new Date(d.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '',
            appointmentDate: dateOnly,
            appointmentTime: displayTime,
            location: d.caseDetails?.location || 'SOLA (Sebastian Office Legal Aid)',
            purpose: d.caseDetails?.purpose || `Appointment for ${displayName}`,
            clientName: displayName,
            submittedBy: displayName,
          }
          
          // Filter by status
          if (status === 'auto-scheduled' || status === 'confirmed') {
            appointmentsList.push({
              ...baseItem,
              status: appointed ? 'Scheduled' : 'Pending'
            })
          } else if (status === 'legal-advice') {
            legalAdviceList.push({
              ...baseItem,
              topic: baseItem.type,
              date: baseItem.submittedDate,
              status: 'Completed',
              description: baseItem.purpose,
              internDraft: false,
              completedDate: baseItem.appointmentDate,
              caseId: d.caseId || d._id
            })
          } else if (status === 'court-case') {
            courtCasesList.push({
              ...baseItem,
              caseTitle: baseItem.purpose || 'Court Case',
              caseNumber: d.caseNumber || 'TBD',
              caseId: d.caseId || d._id,
              stage: 'Pre-Trial',
              nextDate: baseItem.appointmentDate,
              attorney: d.assignedTo || 'TBD',
              isRejected: false
            })
          } else if (status === 'rejected') {
            rejectedList.push({
              ...baseItem,
              status: 'Rejected',
              rejectionReason: d.rejectionReason || 'Case was reviewed and rejected by the director',
              caseId: d.caseId || d._id
            })
            // Also add to court cases list with rejected flag for viewing recommendation
            courtCasesList.push({
              ...baseItem,
              caseTitle: baseItem.purpose || 'Rejected Case',
              caseNumber: d.caseNumber || 'TBD',
              caseId: d.caseId || d._id,
              stage: 'Rejected',
              nextDate: 'N/A',
              attorney: 'N/A',
              isRejected: true,
              rejectionReason: d.rejectionReason || 'Case was reviewed and rejected by the director'
            })
          }
        })
        
        if (mounted) {
          setForAppointmentData(appointmentsList)
          setLegalAdviceData(legalAdviceList)
          setRepresentationData(courtCasesList)
          setRejectedData(rejectedList)
        }
      } catch (err) {
        console.error('Failed to load clientsinfo for appointments', err)
      } finally {
        if (mounted) setLoadingAppointments(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [currentUser, authLoading])

  // Function to fetch case record
  const fetchCaseRecord = async (caseIdString) => {
    setLoadingCaseRecord(true)
    setCaseRecordError(null)
    setCaseRecordData({})
    
    try {
      const { default: apiClient } = await import('@config/api/apiClient')
      console.log('Fetching finalize document for caseId:', caseIdString)
      
      // First, get the finalize document by caseId to get its _id
      const finalizeResponse = await apiClient.get(`/finalize/case/${caseIdString}`)
      console.log('Finalize document response:', finalizeResponse.data)
      
      if (!finalizeResponse.data || !finalizeResponse.data._id) {
        console.log('No finalize document found for this case')
        setCaseRecordError('Case record is still being processed')
        return
      }
      
      const finalizeId = finalizeResponse.data._id
      console.log('Got finalizeId:', finalizeId)
      console.log('Now fetching case record for finalizeId:', finalizeId)
      
      // Now fetch the case record using the finalize document's _id (note: endpoint is /caserecords not /case-records)
      const caseRecordResponse = await apiClient.get(`/caserecords/finalize/${finalizeId}`)
      
      console.log('Case record API full response:', caseRecordResponse)
      console.log('Case record response.data:', caseRecordResponse.data)
      console.log('Is response.data truthy?', !!caseRecordResponse.data)
      console.log('response.data type:', typeof caseRecordResponse.data)
      
      if (caseRecordResponse && caseRecordResponse.data && Object.keys(caseRecordResponse.data).length > 0) {
        console.log('Setting case record data:', caseRecordResponse.data)
        setCaseRecordData(caseRecordResponse.data)
        setCaseRecordError(null)
      } else {
        console.log('No case record data in response, showing processing message')
        setCaseRecordError('Case record is still being processed')
      }
    } catch (error) {
      console.error('Error fetching case record:', error)
      console.error('Error status:', error.response?.status)
      console.error('Error data:', error.response?.data)
      
      // If it's a 404, the case record doesn't exist yet
      if (error.response?.status === 404) {
        setCaseRecordError('Case record is still being processed')
      } else {
        setCaseRecordError('Unable to load case record. Please try again later.')
      }
    } finally {
      setLoadingCaseRecord(false)
    }
  }

  const openCaseRecordModal = async (caseItem) => {
    console.log('Opening case record modal for case:', caseItem)
    setCaseRecordModalOpened(true)
    await fetchCaseRecord(caseItem.caseId)
  }

  // Function to fetch and display appointment details
  const openAppointmentModal = async (appointmentId) => {
    setAppointmentModalOpened(true)
    setLoadingAppointment(true)
    
    try {
      const { default: apiClient } = await import('@config/api/apiClient')
      const response = await apiClient.get(`/clientsinfo/${appointmentId}`)
      console.log('=== APPOINTMENT DETAILS FETCHED ===')
      console.log('Full response.data:', response.data)
      console.log('Keys in response.data:', Object.keys(response.data))
      console.log('age:', response.data.age)
      console.log('birthday:', response.data.birthday)
      console.log('sex:', response.data.sex)
      console.log('civilStatus:', response.data.civilStatus)
      console.log('contactNumber:', response.data.contactNumber)
      console.log('===================================')
      setAppointmentDetails(response.data)
    } catch (error) {
      console.error('Error fetching appointment details:', error)
    } finally {
      setLoadingAppointment(false)
    }
  }

  // Function to fetch and display review data for finalized cases
  const openReviewModal = async (caseId) => {
    try {
      setLoadingReview(true)
      setActiveStep(0)
      
      // First try to fetch by caseId
      let response = await fetch(`/api/finalize/case/${caseId}`)
      
      // If not found, try to fetch all finalized and find by MongoDB _id
      if (!response.ok && response.status === 404) {
        console.log('CaseId not found, searching by MongoDB ID...')
        const allResponse = await fetch('/api/finalize')
        if (allResponse.ok) {
          const allFinalized = await allResponse.json()
          const found = allFinalized.find(f => 
            f._id === caseId || 
            f.caseId === caseId ||
            f.content?.interviewInfo?.clientId === caseId
          )
          if (found) {
            console.log('=== REVIEW DATA FETCHED (by search) ===')
            console.log('Full review:', found)
            setReviewData(found)
            setReviewModalOpened(true)
            setLoadingReview(false)
            return
          }
        }
        throw new Error('No finalized review found for this case')
      }
      
      if (!response.ok) throw new Error('Failed to fetch review data')
      
      const data = await response.json()
      console.log('=== REVIEW DATA FETCHED ===')
      console.log('Full review:', data)
      setReviewData(data)
      setReviewModalOpened(true)
    } catch (error) {
      console.error('Error fetching review data:', error)
      alert('Failed to load review details. This case may not have a finalized review yet.')
    } finally {
      setLoadingReview(false)
    }
  }

  // Keep one dummy example for Legal Advice
  const dummyLegalAdvice = {
    id: 'dummy-1',
    topic: "Example: Land Dispute Inquiry",
    date: "Oct 24, 2025",
    status: "Pending Review",
    description: "This is a sample legal advice request. Your actual requests will appear here.",
    internDraft: true
  };

  // Keep one dummy example for Court Cases
  const dummyCourtCase = {
    id: 'dummy-2',
    caseTitle: "Example: Sample vs. Example",
    caseNumber: "CV-2025-SAMPLE",
    stage: "Example Stage",
    nextDate: "TBD",
    location: "Example Court",
    attorney: "Atty. Example"
  };

  const documentData = [
    {
      id: 1,
      docType: "Affidavit of Loss",
      status: "Ready for Pickup",
      actionNeeded: "Sign Physically",
      dateRequest: "Oct 28, 2025",
      appointment: {
        date: "Nov 05, 2025",
        time: "10:00 AM",
        handler: "Intern Marco Santos",
        role: "Legal Intern",
        location: "SOLA (Sebastian Office Legal Aid)"
      }
    },
    {
      id: 2,
      docType: "Deed of Sale",
      status: "In Progress",
      actionNeeded: "Drafting",
      dateRequest: "Nov 02, 2025",
      estimatedCompletion: "Nov 15, 2025"
    },
    {
      id: 3,
      docType: "Special Power of Attorney",
      status: "Ready for Pickup",
      actionNeeded: "Sign Physically",
      dateRequest: "Oct 15, 2025",
      appointment: {
        date: "Nov 06, 2025",
        time: "1:30 PM",
        handler: "Admin Staff - Lisa Chen",
        role: "Administrative Officer",
        location: "SOLA (Sebastian Office Legal Aid)"
      }
    }
  ];

  // --- REUSABLE CARD COMPONENTS ---

  const ForAppointmentCard = ({ item }) => (
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
      {/* Status indicator dot */}
      {item.status === "Scheduled" && (
        <Box
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: '#10B981',
            boxShadow: '0 0 0 3px #10B98130',
          }}
        />
      )}

      <Box
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '4px',
          background: 
            item.status === "Scheduled" ? `linear-gradient(90deg, ${PRIMARY_GOLD} 0%, ${PRIMARY_BROWN} 100%)` :
            item.status === "Rescheduled" ? `linear-gradient(90deg, ${ACCENT_TAN} 0%, ${PRIMARY_GOLD} 100%)` :
            item.status === "Canceled" ? `linear-gradient(90deg, #E74C3C 0%, #C0392B 100%)` :
            `linear-gradient(90deg, ${MUTED_OLIVE} 0%, #6B8E4E 100%)`,
        }}
      />

      <Group justify="space-between" mb="md" align="flex-start">
        <Box style={{ flex: 1 }}>
          <Text fw={700} size="lg" c={CHARCOAL} mb={4}>
            {item.type}
          </Text>
          {item.clientName && (
            <Text size="sm" c={MUTED_OLIVE} mb={6}>
              {item.clientName}
            </Text>
          )}
          <Group gap="xs">
            <IconCalendarEvent size={14} color={MUTED_OLIVE} />
            <Text size="xs" c={MUTED_OLIVE}>
              Submitted: {item.submittedDate}
            </Text>
          </Group>
        </Box>
        <Badge 
          size="lg"
          radius="md"
          variant="filled"
          style={{ 
            backgroundColor: 
              item.status === "Scheduled" ? PRIMARY_BROWN :
              item.status === "Rescheduled" ? ACCENT_TAN :
              item.status === "Canceled" ? '#E74C3C' :
              MUTED_OLIVE,
            padding: '8px 12px',
          }}
        >
          {item.status}
        </Badge>
      </Group>

      {item.purpose && (
        <Text size="sm" c={CHARCOAL} mb="lg" style={{ lineHeight: 1.6 }}>
          {item.purpose}
        </Text>
      )}

      {/* Scheduled State */}
      {item.status === "Scheduled" && (
        <Paper 
          p="lg" 
          radius="md" 
          style={{ 
            background: `linear-gradient(135deg, ${THEMED_LIGHT_BG} 0%, white 100%)`,
            border: `2px solid ${PRIMARY_GOLD}30`,
          }}
        >
          <Group gap="xs" mb="md">
            <Box
              style={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                background: `linear-gradient(135deg, ${PRIMARY_GOLD} 0%, ${PRIMARY_BROWN} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconCheckbox size={18} color="white" />
            </Box>
            <Text size="sm" fw={700} c={PRIMARY_BROWN} tt="uppercase" style={{ letterSpacing: '0.5px' }}>
              Appointment Details
            </Text>
          </Group>

          <Stack gap="sm">
            <Group gap="sm" wrap="nowrap">
              <Box
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '6px',
                  background: `${PRIMARY_BROWN}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <IconCalendarEvent size={14} color={PRIMARY_BROWN} />
              </Box>
              <Box>
                <Text size="xs" c={MUTED_OLIVE} mb={2}>Date & Time</Text>
                <Text size="sm" fw={600} c={CHARCOAL}>
                  {item.appointmentDate} at {item.appointmentTime}
                </Text>
              </Box>
            </Group>

            <Group gap="sm" wrap="nowrap">
              <Box
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '6px',
                  background: `${ACCENT_TAN}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <IconMapPin size={14} color={ACCENT_TAN} />
              </Box>
              <Box>
                <Text size="xs" c={MUTED_OLIVE} mb={2}>Location</Text>
                <Text size="sm" fw={500} c={CHARCOAL}>
                  {item.location}
                </Text>
              </Box>
            </Group>
          </Stack>
        </Paper>
      )}

      {/* Rescheduled State */}
      {item.status === "Rescheduled" && (
        <Paper 
          p="lg" 
          radius="md" 
          style={{ 
            background: `linear-gradient(135deg, ${THEMED_LIGHT_BG} 0%, white 100%)`,
            border: `2px solid ${ACCENT_TAN}40`,
          }}
        >
          <Group gap="xs" mb="md">
            <Box
              style={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                background: `${ACCENT_TAN}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconAlertCircle size={18} color="white" />
            </Box>
            <Text size="sm" fw={700} c={ACCENT_TAN} tt="uppercase" style={{ letterSpacing: '0.5px' }}>
              Rescheduled
            </Text>
          </Group>

          <Stack gap="sm">
            <Paper 
              p="xs" 
              radius="md"
              style={{ 
                backgroundColor: '#FEF3E2',
                border: '1px solid #F59E0B30',
              }}
            >
              <Group gap="xs">
                <IconClock size={14} color="#F59E0B" />
                <Text size="xs" c={CHARCOAL}>
                  Original: <Text span fw={600}>{item.originalDate}</Text>
                </Text>
              </Group>
            </Paper>

            <Group gap="sm" wrap="nowrap">
              <Box
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '6px',
                  background: `${PRIMARY_BROWN}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <IconCalendarEvent size={14} color={PRIMARY_BROWN} />
              </Box>
              <Box>
                <Text size="xs" c={MUTED_OLIVE} mb={2}>New Date & Time</Text>
                <Text size="sm" fw={600} c={CHARCOAL}>
                  {item.appointmentDate} at {item.appointmentTime}
                </Text>
              </Box>
            </Group>

            <Group gap="sm" wrap="nowrap">
              <Box
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '6px',
                  background: `${ACCENT_TAN}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <IconMapPin size={14} color={ACCENT_TAN} />
              </Box>
              <Box>
                <Text size="xs" c={MUTED_OLIVE} mb={2}>Location</Text>
                <Text size="sm" fw={500} c={CHARCOAL}>
                  {item.location}
                </Text>
              </Box>
            </Group>
          </Stack>
        </Paper>
      )}

      {/* Canceled State */}
      {item.status === "Canceled" && (
        <Paper 
          p="md" 
          radius="md"
          style={{ 
            backgroundColor: '#FEE2E2',
            border: '1px solid #EF444440',
          }}
        >
          <Group gap="sm" align="flex-start">
            <Box
              style={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                background: '#EF4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <IconAlertCircle size={18} color="white" />
            </Box>
            <Box style={{ flex: 1 }}>
              <Text size="sm" fw={600} c="#B91C1C" mb={4}>
                Appointment Canceled
              </Text>
              {item.originalDate && (
                <Text size="xs" c="#DC2626" mb={4}>
                  Originally scheduled: {item.originalDate}
                </Text>
              )}
              {item.cancelReason && (
                <Text size="xs" c="#991B1B">
                  Reason: {item.cancelReason}
                </Text>
              )}
            </Box>
          </Group>
        </Paper>
      )}

      {/* Pending State */}
      {item.status === "Pending" && (
        <Paper 
          p="md" 
          radius="md"
          style={{ 
            backgroundColor: `${MUTED_OLIVE}15`,
            border: `1px solid ${MUTED_OLIVE}40`,
          }}
        >
          <Group gap="sm">
            <Box
              style={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                background: `${MUTED_OLIVE}30`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconClock size={18} color={MUTED_OLIVE} />
            </Box>
            <Box>
              <Text size="sm" fw={600} c={CHARCOAL}>
                Awaiting Schedule
              </Text>
              <Text size="xs" c={MUTED_OLIVE}>
                Your appointment date will be set soon
              </Text>
            </Box>
          </Group>
        </Paper>
      )}

      {/* View Details Button for all appointments */}
      <Group gap="xs" mt="md">
        <Button
          flex={1}
          size="md"
          variant="light"
          leftSection={<IconEye size={18} />}
          onClick={() => openAppointmentModal(item.id)}
          style={{
            backgroundColor: THEMED_LIGHT_BG,
            color: PRIMARY_BROWN,
            fontWeight: 600,
          }}
        >
          View Full Details
        </Button>
        {item.status === "Rejected" && item.caseId && (
          <Button 
            variant="outline"
            onClick={() => openReviewModal(item.caseId)}
            flex={1}
            size="md"
            leftSection={<IconFileText size={18} />}
            style={{ 
              borderColor: PRIMARY_BROWN,
              color: PRIMARY_BROWN,
              fontWeight: 600,
            }}
          >
            View Review
          </Button>
        )}
      </Group>
    </Card>
  );

  const AdviceCard = ({ item }) => (
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
            {item.topic}
          </Text>
          <Group gap="xs">
            <IconCalendarEvent size={14} color={MUTED_OLIVE} />
            <Text size="xs" c={MUTED_OLIVE}>
              Submitted: {item.date}
            </Text>
          </Group>
        </Box>
        <Badge 
          size="lg"
          radius="md"
          variant="filled"
          style={{ 
            backgroundColor: 
                item.status === "Completed" ? MUTED_OLIVE : 
                item.status === "Scheduled" ? PRIMARY_BROWN : ACCENT_TAN,
            padding: '8px 12px',
          }}
        >
          {item.status}
        </Badge>
      </Group>

      <Text size="sm" c={CHARCOAL} mb="lg" style={{ lineHeight: 1.6 }}>
        {item.description}
      </Text>
      
      {/* Pending State */}
      {item.status === "Pending Review" && (
        <Paper 
          p="md" 
          radius="md" 
          style={{ 
            backgroundColor: `${ACCENT_TAN}15`,
            border: `1px solid ${ACCENT_TAN}40`,
          }}
        >
          <Group gap="sm">
            <Box
              style={{
                width: 36,
                height: 36,
                borderRadius: '8px',
                background: `${ACCENT_TAN}30`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconClock size={18} color={ACCENT_TAN} />
            </Box>
            <Box style={{ flex: 1 }}>
              <Text size="sm" fw={600} c={CHARCOAL}>
                Pending Lawyer Approval
              </Text>
              <Text size="xs" c={MUTED_OLIVE}>
                Drafted by Intern - Awaiting review
              </Text>
            </Box>
          </Group>
        </Paper>
      )}

      {/* Scheduled State with Appointment Details */}
      {item.status === "Scheduled" && item.appointment && (
        <Paper 
          p="lg" 
          radius="md" 
          style={{ 
            background: `linear-gradient(135deg, ${THEMED_LIGHT_BG} 0%, white 100%)`,
            border: `2px solid ${PRIMARY_GOLD}30`,
          }}
        >
          <Group gap="xs" mb="md">
            <Box
              style={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                background: `linear-gradient(135deg, ${PRIMARY_GOLD} 0%, ${PRIMARY_BROWN} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconCheckbox size={18} color="white" />
            </Box>
            <Text size="sm" fw={700} c={PRIMARY_BROWN} tt="uppercase" style={{ letterSpacing: '0.5px' }}>
              Appointment Scheduled
            </Text>
          </Group>

          <Stack gap="sm">
            <Group gap="sm" wrap="nowrap">
              <Box
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '6px',
                  background: `${PRIMARY_BROWN}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <IconCalendarEvent size={14} color={PRIMARY_BROWN} />
              </Box>
              <Box>
                <Text size="xs" c={MUTED_OLIVE} mb={2}>Date & Time</Text>
                <Text size="sm" fw={600} c={CHARCOAL}>
                  {item.appointment.date} at {item.appointment.time}
                </Text>
              </Box>
            </Group>

            <Group gap="sm" wrap="nowrap">
              <Box
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '6px',
                  background: `${PRIMARY_GOLD}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <IconUser size={14} color={PRIMARY_GOLD} />
              </Box>
              <Box>
                <Text size="xs" c={MUTED_OLIVE} mb={2}>Handler</Text>
                <Text size="sm" fw={600} c={CHARCOAL}>
                  {item.appointment.handler}
                </Text>
                <Text size="xs" c={MUTED_OLIVE}>{item.appointment.role}</Text>
              </Box>
            </Group>

            <Group gap="sm" wrap="nowrap">
              <Box
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '6px',
                  background: `${ACCENT_TAN}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <IconMapPin size={14} color={ACCENT_TAN} />
              </Box>
              <Box>
                <Text size="xs" c={MUTED_OLIVE} mb={2}>Location</Text>
                <Text size="sm" fw={500} c={CHARCOAL}>
                  {item.appointment.location}
                </Text>
              </Box>
            </Group>
          </Stack>
        </Paper>
      )}

      {/* Completed State */}
      {item.status === "Completed" && (
        <>
          <Paper 
            p="md" 
            radius="md" 
            mb="md"
            style={{ 
              backgroundColor: `${MUTED_OLIVE}15`,
              border: `1px solid ${MUTED_OLIVE}40`,
            }}
          >
            <Group gap="sm">
              <IconCheck size={20} color={MUTED_OLIVE} />
              <Box>
                <Text size="sm" fw={600} c={CHARCOAL}>
                  Completed on {item.completedDate}
                </Text>
                <Text size="xs" c={MUTED_OLIVE}>
                  Legal opinion is now available
                </Text>
              </Box>
            </Group>
          </Paper>
          <Group gap="xs">
            <Button 
              variant="light" 
              onClick={() => {
                if (item.id) {
                  openAppointmentModal(item.id)
                }
              }}
              flex={1}
              size="md"
              leftSection={<IconEye size={18} />}
              style={{ 
                backgroundColor: THEMED_LIGHT_BG,
                color: PRIMARY_BROWN,
                fontWeight: 600,
              }}
            >
              View Full Details
            </Button>
            {item.caseId && (
              <Button 
                variant="outline"
                onClick={() => openReviewModal(item.caseId)}
                flex={1}
                size="md"
                leftSection={<IconFileText size={18} />}
                style={{ 
                  borderColor: PRIMARY_BROWN,
                  color: PRIMARY_BROWN,
                  fontWeight: 600,
                }}
              >
                View Review
              </Button>
            )}
          </Group>
        </>
      )}
    </Card>
  );

  const RepresentationCard = ({ item }) => (
    <Card 
      shadow="xs" 
      padding="xl" 
      radius="lg"
      style={{ 
        border: '1px solid #F0F0F0',
        borderLeft: `4px solid ${PRIMARY_BROWN}`,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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
      <Group mb="lg" wrap="nowrap">
        <Box
          style={{
            width: 48,
            height: 48,
            borderRadius: '12px',
            background: `linear-gradient(135deg, ${PRIMARY_BROWN} 0%, #8B5A2B 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 4px 12px ${PRIMARY_BROWN}40`,
            flexShrink: 0,
          }}
        >
          <IconScale size={24} color="white" stroke={2.5} />
        </Box>
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Text fw={700} size="lg" c={CHARCOAL} mb={4} lineClamp={1}>
            {item.caseTitle}
          </Text>
          <Badge 
            size="sm" 
            variant="light"
            color={PRIMARY_BROWN}
            style={{ fontFamily: 'monospace' }}
          >
            {item.caseNumber}
          </Badge>
        </Box>
      </Group>

      <Paper 
        p="md" 
        radius="md" 
        mb="md" 
        style={{ 
          background: `linear-gradient(135deg, ${THEMED_LIGHT_BG} 0%, white 100%)`,
          border: `1px solid ${PRIMARY_GOLD}30`,
        }}
      >
        <Group gap="sm" wrap="nowrap">
          <Box
            style={{
              width: 36,
              height: 36,
              borderRadius: '8px',
              background: `${MUTED_OLIVE}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <IconGavel size={18} color={MUTED_OLIVE} />
          </Box>
          <Box style={{ flex: 1 }}>
            <Text size="xs" c={MUTED_OLIVE} mb={2}>Current Stage</Text>
            <Text fw={600} c={PRIMARY_BROWN} size="sm">
              {item.stage}
            </Text>
          </Box>
        </Group>
      </Paper>

      <Stack gap="sm" mb="lg">
        <Group gap="sm" wrap="nowrap">
          <IconCalendarEvent size={16} color={CHARCOAL} style={{ flexShrink: 0 }} />
          <Box>
            <Text size="xs" c={MUTED_OLIVE}>Next Hearing</Text>
            <Text size="sm" fw={600} c={CHARCOAL}>{item.nextDate}</Text>
          </Box>
        </Group>
        <Group gap="sm" wrap="nowrap">
          <IconMapPin size={16} color={CHARCOAL} style={{ flexShrink: 0 }} />
          <Text size="sm" c={CHARCOAL}>{item.location}</Text>
        </Group>
        <Group gap="sm" wrap="nowrap">
          <IconUser size={16} color={CHARCOAL} style={{ flexShrink: 0 }} />
          <Box>
            <Text size="xs" c={MUTED_OLIVE}>Handling Attorney</Text>
            <Text size="sm" fw={600} c={CHARCOAL}>{item.attorney}</Text>
          </Box>
        </Group>
      </Stack>
      
      <Group gap="xs">
        <Button 
          variant="filled" 
          flex={1}
          size="md"
          rightSection={<IconArrowRight size={18} />}
          onClick={() => {
            if (!item.isRejected && item.caseId) {
              // For accepted cases, fetch and display case record modal
              openCaseRecordModal(item)
            }
            // For rejected cases, do nothing (just show in rejected tab)
          }}
          disabled={item.isRejected}
          style={{ 
            background: item.isRejected ? '#999' : `linear-gradient(135deg, ${MUTED_OLIVE} 0%, #6B8E4E 100%)`,
            fontWeight: 600,
            cursor: item.isRejected ? 'not-allowed' : 'pointer',
          }}
        >
          {item.isRejected ? 'Case Rejected' : 'View Case Folder'}
        </Button>
        {item.caseId && !item.isRejected && (
          <Button 
            variant="outline"
            onClick={() => openReviewModal(item.caseId)}
            flex={1}
            size="md"
            leftSection={<IconFileText size={18} />}
            style={{ 
              borderColor: PRIMARY_BROWN,
              color: PRIMARY_BROWN,
              fontWeight: 600,
            }}
          >
            View Review
          </Button>
        )}
      </Group>
    </Card>
  );

  const DocumentCard = ({ item }) => (
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
      {item.status === "Ready for Pickup" && (
        <Box
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: '#10B981',
            boxShadow: '0 0 0 3px #10B98130',
          }}
        />
      )}

      <Group justify="space-between" mb="md">
        <Group gap="sm">
          <Box
            style={{
              width: 44,
              height: 44,
              borderRadius: '10px',
              background: item.status === "Ready for Pickup" 
                ? `linear-gradient(135deg, ${PRIMARY_GOLD} 0%, ${PRIMARY_BROWN} 100%)`
                : `${MUTED_OLIVE}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: item.status === "Ready for Pickup" ? `0 4px 12px ${PRIMARY_GOLD}40` : 'none',
            }}
          >
            {item.status === "Ready for Pickup" ? (
              <IconCheck size={22} color="white" stroke={3} />
            ) : (
              <IconClock size={22} color={MUTED_OLIVE} />
            )}
          </Box>
          <Box>
            <Text fw={700} c={CHARCOAL} size="lg">
              {item.docType}
            </Text>
            <Text size="xs" c={MUTED_OLIVE}>
              Requested: {item.dateRequest}
            </Text>
          </Box>
        </Group>
      </Group>

      <Badge 
        size="lg" 
        radius="md"
        fullWidth
        mb="md"
        style={{ 
          backgroundColor: item.status === "Ready for Pickup" ? `${PRIMARY_GOLD}20` : THEMED_LIGHT_BG,
          color: item.status === "Ready for Pickup" ? PRIMARY_BROWN : MUTED_OLIVE,
          fontWeight: 600,
          padding: '12px 16px',
          border: item.status === "Ready for Pickup" ? `1px solid ${PRIMARY_GOLD}` : `1px solid #E0E0E0`,
        }}
      >
        {item.status}
      </Badge>

      {/* Ready for Pickup - Appointment Details */}
      {item.status === "Ready for Pickup" && item.appointment && (
        <>
          <Paper 
            p="lg" 
            radius="md" 
            mb="md"
            style={{ 
              background: `linear-gradient(135deg, ${THEMED_LIGHT_BG} 0%, white 100%)`,
              border: `2px dashed ${PRIMARY_GOLD}60`,
            }}
          >
            <Group gap="xs" mb="md">
              <Box
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '8px',
                  background: `linear-gradient(135deg, ${PRIMARY_GOLD} 0%, ${PRIMARY_BROWN} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconCalendarEvent size={16} color="white" />
              </Box>
              <Text size="sm" fw={700} c={PRIMARY_BROWN} tt="uppercase" style={{ letterSpacing: '0.5px' }}>
                Pickup Schedule
              </Text>
            </Group>

            <Stack gap="sm">
              <Group gap="sm" wrap="nowrap">
                <Box
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '6px',
                    background: `${PRIMARY_BROWN}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <IconCalendarEvent size={14} color={PRIMARY_BROWN} />
                </Box>
                <Box>
                  <Text size="xs" c={MUTED_OLIVE} mb={2}>Date & Time</Text>
                  <Text size="sm" fw={600} c={CHARCOAL}>
                    {item.appointment.date} at {item.appointment.time}
                  </Text>
                </Box>
              </Group>

              <Group gap="sm" wrap="nowrap">
                <Box
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '6px',
                    background: `${PRIMARY_GOLD}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <IconUser size={14} color={PRIMARY_GOLD} />
                </Box>
                <Box>
                  <Text size="xs" c={MUTED_OLIVE} mb={2}>Look for</Text>
                  <Text size="sm" fw={600} c={CHARCOAL}>
                    {item.appointment.handler}
                  </Text>
                  <Text size="xs" c={MUTED_OLIVE}>{item.appointment.role}</Text>
                </Box>
              </Group>

              <Group gap="sm" wrap="nowrap">
                <Box
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '6px',
                    background: `${ACCENT_TAN}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <IconMapPin size={14} color={ACCENT_TAN} />
                </Box>
                <Box>
                  <Text size="xs" c={MUTED_OLIVE} mb={2}>Location</Text>
                  <Text size="sm" fw={500} c={CHARCOAL}>
                    {item.appointment.location}
                  </Text>
                </Box>
              </Group>
            </Stack>
          </Paper>

          <Button 
            variant="filled"
            fullWidth
            size="md"
            leftSection={<IconDownload size={18} />}
            style={{ 
              background: `linear-gradient(135deg, ${PRIMARY_GOLD} 0%, ${PRIMARY_BROWN} 100%)`,
              fontWeight: 600,
            }}
          >
            Download Document
          </Button>
        </>
      )}

      {/* In Progress State */}
      {item.status === "In Progress" && (
        <Paper 
          p="md" 
          radius="md"
          style={{ 
            backgroundColor: `${MUTED_OLIVE}15`,
            border: `1px solid ${MUTED_OLIVE}40`,
          }}
        >
          <Group gap="sm">
            <IconClock size={20} color={MUTED_OLIVE} />
            <Box>
              <Text size="sm" fw={600} c={CHARCOAL}>
                {item.actionNeeded}
              </Text>
              <Text size="xs" c={MUTED_OLIVE}>
                Est. completion: {item.estimatedCompletion}
              </Text>
            </Box>
          </Group>
        </Paper>
      )}
    </Card>
  );

  // --- MAIN RENDER ---

  return (
    <>
      {/* Case Record Modal */}
      <Modal
        opened={caseRecordModalOpened}
        onClose={() => {
          setCaseRecordModalOpened(false)
          setCaseRecordData({})
          setCaseRecordError(null)
        }}
        title={
          <Title order={3} c={PRIMARY_BROWN}>
            Case Record
          </Title>
        }
        size="xl"
        styles={{
          title: { fontWeight: 700, width: '100%' },
          body: { maxHeight: '70vh', overflowY: 'auto' },
        }}
      >
        {loadingCaseRecord ? (
          <Center p="xl">
            <Loader size="lg" color={PRIMARY_BROWN} />
          </Center>
        ) : caseRecordData && Object.keys(caseRecordData).length > 0 ? (
          <CaseInformationSection 
            value={caseRecordData} 
            onChange={() => {}} 
            readOnly={true}
          />
        ) : caseRecordError ? (
          <Alert color="blue" title="Case Record In Progress" icon={<IconAlertCircle size={20} />}>
            The case record for this case is still being processed by the legal team. 
            Please check back later.
          </Alert>
        ) : null}
      </Modal>

      <Box bg={THEMED_LIGHT_BG} mih="100vh" py="xl">
      <Container size="xl">
        <Box mb="xl">
          <Title order={1} mb="xs" c={PRIMARY_BROWN}>
            My Legal Portal
          </Title>
          <Text c={MUTED_OLIVE} size="lg">
            Manage your inquiries, cases, and documents.
          </Text>
        </Box>

        <Tabs 
          defaultValue="appointments" 
          variant="pills"
          radius="md"
          styles={{
            tab: {
              padding: '12px 24px',
              fontWeight: 600,
              fontSize: '15px',
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: THEMED_LIGHT_BG,
              },
            },
            tabLabel: {
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            },
          }}
        >
          <Tabs.List mb="xl">
            <Tabs.Tab value="appointments" leftSection={<IconCalendarEvent size={20} />}>
              For Appointment
            </Tabs.Tab>
            <Tabs.Tab value="advice" leftSection={<IconMessage2 size={20} />}>
              Legal Advice
            </Tabs.Tab>
            <Tabs.Tab value="representation" leftSection={<IconScale size={20} />}>
              Track Case
            </Tabs.Tab>
            <Tabs.Tab value="rejected" leftSection={<IconX size={20} />}>
              Rejected Cases
            </Tabs.Tab>
            <Tabs.Tab value="documents" leftSection={<IconFileDescription size={20} />}>
              Documents
            </Tabs.Tab>
          </Tabs.List>

          {/* --- TAB 1: FOR APPOINTMENT --- */}
          <Tabs.Panel value="appointments">
            <Paper shadow="xs" p="md" mb="xl" radius="lg" style={{ border: `1px solid #F0F0F0` }}>
              <Group gap="sm">
                <IconAlertCircle size={20} color={PRIMARY_BROWN} />
                <Text size="sm" c={CHARCOAL} fw={500}>
                  Your scheduled interviews and appointments after submitting client information
                </Text>
              </Group>
            </Paper>
            
            {loadingAppointments ? (
              <Paper shadow="xs" p="xl" radius="lg" style={{ textAlign: 'center' }}>
                <Text c={MUTED_OLIVE}>Loading your appointments...</Text>
              </Paper>
            ) : forAppointmentData.length === 0 ? (
              <Paper shadow="xs" p="xl" radius="lg" style={{ textAlign: 'center', border: `1px solid #F0F0F0` }}>
                <Box mb="md">
                  <IconCalendarEvent size={48} color={MUTED_OLIVE} stroke={1.5} style={{ opacity: 0.5 }} />
                </Box>
                <Text size="lg" fw={600} c={CHARCOAL} mb="xs">
                  No Appointments Yet
                </Text>
                <Text size="sm" c={MUTED_OLIVE}>
                  You don't have any appointments scheduled at the moment.
                </Text>
              </Paper>
            ) : (
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="xl">
                {forAppointmentData.map((item) => (
                  <ForAppointmentCard key={item.id} item={item} />
                ))}
              </SimpleGrid>
            )}
          </Tabs.Panel>

          {/* --- TAB 2: LEGAL ADVICE --- */}
          <Tabs.Panel value="advice">
            <Paper shadow="xs" p="md" mb="xl" radius="lg" style={{ border: `1px solid #F0F0F0` }}>
              <Group gap="sm">
                <IconAlertCircle size={20} color={PRIMARY_BROWN} />
                <Text size="sm" c={CHARCOAL} fw={500}>
                  Your submitted inquiries and their current status
                </Text>
              </Group>
            </Paper>
            {legalAdviceData.length === 0 ? (
              <Paper shadow="xs" p="xl" radius="lg" style={{ textAlign: 'center', border: `1px solid #F0F0F0` }}>
                <Box mb="md">
                  <IconMessage2 size={48} color={MUTED_OLIVE} stroke={1.5} style={{ opacity: 0.5 }} />
                </Box>
                <Text size="lg" fw={600} c={CHARCOAL} mb="xs">
                  No Legal Advice Requests
                </Text>
                <Text size="sm" c={MUTED_OLIVE} mb="lg">
                  Cases marked for legal advice only will appear here.
                </Text>
                <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="xl">
                  <AdviceCard key={dummyLegalAdvice.id} item={dummyLegalAdvice} />
                </SimpleGrid>
              </Paper>
            ) : (
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="xl">
                {legalAdviceData.map((item) => (
                  <AdviceCard key={item.id} item={item} />
                ))}
              </SimpleGrid>
            )}
          </Tabs.Panel>

          {/* --- TAB 3: REPRESENTATION (TRACK CASE) --- */}
          <Tabs.Panel value="representation">
            <Paper shadow="xs" p="md" mb="xl" radius="lg" style={{ border: `1px solid #F0F0F0` }}>
              <Group justify="space-between">
                <Group gap="sm">
                  <IconAlertCircle size={20} color={PRIMARY_BROWN} />
                  <Text size="sm" c={CHARCOAL} fw={500}>
                    Active Litigation & Court Cases
                  </Text>
                </Group>
                <Badge color="red" variant="dot" size="lg">
                  Restricted Access
                </Badge>
              </Group>
            </Paper>
            
            {representationData.length === 0 ? (
              <Paper shadow="xs" p="xl" radius="lg" style={{ textAlign: 'center', border: `1px solid #F0F0F0` }}>
                <Box mb="md">
                  <IconScale size={48} color={MUTED_OLIVE} stroke={1.5} style={{ opacity: 0.5 }} />
                </Box>
                <Text size="lg" fw={600} c={CHARCOAL} mb="xs">
                  No Active Court Cases
                </Text>
                <Text size="sm" c={MUTED_OLIVE} mb="lg">
                  Accepted court representation cases will appear here.
                </Text>
                <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="xl">
                  <RepresentationCard key={dummyCourtCase.id} item={dummyCourtCase} />
                </SimpleGrid>
              </Paper>
            ) : (
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="xl">
                {representationData.map((item) => (
                  <RepresentationCard key={item.id} item={item} />
                ))}
              </SimpleGrid>
            )}
          </Tabs.Panel>

          {/* --- TAB 4: REJECTED CASES --- */}
          <Tabs.Panel value="rejected">
            <Paper shadow="xs" p="md" mb="xl" radius="lg" style={{ border: `1px solid #F0F0F0`, backgroundColor: '#FEE2E2' }}>
              <Group gap="sm">
                <IconAlertCircle size={20} color="#DC2626" />
                <Text size="sm" c="#991B1B" fw={500}>
                  Cases that were reviewed and rejected by the director
                </Text>
              </Group>
            </Paper>
            
            {loadingAppointments ? (
              <Paper shadow="xs" p="xl" radius="lg" style={{ textAlign: 'center' }}>
                <Text c={MUTED_OLIVE}>Loading rejected cases...</Text>
              </Paper>
            ) : rejectedData.length === 0 ? (
              <Paper shadow="xs" p="xl" radius="lg" style={{ textAlign: 'center', border: `1px solid #F0F0F0` }}>
                <Box mb="md">
                  <IconX size={48} color={MUTED_OLIVE} stroke={1.5} style={{ opacity: 0.5 }} />
                </Box>
                <Text size="lg" fw={600} c={CHARCOAL} mb="xs">
                  No Rejected Cases
                </Text>
                <Text size="sm" c={MUTED_OLIVE}>
                  Cases rejected by the director will appear here.
                </Text>
              </Paper>
            ) : (
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="xl">
                {rejectedData.map((item) => (
                  <ForAppointmentCard key={item.id} item={item} />
                ))}
              </SimpleGrid>
            )}
          </Tabs.Panel>

          {/* --- TAB 5: DOCUMENTS --- */}
          <Tabs.Panel value="documents">
            <Paper shadow="xs" p="md" mb="xl" radius="lg" style={{ border: `1px solid #F0F0F0` }}>
              <Group gap="sm">
                <IconAlertCircle size={20} color={PRIMARY_BROWN} />
                <Text size="sm" c={CHARCOAL} fw={500}>
                  Drafting requests and document pickup schedules
                </Text>
              </Group>
            </Paper>
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="xl">
              {documentData.map((item) => (
                <DocumentCard key={item.id} item={item} />
              ))}
            </SimpleGrid>
          </Tabs.Panel>
        </Tabs>
      </Container>
      </Box>

      {/* Appointment Details Modal */}
      <Modal
        opened={appointmentModalOpened}
        onClose={() => setAppointmentModalOpened(false)}
        title={
          <Text fw={700} size="xl" c={PRIMARY_BROWN}>
            Appointment Receipt
          </Text>
        }
        size="lg"
        radius="lg"
      >
        {loadingAppointment ? (
          <Center py="xl">
            <Loader size="lg" color={PRIMARY_BROWN} />
          </Center>
        ) : appointmentDetails ? (
          <Stack gap="lg" mt="lg">
            {/* Header Badge */}
            <Paper p="md" radius="md" style={{ backgroundColor: `${PRIMARY_GOLD}15`, border: `1px solid ${PRIMARY_GOLD}` }}>
              <Group justify="space-between" align="center">
                <Text fw={700} size="lg" c={PRIMARY_BROWN}>
                  {appointmentDetails.caseDetails?.appointmentType || appointmentDetails.personal?.legalMatter || 'Appointment'}
                </Text>
                <Badge size="lg" variant="filled" style={{ backgroundColor: PRIMARY_GOLD, color: CHARCOAL }}>
                  {appointmentDetails.status || 'For Appointment'}
                </Badge>
              </Group>
              <Text size="sm" c={MUTED_OLIVE} mt="xs">
                Case #{appointmentDetails.caseNumber || 'N/A'}
              </Text>
            </Paper>

            {/* Personal Details */}
            <Paper shadow="xs" p="lg" radius="lg" style={{ backgroundColor: 'white', border: '1px solid #F0F0F0' }}>
              <Title order={4} mb="md" c={CHARCOAL}>Personal Details</Title>
              <Divider mb="md" color="#F0F0F0" />
              <Grid gutter="md">
                <Grid.Col span={6}>
                  <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Name</Text>
                  <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.fullName || appointmentDetails.name || 'N/A'}</Text>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Age</Text>
                  <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.age || 'N/A'}</Text>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Birthday</Text>
                  <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.birthday || 'N/A'}</Text>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Sex</Text>
                  <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.sex || 'N/A'}</Text>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Civil Status</Text>
                  <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.civilStatus || 'N/A'}</Text>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Contact Number</Text>
                  <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.contactNumber || 'N/A'}</Text>
                </Grid.Col>
                <Grid.Col span={12}>
                  <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Present Address</Text>
                  <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.presentAddress || 'N/A'}</Text>
                </Grid.Col>
                <Grid.Col span={12}>
                  <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Permanent Address</Text>
                  <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.permanentAddress || 'N/A'}</Text>
                </Grid.Col>
              </Grid>
            </Paper>

            {/* Schedule Details */}
            <Paper shadow="xs" p="lg" radius="lg" style={{ backgroundColor: 'white', border: '1px solid #F0F0F0' }}>
              <Title order={4} mb="md" c={CHARCOAL}>Schedule Details</Title>
              <Divider mb="md" color="#F0F0F0" />
              <Grid gutter="md">
                <Grid.Col span={12}>
                  <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Appointment Date</Text>
                  <Text size="sm" c={CHARCOAL} fw={500}>
                    {appointmentDetails.appointedDate ? new Date(appointmentDetails.appointedDate).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    }) : 'N/A'}
                  </Text>
                </Grid.Col>
              </Grid>
            </Paper>

            {/* Financial Details */}
            <Paper shadow="xs" p="lg" radius="lg" style={{ backgroundColor: 'white', border: '1px solid #F0F0F0' }}>
              <Title order={4} mb="md" c={CHARCOAL}>Financial Details</Title>
              <Divider mb="md" color="#F0F0F0" />
              <Grid gutter="md">
                <Grid.Col span={6}>
                  <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Income Source</Text>
                  <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.currentSourceOfIncome || 'N/A'}</Text>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Monthly Income</Text>
                  <Text size="sm" c={CHARCOAL} fw={500}>
                    {appointmentDetails.monthlyIncome ? `₱${Number(appointmentDetails.monthlyIncome).toLocaleString()}` : 'N/A'}
                  </Text>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Nature of Work</Text>
                  <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.natureOfWork || 'N/A'}</Text>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Employer</Text>
                  <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.employerName || 'N/A'}</Text>
                </Grid.Col>
                <Grid.Col span={12}>
                  <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Employer Address</Text>
                  <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.employerAddress || 'N/A'}</Text>
                </Grid.Col>
              </Grid>
            </Paper>

            {/* Case Details */}
            <Paper shadow="xs" p="lg" radius="lg" style={{ backgroundColor: 'white', border: '1px solid #F0F0F0' }}>
              <Title order={4} mb="md" c={CHARCOAL}>Case Details</Title>
              <Divider mb="md" color="#F0F0F0" />
              <Grid gutter="md">
                <Grid.Col span={6}>
                  <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Party Represented</Text>
                  <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.partyRepresented || 'N/A'}</Text>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Case Number</Text>
                  <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.caseNumber || 'N/A'}</Text>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Venue</Text>
                  <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.venue || 'N/A'}</Text>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Present Stage</Text>
                  <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.presentStage || 'N/A'}</Text>
                </Grid.Col>
                <Grid.Col span={12}>
                  <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Court Division</Text>
                  <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.courtDivision || 'N/A'}</Text>
                </Grid.Col>
                <Grid.Col span={12}>
                  <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Court Address</Text>
                  <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.courtAddress || 'N/A'}</Text>
                </Grid.Col>
                <Grid.Col span={12}>
                  <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Presiding Officer</Text>
                  <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.presidingOfficer || 'N/A'}</Text>
                </Grid.Col>
              </Grid>
            </Paper>
          </Stack>
        ) : (
          <Text c="dimmed" ta="center" py="xl">
            No appointment details available
          </Text>
        )}
      </Modal>

      {/* Review Modal */}
      <Modal
        opened={reviewModalOpened}
        onClose={() => setReviewModalOpened(false)}
        title={<Title order={3} c={PRIMARY_BROWN}>Recommendation for Action</Title>}
        size="xl"
        styles={{
          title: { fontWeight: 700 },
          body: { maxHeight: '70vh', overflowY: 'auto' },
        }}
      >
        {loadingReview ? (
          <Center py="xl">
            <Loader size="lg" color={PRIMARY_BROWN} />
          </Center>
        ) : reviewData ? (
          <Stack gap="lg">
            <Stepper 
              active={activeStep} 
              color={PRIMARY_BROWN}
              completedIcon={<IconCircleCheck size={20} />}
              styles={{
                stepLabel: { fontWeight: 600, fontSize: '14px' },
                stepDescription: { fontSize: '12px', color: MUTED_OLIVE },
              }}
            >
              <Stepper.Step label="Interview" description="Client & Evidence" />
              <Stepper.Step label="Action" description="Lawyer & Director" />
            </Stepper>

            <Divider />

            {/* Step 0: Interview Info */}
            {activeStep === 0 && (
              <Paper p="md" withBorder>
                <Title order={4} c={PRIMARY_BROWN} mb="md">Client Interview Information</Title>
                <SimpleGrid cols={2} spacing="sm" mb="md">
                  <Box>
                    <Text size="xs" c="dimmed">Date of Interview</Text>
                    <Text fw={500}>{reviewData.content?.interviewInfo?.dateOfInterview || '-'}</Text>
                  </Box>
                  <Box>
                    <Text size="xs" c="dimmed">Date Submitted</Text>
                    <Text fw={500}>{reviewData.content?.interviewInfo?.dateSubmitted || '-'}</Text>
                  </Box>
                  <Box>
                    <Text size="xs" c="dimmed">Client's Name</Text>
                    <Text fw={500}>{reviewData.content?.interviewInfo?.clientName || '-'}</Text>
                  </Box>
                  <Box>
                    <Text size="xs" c="dimmed">Interviewing Intern/s</Text>
                    <Text fw={500}>{reviewData.content?.interviewInfo?.interviewingInterns || '-'}</Text>
                  </Box>
                </SimpleGrid>
                <Divider my="md" />
                <Box mb="md">
                  <Text size="sm" fw={600} c={PRIMARY_BROWN} mb="xs">Fast Facts</Text>
                  <Text size="sm">{reviewData.content?.interviewInfo?.fastFacts || '-'}</Text>
                </Box>
                <Divider my="md" />
                {/* Evidence tables */}
                {reviewData.content?.interviewInfo?.clientEvidence && reviewData.content.interviewInfo.clientEvidence.length > 0 && (
                  <Box mb="md">
                    <Text size="sm" fw={600} c={PRIMARY_BROWN} mb="xs">Evidence on Hand / Available for the Client(s)</Text>
                    <Table withTableBorder withColumnBorders>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Type/Description</Table.Th>
                          <Table.Th>Author/Source</Table.Th>
                          <Table.Th>Purpose</Table.Th>
                          <Table.Th>Issues</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {reviewData.content.interviewInfo.clientEvidence.map((ev, idx) => (
                          <Table.Tr key={idx}>
                            <Table.Td>{ev.type || '-'}</Table.Td>
                            <Table.Td>{ev.author || '-'}</Table.Td>
                            <Table.Td>{ev.purpose || '-'}</Table.Td>
                            <Table.Td>{ev.issues || '-'}</Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </Box>
                )}
                {reviewData.content?.interviewInfo?.adversePartyEvidence && reviewData.content.interviewInfo.adversePartyEvidence.length > 0 && (
                  <Box mb="md">
                    <Text size="sm" fw={600} c={PRIMARY_BROWN} mb="xs">Evidence on Hand / Available for the Adverse Party(ies)</Text>
                    <Table withTableBorder withColumnBorders>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Type/Description</Table.Th>
                          <Table.Th>Author/Source</Table.Th>
                          <Table.Th>Purpose</Table.Th>
                          <Table.Th>Issues</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {reviewData.content.interviewInfo.adversePartyEvidence.map((ev, idx) => (
                          <Table.Tr key={idx}>
                            <Table.Td>{ev.type || '-'}</Table.Td>
                            <Table.Td>{ev.author || '-'}</Table.Td>
                            <Table.Td>{ev.purpose || '-'}</Table.Td>
                            <Table.Td>{ev.issues || '-'}</Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </Box>
                )}
                <Box mb="md">
                  <Text size="sm" fw={600} c={PRIMARY_BROWN} mb="xs">Intern's Initial Advice</Text>
                  <Text size="sm">{reviewData.content?.interviewInfo?.internAdvice || '-'}</Text>
                </Box>
                <Box>
                  <Text size="sm" fw={600} c={PRIMARY_BROWN} mb="xs">Legal Opinion</Text>
                  <Text size="sm">{reviewData.content?.interviewInfo?.legalOpinion || '-'}</Text>
                </Box>
              </Paper>
            )}

            {/* Step 1: Action Info */}
            {activeStep === 1 && (
              <Paper p="md" withBorder>
                <Title order={4} c={PRIMARY_BROWN} mb="md">Supervising Lawyer & Director Action</Title>
                <Box mb="md">
                  <Text size="sm" fw={600} c={PRIMARY_BROWN} mb="xs">Supervising Lawyer's Comment</Text>
                  <Text size="sm">{reviewData.content?.actionInfo?.supervisingComment || '-'}</Text>
                </Box>
                <Divider my="md" />
                <Box mb="md">
                  <Text size="sm" fw={600} c={PRIMARY_BROWN} mb="xs">Director's Decision</Text>
                  <Badge 
                    size="lg" 
                    color={
                      reviewData.decision === 'accepted' ? 'green' : 
                      reviewData.decision === 'rejected' ? 'red' : 
                      'yellow'
                    }
                  >
                    {(reviewData.decision || 'pending').toUpperCase()}
                  </Badge>
                </Box>
                <Box mb="md">
                  <Text size="sm" fw={600} c={PRIMARY_BROWN} mb="xs">Decision Note</Text>
                  <Text size="sm">{reviewData.content?.actionInfo?.decisionNote || '-'}</Text>
                </Box>
                <Divider my="md" />
                <SimpleGrid cols={2} spacing="sm">
                  <Box>
                    <Text size="xs" c="dimmed">Assigned To</Text>
                    <Text fw={500}>{reviewData.content?.actionInfo?.assignedTo || '-'}</Text>
                  </Box>
                  <Box>
                    <Text size="xs" c="dimmed">Supervising Lawyer</Text>
                    <Text fw={500}>{reviewData.content?.actionInfo?.supervisingLawyer || '-'}</Text>
                  </Box>
                  <Box>
                    <Text size="xs" c="dimmed">Director's Signature</Text>
                    <Text fw={500}>{reviewData.content?.actionInfo?.directorSignature || '-'}</Text>
                  </Box>
                  <Box>
                    <Text size="xs" c="dimmed">Signature Date</Text>
                    <Text fw={500}>{reviewData.content?.actionInfo?.signatureDate || '-'}</Text>
                  </Box>
                </SimpleGrid>
              </Paper>
            )}

            <Divider />
            <Group justify="space-between">
              {activeStep > 0 ? (
                <Button 
                  variant="outline" 
                  leftSection={<IconChevronLeft size={20} />}
                  onClick={() => setActiveStep(activeStep - 1)}
                  size="sm"
                  styles={{
                    root: { borderColor: '#E0E0E0', color: MUTED_OLIVE, '&:hover': { backgroundColor: THEMED_LIGHT_BG } },
                  }}
                >
                  Previous
                </Button>
              ) : (
                <Box />
              )}
              
              {activeStep < 1 && (
                <Button 
                  rightSection={<IconChevronRight size={20} />}
                  onClick={() => setActiveStep(activeStep + 1)}
                  size="sm"
                  style={{ backgroundColor: PRIMARY_BROWN }}
                >
                  Next Step
                </Button>
              )}
            </Group>
          </Stack>
        ) : (
          <Text c="dimmed" ta="center" py="xl">
            No review data available
          </Text>
        )}
      </Modal>
    </>
  );
}