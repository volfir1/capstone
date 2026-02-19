import React, { useEffect, useState, useRef } from 'react';
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
  ScrollArea,
  Avatar,
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
  IconMessageCircle,
  IconSend,
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
  ACCENT_TAN,
  BG 
} from '@utils/constants';

export default function AppointmentTracker() {
  const navigate = useNavigate();
  const { currentUser, userData, loading: authLoading } = useAuth();
  const [forAppointmentData, setForAppointmentData] = useState([])
  const [legalAdviceData, setLegalAdviceData] = useState([])
  const [representationData, setRepresentationData] = useState([])
  const [rejectedData, setRejectedData] = useState([])
  const [documentData, setDocumentData] = useState([])
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
  
  // Chat Modal states
  const [chatModalOpened, setChatModalOpened] = useState(false)
  const [currentChatCase, setCurrentChatCase] = useState(null)
  const [chatMessages, setChatMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loadingChat, setLoadingChat] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)
  const chatViewportRef = useRef(null)

  useEffect(() => {
    // Wait for auth to load and user to be available
    if (authLoading || !currentUser || !userData) {
      return;
    }

    let mounted = true
    const load = async () => {
      setLoadingAppointments(true)
      try {
        const { default: apiClient } = await import('@config/api/apiClient')
        
        // Fetch both clientsinfo appointments and finalized cases for this user
        const [appointmentsResp, finalizedResp] = await Promise.all([
          apiClient.get('/clientsinfo'),
          apiClient.get(`/finalize/user/${userData._id || userData.id}`)
        ])
        
        const docs = appointmentsResp?.data || []
        const finalizedCases = finalizedResp?.data || []
        
        console.log('Fetched appointments for current user:', docs.length, 'records');
        console.log('Fetched finalized cases for current user:', finalizedCases.length, 'cases');
        
        const appointmentsList = []
        const legalAdviceList = []
        const courtCasesList = []
        const rejectedList = []
        
        const docsArray = Array.isArray(docs) ? docs : [];
        const filteredStatuses = new Set([
          'submitted-for-review',
          'submitted for review',
          'for-review',
          'review',
          'pending review',
          'finalized',
          'finalised'
        ]);

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
          if (filteredStatuses.has(String(status).toLowerCase())) {
            return; // Hide items already submitted for review or finalized
          }
          
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
            console.log('Processing court-case item:', d._id, 'with caseId:', d.caseId);
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
        
        // Process finalized cases created by admin for this user
        const documentsList = []
        finalizedCases.forEach((f) => {
          console.log('Processing finalized case:', f.caseId, f.caseTitle);
          const clientName = f.content?.interviewInfo?.clientName || f.clientName || userData.firstName + ' ' + userData.lastName;
          const caseType = f.content?.interviewInfo?.caseType;
          const isDocumentDrafting = caseType === 'legal-document';
          
          if (isDocumentDrafting) {
            // Add to documents list
            documentsList.push({
              id: f._id,
              docType: f.caseTitle || 'Legal Document',
              status: 'In Progress',
              actionNeeded: 'Drafting',
              dateRequest: f.createdAt ? new Date(f.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '',
              caseId: f.caseId,
              finalizeId: f._id,
              clientName: clientName,
              isFromFinalizedCase: true
            })
          } else {
            // Add to court cases list
            courtCasesList.push({
              id: f._id,
              type: 'Court Case',
              submittedDate: f.createdAt ? new Date(f.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '',
              appointmentDate: 'TBD',
              appointmentTime: '',
              location: 'SOLA (Sebastian Office Legal Aid)',
              purpose: f.caseTitle || 'Court Case',
              clientName: clientName,
              submittedBy: clientName,
              caseTitle: f.caseTitle || 'Court Case',
              caseNumber: f.caseId || 'TBD',
              caseId: f.caseId,
              finalizeId: f._id, // Use finalize _id for fetching case record
              stage: 'Active',
              nextDate: 'TBD',
              attorney: 'TBD',
              isRejected: false,
              isFromFinalizedCase: true // Mark to identify these cases
            })
          }
        })
        
        if (mounted) {
          // Fetch all case records for court cases
          const courtCasesWithRecords = await Promise.all(
            courtCasesList.map(async (item) => {
              // For cases from finalized records, use finalizeId directly
              if (item.isFromFinalizedCase && item.finalizeId) {
                try {
                  const recordResp = await apiClient.get(`/caserecords/finalize/${item.finalizeId}`);
                  const caseRecord = recordResp?.data?.data || recordResp?.data || null;
                  console.log(`Case record for finalized case ${item.finalizeId}:`, caseRecord);
                  return { ...item, caseRecord };
                } catch (err) {
                  console.log(`No case record yet for finalized case ${item.finalizeId}`);
                  return { ...item, caseRecord: null };
                }
              }
              
              // For regular cases from clientsinfo
              if (item.caseId && !item.isFromFinalizedCase) {
                try {
                  // First, get the finalize document by caseId to get its _id
                  console.log('Fetching finalize document for caseId:', item.caseId);
                  const finalizeResp = await apiClient.get(`/finalize/case/${item.caseId}`);
                  console.log('Finalize response:', finalizeResp.data);
                  
                  if (finalizeResp.data && finalizeResp.data._id) {
                    const finalizeId = finalizeResp.data._id;
                    console.log('Got finalize _id:', finalizeId);
                    
                    // Now fetch the case record using the finalize document's _id
                    const recordResp = await apiClient.get(`/caserecords/finalize/${finalizeId}`);
                    console.log(`Raw response for finalize ${finalizeId}:`, recordResp);
                    const caseRecord = recordResp?.data?.data || recordResp?.data || null;
                    console.log(`Case record for ${finalizeId}:`, caseRecord);
                    if (caseRecord) {
                      console.log(`Case record title: ${caseRecord.title}, nature: ${caseRecord.nature}`);
                    }
                    return { ...item, caseRecord };
                  }
                } catch (err) {
                  console.error(`Error fetching case record for caseId ${item.caseId}:`, err);
                  return { ...item, caseRecord: null };
                }
              }
              return item;
            })
          );
          
          console.log('Court cases with records (final):', courtCasesWithRecords);
          console.log('First court case item:', courtCasesWithRecords[0]);
          if (courtCasesWithRecords[0]?.caseRecord) {
            console.log('First case record details:', {
              title: courtCasesWithRecords[0].caseRecord.title,
              nature: courtCasesWithRecords[0].caseRecord.nature
            });
          }
          
          setForAppointmentData(appointmentsList)
          setLegalAdviceData(legalAdviceList)
          setRepresentationData(courtCasesWithRecords)
          setRejectedData(rejectedList)
          setDocumentData(documentsList)
        }
      } catch (err) {
        console.error('Failed to load clientsinfo for appointments', err)
      } finally {
        if (mounted) setLoadingAppointments(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [currentUser, authLoading, userData])

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

  // Chat functions
  const openChatModal = async (caseItem) => {
    try {
      const { default: apiClient } = await import('@config/api/apiClient');
      let caseDoc = null;

      // The caseItem.caseId is actually the linkedCaseId from finalize document
      // We need to find the Case document where linkedCaseId matches this value
      if (caseItem.caseId) {
        try {
          // First, try to get the finalize document to find the actual Case _id
          const finalizeResp = await apiClient.get(`/finalize/case/${caseItem.caseId}`);
          if (finalizeResp.data && finalizeResp.data.linkedCaseId) {
            // If finalize has linkedCaseId, fetch that Case document
            const caseResp = await apiClient.get(`/cases/${finalizeResp.data.linkedCaseId}`);
            if (caseResp.data) {
              caseDoc = caseResp.data.data || caseResp.data;
              console.log('Found existing case via finalize:', caseDoc);
            }
          }
        } catch (err) {
          console.log('Case not found:', err.message);
        }
      }

      // If no case exists, we can't create it from customer side
      // Only admin should create cases
      if (!caseDoc) {
        console.error('Case document not found. Admin must open chat first.');
        const { notifications } = await import('@mantine/notifications');
        notifications.show({
          title: 'Chat Not Available',
          message: 'The attorney must initiate the chat first. Please wait for them to contact you.',
          color: 'yellow',
        });
        return;
      }

      // Open chat modal with the case
      setCurrentChatCase({ ...caseItem, ...caseDoc });
      setChatModalOpened(true);
      await fetchChatMessages(caseDoc._id);
      
    } catch (error) {
      console.error('Error opening chat:', error);
      const { notifications } = await import('@mantine/notifications');
      notifications.show({
        title: 'Error',
        message: 'Failed to open chat',
        color: 'red',
      });
    }
  };

  const fetchChatMessages = async (caseId) => {
    if (!caseId) return;
    
    setLoadingChat(true);
    try {
      const { default: apiClient } = await import('@config/api/apiClient');
      console.log('Fetching messages for caseId:', caseId);
      const response = await apiClient.get(`/chat/case/${caseId}`);
      
      console.log('Fetched messages response:', response.data);
      if (response.data.success) {
        console.log('Setting messages:', response.data.data);
        console.log('First message:', response.data.data[0]);
        setChatMessages(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setChatMessages([]);
    } finally {
      setLoadingChat(false);
    }
  };

  const handleSendMessage = async () => {
    // Use _id (the actual Case document ID) instead of caseId (the finalize linkedCaseId)
    const actualCaseId = currentChatCase?._id || currentChatCase?.caseId;
    if (!newMessage.trim() || !actualCaseId) return;
    
    setSendingMessage(true);
    try {
      const { default: apiClient } = await import('@config/api/apiClient');
      const response = await apiClient.post('/chat/send', {
        caseId: actualCaseId,
        message: newMessage.trim()
      });
      
      if (response.data.success) {
        setNewMessage('');
        await fetchChatMessages(actualCaseId);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const closeChatModal = () => {
    setChatModalOpened(false);
    setCurrentChatCase(null);
    setChatMessages([]);
    setNewMessage('');
  };

  // Auto-refresh chat messages
  useEffect(() => {
    if (chatModalOpened && currentChatCase) {
      const actualCaseId = currentChatCase._id || currentChatCase.caseId;
      if (actualCaseId) {
        const interval = setInterval(() => {
          fetchChatMessages(actualCaseId);
        }, 10000); // Refresh every 10 seconds
        
        return () => clearInterval(interval);
      }
    }
  }, [chatModalOpened, currentChatCase]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (chatViewportRef.current && chatMessages.length > 0) {
      chatViewportRef.current.scrollTo({ 
        top: chatViewportRef.current.scrollHeight, 
        behavior: 'smooth' 
      });
    }
  }, [chatMessages]);

  // --- REUSABLE CARD COMPONENTS ---

  const ForAppointmentCard = ({ item }) => {
    const statusColor = 
      item.status === "Scheduled" ? '#10B981' :
      item.status === "Rescheduled" ? '#F59E0B' :
      item.status === "Canceled" ? '#EF4444' :
      item.status === "Rejected" ? '#EF4444' :
      MUTED_OLIVE;

    return (
      <Paper 
        shadow="xs" 
        p="lg" 
        radius="lg"
        style={{ 
          border: '1px solid #F0F0F0',
          transition: 'all 0.25s ease',
          cursor: 'pointer',
          background: 'white',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-3px)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.07)';
          e.currentTarget.style.borderColor = '#E0E0E0';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '';
          e.currentTarget.style.borderColor = '#F0F0F0';
        }}
      >
        {/* Header row */}
        <Group justify="space-between" align="center" mb="sm">
          <Group gap={8}>
            <Box style={{
              width: 32, height: 32, borderRadius: 8,
              background: `${statusColor}12`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <IconCalendarEvent size={16} color={statusColor} />
            </Box>
            <Box>
              <Text fw={600} size="sm" c={CHARCOAL} lh={1.2}>{item.type}</Text>
              {item.clientName && (
                <Text size="xs" c={MUTED_OLIVE}>{item.clientName}</Text>
              )}
            </Box>
          </Group>
          <Badge 
            size="sm" 
            radius="sm"
            variant="light"
            color={
              item.status === "Scheduled" ? 'green' :
              item.status === "Rescheduled" ? 'yellow' :
              item.status === "Canceled" || item.status === "Rejected" ? 'red' : 'gray'
            }
          >
            {item.status}
          </Badge>
        </Group>

        {/* Submitted date */}
        <Text size="xs" c={MUTED_OLIVE} mb="sm">
          Submitted {item.submittedDate}
        </Text>

        <Divider color="#F0F0F0" mb="sm" />

        {/* Appointment info */}
        {(item.status === "Scheduled" || item.status === "Rescheduled") && (
          <Stack gap={8} mb="sm">
            {item.status === "Rescheduled" && item.originalDate && (
              <Group gap={6}>
                <IconClock size={13} color="#F59E0B" />
                <Text size="xs" c={MUTED_OLIVE} td="line-through">Original: {item.originalDate}</Text>
              </Group>
            )}
            <Group gap={6}>
              <IconCalendarEvent size={13} color={CHARCOAL} />
              <Text size="sm" fw={600} c={CHARCOAL}>
                {item.appointmentDate} at {item.appointmentTime}
              </Text>
            </Group>
            <Group gap={6}>
              <IconMapPin size={13} color={MUTED_OLIVE} />
              <Text size="xs" c={MUTED_OLIVE}>{item.location}</Text>
            </Group>
          </Stack>
        )}

        {/* Canceled info */}
        {item.status === "Canceled" && (
          <Box mb="sm" p="xs" style={{ background: '#FEF2F2', borderRadius: 8 }}>
            <Text size="xs" c="#B91C1C" fw={500}>Appointment Canceled</Text>
            {item.cancelReason && <Text size="xs" c="#DC2626" mt={2}>{item.cancelReason}</Text>}
          </Box>
        )}

        {/* Pending info */}
        {item.status === "Pending" && (
          <Box mb="sm" p="xs" style={{ background: '#F9FAFB', borderRadius: 8 }}>
            <Group gap={6}>
              <IconClock size={13} color={MUTED_OLIVE} />
              <Text size="xs" c={MUTED_OLIVE} fw={500}>Awaiting schedule confirmation</Text>
            </Group>
          </Box>
        )}

        {/* Action buttons */}
        <Group gap="xs" mt="xs">
          <Button
            flex={1}
            size="sm"
            variant="light"
            leftSection={<IconEye size={15} />}
            onClick={() => openAppointmentModal(item.id)}
            radius="md"
            styles={{
              root: {
                backgroundColor: '#F5F5F5',
                color: CHARCOAL,
                fontWeight: 600,
                fontSize: '13px',
                '&:hover': { backgroundColor: '#EBEBEB' },
              },
            }}
          >
            View Details
          </Button>
          {item.status === "Rejected" && item.caseId && (
            <Button 
              variant="light"
              onClick={() => openReviewModal(item.caseId)}
              flex={1}
              size="sm"
              radius="md"
              leftSection={<IconFileText size={15} />}
              styles={{
                root: {
                  backgroundColor: `${PRIMARY_BROWN}10`,
                  color: PRIMARY_BROWN,
                  fontWeight: 600,
                  fontSize: '13px',
                },
              }}
            >
              View Review
            </Button>
          )}
        </Group>
      </Paper>
    );
  };

  const AdviceCard = ({ item }) => {
    const statusColor = 
      item.status === "Completed" ? '#10B981' :
      item.status === "Scheduled" ? '#3B82F6' :
      item.status === "Pending Review" ? '#F59E0B' : MUTED_OLIVE;

    return (
      <Paper 
        shadow="xs" 
        p="lg" 
        radius="lg"
        style={{ 
          border: '1px solid #F0F0F0',
          transition: 'all 0.25s ease',
          background: 'white',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-3px)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.07)';
          e.currentTarget.style.borderColor = '#E0E0E0';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '';
          e.currentTarget.style.borderColor = '#F0F0F0';
        }}
      >
        {/* Header */}
        <Group justify="space-between" align="center" mb="sm">
          <Group gap={8}>
            <Box style={{
              width: 32, height: 32, borderRadius: 8,
              background: `${statusColor}12`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <IconMessage2 size={16} color={statusColor} />
            </Box>
            <Text fw={600} size="sm" c={CHARCOAL} lineClamp={1} style={{ maxWidth: 200 }}>{item.topic}</Text>
          </Group>
          <Badge 
            size="sm" 
            radius="sm"
            variant="light"
            color={
              item.status === "Completed" ? 'green' :
              item.status === "Scheduled" ? 'blue' :
              item.status === "Pending Review" ? 'yellow' : 'gray'
            }
          >
            {item.status}
          </Badge>
        </Group>

        <Text size="xs" c={MUTED_OLIVE} mb="xs">Submitted {item.date}</Text>

        <Divider color="#F0F0F0" mb="sm" />

        <Text size="sm" c={CHARCOAL} mb="md" lineClamp={2} lh={1.6}>
          {item.description}
        </Text>

        {/* Status-specific info */}
        {item.status === "Pending Review" && (
          <Box mb="sm" p="xs" style={{ background: '#FFFBEB', borderRadius: 8 }}>
            <Group gap={6}>
              <IconClock size={13} color="#F59E0B" />
              <Text size="xs" c="#92400E" fw={500}>Pending lawyer approval</Text>
            </Group>
          </Box>
        )}

        {item.status === "Scheduled" && item.appointment && (
          <Stack gap={6} mb="sm">
            <Group gap={6}>
              <IconCalendarEvent size={13} color={CHARCOAL} />
              <Text size="sm" fw={600} c={CHARCOAL}>{item.appointment.date} at {item.appointment.time}</Text>
            </Group>
            <Group gap={6}>
              <IconUser size={13} color={MUTED_OLIVE} />
              <Text size="xs" c={MUTED_OLIVE}>{item.appointment.handler} — {item.appointment.role}</Text>
            </Group>
            <Group gap={6}>
              <IconMapPin size={13} color={MUTED_OLIVE} />
              <Text size="xs" c={MUTED_OLIVE}>{item.appointment.location}</Text>
            </Group>
          </Stack>
        )}

        {item.status === "Completed" && (
          <Box mb="sm" p="xs" style={{ background: '#F0FDF4', borderRadius: 8 }}>
            <Group gap={6}>
              <IconCheck size={13} color="#10B981" />
              <Text size="xs" c="#065F46" fw={500}>Completed {item.completedDate}</Text>
            </Group>
          </Box>
        )}

        {/* Action buttons */}
        <Group gap="xs">
          {item.caseId && (
            <>
              {/* Chat button disabled per checklist. Uncomment to re-enable.
              <Button 
                variant="light"
                onClick={() => openChatModal(item)}
                flex={1}
                size="sm"
                radius="md"
                leftSection={<IconMessageCircle size={15} />}
                styles={{
                  root: {
                    backgroundColor: `${PRIMARY_GOLD}12`,
                    color: ACCENT_TAN,
                    fontWeight: 600,
                    fontSize: '13px',
                  },
                }}
              >
                Chat with Attorney
              </Button>
              */}
            </>
          )}
          {item.status === "Completed" && (
            <>
              <Button 
                variant="light" 
                onClick={() => item.id && openAppointmentModal(item.id)}
                flex={1}
                size="sm"
                radius="md"
                leftSection={<IconEye size={15} />}
                styles={{
                  root: {
                    backgroundColor: '#F5F5F5',
                    color: CHARCOAL,
                    fontWeight: 600,
                    fontSize: '13px',
                  },
                }}
              >
                Details
              </Button>
              {item.caseId && (
                <Button 
                  variant="light"
                  onClick={() => openReviewModal(item.caseId)}
                  flex={1}
                  size="sm"
                  radius="md"
                  leftSection={<IconFileText size={15} />}
                  styles={{
                    root: {
                      backgroundColor: `${PRIMARY_BROWN}10`,
                      color: PRIMARY_BROWN,
                      fontWeight: 600,
                      fontSize: '13px',
                    },
                  }}
                >
                  Review
                </Button>
              )}
            </>
          )}
        </Group>
      </Paper>
    );
  };

  const RepresentationCard = ({ item }) => (
    <Paper 
      shadow="xs" 
      p="lg" 
      radius="lg"
      style={{ 
        border: '1px solid #F0F0F0',
        transition: 'all 0.25s ease',
        background: 'white',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.07)';
        e.currentTarget.style.borderColor = '#E0E0E0';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '';
        e.currentTarget.style.borderColor = '#F0F0F0';
      }}
    >
      {/* Header */}
      <Group gap={8} mb="sm">
        <Box style={{
          width: 32, height: 32, borderRadius: 8,
          background: `${PRIMARY_BROWN}12`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <IconScale size={16} color={PRIMARY_BROWN} />
        </Box>
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Text fw={600} size="sm" c={CHARCOAL} lineClamp={1}>
            {item.caseRecord?.title || `Appointment for ${item.clientName || 'Case'}`}
          </Text>
          <Text size="xs" c={MUTED_OLIVE} style={{ fontFamily: 'monospace' }}>{item.caseNumber}</Text>
        </Box>
        <Badge 
          size="sm" 
          radius="sm"
          variant="light"
          color={item.isRejected ? 'red' : 'green'}
        >
          {item.isRejected ? 'Rejected' : 'Active'}
        </Badge>
      </Group>

      <Divider color="#F0F0F0" mb="sm" />

      {/* Case nature */}
      <Group gap={6} mb="md">
        <IconGavel size={13} color={MUTED_OLIVE} />
        <Text size="xs" c={MUTED_OLIVE}>Nature:</Text>
        <Text size="sm" fw={600} c={CHARCOAL}>{item.caseRecord?.nature || 'N/A'}</Text>
      </Group>

      {/* Action buttons */}
      <Stack gap={6}>
        <Button 
          variant="light" 
          fullWidth
          size="sm"
          radius="md"
          rightSection={<IconArrowRight size={15} />}
          onClick={() => !item.isRejected && item.caseId && openCaseRecordModal(item)}
          disabled={item.isRejected}
          styles={{
            root: {
              backgroundColor: item.isRejected ? '#F5F5F5' : `${MUTED_OLIVE}12`,
              color: item.isRejected ? '#999' : MUTED_OLIVE,
              fontWeight: 600,
              fontSize: '13px',
            },
          }}
        >
          {item.isRejected ? 'Case Rejected' : 'View Case Folder'}
        </Button>
        {item.caseId && !item.isRejected && (
            <Group gap={6}>
            <Button 
              variant="light"
              flex={1}
              onClick={() => openReviewModal(item.caseId)}
              size="sm"
              radius="md"
              leftSection={<IconFileText size={15} />}
              styles={{
                root: {
                  backgroundColor: `${PRIMARY_BROWN}10`,
                  color: PRIMARY_BROWN,
                  fontWeight: 600,
                  fontSize: '13px',
                },
              }}
            >
              Review
            </Button>
            {/* Chat button disabled per checklist. Uncomment to re-enable.
            <Button 
              variant="light"
              flex={1}
              onClick={() => openChatModal(item)}
              size="sm"
              radius="md"
              leftSection={<IconMessageCircle size={15} />}
              styles={{
                root: {
                  backgroundColor: `${PRIMARY_GOLD}12`,
                  color: ACCENT_TAN,
                  fontWeight: 600,
                  fontSize: '13px',
                },
              }}
            >
              Chat
            </Button>
            */}
          </Group>
        )}
      </Stack>
    </Paper>
  );

  const DocumentCard = ({ item }) => {
    const isReady = item.status === "Ready for Pickup";
    const statusColor = isReady ? '#10B981' : MUTED_OLIVE;

    return (
      <Paper 
        shadow="xs" 
        p="lg" 
        radius="lg"
        style={{ 
          border: '1px solid #F0F0F0',
          transition: 'all 0.25s ease',
          background: 'white',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-3px)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.07)';
          e.currentTarget.style.borderColor = '#E0E0E0';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '';
          e.currentTarget.style.borderColor = '#F0F0F0';
        }}
      >
        {/* Header */}
        <Group justify="space-between" align="center" mb="sm">
          <Group gap={8}>
            <Box style={{
              width: 32, height: 32, borderRadius: 8,
              background: `${statusColor}12`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {isReady ? <IconCheck size={16} color={statusColor} /> : <IconClock size={16} color={statusColor} />}
            </Box>
            <Box>
              <Text fw={600} size="sm" c={CHARCOAL}>{item.docType}</Text>
              <Text size="xs" c={MUTED_OLIVE}>Requested {item.dateRequest}</Text>
            </Box>
          </Group>
          <Badge 
            size="sm" 
            radius="sm"
            variant="light"
            color={isReady ? 'green' : 'gray'}
          >
            {item.status}
          </Badge>
        </Group>

        <Divider color="#F0F0F0" mb="sm" />

        {/* Ready for Pickup */}
        {isReady && item.appointment && (
          <Stack gap={6} mb="sm">
            <Group gap={6}>
              <IconCalendarEvent size={13} color={CHARCOAL} />
              <Text size="sm" fw={600} c={CHARCOAL}>{item.appointment.date} at {item.appointment.time}</Text>
            </Group>
            <Group gap={6}>
              <IconUser size={13} color={MUTED_OLIVE} />
              <Text size="xs" c={MUTED_OLIVE}>Look for {item.appointment.handler}</Text>
            </Group>
            <Group gap={6}>
              <IconMapPin size={13} color={MUTED_OLIVE} />
              <Text size="xs" c={MUTED_OLIVE}>{item.appointment.location}</Text>
            </Group>
          </Stack>
        )}

        {/* In Progress */}
        {item.status === "In Progress" && (
          <Box mb="sm" p="xs" style={{ background: '#F9FAFB', borderRadius: 8 }}>
            <Group gap={6}>
              <IconClock size={13} color={MUTED_OLIVE} />
              <Text size="xs" c={MUTED_OLIVE} fw={500}>{item.actionNeeded}</Text>
            </Group>
          </Box>
        )}

        {/* Action button */}
        {isReady && (
          <Button 
            variant="light"
            fullWidth
            size="sm"
            radius="md"
            leftSection={<IconDownload size={15} />}
            styles={{
              root: {
                backgroundColor: `${PRIMARY_GOLD}12`,
                color: ACCENT_TAN,
                fontWeight: 600,
                fontSize: '13px',
              },
            }}
          >
            Download Document
          </Button>
        )}
      </Paper>
    );
  };

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
          <Group gap={8}>
            <Box style={{ width: 28, height: 28, borderRadius: 7, background: CHARCOAL, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconFileText size={14} color="white" stroke={2.5} />
            </Box>
            <Text fw={700} size="lg" c={CHARCOAL}>Case Record</Text>
          </Group>
        }
        size="xl"
        radius="lg"
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

      <Box bg={BG} mih="100vh" py="xl">
      <Container size="xl">
        {/* Page Header */}
        <Group gap="sm" mb="xs">
          <Box style={{ width: 36, height: 36, borderRadius: 9, background: CHARCOAL, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconGavel size={18} color="white" stroke={2.5} />
          </Box>
          <Title order={2} c={CHARCOAL} fw={700}>My Legal Portal</Title>
        </Group>
        <Text c={MUTED_OLIVE} size="sm" mb="lg" ml={48}>
          Manage your inquiries, cases, and documents
        </Text>

        <Tabs 
          defaultValue="appointments" 
          variant="unstyled"
          styles={{
            tab: {
              padding: '12px 20px',
              fontWeight: 600,
              fontSize: '14px',
              color: MUTED_OLIVE,
              borderRadius: '10px',
              transition: 'all 0.2s ease',
              border: '1.5px solid transparent',
              '&[data-active]': {
                backgroundColor: 'white',
                color: CHARCOAL,
                border: `1.5px solid #E0E0E0`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              },
              '&:hover': {
                backgroundColor: '#F5F5F5',
              },
            },
            list: {
              gap: '6px',
            },
          }}
        >
          <Paper p="xs" radius="xl" mb="lg" style={{ background: '#F5F5F5', border: '1px solid #EBEBEB', display: 'inline-flex' }}>
            <Tabs.List>
              <Tabs.Tab value="appointments" leftSection={<IconCalendarEvent size={16} color={PRIMARY_BROWN} />}>
                Appointments
              </Tabs.Tab>
              <Tabs.Tab value="advice" leftSection={<IconMessage2 size={16} color="#4DABF7" />}>
                Legal Advice
              </Tabs.Tab>
              <Tabs.Tab value="representation" leftSection={<IconScale size={16} color={MUTED_OLIVE} />}>
                Court Cases
              </Tabs.Tab>
              <Tabs.Tab value="rejected" leftSection={<IconX size={16} color="#EF4444" />}>
                Rejected
              </Tabs.Tab>
              <Tabs.Tab value="documents" leftSection={<IconFileDescription size={16} color={ACCENT_TAN} />}>
                Documents
              </Tabs.Tab>
            </Tabs.List>
          </Paper>

          {/* --- TAB 1: FOR APPOINTMENT --- */}
          <Tabs.Panel value="appointments">
            <Paper p="sm" px="md" mb="lg" radius="lg" style={{ background: '#FAFAFA', border: '1px solid #F0F0F0' }}>
              <Group gap={8}>
                <Box style={{ width: 24, height: 24, borderRadius: 6, background: `${PRIMARY_GOLD}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconCalendarEvent size={13} color={ACCENT_TAN} />
                </Box>
                <Text size="xs" c={MUTED_OLIVE} fw={500}>
                  Your scheduled interviews and appointments after submitting client information
                </Text>
              </Group>
            </Paper>
            
            {loadingAppointments ? (
              <Paper p="xl" radius="lg" style={{ textAlign: 'center', border: '1px solid #F0F0F0' }}>
                <Loader size="md" color={ACCENT_TAN} />
                <Text c={MUTED_OLIVE} size="sm" mt="sm">Loading appointments...</Text>
              </Paper>
            ) : forAppointmentData.length === 0 ? (
              <Paper p="xl" radius="lg" style={{ textAlign: 'center', border: '1px solid #F0F0F0' }}>
                <IconCalendarEvent size={40} color={MUTED_OLIVE} stroke={1.5} style={{ opacity: 0.4 }} />
                <Text size="sm" fw={600} c={CHARCOAL} mt="sm">No Appointments Yet</Text>
                <Text size="xs" c={MUTED_OLIVE} mt={4}>Submit a client information form to get started</Text>
              </Paper>
            ) : (
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                {forAppointmentData.map((item) => (
                  <ForAppointmentCard key={item.id} item={item} />
                ))}
              </SimpleGrid>
            )}
          </Tabs.Panel>

          {/* --- TAB 2: LEGAL ADVICE --- */}
          <Tabs.Panel value="advice">
            <Paper p="sm" px="md" mb="lg" radius="lg" style={{ background: '#FAFAFA', border: '1px solid #F0F0F0' }}>
              <Group gap={8}>
                <Box style={{ width: 24, height: 24, borderRadius: 6, background: `${MUTED_OLIVE}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconMessage2 size={13} color={MUTED_OLIVE} />
                </Box>
                <Text size="xs" c={MUTED_OLIVE} fw={500}>
                  Your submitted inquiries and their current status
                </Text>
              </Group>
            </Paper>
            {legalAdviceData.length === 0 ? (
              <Paper p="xl" radius="lg" style={{ textAlign: 'center', border: '1px solid #F0F0F0' }}>
                <IconMessage2 size={40} color={MUTED_OLIVE} stroke={1.5} style={{ opacity: 0.4 }} />
                <Text size="sm" fw={600} c={CHARCOAL} mt="sm">No Legal Advice Requests</Text>
                <Text size="xs" c={MUTED_OLIVE} mt={4} mb="lg">Cases marked for legal advice only will appear here</Text>
                <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                  <AdviceCard key={dummyLegalAdvice.id} item={dummyLegalAdvice} />
                </SimpleGrid>
              </Paper>
            ) : (
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                {legalAdviceData.map((item) => (
                  <AdviceCard key={item.id} item={item} />
                ))}
              </SimpleGrid>
            )}
          </Tabs.Panel>

          {/* --- TAB 3: REPRESENTATION (TRACK CASE) --- */}
          <Tabs.Panel value="representation">
            <Paper p="sm" px="md" mb="lg" radius="lg" style={{ background: '#FAFAFA', border: '1px solid #F0F0F0' }}>
              <Group justify="space-between">
                <Group gap={8}>
                  <Box style={{ width: 24, height: 24, borderRadius: 6, background: `${PRIMARY_BROWN}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IconScale size={13} color={PRIMARY_BROWN} />
                  </Box>
                  <Text size="xs" c={MUTED_OLIVE} fw={500}>
                    Active Litigation & Court Cases
                  </Text>
                </Group>
                <Badge size="sm" radius="md" variant="light" color="red">
                  Restricted
                </Badge>
              </Group>
            </Paper>
            
            {representationData.length === 0 ? (
              <Paper p="xl" radius="lg" style={{ textAlign: 'center', border: '1px solid #F0F0F0' }}>
                <IconScale size={40} color={MUTED_OLIVE} stroke={1.5} style={{ opacity: 0.4 }} />
                <Text size="sm" fw={600} c={CHARCOAL} mt="sm">No Active Court Cases</Text>
                <Text size="xs" c={MUTED_OLIVE} mt={4} mb="lg">Accepted court representation cases will appear here</Text>
                <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                  <RepresentationCard key={dummyCourtCase.id} item={dummyCourtCase} />
                </SimpleGrid>
              </Paper>
            ) : (
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                {representationData.map((item) => (
                  <RepresentationCard key={item.id} item={item} />
                ))}
              </SimpleGrid>
            )}
          </Tabs.Panel>

          {/* --- TAB 4: REJECTED CASES --- */}
          <Tabs.Panel value="rejected">
            <Paper p="sm" px="md" mb="lg" radius="lg" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
              <Group gap={8}>
                <Box style={{ width: 24, height: 24, borderRadius: 6, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconX size={13} color="#DC2626" />
                </Box>
                <Text size="xs" c="#991B1B" fw={500}>
                  Cases reviewed and rejected by the director
                </Text>
              </Group>
            </Paper>
            
            {loadingAppointments ? (
              <Paper p="xl" radius="lg" style={{ textAlign: 'center', border: '1px solid #F0F0F0' }}>
                <Loader size="md" color={ACCENT_TAN} />
                <Text c={MUTED_OLIVE} size="sm" mt="sm">Loading...</Text>
              </Paper>
            ) : rejectedData.length === 0 ? (
              <Paper p="xl" radius="lg" style={{ textAlign: 'center', border: '1px solid #F0F0F0' }}>
                <IconX size={40} color={MUTED_OLIVE} stroke={1.5} style={{ opacity: 0.4 }} />
                <Text size="sm" fw={600} c={CHARCOAL} mt="sm">No Rejected Cases</Text>
                <Text size="xs" c={MUTED_OLIVE} mt={4}>Cases rejected by the director will appear here</Text>
              </Paper>
            ) : (
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                {rejectedData.map((item) => (
                  <ForAppointmentCard key={item.id} item={item} />
                ))}
              </SimpleGrid>
            )}
          </Tabs.Panel>

          {/* --- TAB 5: DOCUMENTS --- */}
          <Tabs.Panel value="documents">
            <Paper p="sm" px="md" mb="lg" radius="lg" style={{ background: '#FAFAFA', border: '1px solid #F0F0F0' }}>
              <Group gap={8}>
                <Box style={{ width: 24, height: 24, borderRadius: 6, background: `${PRIMARY_GOLD}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconFileDescription size={13} color={ACCENT_TAN} />
                </Box>
                <Text size="xs" c={MUTED_OLIVE} fw={500}>
                  Drafting requests and document pickup schedules
                </Text>
              </Group>
            </Paper>
            {documentData.length === 0 ? (
              <Paper p="xl" radius="lg" style={{ textAlign: 'center', border: '1px solid #F0F0F0' }}>
                <IconFileDescription size={40} color={MUTED_OLIVE} stroke={1.5} style={{ opacity: 0.4 }} />
                <Text size="sm" fw={600} c={CHARCOAL} mt="sm">No Documents</Text>
                <Text size="xs" c={MUTED_OLIVE} mt={4}>Your document requests will appear here</Text>
              </Paper>
            ) : (
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
              {documentData.map((item) => (
                <DocumentCard key={item.id} item={item} />
              ))}
            </SimpleGrid>
            )}
          </Tabs.Panel>
        </Tabs>
      </Container>
      </Box>

      {/* Appointment Details Modal */}
      <Modal
        opened={appointmentModalOpened}
        onClose={() => setAppointmentModalOpened(false)}
        title={
          <Group gap={8}>
            <Box style={{ width: 28, height: 28, borderRadius: 7, background: CHARCOAL, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconCalendarEvent size={14} color="white" stroke={2.5} />
            </Box>
            <Text fw={700} size="lg" c={CHARCOAL}>Appointment Receipt</Text>
          </Group>
        }
        size="lg"
        radius="lg"
      >
        {loadingAppointment ? (
          <Center py="xl">
            <Loader size="md" color={ACCENT_TAN} />
          </Center>
        ) : appointmentDetails ? (
          <Stack gap="md" mt="md">
            {/* Header Badge */}
            <Paper p="md" radius="lg" style={{ background: `${PRIMARY_GOLD}12`, border: `1px solid ${PRIMARY_GOLD}30` }}>
              <Group justify="space-between" align="center">
                <Text fw={600} size="sm" c={CHARCOAL}>
                  {appointmentDetails.caseDetails?.appointmentType || appointmentDetails.personal?.legalMatter || 'Appointment'}
                </Text>
                <Badge size="sm" variant="filled" style={{ backgroundColor: ACCENT_TAN, color: 'white' }}>
                  {appointmentDetails.status || 'For Appointment'}
                </Badge>
              </Group>
            </Paper>

            {/* Personal Details */}
            <Paper p="lg" radius="lg" style={{ background: '#FAFAFA', border: '1px solid #F0F0F0' }}>
              <Group gap={8} mb="md">
                <Box style={{ width: 28, height: 28, borderRadius: 7, background: PRIMARY_BROWN, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconUser size={14} color="white" stroke={2.5} />
                </Box>
                <Text size="sm" fw={600} c={CHARCOAL} tt="uppercase" lts={0.5}>Personal Details</Text>
              </Group>
              <Grid gutter="sm">
                <Grid.Col span={6}>
                  <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} lts={0.3} mb={2}>Name</Text>
                  <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.fullName || appointmentDetails.name || 'N/A'}</Text>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} lts={0.3} mb={2}>Age</Text>
                  <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.age || 'N/A'}</Text>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} lts={0.3} mb={2}>Birthday</Text>
                  <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.birthday || 'N/A'}</Text>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} lts={0.3} mb={2}>Sex</Text>
                  <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.sex || 'N/A'}</Text>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} lts={0.3} mb={2}>Civil Status</Text>
                  <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.civilStatus || 'N/A'}</Text>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} lts={0.3} mb={2}>Contact Number</Text>
                  <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.contactNumber || 'N/A'}</Text>
                </Grid.Col>
                <Grid.Col span={12}>
                  <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} lts={0.3} mb={2}>Present Address</Text>
                  <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.presentAddress || 'N/A'}</Text>
                </Grid.Col>
                <Grid.Col span={12}>
                  <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} lts={0.3} mb={2}>Permanent Address</Text>
                  <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.permanentAddress || 'N/A'}</Text>
                </Grid.Col>
              </Grid>
            </Paper>

            {/* Schedule Details */}
            <Paper p="lg" radius="lg" style={{ background: '#FAFAFA', border: '1px solid #F0F0F0' }}>
              <Group gap={8} mb="md">
                <Box style={{ width: 28, height: 28, borderRadius: 7, background: '#F59F00', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconCalendarEvent size={14} color="white" stroke={2.5} />
                </Box>
                <Text size="sm" fw={600} c={CHARCOAL} tt="uppercase" lts={0.5}>Schedule</Text>
              </Group>
              <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} lts={0.3} mb={2}>Appointment Date</Text>
              <Text size="sm" c={CHARCOAL} fw={500}>
                {appointmentDetails.appointedDate ? new Date(appointmentDetails.appointedDate).toLocaleDateString('en-US', { 
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                }) : 'N/A'}
              </Text>
            </Paper>

            {/* Financial Details */}
            <Paper p="lg" radius="lg" style={{ background: '#FAFAFA', border: '1px solid #F0F0F0' }}>
              <Group gap={8} mb="md">
                <Box style={{ width: 28, height: 28, borderRadius: 7, background: '#40C057', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconFileDescription size={14} color="white" stroke={2.5} />
                </Box>
                <Text size="sm" fw={600} c={CHARCOAL} tt="uppercase" lts={0.5}>Financial Details</Text>
              </Group>
              <Grid gutter="sm">
                <Grid.Col span={6}>
                  <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} lts={0.3} mb={2}>Income Source</Text>
                  <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.currentSourceOfIncome || 'N/A'}</Text>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} lts={0.3} mb={2}>Monthly Income</Text>
                  <Text size="sm" c={CHARCOAL} fw={500}>
                    {appointmentDetails.monthlyIncome ? `₱${Number(appointmentDetails.monthlyIncome).toLocaleString()}` : 'N/A'}
                  </Text>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} lts={0.3} mb={2}>Nature of Work</Text>
                  <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.natureOfWork || 'N/A'}</Text>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} lts={0.3} mb={2}>Employer</Text>
                  <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.employerName || 'N/A'}</Text>
                </Grid.Col>
                <Grid.Col span={12}>
                  <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} lts={0.3} mb={2}>Employer Address</Text>
                  <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.employerAddress || 'N/A'}</Text>
                </Grid.Col>
              </Grid>
            </Paper>

            {/* Case Details */}
            <Paper p="lg" radius="lg" style={{ background: '#FAFAFA', border: '1px solid #F0F0F0' }}>
              <Group gap={8} mb="md">
                <Box style={{ width: 28, height: 28, borderRadius: 7, background: '#4DABF7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconGavel size={14} color="white" stroke={2.5} />
                </Box>
                <Text size="sm" fw={600} c={CHARCOAL} tt="uppercase" lts={0.5}>Case Details</Text>
              </Group>
              <Grid gutter="sm">
                <Grid.Col span={6}>
                  <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} lts={0.3} mb={2}>Party Represented</Text>
                  <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.partyRepresented || 'N/A'}</Text>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} lts={0.3} mb={2}>Case Number</Text>
                  <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.caseNumber || 'N/A'}</Text>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} lts={0.3} mb={2}>Venue</Text>
                  <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.venue || 'N/A'}</Text>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} lts={0.3} mb={2}>Present Stage</Text>
                  <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.presentStage || 'N/A'}</Text>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} lts={0.3} mb={2}>Court Division</Text>
                  <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.courtDivision || 'N/A'}</Text>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} lts={0.3} mb={2}>Presiding Officer</Text>
                  <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.presidingOfficer || 'N/A'}</Text>
                </Grid.Col>
                <Grid.Col span={12}>
                  <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} lts={0.3} mb={2}>Court Address</Text>
                  <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.courtAddress || 'N/A'}</Text>
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
        title={
          <Group gap={8}>
            <Box style={{ width: 28, height: 28, borderRadius: 7, background: CHARCOAL, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconCircleCheck size={14} color="white" stroke={2.5} />
            </Box>
            <Text fw={700} size="lg" c={CHARCOAL}>Recommendation for Action</Text>
          </Group>
        }
        size="xl"
        radius="lg"
        styles={{
          title: { fontWeight: 700 },
          body: { maxHeight: '70vh', overflowY: 'auto' },
        }}
      >
        {loadingReview ? (
          <Center py="xl">
            <Loader size="md" color={ACCENT_TAN} />
          </Center>
        ) : reviewData ? (
          <Stack gap="md" mt="sm">
            <Stepper 
              active={activeStep} 
              color={CHARCOAL}
              size="sm"
              completedIcon={<IconCircleCheck size={16} />}
              styles={{
                stepLabel: { fontWeight: 600, fontSize: '13px' },
                stepDescription: { fontSize: '11px', color: MUTED_OLIVE },
              }}
            >
              <Stepper.Step label="Interview" description="Client & Evidence" />
              <Stepper.Step label="Action" description="Lawyer & Director" />
            </Stepper>

            {/* Step 0: Interview Info */}
            {activeStep === 0 && (
              <Paper p="lg" radius="lg" style={{ background: '#FAFAFA', border: '1px solid #F0F0F0' }}>
                <Group gap={8} mb="md">
                  <Box style={{ width: 28, height: 28, borderRadius: 7, background: PRIMARY_BROWN, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IconUser size={14} color="white" stroke={2.5} />
                  </Box>
                  <Text size="sm" fw={600} c={CHARCOAL} tt="uppercase" lts={0.5}>Client Interview Information</Text>
                </Group>
                <Grid gutter="sm" mb="md">
                  <Grid.Col span={6}>
                    <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} lts={0.3} mb={2}>Date of Interview</Text>
                    <Text size="sm" fw={500} c={CHARCOAL}>{reviewData.content?.interviewInfo?.dateOfInterview || '-'}</Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} lts={0.3} mb={2}>Date Submitted</Text>
                    <Text size="sm" fw={500} c={CHARCOAL}>{reviewData.content?.interviewInfo?.dateSubmitted || '-'}</Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} lts={0.3} mb={2}>Client's Name</Text>
                    <Text size="sm" fw={500} c={CHARCOAL}>{reviewData.content?.interviewInfo?.clientName || '-'}</Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} lts={0.3} mb={2}>Interviewing Intern/s</Text>
                    <Text size="sm" fw={500} c={CHARCOAL}>{reviewData.content?.interviewInfo?.interviewingInterns || '-'}</Text>
                  </Grid.Col>
                </Grid>
                <Divider my="sm" color="#F0F0F0" />
                <Box mb="md">
                  <Text size="xs" fw={600} c={ACCENT_TAN} tt="uppercase" lts={0.3} mb={4}>Fast Facts</Text>
                  <Text size="sm" c={CHARCOAL}>{reviewData.content?.interviewInfo?.fastFacts || '-'}</Text>
                </Box>
                <Divider my="sm" color="#F0F0F0" />
                {/* Evidence tables */}
                {reviewData.content?.interviewInfo?.clientEvidence && reviewData.content.interviewInfo.clientEvidence.length > 0 && (
                  <Box mb="md">
                    <Text size="xs" fw={600} c={ACCENT_TAN} tt="uppercase" lts={0.3} mb={6}>Evidence on Hand — Client(s)</Text>
                    <Table withTableBorder withColumnBorders styles={{ th: { fontSize: '12px', color: MUTED_OLIVE, fontWeight: 600 }, td: { fontSize: '13px' } }}>
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
                    <Text size="xs" fw={600} c={ACCENT_TAN} tt="uppercase" lts={0.3} mb={6}>Evidence on Hand — Adverse Party(ies)</Text>
                    <Table withTableBorder withColumnBorders styles={{ th: { fontSize: '12px', color: MUTED_OLIVE, fontWeight: 600 }, td: { fontSize: '13px' } }}>
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
                  <Text size="xs" fw={600} c={ACCENT_TAN} tt="uppercase" lts={0.3} mb={4}>Intern's Initial Advice</Text>
                  <Text size="sm" c={CHARCOAL}>{reviewData.content?.interviewInfo?.internAdvice || '-'}</Text>
                </Box>
                <Box>
                  <Text size="xs" fw={600} c={ACCENT_TAN} tt="uppercase" lts={0.3} mb={4}>Legal Opinion</Text>
                  <Text size="sm" c={CHARCOAL}>{reviewData.content?.interviewInfo?.legalOpinion || '-'}</Text>
                </Box>
              </Paper>
            )}

            {/* Step 1: Action Info */}
            {activeStep === 1 && (
              <Paper p="lg" radius="lg" style={{ background: '#FAFAFA', border: '1px solid #F0F0F0' }}>
                <Group gap={8} mb="md">
                  <Box style={{ width: 28, height: 28, borderRadius: 7, background: '#4DABF7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IconGavel size={14} color="white" stroke={2.5} />
                  </Box>
                  <Text size="sm" fw={600} c={CHARCOAL} tt="uppercase" lts={0.5}>Supervising Lawyer & Director Action</Text>
                </Group>
                <Box mb="md">
                  <Text size="xs" fw={600} c={ACCENT_TAN} tt="uppercase" lts={0.3} mb={4}>Supervising Lawyer's Comment</Text>
                  <Text size="sm" c={CHARCOAL}>{reviewData.content?.actionInfo?.supervisingComment || '-'}</Text>
                </Box>
                <Divider my="sm" color="#F0F0F0" />
                <Box mb="md">
                  <Text size="xs" fw={600} c={ACCENT_TAN} tt="uppercase" lts={0.3} mb={4}>Director's Decision</Text>
                  <Badge 
                    size="md" 
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
                  <Text size="xs" fw={600} c={ACCENT_TAN} tt="uppercase" lts={0.3} mb={4}>Decision Note</Text>
                  <Text size="sm" c={CHARCOAL}>{reviewData.content?.actionInfo?.decisionNote || '-'}</Text>
                </Box>
                <Divider my="sm" color="#F0F0F0" />
                <Grid gutter="sm">
                  <Grid.Col span={6}>
                    <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} lts={0.3} mb={2}>Assigned To</Text>
                    <Text size="sm" fw={500} c={CHARCOAL}>{reviewData.content?.actionInfo?.assignedTo || '-'}</Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} lts={0.3} mb={2}>Supervising Lawyer</Text>
                    <Text size="sm" fw={500} c={CHARCOAL}>{reviewData.content?.actionInfo?.supervisingLawyer || '-'}</Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} lts={0.3} mb={2}>Director's Signature</Text>
                    <Text size="sm" fw={500} c={CHARCOAL}>{reviewData.content?.actionInfo?.directorSignature || '-'}</Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} lts={0.3} mb={2}>Signature Date</Text>
                    <Text size="sm" fw={500} c={CHARCOAL}>{reviewData.content?.actionInfo?.signatureDate || '-'}</Text>
                  </Grid.Col>
                </Grid>
              </Paper>
            )}

            <Group justify="space-between">
              {activeStep > 0 ? (
                <Button 
                  variant="outline" 
                  size="sm"
                  leftSection={<IconChevronLeft size={16} />}
                  onClick={() => setActiveStep(activeStep - 1)}
                  styles={{
                    root: { borderColor: '#E0E0E0', color: MUTED_OLIVE },
                  }}
                >
                  Previous
                </Button>
              ) : (
                <Box />
              )}
              
              {activeStep < 1 && (
                <Button 
                  size="sm"
                  rightSection={<IconChevronRight size={16} />}
                  onClick={() => setActiveStep(activeStep + 1)}
                  style={{ backgroundColor: CHARCOAL }}
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

      {/* Chat UI disabled per checklist. To re-enable, uncomment the Chat modal and buttons above. */}
    </>
  );
}