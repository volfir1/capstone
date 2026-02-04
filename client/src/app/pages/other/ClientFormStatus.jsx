import React, { useState, useEffect } from 'react';
import { 
  Tabs, Card, Text, Badge, Group, Button, SimpleGrid, Container, Title,
  Paper, Box, Stack, Avatar, Menu, ActionIcon, Select, TextInput, Textarea, Modal, Loader, Center,
  Grid, Divider, Radio,
} from '@mantine/core';
import ClientFormStatusCalendar from '@components/calendar/ClientFormCalendar';
import { DatePickerInput, DateInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/authContext';
import { 
  IconCalendarEvent, IconMessage2, IconFileDescription, IconClock, IconCheck, 
  IconMapPin, IconScale, IconUser, IconCheckbox, IconPhone, IconMail, IconDots,
  IconEdit, IconX, IconSearch, IconFilter, IconGavel, IconFileText, IconEye, IconCalendar,
  IconBrandGoogle,
} from '@tabler/icons-react';
import { GENDER_OPTIONS, CIVIL_STATUS_OPTIONS, DEFAULT_CITIZENSHIP } from '@utils/constants';
import { generateGoogleCalendarUrl } from '@utils/googleCalendar';

const PRIMARY_GOLD = '#D4A574';
const PRIMARY_BROWN = '#6B4423';
const MUTED_OLIVE = '#8B8B5C';
const THEMED_LIGHT_BG = '#F5F3F0';
const CHARCOAL = '#333333';
const ACCENT_TAN = '#C9A876';
const APPOINTMENT_STATUS_OPTIONS = [
  { value: 'auto-scheduled', label: 'Auto-scheduled' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'legal-advice', label: 'Legal Advice' },
  { value: 'court-case', label: 'Court Case' },
];

export default function StaffAppointmentManager() {
  const { userData } = useAuth();
  const [userRole] = useState('attorney');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [rescheduleModal, setRescheduleModal] = useState(false);
  const [dateDetailsModal, setDateDetailsModal] = useState(false);
  const [editEventModal, setEditEventModal] = useState(false);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [isUpdatingEvent, setIsUpdatingEvent] = useState(false);
  const [isDeletingEvent, setIsDeletingEvent] = useState(false);
  const [eventEditForm, setEventEditForm] = useState({
    title: '',
    description: '',
    eventDate: null,
    eventType: 'appointment',
    location: '',
    clientName: '',
    assignedTo: '',
    priority: 'Medium',
  });
  const [newDate, setNewDate] = useState(null);
  const [newTime, setNewTime] = useState('');
  const [pendingAppointments, setPendingAppointments] = useState([]);
  const [scheduledAppointments, setScheduledAppointments] = useState([]);
  const [adviceRequests, setAdviceRequests] = useState([]);
  const [documentRequests, setDocumentRequests] = useState([]);
  const [caseRepresentation, setCaseRepresentation] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const navigate = useNavigate();
  
  // Appointment Details Modal states
  const [appointmentModalOpened, setAppointmentModalOpened] = useState(false);
  const [appointmentDetails, setAppointmentDetails] = useState(null);
  const [loadingAppointment, setLoadingAppointment] = useState(false);
  const [appointmentEditMode, setAppointmentEditMode] = useState(false);
  const [appointmentSaving, setAppointmentSaving] = useState(false);
  const [appointmentForm, setAppointmentForm] = useState({
    status: '',
    appointedDate: '',
    appointmentTime: '',
    fullName: '',
    age: '',
    birthday: '',
    sex: '',
    civilStatus: '',
    citizenship: '',
    contactNumber: '',
    cellphoneNumber: '',
    telephoneNumber: '',
    email: '',
    presentAddress: '',
    permanentAddress: '',
    spouseName: '',
    throughRelator: 'no',
    relatorName: '',
    relationshipToClient: '',
    relatorContactNumber: '',
    currentSourceOfIncome: '',
    monthlyIncome: '',
    natureOfWork: '',
    employerName: '',
    employerAddress: '',
    employerTelephone: '',
    spouseSourceOfIncome: '',
    spouseMonthlyIncome: '',
    spouseEmployerAddress: '',
    totalCombinedIncome: '',
    partyRepresented: '',
    venue: '',
    caseNumber: '',
    presentStage: '',
    caseNature: '',
    courtDivision: '',
    courtAddress: '',
    courtPhoneNumber: '',
    presidingOfficer: '',
    adverseParty: '',
    adversePartyAddress: '',
    adversePartyCounsel: '',
    adversePartyCounselAddress: '',
    adversePartyCounselPhone: '',
    caseDescription: '',
    appointmentType: '',
  });

  // Auto-calculate total combined monthly income
  useEffect(() => {
    const parseIncome = (value) => {
      if (value === undefined || value === null || value === '') return 0;
      const cleaned = value.toString().replace(/,/g, '');
      const parsed = parseFloat(cleaned);
      return Number.isFinite(parsed) ? parsed : 0;
    };

    const monthly = parseIncome(appointmentForm.monthlyIncome);
    const spouseMonthly = parseIncome(appointmentForm.spouseMonthlyIncome);
    const total = monthly + spouseMonthly;
    const currentTotal = parseIncome(appointmentForm.totalCombinedIncome);

    if (Number.isFinite(total) && total !== currentTotal) {
      setAppointmentForm(prev => ({
        ...prev,
        totalCombinedIncome: total ? total.toString() : ''
      }));
    }
  }, [appointmentForm.monthlyIncome, appointmentForm.spouseMonthlyIncome]);

  // Fetch all data function
  const loadAllData = async () => {
    setLoading(true);
    try {
      const { default: apiClient } = await import('@config/api/apiClient');
      
      // Fetch reviews to filter out appointments with existing reviews
      let appointmentsWithReviews = new Set();
      try {
        const reviewsResp = await apiClient.get('/reviews');
        const reviewsData = reviewsResp?.data?.data ?? reviewsResp?.data ?? [];
        const reviewsArray = Array.isArray(reviewsData) ? reviewsData : [];
        // Create a set of caseIds that have reviews
        appointmentsWithReviews = new Set(reviewsArray.map(r => r.caseId).filter(Boolean));
      } catch (err) {
        console.error('Failed to load reviews for filtering:', err);
      }
      
      // Fetch pending appointments (auto-scheduled)
      try {
        const pendingResp = await apiClient.get('/clientsinfo');
        const docs = pendingResp?.data || [];
        const mapped = (Array.isArray(docs) ? docs : [])
          .filter(d => {
            // Filter out appointments that have a review submitted
            const appointmentId = d._id;
            return !appointmentsWithReviews.has(appointmentId);
          })
          .map((d, idx) => ({
            id: d._id || idx,
            clientName: d.fullName || d.personal?.fullName || `${d.personal?.firstName || ''} ${d.personal?.lastName || ''}`.trim() || '',
            type: 'Initial Interview',
            submittedDate: d.createdAt ? new Date(d.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '',
            scheduledDate: d.appointedDate ? new Date(d.appointedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'TBD',
            rawAppointedDate: d.appointedDate || null,
            appointmentTime: d.appointmentTime || '',
            status: d.status || 'auto-scheduled',
            contactNumber: d.personal?.contactNumber || '+63 000 000 0000',
            email: d.personal?.email || 'email@sola.com',
            assignedTo: d.assignedTo || 'Atty. Maria Cruz',
            location: d.caseDetails?.location || 'SOLA Office',
            purpose: d.caseDetails?.purpose || `Client information gathering for ${d.fullName}`,
            priority: d.priority || 'High',
          }));
        setPendingAppointments(mapped);
      } catch (err) {
        console.error('Failed to load pending appointments:', err);
      }

      // Fetch events
      try {
        const eventsResp = await apiClient.get('/events');
        const eventsData = eventsResp?.data || [];
        const mappedEvents = (Array.isArray(eventsData) ? eventsData : []).map((e, idx) => ({
          id: e._id || idx,
          clientName: e.clientName || 'Event',
          type: e.eventType || 'other',
          rawAppointedDate: e.eventDate,
          scheduledDate: e.eventDate ? new Date(e.eventDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'TBD',
          location: e.location || 'TBD',
          priority: e.priority || 'Medium',
          status: e.status || 'scheduled',
          description: e.description || '',
          assignedTo: e.assignedTo || '',
          contactNumber: '',
          email: '',
          purpose: e.title || '',
        }));
        setEvents(mappedEvents);
      } catch (err) {
        console.error('Failed to load events:', err);
      }

      // NOTE: These endpoints are not yet implemented on the backend
      // Uncomment when the backend routes are ready
      
      // Fetch scheduled appointments
      // try {
      //   const scheduledResp = await apiClient.get('/appointments/scheduled');
      //   const scheduled = scheduledResp?.data || [];
      //   setScheduledAppointments(Array.isArray(scheduled) ? scheduled : []);
      // } catch (err) {
      //   console.error('Failed to load scheduled appointments:', err);
      //   setScheduledAppointments([]);
      // }

      // Fetch advice requests
      // try {
      //   const adviceResp = await apiClient.get('/advice-requests');
      //   const advice = adviceResp?.data || [];
      //   setAdviceRequests(Array.isArray(advice) ? advice : []);
      // } catch (err) {
      //   console.error('Failed to load advice requests:', err);
      //   setAdviceRequests([]);
      // }

      // Fetch document requests
      // try {
      //   const docsResp = await apiClient.get('/document-requests');
      //   const docs = docsResp?.data || [];
      //   setDocumentRequests(Array.isArray(docs) ? docs : []);
      // } catch (err) {
      //   console.error('Failed to load document requests:', err);
      //   setDocumentRequests([]);
      // }

      // Fetch case representation
      // try {
      //   const caseResp = await apiClient.get('/case-representation');
      //   const cases = caseResp?.data || [];
      //   setCaseRepresentation(Array.isArray(cases) ? cases : []);
      // } catch (err) {
      //   console.error('Failed to load case representation:', err);
      //   setCaseRepresentation([]);
      // }
      } catch (err) {
        console.error('Failed to initialize apiClient:', err);
        notifications.show({
          title: 'Error',
          message: 'Failed to load data from server.',
          color: 'red',
        });
      } finally {
      setLoading(false);
    }
  };

  // Fetch all data on mount
  useEffect(() => {
    loadAllData();
  }, []);

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setDateDetailsModal(true);
  };

  const getAppointmentsForDate = (date) => {
    if (!date) return [];
    const allItems = [...pendingAppointments, ...events];
    return allItems.filter(item => {
      if (!item.rawAppointedDate) return false;
      const itemDate = new Date(item.rawAppointedDate);
      return itemDate.toDateString() === date.toDateString();
    });
  };

  const handleEditEvent = (event) => {
    // Find the full event data from events array
    const fullEvent = events.find(e => e.id === event.id);
    if (!fullEvent) return;

    setSelectedEvent(fullEvent);
    setEventEditForm({
      title: fullEvent.purpose || '',
      description: fullEvent.description || '',
      eventDate: fullEvent.rawAppointedDate ? new Date(fullEvent.rawAppointedDate) : null,
      eventType: fullEvent.type || 'appointment',
      location: fullEvent.location || '',
      clientName: fullEvent.clientName || '',
      assignedTo: fullEvent.assignedTo || '',
      priority: fullEvent.priority || 'Medium',
    });
    setEditEventModal(true);
    setDateDetailsModal(false);
  };

  const handleUpdateEvent = async () => {
    if (!eventEditForm.title || !eventEditForm.eventDate || !selectedEvent) {
      notifications.show({
        title: 'Error',
        message: 'Title and date are required',
        color: 'red',
      });
      return;
    }

    setIsUpdatingEvent(true);
    try {
      const { default: apiClient } = await import('@config/api/apiClient');
      await apiClient.put(`/events/${selectedEvent.id}`, eventEditForm);
      
      notifications.show({
        title: 'Success',
        message: 'Event updated successfully',
        color: 'green',
        icon: <IconCheck size={18} />,
      });
      
      setEditEventModal(false);
      setSelectedEvent(null);
      await loadAllData();
    } catch (error) {
      console.error('Error updating event:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to update event',
        color: 'red',
      });
    } finally {
      setIsUpdatingEvent(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!eventToDelete) return;

    setIsDeletingEvent(true);
    try {
      const { default: apiClient } = await import('@config/api/apiClient');
      await apiClient.delete(`/events/${eventToDelete.id}`);
      
      notifications.show({
        title: 'Success',
        message: 'Event deleted successfully',
        color: 'green',
        icon: <IconCheck size={18} />,
      });
      
      setDeleteConfirmModal(false);
      setDateDetailsModal(false);
      setEventToDelete(null);
      await loadAllData();
    } catch (error) {
      console.error('Error deleting event:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to delete event',
        color: 'red',
      });
    } finally {
      setIsDeletingEvent(false);
    }
  };

  const handleOpenEditAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    if (appointment?.rawAppointedDate) {
      try {
        setNewDate(new Date(appointment.rawAppointedDate));
      } catch (e) {
        setNewDate(null);
      }
    } else {
      setNewDate(null);
    }
    // Set existing appointment time if available
    setNewTime(appointment?.appointmentTime || '');
    setRescheduleModal(true);
  };

  const handleUpdateAppointment = async () => {
    if (!newDate || !selectedAppointment?.id) {
      notifications.show({
        title: 'Error',
        message: 'Please select a valid date and time.',
        color: 'red',
      });
      return;
    }

    setIsUpdating(true);
    
    // Ensure newDate is a valid Date object
    let dateObj = newDate;
    if (!(newDate instanceof Date)) {
      try {
        dateObj = new Date(newDate);
      } catch (e) {
        notifications.show({
          title: 'Error',
          message: 'Invalid date format.',
          color: 'red',
        });
        setIsUpdating(false);
        return;
      }
    }
    
    const iso = dateObj.toISOString();
    const payload = { 
      appointedDate: iso,
      appointmentTime: newTime || ''
    };
    console.log('Updating appointment:', selectedAppointment.id, 'with payload:', payload);

    try {
      const { default: apiClient } = await import('@config/api/apiClient');
      
      // Try the primary endpoint
      const response = await apiClient.put(`/clientsinfo/${selectedAppointment.id}`, payload);
      console.log('Update response:', response);
      
      if (response && (response.status >= 200 && response.status < 300)) {
        setIsUpdating(false);
        updateLocalAppointment(iso);
        return;
      }
    } catch (error) {
      console.error('Error with /clientsinfo endpoint:', error);
      
      try {
        const { default: apiClient } = await import('@config/api/apiClient');
        const response = await apiClient.put(`/api/clientsinfo/${selectedAppointment.id}`, payload);
        console.log('Update response:', response);
        
        if (response && (response.status >= 200 && response.status < 300)) {
          setIsUpdating(false);
          updateLocalAppointment(iso);
          return;
        }
      } catch (error2) {
        console.error('Error with /api/clientsinfo endpoint:', error2);
      }
    }

    setIsUpdating(false);
    notifications.show({
      title: 'Error',
      message: 'Failed to update appointment. Please check your server connection.',
      color: 'red',
      autoClose: 6000,
    });
  };

  const updateLocalAppointment = (iso) => {
    const formattedDate = new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    setPendingAppointments((prev) =>
      prev.map((apt) =>
        apt.id === selectedAppointment.id
          ? { ...apt, scheduledDate: formattedDate, rawAppointedDate: iso, appointmentTime: newTime }
          : apt
      )
    );

    setRescheduleModal(false);
    setNewDate(null);
    setNewTime('');
    setSelectedAppointment(null);

    notifications.show({
      title: 'Success',
      message: `Appointment updated to ${formattedDate}`,
      color: 'green',
      icon: <IconCheck size={18} />,
      autoClose: 5000,
    });
  };

  const toInputDate = (value) => {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const syncAppointmentFormFromDetails = (details) => {
    const hasRelatorData = details?.relatorName || details?.relationshipToClient;
    return {
      status: details?.status || '',
      appointedDate: toInputDate(details?.appointedDate),
      appointmentTime: details?.appointmentTime || '',
      fullName: details?.fullName || details?.name || '',
      age: details?.age !== undefined && details?.age !== null ? String(details.age) : '',
      birthday: toInputDate(details?.birthday),
      sex: details?.sex || '',
      civilStatus: details?.civilStatus || '',
      citizenship: details?.citizenship || '',
      contactNumber: details?.contactNumber || '',
      cellphoneNumber: details?.cellphoneNumber || '',
      telephoneNumber: details?.telephoneNumber || '',
      email: details?.email || '',
      presentAddress: details?.presentAddress || '',
      permanentAddress: details?.permanentAddress || '',
      spouseName: details?.spouseName || '',
      throughRelator: details?.throughRelator || (hasRelatorData ? 'yes' : 'no'),
      relatorName: details?.relatorName || '',
      relationshipToClient: details?.relationshipToClient || '',
      relatorContactNumber: details?.relatorContactNumber || '',
      currentSourceOfIncome: details?.currentSourceOfIncome || '',
      monthlyIncome: details?.monthlyIncome !== undefined && details?.monthlyIncome !== null ? String(details.monthlyIncome) : '',
      natureOfWork: details?.natureOfWork || '',
      employerName: details?.employerName || '',
      employerAddress: details?.employerAddress || '',
      partyRepresented: details?.partyRepresented || '',
      venue: details?.venue || '',
      presentStage: details?.presentStage || '',
      courtDivision: details?.courtDivision || '',
      courtAddress: details?.courtAddress || '',
      courtPhoneNumber: details?.courtPhoneNumber || '',
      presidingOfficer: details?.presidingOfficer || '',
      adverseParty: details?.adverseParty || '',
      adversePartyAddress: details?.adversePartyAddress || '',
      adversePartyCounsel: details?.adversePartyCounsel || '',
      adversePartyCounselAddress: details?.adversePartyCounselAddress || '',
      adversePartyCounselPhone: details?.adversePartyCounselPhone || '',
      employerTelephone: details?.employerTelephone || '',
      spouseSourceOfIncome: details?.spouseSourceOfIncome || '',
      spouseMonthlyIncome: details?.spouseMonthlyIncome !== undefined && details?.spouseMonthlyIncome !== null ? String(details.spouseMonthlyIncome) : '',
      spouseEmployerAddress: details?.spouseEmployerAddress || '',
      totalCombinedIncome: details?.totalCombinedIncome !== undefined && details?.totalCombinedIncome !== null ? String(details.totalCombinedIncome) : '',
      caseNumber: details?.caseNumber || '',
      caseDescription: details?.caseDescription || '',
      caseNature: details?.caseNature || details?.natureOfCase || '',
      appointmentType: details?.caseDetails?.appointmentType || details?.appointmentType || details?.personal?.legalMatter || '',
    };
  };

  // Function to fetch and display appointment details
  const openAppointmentModal = async (appointmentId) => {
    setAppointmentModalOpened(true);
    setLoadingAppointment(true);
    setAppointmentEditMode(false);
    setAppointmentSaving(false);
    
    try {
      const { default: apiClient } = await import('@config/api/apiClient');
      const response = await apiClient.get(`/clientsinfo/${appointmentId}`);
      console.log('Appointment details:', response.data);
      setAppointmentDetails(response.data);
      setAppointmentForm(syncAppointmentFormFromDetails(response.data));
    } catch (error) {
      console.error('Error fetching appointment details:', error);
    } finally {
      setLoadingAppointment(false);
    }
  };

  const handleEnterAppointmentEdit = () => {
    if (!appointmentDetails) return;
    setAppointmentForm(syncAppointmentFormFromDetails(appointmentDetails));
    setAppointmentEditMode(true);
  };

  const handleCancelAppointmentEdit = () => {
    setAppointmentEditMode(false);
    setAppointmentForm(syncAppointmentFormFromDetails(appointmentDetails));
  };

  const handleSaveAppointmentDetails = async () => {
    if (!appointmentDetails?._id && !appointmentDetails?.id) return;

    const payload = {
      status: appointmentForm.status || undefined,
      appointedDate: appointmentForm.appointedDate || undefined,
      appointmentTime: appointmentForm.appointmentTime || '',
      fullName: appointmentForm.fullName || undefined,
      name: appointmentForm.fullName || undefined,
      age: appointmentForm.age ? Number(appointmentForm.age) : undefined,
      birthday: appointmentForm.birthday || undefined,
      sex: appointmentForm.sex || undefined,
      civilStatus: appointmentForm.civilStatus || undefined,
      contactNumber: appointmentForm.contactNumber || undefined,
      cellphoneNumber: appointmentForm.cellphoneNumber || undefined,
      telephoneNumber: appointmentForm.telephoneNumber || undefined,
      email: appointmentForm.email || undefined,
      presentAddress: appointmentForm.presentAddress || undefined,
      permanentAddress: appointmentForm.permanentAddress || undefined,
      citizenship: appointmentForm.citizenship || undefined,
      spouseName: appointmentForm.spouseName || undefined,
      throughRelator: appointmentForm.throughRelator || 'no',
      relatorName: appointmentForm.throughRelator === 'yes' ? (appointmentForm.relatorName || undefined) : undefined,
      relationshipToClient: appointmentForm.throughRelator === 'yes' ? (appointmentForm.relationshipToClient || undefined) : undefined,
      relatorContactNumber: appointmentForm.relatorContactNumber || undefined,
      currentSourceOfIncome: appointmentForm.currentSourceOfIncome || undefined,
      monthlyIncome: appointmentForm.monthlyIncome ? Number(appointmentForm.monthlyIncome) : undefined,
      natureOfWork: appointmentForm.natureOfWork || undefined,
      employerName: appointmentForm.employerName || undefined,
      employerAddress: appointmentForm.employerAddress || undefined,
      employerTelephone: appointmentForm.employerTelephone || undefined,
      spouseSourceOfIncome: appointmentForm.spouseSourceOfIncome || undefined,
      spouseMonthlyIncome: appointmentForm.spouseMonthlyIncome ? Number(appointmentForm.spouseMonthlyIncome) : undefined,
      spouseEmployerAddress: appointmentForm.spouseEmployerAddress || undefined,
      totalCombinedIncome: appointmentForm.totalCombinedIncome ? Number(appointmentForm.totalCombinedIncome) : undefined,
      partyRepresented: appointmentForm.partyRepresented || undefined,
      venue: appointmentForm.venue || undefined,
      caseNumber: appointmentForm.caseNumber || undefined,
      presentStage: appointmentForm.presentStage || undefined,
      courtDivision: appointmentForm.courtDivision || undefined,
      courtAddress: appointmentForm.courtAddress || undefined,
      courtPhoneNumber: appointmentForm.courtPhoneNumber || undefined,
      presidingOfficer: appointmentForm.presidingOfficer || undefined,
      adverseParty: appointmentForm.adverseParty || undefined,
      adversePartyAddress: appointmentForm.adversePartyAddress || undefined,
      adversePartyCounsel: appointmentForm.adversePartyCounsel || undefined,
      adversePartyCounselAddress: appointmentForm.adversePartyCounselAddress || undefined,
      adversePartyCounselPhone: appointmentForm.adversePartyCounselPhone || undefined,
      employerTelephone: appointmentForm.employerTelephone || undefined,
      spouseSourceOfIncome: appointmentForm.spouseSourceOfIncome || undefined,
      spouseMonthlyIncome: appointmentForm.spouseMonthlyIncome ? Number(appointmentForm.spouseMonthlyIncome) : undefined,
      spouseEmployerAddress: appointmentForm.spouseEmployerAddress || undefined,
      totalCombinedIncome: appointmentForm.totalCombinedIncome ? Number(appointmentForm.totalCombinedIncome) : undefined,
      caseNumber: appointmentForm.caseNumber || undefined,
      caseDescription: appointmentForm.caseDescription || undefined,
      caseNature: appointmentForm.caseNature || undefined,
      natureOfCase: appointmentForm.caseNature || undefined,
      appointmentType: appointmentForm.appointmentType || undefined,
    };

    setAppointmentSaving(true);

    try {
      const { default: apiClient } = await import('@config/api/apiClient');
      const resp = await apiClient.put(`/clientsinfo/${appointmentDetails._id || appointmentDetails.id}`, payload);
      const updated = resp?.data || { ...appointmentDetails, ...payload };
      setAppointmentDetails(updated);
      setAppointmentForm(syncAppointmentFormFromDetails(updated));
      setAppointmentEditMode(false);
      notifications.show({ title: 'Updated', message: 'Appointment details saved.', color: 'green' });
      await loadAllData();
    } catch (err) {
      console.error('Error updating appointment details:', err);
      notifications.show({ title: 'Error', message: 'Failed to save appointment details.', color: 'red' });
    } finally {
      setAppointmentSaving(false);
    }
  };

  const PendingAppointmentCard = ({ item }) => (
    <Card shadow="xs" padding="lg" radius="lg" style={{ border: `2px solid ${PRIMARY_GOLD}` }}>
      <Group justify="space-between" mb="md">
        <Group gap="sm">
          <Avatar size={48} radius="md" color={PRIMARY_BROWN}><IconUser size={24} /></Avatar>
          <Box>
            <Text fw={700} size="md" c={CHARCOAL}>{item.clientName}</Text>
            <Text size="xs" c={MUTED_OLIVE}>{item.type}</Text>
          </Box>
        </Group>
        <Menu shadow="md" width={200}>
          <Menu.Target><ActionIcon variant="subtle" color="gray"><IconDots size={18} /></ActionIcon></Menu.Target>
          <Menu.Dropdown>
            <Menu.Item leftSection={<IconEdit size={16} />} onClick={() => handleOpenEditAppointment(item)}>Edit Appointment</Menu.Item>
            <Menu.Item leftSection={<IconPhone size={16} />}>Call Client</Menu.Item>
            <Menu.Item leftSection={<IconMail size={16} />}>Send Email</Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>

      <Paper p="lg" radius="md" mb="md" style={{ backgroundColor: `${PRIMARY_GOLD}10`, border: `1px solid ${PRIMARY_GOLD}` }}>
        <Stack gap="sm">
          <Group gap="xs">
            <IconCalendarEvent size={14} color={PRIMARY_BROWN} />
            <Text size="sm" fw={600} c={CHARCOAL}>
              {item.scheduledDate}
              {item.appointmentTime && ` at ${
                // Convert 24-hour to 12-hour format
                (() => {
                  const [hours, minutes] = item.appointmentTime.split(':');
                  const hour = parseInt(hours);
                  const ampm = hour >= 12 ? 'PM' : 'AM';
                  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                  return `${displayHour}:${minutes} ${ampm}`;
                })()
              }`}
            </Text>
          </Group>
          <Group gap="xs">
            <IconMapPin size={14} color={ACCENT_TAN} />
            <Text size="sm" c={CHARCOAL}>{item.location}</Text>
          </Group>
          <Group gap="xs">
            <IconUser size={14} color={PRIMARY_GOLD} />
            <Text size="sm" c={CHARCOAL}>{item.assignedTo}</Text>
          </Group>
        </Stack>
      </Paper>

      <Stack gap="xs" mb="md">
        <Group gap="xs">
          <IconPhone size={14} color={MUTED_OLIVE} />
          <Text size="xs" c={CHARCOAL}>{item.contactNumber}</Text>
        </Group>
        <Group gap="xs">
          <IconMail size={14} color={MUTED_OLIVE} />
          <Text size="xs" c={CHARCOAL}>{item.email}</Text>
        </Group>
      </Stack>

      <Paper p="md" radius="md" mb="md" style={{ backgroundColor: THEMED_LIGHT_BG }}>
        <Text size="xs" c={MUTED_OLIVE} mb={4}>Purpose</Text>
        <Text size="sm" c={CHARCOAL}>{item.purpose}</Text>
      </Paper>

      <Group gap="xs" mb="md">
        <Badge size="sm" color={item.priority === 'High' ? 'red' : 'yellow'}>
          {item.priority} Priority
        </Badge>
      </Group>

      {/* Show buttons based on status */}
      {item.status === 'auto-scheduled' ? (
        <SimpleGrid cols={2} spacing="sm">
          <Button 
            size="md" 
            variant="filled" 
            leftSection={<IconFileText size={18} />} 
            onClick={() => {
              // Get current date for auto-fill
              const today = new Date();
              const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
              
              // Get logged-in intern's name and ID
              const internName = userData?.firstName && userData?.lastName 
                ? `${userData.firstName} ${userData.lastName}` 
                : userData?.username || userData?.displayName || '';
              const internId = userData?._id || userData?.id || null;
              
              // Navigate to recommendation page with client info and current date
              navigate(`/admin/recommendation/${item.id}`, { 
                state: { 
                  caseId: item.id,
                  clientInfo: {
                    clientName: item.clientName,
                    dateOfInterview: formattedDate,
                    dateSubmitted: formattedDate,
                    interviewingInterns: internName,
                    interviewingInternsId: internId
                  }
                } 
              });
            }}
            style={{ backgroundColor: PRIMARY_GOLD, color: PRIMARY_BROWN }}
          >
            Recommend
          </Button>
          <Button 
            size="md" 
            variant="light" 
            leftSection={<IconEdit size={18} />} 
            onClick={() => handleOpenEditAppointment(item)} 
            style={{ backgroundColor: THEMED_LIGHT_BG, color: PRIMARY_BROWN }}
          >
            Edit
          </Button>
        </SimpleGrid>
      ) : (
        <Button 
          fullWidth 
          size="md" 
          variant="outline" 
          leftSection={<IconFileText size={18} />}
          onClick={() => navigate(`/admin/recommendation/${item.id}`, { state: { caseId: item.id } })}
          style={{ borderColor: PRIMARY_GOLD, color: PRIMARY_BROWN }}
        >
          View Recommendation
        </Button>
      )}
      
      {/* View Full Details Button */}
      <Button
        fullWidth
        size="md"
        variant="light"
        mt="sm"
        leftSection={<IconEye size={18} />}
        onClick={() => openAppointmentModal(item.id)}
        style={{
          backgroundColor: THEMED_LIGHT_BG,
          color: PRIMARY_BROWN,
          fontWeight: 600,
        }}
      >
        View Full Receipt
      </Button>
    </Card>
  );

  const ScheduledAppointmentCard = ({ item }) => (
    <Card shadow="xs" padding="lg" radius="lg" style={{ border: `2px solid ${PRIMARY_GOLD}` }}>
      <Group justify="space-between" mb="md">
        <Group gap="sm">
          <Avatar size={48} radius="md" color={PRIMARY_BROWN}><IconUser size={24} /></Avatar>
          <Box>
            <Text fw={700} size="md" c={CHARCOAL}>{item.clientName}</Text>
            <Text size="xs" c={MUTED_OLIVE}>{item.type || 'Appointment'}</Text>
          </Box>
        </Group>
      </Group>
      <Paper p="lg" radius="md" mb="md" style={{ backgroundColor: `${PRIMARY_GOLD}10`, border: `1px solid ${PRIMARY_GOLD}` }}>
        <Stack gap="sm">
          <Group gap="xs">
            <IconCalendarEvent size={14} color={PRIMARY_BROWN} />
            <Text size="sm" fw={600} c={CHARCOAL}>{item.scheduledDate}</Text>
          </Group>
          <Group gap="xs">
            <IconMapPin size={14} color={ACCENT_TAN} />
            <Text size="sm" c={CHARCOAL}>{item.location}</Text>
          </Group>
        </Stack>
      </Paper>
      <Button fullWidth size="md" variant="light" style={{ backgroundColor: THEMED_LIGHT_BG, color: PRIMARY_BROWN }}>View Details</Button>
    </Card>
  );

  const AdviceRequestCard = ({ item }) => (
    <Card shadow="xs" padding="lg" radius="lg" style={{ border: '1px solid #F0F0F0' }}>
      <Group justify="space-between" mb="md">
        <Group gap="sm">
          <Avatar size={48} radius="md" color={MUTED_OLIVE}><IconMessage2 size={24} /></Avatar>
          <Box>
            <Text fw={700} size="md" c={CHARCOAL}>{item.clientName}</Text>
            <Text size="xs" c={MUTED_OLIVE}>{item.topic}</Text>
          </Box>
        </Group>
        <Badge size="lg" color={item.status === 'Draft Ready' ? PRIMARY_BROWN : 'gray'}>{item.status}</Badge>
      </Group>
      <Paper p="md" radius="md" mb="md" style={{ backgroundColor: THEMED_LIGHT_BG }}>
        <Text size="xs" c={MUTED_OLIVE} mb={4}>Description</Text>
        <Text size="sm" c={CHARCOAL}>{item.description}</Text>
      </Paper>
      <Button fullWidth size="md" style={{ backgroundColor: PRIMARY_BROWN }}>Review</Button>
    </Card>
  );

  const DocumentRequestCard = ({ item }) => (
    <Card shadow="xs" padding="lg" radius="lg" style={{ border: '1px solid #F0F0F0' }}>
      <Group justify="space-between" mb="md">
        <Group gap="sm">
          <Avatar size={48} radius="md" color={PRIMARY_GOLD}><IconFileDescription size={24} /></Avatar>
          <Box>
            <Text fw={700} size="md" c={CHARCOAL}>{item.clientName}</Text>
            <Text size="xs" c={MUTED_OLIVE}>{item.docType}</Text>
          </Box>
        </Group>
        <Badge size="lg" color={item.status === 'Ready for Pickup' ? 'green' : 'yellow'}>{item.status}</Badge>
      </Group>
      <Stack gap="xs" mb="md">
        <Group gap="xs">
          <IconCalendarEvent size={14} color={MUTED_OLIVE} />
          <Text size="xs" c={MUTED_OLIVE}>Requested: {item.dateRequested}</Text>
        </Group>
      </Stack>
      <Button fullWidth size="md" style={{ backgroundColor: item.status === 'Ready for Pickup' ? MUTED_OLIVE : PRIMARY_BROWN }}>
        {item.status === 'Ready for Pickup' ? 'Mark as Collected' : 'Update Status'}
      </Button>
    </Card>
  );

  const CaseRepresentationCard = ({ item }) => (
    <Card shadow="xs" padding="lg" radius="lg" style={{ border: `2px solid ${PRIMARY_BROWN}` }}>
      <Group justify="space-between" mb="md">
        <Group gap="sm">
          <Avatar size={48} radius="md" color={PRIMARY_BROWN}><IconGavel size={24} /></Avatar>
          <Box>
            <Text fw={700} size="md" c={CHARCOAL}>{item.clientName}</Text>
            <Text size="xs" c={MUTED_OLIVE}>{item.type || item.caseType || 'Court Case'}</Text>
          </Box>
        </Group>
      </Group>
      <Paper p="md" radius="md" mb="md" style={{ backgroundColor: THEMED_LIGHT_BG }}>
        <Text size="xs" c={MUTED_OLIVE} mb={4}>Case Information</Text>
        <Text size="sm" fw={600} c={CHARCOAL}>{item.purpose || item.caseTitle || 'Case Details'}</Text>
        {item.caseNumber && (
          <Badge size="sm" variant="light" color={PRIMARY_BROWN} style={{ fontFamily: 'monospace', marginTop: '8px' }}>
            {item.caseNumber}
          </Badge>
        )}
      </Paper>
      <Stack gap="sm" mb="md">
        {item.scheduledDate && (
          <Group gap="xs">
            <IconCalendarEvent size={14} color={CHARCOAL} />
            <Text size="sm" c={CHARCOAL}>{item.scheduledDate}</Text>
          </Group>
        )}
        <Group gap="xs">
          <IconMapPin size={14} color={CHARCOAL} />
          <Text size="sm" c={CHARCOAL}>{item.location}</Text>
        </Group>
      </Stack>
      <Button 
        fullWidth 
        size="md" 
        variant="outline"
        leftSection={<IconFileText size={18} />}
        onClick={() => navigate(`/admin/recommendation/${item.id}`, { state: { caseId: item.id } })}
        style={{ borderColor: PRIMARY_BROWN, color: PRIMARY_BROWN }}
      >
        View Case Details
      </Button>
    </Card>
  );

  const appointmentStatusLabel = appointmentEditMode
    ? (appointmentForm.status || appointmentDetails?.status || 'For Appointment')
    : (appointmentDetails?.status || 'For Appointment');

  if (loading) {
    return (
      <Box bg={THEMED_LIGHT_BG} mih="100vh" py="xl">
        <Center mih="100vh">
          <Loader />
        </Center>
      </Box>
    );
  }

  return (
    <Box bg={THEMED_LIGHT_BG} mih="100vh" py="xl">
      <Container size="xl">
        <Paper shadow="xs" p="xl" mb="xl" radius="lg" style={{ background: PRIMARY_BROWN, border: 'none' }}>
          <Group gap="md" align="center">
            <Box style={{ width: 48, height: 48, borderRadius: '12px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconScale size={24} color={PRIMARY_BROWN} stroke={2.5} />
            </Box>
            <Box>
              <Title order={2} c="white" mb={4}>Staff Portal - {userRole.charAt(0).toUpperCase() + userRole.slice(1)}</Title>
              <Text c="rgba(255, 255, 255, 0.9)" size="sm" fw={500}>Manage client appointments and requests</Text>
            </Box>
          </Group>
        </Paper>

        {/* Appointment Calendar */}
        <ClientFormStatusCalendar 
          appointments={[
            ...pendingAppointments.map(apt => ({
              id: apt.id,
              clientName: apt.clientName,
              type: apt.type,
              rawAppointedDate: apt.rawAppointedDate,
              scheduledDate: apt.scheduledDate,
              location: apt.location,
              purpose: apt.purpose,
              date: apt.rawAppointedDate ? new Date(apt.rawAppointedDate) : null,
            })),
            ...events.map(evt => ({
              id: evt.id,
              clientName: evt.clientName,
              type: evt.type,
              rawAppointedDate: evt.rawAppointedDate,
              scheduledDate: evt.scheduledDate,
              location: evt.location,
              purpose: evt.purpose,
              date: evt.rawAppointedDate ? new Date(evt.rawAppointedDate) : null,
            }))
          ].filter(apt => apt.date)}
          onEventCreated={loadAllData}
          onDateClick={handleDateClick}
        />

        <Paper shadow="xs" p="lg" mb="xl" radius="lg" bg="white">
          <Group>
            <TextInput placeholder="Search clients..." leftSection={<IconSearch size={16} />} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ flex: 1 }} />
            <Select placeholder="Filter by status" leftSection={<IconFilter size={16} />} data={['All', 'Pending', 'Scheduled', 'Completed']} value={filterStatus} onChange={setFilterStatus} w={200} />
          </Group>
        </Paper>

        <Tabs defaultValue="pending" variant="pills" styles={{ tab: { padding: '12px 24px', fontWeight: 600, '&[data-active]': { background: PRIMARY_BROWN, color: 'white' } } }}>
          <Tabs.List mb="xl">
            <Tabs.Tab value="pending" leftSection={<IconClock size={20} />}>
              Auto-Scheduled ({pendingAppointments.filter(a => a.status === 'auto-scheduled').length})
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="pending">
            {pendingAppointments.filter(a => a.status === 'auto-scheduled').length > 0 ? (
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
                {pendingAppointments.filter(a => a.status === 'auto-scheduled').map((item) => (<PendingAppointmentCard key={item.id} item={item} />))}
              </SimpleGrid>
            ) : (
              <Center mih={300}><Text c={MUTED_OLIVE}>No auto-scheduled appointments</Text></Center>
            )}
          </Tabs.Panel>

        </Tabs>

        <Modal opened={rescheduleModal} onClose={() => setRescheduleModal(false)} title="Edit Appointment" size="lg" styles={{ header: { borderBottom: '1px solid #F0F0F0', paddingBottom: '16px' }, body: { padding: '24px' } }}>
          {selectedAppointment && (
            <Stack gap="lg">
              <Paper p="md" radius="md" style={{ backgroundColor: THEMED_LIGHT_BG, border: '1px solid #F0F0F0' }}>
                <Group gap="sm">
                  <Avatar size={40} radius="md" color={PRIMARY_BROWN}><IconUser size={20} /></Avatar>
                  <Box>
                    <Text fw={600} c={CHARCOAL}>{selectedAppointment.clientName}</Text>
                    <Text size="xs" c={MUTED_OLIVE}>{selectedAppointment.type}</Text>
                  </Box>
                </Group>
              </Paper>

              <Box>
                <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={8}>Current Schedule</Text>
                <Paper p="md" radius="md" style={{ backgroundColor: `${ACCENT_TAN}10`, border: `1px solid ${ACCENT_TAN}` }}>
                  <Stack gap="xs">
                    <Group gap="xs">
                      <IconCalendarEvent size={16} color={ACCENT_TAN} />
                      <Text size="sm" fw={600} c={CHARCOAL}>{selectedAppointment.scheduledDate}</Text>
                    </Group>
                    {selectedAppointment.appointmentTime && (
                      <Group gap="xs">
                        <IconClock size={16} color={ACCENT_TAN} />
                        <Text size="sm" fw={600} c={CHARCOAL}>
                          {(() => {
                            const [hours, minutes] = selectedAppointment.appointmentTime.split(':');
                            const hour = parseInt(hours);
                            const ampm = hour >= 12 ? 'PM' : 'AM';
                            const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                            return `${displayHour}:${minutes} ${ampm}`;
                          })()}
                        </Text>
                      </Group>
                    )}
                  </Stack>
                </Paper>
              </Box>

              <SimpleGrid cols={2} spacing="md">
                <Box>
                  <Group gap={8} mb={8}>
                    <Text size="sm" fw={600} c={CHARCOAL}>New Date</Text>
                    <Text size="sm" c="red">*</Text>
                  </Group>
                  <DatePickerInput 
                    placeholder="Select new date" 
                    value={newDate} 
                    onChange={setNewDate} 
                    size="md" 
                    minDate={new Date()} 
                    leftSection={<IconCalendarEvent size={18} color={PRIMARY_BROWN} />}
                    styles={{ input: { borderColor: '#E0E0E0', '&:focus': { borderColor: PRIMARY_BROWN } } }} 
                  />
                </Box>

                <Box>
                  <Group gap={8} mb={8}>
                    <Text size="sm" fw={600} c={CHARCOAL}>New Time</Text>
                    <Text size="sm" c="red">*</Text>
                  </Group>
                  <Select
                    placeholder="Select time"
                    value={newTime}
                    onChange={setNewTime}
                    size="md"
                    leftSection={<IconClock size={18} color={PRIMARY_BROWN} />}
                    data={[
                      { value: '09:00', label: '9:00 AM' },
                      { value: '09:30', label: '9:30 AM' },
                      { value: '10:00', label: '10:00 AM' },
                      { value: '10:30', label: '10:30 AM' },
                      { value: '11:00', label: '11:00 AM' },
                      { value: '11:30', label: '11:30 AM' },
                      { value: '13:00', label: '1:00 PM' },
                      { value: '13:30', label: '1:30 PM' },
                      { value: '14:00', label: '2:00 PM' },
                      { value: '14:30', label: '2:30 PM' },
                      { value: '15:00', label: '3:00 PM' },
                      { value: '15:30', label: '3:30 PM' },
                      { value: '16:00', label: '4:00 PM' },
                      { value: '16:30', label: '4:30 PM' },
                      { value: '17:00', label: '5:00 PM' },
                    ]}
                    styles={{ input: { borderColor: '#E0E0E0', '&:focus': { borderColor: PRIMARY_BROWN } } }}
                  />
                </Box>
              </SimpleGrid>

              <Text size="xs" c={MUTED_OLIVE}>Select a new date and time for the appointment</Text>

              <Group justify="flex-end" gap="md" mt="md">
                <Button variant="outline" size="md" onClick={() => setRescheduleModal(false)} styles={{ root: { borderColor: '#E0E0E0', color: MUTED_OLIVE } }}>Cancel</Button>
                <Button size="md" onClick={handleUpdateAppointment} disabled={!newDate || !newTime || isUpdating} loading={isUpdating} leftSection={<IconCheck size={18} />} style={{ backgroundColor: PRIMARY_BROWN }}>
                  {isUpdating ? 'Saving...' : 'Save'}
                </Button>
              </Group>
            </Stack>
          )}
        </Modal>

        {/* Date Details Modal */}
        <Modal 
          opened={dateDetailsModal} 
          onClose={() => setDateDetailsModal(false)} 
          title={selectedDate ? `Appointments for ${selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}` : 'Appointments'}
          size="lg"
          styles={{
            header: { borderBottom: '1px solid #F0F0F0', paddingBottom: '16px' },
            body: { padding: '24px' },
          }}
        >
          {selectedDate && (() => {
            const dateAppointments = getAppointmentsForDate(selectedDate);
            return dateAppointments.length > 0 ? (
              <Stack gap="md">
                {dateAppointments.map((item, idx) => (
                  <Paper 
                    key={idx} 
                    p="lg" 
                    radius="md" 
                    style={{ 
                      backgroundColor: THEMED_LIGHT_BG, 
                      border: `1px solid ${PRIMARY_GOLD}` 
                    }}
                  >
                    <Group justify="space-between" mb="md">
                      <Box>
                        <Text fw={600} size="lg" c={CHARCOAL} mb={4}>
                          {item.clientName || item.title}
                        </Text>
                        <Badge size="sm" style={{ backgroundColor: PRIMARY_BROWN }}>
                          {item.type || 'Event'}
                        </Badge>
                      </Box>
                      {item.type !== 'event' && (
                        <Group gap="xs">
                          <ActionIcon
                            size="lg"
                            variant="light"
                            color={PRIMARY_BROWN}
                            onClick={() => handleOpenEditAppointment(item)}
                          >
                            <IconEdit size={18} />
                          </ActionIcon>
                          <ActionIcon
                            size="lg"
                            variant="light"
                            color="red"
                            onClick={() => {
                              setEventToDelete(item);
                              setDeleteConfirmModal(true);
                            }}
                          >
                            <IconX size={18} />
                          </ActionIcon>
                        </Group>
                      )}
                    </Group>

                    <Stack gap="sm">
                      {item.location && (
                        <Group gap="xs">
                          <IconMapPin size={16} color={MUTED_OLIVE} />
                          <Text size="sm" c={CHARCOAL}>
                            {item.location}
                          </Text>
                        </Group>
                      )}
                      <Group gap="xs">
                        <IconCalendarEvent size={16} color={PRIMARY_BROWN} />
                        <Text size="sm" fw={600} c={CHARCOAL}>
                          {item.scheduledDate}
                          {item.appointmentTime && ` at ${item.appointmentTime}`}
                        </Text>
                      </Group>
                      {item.purpose && (
                        <Box mt="xs">
                          <Text size="xs" c={MUTED_OLIVE} mb={4}>
                            Purpose
                          </Text>
                          <Text size="sm" c={CHARCOAL}>
                            {item.purpose}
                          </Text>
                        </Box>
                      )}
                    </Stack>

                    {/* Transfer to Google Calendar Button */}
                    <Button
                      fullWidth
                      mt="md"
                      variant="outline"
                      leftSection={<IconBrandGoogle size={18} />}
                      onClick={() => {
                        const googleCalendarUrl = generateGoogleCalendarUrl({
                          title: item.clientName || item.title,
                          appointmentDate: item.rawAppointedDate || item.eventDate,
                          appointmentTime: item.appointmentTime || item.time,
                          location: item.location,
                          description: item.purpose || item.description,
                          purpose: item.purpose
                        });
                        window.open(googleCalendarUrl, '_blank');
                      }}
                      styles={{
                        root: {
                          borderColor: '#4285F4',
                          color: '#4285F4',
                          '&:hover': {
                            backgroundColor: '#4285F410',
                          }
                        }
                      }}
                    >
                      Transfer to Google Calendar
                    </Button>
                  </Paper>
                ))}
              </Stack>
            ) : (
              <Center py="xl">
                <Stack align="center" gap="md">
                  <IconCalendarEvent size={48} color={MUTED_OLIVE} />
                  <Text c={MUTED_OLIVE} size="sm">
                    No appointments or events scheduled for this date
                  </Text>
                </Stack>
              </Center>
            );
          })()}
        </Modal>

        {/* Edit Event Modal */}
        <Modal
          opened={editEventModal}
          onClose={() => setEditEventModal(false)}
          title="Edit Event"
          size="lg"
          styles={{
            header: { borderBottom: '1px solid #F0F0F0', paddingBottom: '16px' },
            body: { padding: '24px' },
          }}
        >
          <Stack gap="md">
            <TextInput
              label="Event Title"
              placeholder="Enter event title"
              required
              value={eventEditForm.title}
              onChange={(e) => setEventEditForm({ ...eventEditForm, title: e.target.value })}
              styles={{
                label: { color: CHARCOAL, fontWeight: 600, marginBottom: '8px' },
              }}
            />

            <TextInput
              label="Description"
              placeholder="Enter event description"
              value={eventEditForm.description}
              onChange={(e) => setEventEditForm({ ...eventEditForm, description: e.target.value })}
              styles={{
                label: { color: CHARCOAL, fontWeight: 600, marginBottom: '8px' },
              }}
            />

            <DatePickerInput
              label="Event Date"
              placeholder="Select event date"
              required
              value={eventEditForm.eventDate}
              onChange={(date) => setEventEditForm({ ...eventEditForm, eventDate: date })}
              minDate={new Date()}
              styles={{
                label: { color: CHARCOAL, fontWeight: 600, marginBottom: '8px' },
              }}
            />

            <Select
              label="Event Type"
              placeholder="Select event type"
              data={[
                { value: 'appointment', label: 'Appointment' },
                { value: 'hearing', label: 'Court Hearing' },
                { value: 'consultation', label: 'Consultation' },
                { value: 'deadline', label: 'Deadline' },
                { value: 'other', label: 'Other' },
              ]}
              value={eventEditForm.eventType}
              onChange={(value) => setEventEditForm({ ...eventEditForm, eventType: value })}
              styles={{
                label: { color: CHARCOAL, fontWeight: 600, marginBottom: '8px' },
              }}
            />

            <TextInput
              label="Location"
              placeholder="Enter location"
              leftSection={<IconMapPin size={16} />}
              value={eventEditForm.location}
              onChange={(e) => setEventEditForm({ ...eventEditForm, location: e.target.value })}
              styles={{
                label: { color: CHARCOAL, fontWeight: 600, marginBottom: '8px' },
              }}
            />

            <TextInput
              label="Client Name"
              placeholder="Enter client name (optional)"
              value={eventEditForm.clientName}
              onChange={(e) => setEventEditForm({ ...eventEditForm, clientName: e.target.value })}
              styles={{
                label: { color: CHARCOAL, fontWeight: 600, marginBottom: '8px' },
              }}
            />

            <TextInput
              label="Assigned To"
              placeholder="Enter assigned attorney"
              value={eventEditForm.assignedTo}
              onChange={(e) => setEventEditForm({ ...eventEditForm, assignedTo: e.target.value })}
              styles={{
                label: { color: CHARCOAL, fontWeight: 600, marginBottom: '8px' },
              }}
            />

            <Select
              label="Priority"
              placeholder="Select priority"
              data={[
                { value: 'Low', label: 'Low' },
                { value: 'Medium', label: 'Medium' },
                { value: 'High', label: 'High' },
              ]}
              value={eventEditForm.priority}
              onChange={(value) => setEventEditForm({ ...eventEditForm, priority: value })}
              styles={{
                label: { color: CHARCOAL, fontWeight: 600, marginBottom: '8px' },
              }}
            />

            <Group justify="flex-end" gap="md" mt="md">
              <Button
                variant="outline"
                size="md"
                onClick={() => setEditEventModal(false)}
                styles={{
                  root: { borderColor: '#E0E0E0', color: MUTED_OLIVE },
                }}
              >
                Cancel
              </Button>
              <Button
                size="md"
                onClick={handleUpdateEvent}
                disabled={!eventEditForm.title || !eventEditForm.eventDate || isUpdatingEvent}
                loading={isUpdatingEvent}
                leftSection={<IconCheck size={18} />}
                style={{ backgroundColor: PRIMARY_BROWN }}
              >
                {isUpdatingEvent ? 'Updating...' : 'Update Event'}
              </Button>
            </Group>
          </Stack>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          opened={deleteConfirmModal}
          onClose={() => {
            setDeleteConfirmModal(false);
            setEventToDelete(null);
          }}
          title="Delete Event"
          size="md"
          styles={{
            header: { borderBottom: '1px solid #F0F0F0', paddingBottom: '16px' },
            body: { padding: '24px' },
          }}
        >
          <Stack gap="lg">
            <Paper
              p="lg"
              radius="md"
              style={{
                backgroundColor: '#FFF5F5',
                border: '2px solid #FF6B6B',
              }}
            >
              <Group gap="md" align="flex-start">
                <Box
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    backgroundColor: '#FFE0E0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <IconX size={24} color="#FF6B6B" />
                </Box>
                <Box style={{ flex: 1 }}>
                  <Text fw={700} size="lg" c="#C92A2A" mb={8}>
                    Are you sure?
                  </Text>
                  <Text size="sm" c={CHARCOAL}>
                    This action cannot be undone. The event will be permanently deleted from the calendar.
                  </Text>
                </Box>
              </Group>
            </Paper>

            {eventToDelete && (
              <Paper
                p="md"
                radius="md"
                style={{
                  backgroundColor: THEMED_LIGHT_BG,
                  border: '1px solid #E0E0E0',
                }}
              >
                <Text size="xs" c={MUTED_OLIVE} mb={4}>
                  Event to be deleted:
                </Text>
                <Text fw={600} size="md" c={CHARCOAL} mb={4}>
                  {eventToDelete.purpose || eventToDelete.clientName}
                </Text>
                <Text size="sm" c={MUTED_OLIVE}>
                  {eventToDelete.scheduledDate} • {eventToDelete.location}
                </Text>
              </Paper>
            )}

            <Group justify="flex-end" gap="md">
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  setDeleteConfirmModal(false);
                  setEventToDelete(null);
                }}
                disabled={isDeletingEvent}
                styles={{
                  root: { borderColor: '#E0E0E0', color: MUTED_OLIVE },
                }}
              >
                Cancel
              </Button>
              <Button
                size="md"
                onClick={handleDeleteEvent}
                disabled={isDeletingEvent}
                loading={isDeletingEvent}
                style={{ backgroundColor: '#C92A2A' }}
                leftSection={<IconX size={18} />}
              >
                {isDeletingEvent ? 'Deleting...' : 'Delete Event'}
              </Button>
            </Group>
          </Stack>
        </Modal>

        {/* Appointment Details Modal */}
        <Modal
          opened={appointmentModalOpened}
          onClose={() => {
            setAppointmentModalOpened(false);
            setAppointmentEditMode(false);
          }}
          title={null}
          size="lg"
          radius="lg"
          styles={{
            header: { display: 'none' },
            body: { padding: 0 },
          }}
        >
          {loadingAppointment ? (
            <Center py="xl">
              <Loader size="lg" color={PRIMARY_BROWN} />
            </Center>
          ) : appointmentDetails ? (
            <Box>
              {/* Header Section */}
              <Paper 
                p="xl" 
                radius="0"
                style={{ 
                  background: PRIMARY_BROWN,
                  border: 'none',
                  borderTopLeftRadius: '12px',
                  borderTopRightRadius: '12px',
                }}
              >
                <Group justify="space-between" align="center">
                  <Box>
                    <Title order={2} c="white" mb={4}>
                      Sebastinian Office of Legal Aid (SOLA)
                    </Title>
                    <Text c="rgba(255, 255, 255, 0.9)" size="sm" fw={500}>
                      College of Law - San Sebastian College Recoletos, Manila
                    </Text>
                  </Box>
                  {appointmentEditMode ? (
                    <Group gap="xs">
                      <Button
                        variant="light"
                        color="red"
                        size="sm"
                        onClick={handleCancelAppointmentEdit}
                        disabled={appointmentSaving}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        style={{ backgroundColor: 'white', color: PRIMARY_BROWN }}
                        onClick={handleSaveAppointmentDetails}
                        loading={appointmentSaving}
                      >
                        Save Changes
                      </Button>
                    </Group>
                  ) : (
                    <Button
                      size="sm"
                      variant="light"
                      color="white"
                      onClick={handleEnterAppointmentEdit}
                      disabled={loadingAppointment || !appointmentDetails}
                    >
                      Edit Information
                    </Button>
                  )}
                </Group>
              </Paper>

              <Stack gap="lg" p="xl">
                {/* Form Title Badge */}
                <Box style={{ textAlign: 'center' }}>
                  <Paper 
                    p="sm" 
                    radius="md"
                    style={{ 
                      display: 'inline-block',
                      backgroundColor: `${PRIMARY_GOLD}15`,
                      border: `1px solid ${PRIMARY_GOLD}`,
                    }}
                  >
                    <Text size="sm" fw={600} c={PRIMARY_BROWN}>
                      CLIENT'S INFORMATION SHEET
                    </Text>
                  </Paper>
                </Box>

              {/* Personal Details */}
              <Paper shadow="xs" p="lg" radius="lg" style={{ backgroundColor: 'white', border: '1px solid #F0F0F0' }}>
                <Title order={4} mb="md" c={CHARCOAL}>Personal Details</Title>
                <Divider mb="md" color="#F0F0F0" />
                <Grid gutter="md">
                  {/* Name */}
                  <Grid.Col span={12}>
                    <Box>
                      <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Name</Text>
                      {appointmentEditMode ? (
                        <TextInput
                          size="sm"
                          placeholder="Juan Dela Cruz"
                          value={appointmentForm.fullName}
                          onChange={(e) => {
                            const capitalized = e.target.value
                              .split(' ')
                              .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                              .join(' ');
                            setAppointmentForm({ ...appointmentForm, fullName: capitalized });
                          }}
                        />
                      ) : (
                        <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.fullName || appointmentDetails.name || 'N/A'}</Text>
                      )}
                    </Box>
                  </Grid.Col>
                  {/* Birthday and Age */}
                  {/* Birthday and Age */}
                  <Grid.Col span={6}>
                    <Box>
                      <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Birthday</Text>
                      {appointmentEditMode ? (
                        <DateInput
                          size="sm"
                          placeholder="Pick birthday"
                          valueFormat="MMMM DD, YYYY"
                          leftSection={<IconCalendar size={16} color={MUTED_OLIVE} />}
                          maxDate={new Date()}
                          value={appointmentForm.birthday ? new Date(appointmentForm.birthday) : null}
                          onChange={(date) => {
                            if (!date) {
                              setAppointmentForm({ ...appointmentForm, birthday: '', age: '' });
                              return;
                            }
                            // Ensure date is a Date object
                            const dateObj = date instanceof Date ? date : new Date(date);
                            const formatted = dateObj.toISOString().split('T')[0];
                            // Auto-calculate age
                            const today = new Date();
                            let age = today.getFullYear() - dateObj.getFullYear();
                            const monthDiff = today.getMonth() - dateObj.getMonth();
                            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateObj.getDate())) {
                              age--;
                            }
                            const calculatedAge = String(age >= 0 ? age : '');
                            // Update both birthday and age in one state update
                            setAppointmentForm({ ...appointmentForm, birthday: formatted, age: calculatedAge });
                          }}
                          clearable
                          styles={{
                            input: {
                              borderColor: '#E0E0E0',
                              '&:focus': { borderColor: PRIMARY_BROWN },
                            },
                          }}
                        />
                      ) : (
                        <Text size="sm" c={CHARCOAL} fw={500}>
                          {appointmentDetails.birthday ? new Date(appointmentDetails.birthday).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          }) : 'N/A'}
                        </Text>
                      )}
                    </Box>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Box>
                      <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Age</Text>
                      {appointmentEditMode ? (
                        <TextInput
                          size="sm"
                          placeholder="Auto-calculated"
                          value={appointmentForm.age}
                          readOnly
                          styles={{
                            input: {
                              backgroundColor: '#F5F5F5',
                              borderColor: '#E0E0E0',
                              cursor: 'not-allowed',
                            },
                          }}
                        />
                      ) : (
                        <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.age || 'N/A'}</Text>
                      )}
                    </Box>
                  </Grid.Col>
                  {/* Contact Number */}
                  <Grid.Col span={12}>
                    <Box>
                      <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Contact Number</Text>
                      {appointmentEditMode ? (
                        <TextInput
                          size="sm"
                          type="tel"
                          placeholder="+63 912 345 6789"
                          value={appointmentForm.contactNumber || '+63 '}
                          onChange={(e) => {
                            const value = e.target.value;
                            const cleaned = value.replace(/\D/g, '');
                            const number = cleaned.startsWith('63') ? cleaned.substring(2) : cleaned;
                            const limited = number.substring(0, 10);
                            let formatted = '+63 ';
                            if (limited.length <= 3) {
                              formatted += limited;
                            } else if (limited.length <= 6) {
                              formatted += `${limited.slice(0, 3)} ${limited.slice(3)}`;
                            } else {
                              formatted += `${limited.slice(0, 3)} ${limited.slice(3, 6)} ${limited.slice(6)}`;
                            }
                            setAppointmentForm({ ...appointmentForm, contactNumber: formatted });
                          }}
                          onFocus={(e) => {
                            if (!e.target.value || e.target.value === '') {
                              setAppointmentForm({ ...appointmentForm, contactNumber: '+63 ' });
                            }
                          }}
                          styles={{
                            input: {
                              borderColor: '#E0E0E0',
                              '&:focus': { borderColor: PRIMARY_BROWN },
                            },
                          }}
                        />
                      ) : (
                        <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.contactNumber || 'N/A'}</Text>
                      )}
                    </Box>
                  </Grid.Col>
                  {/* Sex and Civil Status */}
                  {/* Sex and Civil Status */}
                  <Grid.Col span={6}>
                    <Box>
                      <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Sex</Text>
                      {appointmentEditMode ? (
                        <Select
                          size="sm"
                          placeholder="Select Sex"
                          data={GENDER_OPTIONS}
                          value={appointmentForm.sex}
                          onChange={(value) => setAppointmentForm({ ...appointmentForm, sex: value })}
                          searchable
                          styles={{
                            input: {
                              borderColor: '#E0E0E0',
                              '&:focus': { borderColor: PRIMARY_BROWN },
                            },
                          }}
                        />
                      ) : (
                        <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.sex || 'N/A'}</Text>
                      )}
                    </Box>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Box>
                      <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Civil Status</Text>
                      {appointmentEditMode ? (
                        <Select
                          size="sm"
                          placeholder="Select Civil Status"
                          data={CIVIL_STATUS_OPTIONS}
                          value={appointmentForm.civilStatus}
                          onChange={(value) => {
                            setAppointmentForm({ 
                              ...appointmentForm, 
                              civilStatus: value,
                              // Clear spouse name if not married/widowed
                              spouseName: (value === 'Married' || value === 'Widowed') ? appointmentForm.spouseName : ''
                            });
                          }}
                          styles={{
                            input: {
                              borderColor: '#E0E0E0',
                              '&:focus': { borderColor: PRIMARY_BROWN },
                            },
                          }}
                        />
                      ) : (
                        <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.civilStatus || 'N/A'}</Text>
                      )}
                    </Box>
                  </Grid.Col>
                  {/* Citizenship */}
                  <Grid.Col span={12}>
                    <Box>
                      <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Citizenship</Text>
                      {appointmentEditMode ? (
                        <TextInput
                          size="sm"
                          placeholder="e.g., Filipino"
                          value={appointmentForm.citizenship || ''}
                          onChange={(e) => setAppointmentForm({ ...appointmentForm, citizenship: e.target.value })}
                          rightSection={appointmentForm.citizenship === DEFAULT_CITIZENSHIP ? <IconCheck size={16} color={PRIMARY_BROWN} /> : null}
                          styles={{
                            input: {
                              borderColor: '#E0E0E0',
                              '&:focus': { borderColor: PRIMARY_BROWN },
                            },
                          }}
                        />
                      ) : (
                        <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.citizenship || 'N/A'}</Text>
                      )}
                    </Box>
                  </Grid.Col>
                  {/* Spouse Name - Conditional */}
                  {(appointmentForm.civilStatus === 'Married' || appointmentForm.civilStatus === 'Widowed' || 
                    (!appointmentEditMode && (appointmentDetails.civilStatus === 'Married' || appointmentDetails.civilStatus === 'Widowed'))) && (
                    <Grid.Col span={12}>
                      <Box>
                        <Group gap={4} mb={4}>
                          <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600}>Spouse Name</Text>
                          {appointmentEditMode && appointmentForm.civilStatus === 'Married' && <Text size="xs" c="red">*</Text>}
                        </Group>
                        {appointmentEditMode ? (
                          <TextInput
                            size="sm"
                            placeholder="Enter spouse name"
                            value={appointmentForm.spouseName}
                            onChange={(e) => setAppointmentForm({ ...appointmentForm, spouseName: e.target.value })}
                          />
                        ) : (
                          <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.spouseName || 'N/A'}</Text>
                        )}
                      </Box>
                    </Grid.Col>
                  )}
                  {/* Cellphone Number */}
                  <Grid.Col span={12}>
                    <Box>
                      <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Cellphone Number</Text>
                      {appointmentEditMode ? (
                        <TextInput
                          size="sm"
                          type="tel"
                          placeholder="+63 912 345 6789"
                          value={appointmentForm.cellphoneNumber || '+63 '}
                          onChange={(e) => {
                            const value = e.target.value;
                            const cleaned = value.replace(/\D/g, '');
                            const number = cleaned.startsWith('63') ? cleaned.substring(2) : cleaned;
                            const limited = number.substring(0, 10);
                            let formatted = '+63 ';
                            if (limited.length <= 3) {
                              formatted += limited;
                            } else if (limited.length <= 6) {
                              formatted += `${limited.slice(0, 3)} ${limited.slice(3)}`;
                            } else {
                              formatted += `${limited.slice(0, 3)} ${limited.slice(3, 6)} ${limited.slice(6)}`;
                            }
                            setAppointmentForm({ ...appointmentForm, cellphoneNumber: formatted });
                          }}
                          onFocus={(e) => {
                            if (!e.target.value || e.target.value === '') {
                              setAppointmentForm({ ...appointmentForm, cellphoneNumber: '+63 ' });
                            }
                          }}
                          description="Optional alternate contact number"
                          styles={{
                            input: {
                              borderColor: '#E0E0E0',
                              '&:focus': { borderColor: PRIMARY_BROWN },
                            },
                            description: {
                              color: MUTED_OLIVE,
                              fontSize: '11px',
                            },
                          }}
                        />
                      ) : (
                        <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.cellphoneNumber || 'N/A'}</Text>
                      )}
                    </Box>
                  </Grid.Col>
                  {/* Present Address */}
                  <Grid.Col span={12}>
                    <Box>
                      <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Present Address</Text>
                      {appointmentEditMode ? (
                        <TextInput
                          size="sm"
                          placeholder="123 Street, Barangay, City"
                          value={appointmentForm.presentAddress}
                          onChange={(e) => setAppointmentForm({ ...appointmentForm, presentAddress: e.target.value })}
                        />
                      ) : (
                        <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.presentAddress || 'N/A'}</Text>
                      )}
                    </Box>
                  </Grid.Col>
                  {/* Telephone Number */}
                  <Grid.Col span={12}>
                    <Box>
                      <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Telephone Number</Text>
                      {appointmentEditMode ? (
                        <TextInput
                          size="sm"
                          placeholder="(02) 1234-5678"
                          value={appointmentForm.telephoneNumber || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            const digitsOnly = value.replace(/\D/g, '');
                            if (digitsOnly.length === 0) {
                              setAppointmentForm({ ...appointmentForm, telephoneNumber: '' });
                              return;
                            }
                            const withLeadingZero = digitsOnly.startsWith('0') ? digitsOnly : `0${digitsOnly}`;
                            const limited = withLeadingZero.slice(0, 10);
                            let formatted = '';
                            if (limited.length <= 2) {
                              formatted = `(${limited}`;
                            } else if (limited.length <= 4) {
                              formatted = `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
                            } else if (limited.length <= 8) {
                              formatted = `(${limited.slice(0, 2)}) ${limited.slice(2, 6)}-${limited.slice(6)}`;
                            } else {
                              formatted = `(${limited.slice(0, 2)}) ${limited.slice(2, 6)}-${limited.slice(6, 10)}`;
                            }
                            setAppointmentForm({ ...appointmentForm, telephoneNumber: formatted });
                          }}
                          onFocus={(e) => {
                            if (!e.target.value || e.target.value === '') {
                              setAppointmentForm({ ...appointmentForm, telephoneNumber: '(' });
                            }
                          }}
                          styles={{
                            input: {
                              borderColor: '#E0E0E0',
                              '&:focus': { borderColor: PRIMARY_BROWN },
                            },
                          }}
                        />
                      ) : (
                        <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.telephoneNumber || 'N/A'}</Text>
                      )}
                    </Box>
                  </Grid.Col>
                  {/* Permanent Address */}
                  {/* Permanent Address */}
                  <Grid.Col span={12}>
                    <Box>
                      <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Permanent Address</Text>
                      {appointmentEditMode ? (
                        <TextInput
                          size="sm"
                          placeholder="123 Street, Barangay, City"
                          value={appointmentForm.permanentAddress}
                          onChange={(e) => setAppointmentForm({ ...appointmentForm, permanentAddress: e.target.value })}
                        />
                      ) : (
                        <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.permanentAddress || 'N/A'}</Text>
                      )}
                    </Box>
                  </Grid.Col>
                </Grid>
              </Paper>

              {/* Relator/Representative Section */}
              <Paper shadow="xs" p="lg" radius="lg" style={{ backgroundColor: `${PRIMARY_GOLD}10`, border: `1px solid ${PRIMARY_GOLD}` }}>
                <Title order={4} mb="md" c={CHARCOAL}>
                  Relator/Representative Information
                </Title>
                <Stack gap="md">
                  {appointmentEditMode ? (
                    <>
                      <Box>
                        <Text size="sm" fw={600} c={CHARCOAL} mb={6}>If through a Relator / Representative</Text>
                        <Radio.Group
                          value={appointmentForm.throughRelator}
                          onChange={(value) => {
                            setAppointmentForm({ 
                              ...appointmentForm, 
                              throughRelator: value,
                              // Clear relator fields if selecting 'no'
                              relatorName: value === 'no' ? '' : appointmentForm.relatorName,
                              relationshipToClient: value === 'no' ? '' : appointmentForm.relationshipToClient,
                            });
                          }}
                        >
                          <Group gap="lg">
                            <Radio value="yes" label="Yes" color={PRIMARY_BROWN} />
                            <Radio value="no" label="No" color={PRIMARY_BROWN} />
                          </Group>
                        </Radio.Group>
                      </Box>

                      <Box>
                        <Group gap={4} mb={4}>
                          <Text size="sm" fw={600} c={CHARCOAL}>Name of Relator/Representative</Text>
                          {appointmentForm.throughRelator === 'yes' && <Text size="xs" c="red">*</Text>}
                        </Group>
                        <TextInput
                          placeholder="Maria Santos"
                          size="sm"
                          disabled={appointmentForm.throughRelator !== 'yes'}
                          value={appointmentForm.relatorName}
                          onChange={(e) => setAppointmentForm({ ...appointmentForm, relatorName: e.target.value })}
                          styles={{
                            input: {
                              backgroundColor: appointmentForm.throughRelator === 'yes' ? 'white' : '#F5F5F5',
                              cursor: appointmentForm.throughRelator === 'yes' ? 'text' : 'not-allowed',
                            },
                          }}
                        />
                      </Box>

                      <Box>
                        <Group gap={4} mb={4}>
                          <Text size="sm" fw={600} c={CHARCOAL}>Relationship to the Client</Text>
                          {appointmentForm.throughRelator === 'yes' && <Text size="xs" c="red">*</Text>}
                        </Group>
                        <TextInput
                          placeholder="Sister, Brother, Parent, Attorney, etc."
                          size="sm"
                          disabled={appointmentForm.throughRelator !== 'yes'}
                          value={appointmentForm.relationshipToClient}
                          onChange={(e) => setAppointmentForm({ ...appointmentForm, relationshipToClient: e.target.value })}
                          styles={{
                            input: {
                              backgroundColor: appointmentForm.throughRelator === 'yes' ? 'white' : '#F5F5F5',
                              cursor: appointmentForm.throughRelator === 'yes' ? 'text' : 'not-allowed',
                            },
                          }}
                        />
                      </Box>

                      <Box>
                        <Text size="sm" fw={600} c={CHARCOAL} mb={4}>Relator Contact Number</Text>
                        <TextInput
                          placeholder="+63 912 345 6789"
                          size="sm"
                          disabled={appointmentForm.throughRelator !== 'yes'}
                          value={appointmentForm.relatorContactNumber}
                          onChange={(e) => setAppointmentForm({ ...appointmentForm, relatorContactNumber: e.target.value })}
                          styles={{
                            input: {
                              backgroundColor: appointmentForm.throughRelator === 'yes' ? 'white' : '#F5F5F5',
                              cursor: appointmentForm.throughRelator === 'yes' ? 'text' : 'not-allowed',
                            },
                          }}
                        />
                      </Box>
                    </>
                  ) : (
                    <Grid gutter="md">
                      <Grid.Col span={6}>
                        <Box>
                          <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Through Relator</Text>
                          <Badge 
                            size="md" 
                            variant="light" 
                            color={appointmentDetails.throughRelator === 'yes' ? 'green' : 'gray'}
                          >
                            {appointmentDetails.throughRelator === 'yes' ? 'Yes' : 'No'}
                          </Badge>
                        </Box>
                      </Grid.Col>
                      {(appointmentDetails.throughRelator === 'yes' || appointmentDetails.relatorName) && (
                        <>
                          <Grid.Col span={6}>
                            <Box>
                              <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Relator Name</Text>
                              <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.relatorName || 'N/A'}</Text>
                            </Box>
                          </Grid.Col>
                          <Grid.Col span={6}>
                            <Box>
                              <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Relationship to Client</Text>
                              <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.relationshipToClient || 'N/A'}</Text>
                            </Box>
                          </Grid.Col>
                          <Grid.Col span={6}>
                            <Box>
                              <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Relator Contact Number</Text>
                              <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.relatorContactNumber || 'N/A'}</Text>
                            </Box>
                          </Grid.Col>
                        </>
                      )}
                    </Grid>
                  )}
                </Stack>
              </Paper>

              {/* Schedule Details */}
              <Paper shadow="xs" p="lg" radius="lg" style={{ backgroundColor: 'white', border: '1px solid #F0F0F0' }}>
                <Title order={4} mb="md" c={CHARCOAL}>Schedule Details</Title>
                <Divider mb="md" color="#F0F0F0" />
                <Grid gutter="md">
                  <Grid.Col span={6}>
                    <Box>
                      <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Appointment Date</Text>
                      {appointmentEditMode ? (
                        <DateInput
                          size="sm"
                          placeholder="Select appointment date"
                          valueFormat="MMMM DD, YYYY"
                          leftSection={<IconCalendar size={16} color={MUTED_OLIVE} />}
                          minDate={new Date()}
                          value={appointmentForm.appointedDate ? new Date(appointmentForm.appointedDate) : null}
                          onChange={(date) => {
                            if (!date) {
                              setAppointmentForm({ ...appointmentForm, appointedDate: '' });
                              return;
                            }
                            // Ensure date is a Date object
                            const dateObj = date instanceof Date ? date : new Date(date);
                            const formatted = dateObj.toISOString().split('T')[0];
                            setAppointmentForm({ ...appointmentForm, appointedDate: formatted });
                          }}
                          clearable
                          styles={{
                            input: {
                              borderColor: '#E0E0E0',
                              '&:focus': { borderColor: PRIMARY_BROWN },
                            },
                          }}
                        />
                      ) : (
                        <Text size="sm" c={CHARCOAL} fw={500}>
                          {appointmentDetails.appointedDate ? new Date(appointmentDetails.appointedDate).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          }) : 'N/A'}
                        </Text>
                      )}
                    </Box>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Box>
                      <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Appointment Time</Text>
                      {appointmentEditMode ? (
                        <Select
                          size="sm"
                          placeholder="Select a time"
                          leftSection={<IconClock size={16} color={MUTED_OLIVE} />}
                          value={appointmentForm.appointmentTime}
                          onChange={(value) => setAppointmentForm({ ...appointmentForm, appointmentTime: value })}
                          data={[
                            { value: '09:00', label: '9:00 AM' },
                            { value: '09:30', label: '9:30 AM' },
                            { value: '10:00', label: '10:00 AM' },
                            { value: '10:30', label: '10:30 AM' },
                            { value: '11:00', label: '11:00 AM' },
                            { value: '11:30', label: '11:30 AM' },
                            { value: '13:00', label: '1:00 PM' },
                            { value: '13:30', label: '1:30 PM' },
                            { value: '14:00', label: '2:00 PM' },
                            { value: '14:30', label: '2:30 PM' },
                            { value: '15:00', label: '3:00 PM' },
                            { value: '15:30', label: '3:30 PM' },
                            { value: '16:00', label: '4:00 PM' },
                            { value: '16:30', label: '4:30 PM' },
                            { value: '17:00', label: '5:00 PM' },
                          ]}
                          clearable
                          styles={{
                            input: {
                              borderColor: '#E0E0E0',
                              '&:focus': { borderColor: PRIMARY_BROWN },
                            },
                          }}
                        />
                      ) : (
                        <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.appointmentTime || 'N/A'}</Text>
                      )}
                    </Box>
                  </Grid.Col>
                </Grid>
              </Paper>

              {/* Financial Details */}
              <Paper shadow="xs" p="lg" radius="lg" style={{ backgroundColor: 'white', border: '1px solid #F0F0F0' }}>
                <Title order={4} mb="md" c={CHARCOAL}>Financial Details</Title>
                <Divider mb="md" color="#F0F0F0" />
                <Grid gutter="md">
                  <Grid.Col span={12}>
                    <Box>
                      <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Current Source of Income</Text>
                      {appointmentEditMode ? (
                        <TextInput
                          size="sm"
                          placeholder="Employment, Business, etc."
                          value={appointmentForm.currentSourceOfIncome}
                          onChange={(e) => setAppointmentForm({ ...appointmentForm, currentSourceOfIncome: e.target.value })}
                        />
                      ) : (
                        <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.currentSourceOfIncome || 'N/A'}</Text>
                      )}
                    </Box>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Box>
                      <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Income / Month</Text>
                      {appointmentEditMode ? (
                        <TextInput
                          size="sm"
                          type="number"
                          placeholder="15000"
                          value={appointmentForm.monthlyIncome}
                          onChange={(e) => setAppointmentForm({ ...appointmentForm, monthlyIncome: e.target.value })}
                        />
                      ) : (
                        <Text size="sm" c={CHARCOAL} fw={500}>
                          {appointmentDetails.monthlyIncome ? `₱${Number(appointmentDetails.monthlyIncome).toLocaleString()}` : 'N/A'}
                        </Text>
                      )}
                    </Box>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Box>
                      <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Nature of Work / Business</Text>
                      {appointmentEditMode ? (
                        <TextInput
                          size="sm"
                          placeholder="Sales, IT, Retail, etc."
                          value={appointmentForm.natureOfWork}
                          onChange={(e) => setAppointmentForm({ ...appointmentForm, natureOfWork: e.target.value })}
                        />
                      ) : (
                        <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.natureOfWork || 'N/A'}</Text>
                      )}
                    </Box>
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <Box>
                      <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Employer / Business Owner's Name</Text>
                      {appointmentEditMode ? (
                        <TextInput
                          size="sm"
                          placeholder="ABC Corporation"
                          value={appointmentForm.employerName}
                          onChange={(e) => setAppointmentForm({ ...appointmentForm, employerName: e.target.value })}
                        />
                      ) : (
                        <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.employerName || 'N/A'}</Text>
                      )}
                    </Box>
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <Box>
                      <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Employer / Business Address</Text>
                      {appointmentEditMode ? (
                        <TextInput
                          size="sm"
                          placeholder="456 Business St, City"
                          value={appointmentForm.employerAddress}
                          onChange={(e) => setAppointmentForm({ ...appointmentForm, employerAddress: e.target.value })}
                        />
                      ) : (
                        <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.employerAddress || 'N/A'}</Text>
                      )}
                    </Box>
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <Box>
                      <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Telephone</Text>
                      {appointmentEditMode ? (
                        <TextInput
                          size="sm"
                          placeholder="(02) 8765-4321"
                          value={appointmentForm.employerTelephone || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            const digitsOnly = value.replace(/\D/g, '');
                            const withLeadingZero = digitsOnly.startsWith('0') ? digitsOnly : `0${digitsOnly}`;
                            const limited = withLeadingZero.slice(0, 10);
                            let formatted = '';
                            if (limited.length === 0) {
                              formatted = '';
                            } else if (limited.length <= 2) {
                              formatted = `(${limited}`;
                            } else if (limited.length <= 4) {
                              formatted = `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
                            } else if (limited.length <= 8) {
                              formatted = `(${limited.slice(0, 2)}) ${limited.slice(2, 6)}-${limited.slice(6)}`;
                            } else {
                              formatted = `(${limited.slice(0, 2)}) ${limited.slice(2, 6)}-${limited.slice(6, 10)}`;
                            }
                            setAppointmentForm({ ...appointmentForm, employerTelephone: formatted });
                          }}
                        />
                      ) : (
                        <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.employerTelephone || 'N/A'}</Text>
                      )}
                    </Box>
                  </Grid.Col>
                </Grid>
                
                {/* Spouse's Information Section */}
                <Paper p="md" mt="lg" style={{ backgroundColor: `${PRIMARY_GOLD}10`, border: `1px solid ${PRIMARY_GOLD}` }}>
                  <Title order={5} mb="md" c={CHARCOAL}>
                    Spouse's Information (If applicable)
                  </Title>
                  <Grid gutter="md">
                    <Grid.Col span={12}>
                      <Box>
                        <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Spouse's Source of Income</Text>
                        {appointmentEditMode ? (
                          <TextInput
                            size="sm"
                            placeholder="Employment, Business, etc."
                            value={appointmentForm.spouseSourceOfIncome}
                            onChange={(e) => setAppointmentForm({ ...appointmentForm, spouseSourceOfIncome: e.target.value })}
                            styles={{ input: { backgroundColor: 'white' } }}
                          />
                        ) : (
                          <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.spouseSourceOfIncome || 'N/A'}</Text>
                        )}
                      </Box>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Box>
                        <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Spouse's Income / Month</Text>
                        {appointmentEditMode ? (
                          <TextInput
                            size="sm"
                            type="number"
                            placeholder="15000"
                            value={appointmentForm.spouseMonthlyIncome}
                            onChange={(e) => setAppointmentForm({ ...appointmentForm, spouseMonthlyIncome: e.target.value })}
                            styles={{ input: { backgroundColor: 'white' } }}
                          />
                        ) : (
                          <Text size="sm" c={CHARCOAL} fw={500}>
                            {appointmentDetails.spouseMonthlyIncome ? `₱${Number(appointmentDetails.spouseMonthlyIncome).toLocaleString()}` : 'N/A'}
                          </Text>
                        )}
                      </Box>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Box>
                        <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Spouse's Employer / Business Address</Text>
                        {appointmentEditMode ? (
                          <TextInput
                            size="sm"
                            placeholder="789 Work Ave, City"
                            value={appointmentForm.spouseEmployerAddress}
                            onChange={(e) => setAppointmentForm({ ...appointmentForm, spouseEmployerAddress: e.target.value })}
                            styles={{ input: { backgroundColor: 'white' } }}
                          />
                        ) : (
                          <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.spouseEmployerAddress || 'N/A'}</Text>
                        )}
                      </Box>
                    </Grid.Col>
                  </Grid>
                </Paper>

                {/* Total Combined Monthly Income */}
                <Box mt="lg">
                  <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Total Combined Monthly Income</Text>
                  {appointmentEditMode ? (
                    <TextInput
                      size="sm"
                      placeholder="Auto-calculated"
                      value={appointmentForm.totalCombinedIncome ? `₱${Number(appointmentForm.totalCombinedIncome).toLocaleString()}` : ''}
                      readOnly
                      styles={{
                        input: {
                          backgroundColor: '#F5F5F5',
                          borderColor: '#E0E0E0',
                          cursor: 'not-allowed',
                          fontWeight: 500,
                        },
                      }}
                    />
                  ) : (
                    <Text size="sm" c={CHARCOAL} fw={500}>
                      {appointmentDetails.totalCombinedIncome ? `₱${Number(appointmentDetails.totalCombinedIncome).toLocaleString()}` : 'N/A'}
                    </Text>
                  )}
                </Box>
              </Paper>

              {/* Case Details */}
              <Paper shadow="xs" p="lg" radius="lg" style={{ backgroundColor: 'white', border: '1px solid #F0F0F0' }}>
                <Title order={4} mb="md" c={CHARCOAL}>Case Details</Title>
                <Divider mb="md" color="#F0F0F0" />
                <Grid gutter="md">
                  <Grid.Col span={6}>
                    <Box>
                      <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Party Represented</Text>
                      {appointmentEditMode ? (
                        <TextInput
                          size="sm"
                          placeholder="Plaintiff/Defendant"
                          value={appointmentForm.partyRepresented}
                          onChange={(e) => setAppointmentForm({ ...appointmentForm, partyRepresented: e.target.value })}
                        />
                      ) : (
                        <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.partyRepresented || 'N/A'}</Text>
                      )}
                    </Box>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Box>
                      <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Venue / City</Text>
                      {appointmentEditMode ? (
                        <TextInput
                          size="sm"
                          placeholder="Manila"
                          value={appointmentForm.venue}
                          onChange={(e) => setAppointmentForm({ ...appointmentForm, venue: e.target.value })}
                        />
                      ) : (
                        <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.venue || 'N/A'}</Text>
                      )}
                    </Box>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Box>
                      <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Case / Docket Number</Text>
                      {appointmentEditMode ? (
                        <TextInput
                          size="sm"
                          placeholder="Case No. 2024-123"
                          value={appointmentForm.caseNumber}
                          onChange={(e) => setAppointmentForm({ ...appointmentForm, caseNumber: e.target.value })}
                        />
                      ) : (
                        <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.caseNumber || 'N/A'}</Text>
                      )}
                    </Box>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Box>
                      <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Present Stage of the Case</Text>
                      {appointmentEditMode ? (
                        <TextInput
                          size="sm"
                          placeholder="Pre-trial, Trial, etc."
                          value={appointmentForm.presentStage}
                          onChange={(e) => setAppointmentForm({ ...appointmentForm, presentStage: e.target.value })}
                        />
                      ) : (
                        <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.presentStage || 'N/A'}</Text>
                      )}
                    </Box>
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <Box>
                      <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Nature of Case</Text>
                      {appointmentEditMode ? (
                        <Textarea
                          size="sm"
                          placeholder="Describe the nature of the case..."
                          minRows={3}
                          value={appointmentForm.caseNature}
                          onChange={(e) => setAppointmentForm({ ...appointmentForm, caseNature: e.target.value })}
                        />
                      ) : (
                        <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.caseNature || 'N/A'}</Text>
                      )}
                    </Box>
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <Box>
                      <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Court / Agency / Tribunal Division</Text>
                      {appointmentEditMode ? (
                        <TextInput
                          size="sm"
                          placeholder="RTC Branch 1"
                          value={appointmentForm.courtDivision}
                          onChange={(e) => setAppointmentForm({ ...appointmentForm, courtDivision: e.target.value })}
                        />
                      ) : (
                        <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.courtDivision || 'N/A'}</Text>
                      )}
                    </Box>
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <Box>
                      <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Court / Agency / Tribunal Address</Text>
                      {appointmentEditMode ? (
                        <TextInput
                          size="sm"
                          placeholder="Justice Hall, City"
                          value={appointmentForm.courtAddress}
                          onChange={(e) => setAppointmentForm({ ...appointmentForm, courtAddress: e.target.value })}
                        />
                      ) : (
                        <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.courtAddress || 'N/A'}</Text>
                      )}
                    </Box>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Box>
                      <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Phone Number</Text>
                      {appointmentEditMode ? (
                        <TextInput
                          size="sm"
                          placeholder="(02) 1111-2222"
                          value={appointmentForm.courtPhoneNumber}
                          onChange={(e) => setAppointmentForm({ ...appointmentForm, courtPhoneNumber: e.target.value })}
                        />
                      ) : (
                        <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.courtPhoneNumber || 'N/A'}</Text>
                      )}
                    </Box>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Box>
                      <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Presiding Officer</Text>
                      {appointmentEditMode ? (
                        <TextInput
                          size="sm"
                          placeholder="Hon. Judge Name"
                          value={appointmentForm.presidingOfficer || ''}
                          onChange={(e) => setAppointmentForm({ ...appointmentForm, presidingOfficer: e.target.value })}
                        />
                      ) : (
                        <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.presidingOfficer || 'N/A'}</Text>
                      )}
                    </Box>
                  </Grid.Col>
                </Grid>

                {/* Adverse Party Information Section */}
                <Paper p="md" mt="lg" style={{ backgroundColor: `${PRIMARY_GOLD}10`, border: `1px solid ${PRIMARY_GOLD}` }}>
                  <Title order={5} mb="md" c={CHARCOAL}>
                    Adverse Party Information
                  </Title>
                  <Grid gutter="md">
                    <Grid.Col span={12}>
                      <Box>
                        <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Adverse Party(ies)</Text>
                        {appointmentEditMode ? (
                          <TextInput
                            size="sm"
                            placeholder="Name of opposing party"
                            value={appointmentForm.adverseParty}
                            onChange={(e) => setAppointmentForm({ ...appointmentForm, adverseParty: e.target.value })}
                            styles={{ input: { backgroundColor: 'white' } }}
                          />
                        ) : (
                          <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.adverseParty || 'N/A'}</Text>
                        )}
                      </Box>
                    </Grid.Col>
                    <Grid.Col span={12}>
                      <Box>
                        <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Adverse Party(ies) Address</Text>
                        {appointmentEditMode ? (
                          <TextInput
                            size="sm"
                            placeholder="Address of opposing party"
                            value={appointmentForm.adversePartyAddress}
                            onChange={(e) => setAppointmentForm({ ...appointmentForm, adversePartyAddress: e.target.value })}
                            styles={{ input: { backgroundColor: 'white' } }}
                          />
                        ) : (
                          <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.adversePartyAddress || 'N/A'}</Text>
                        )}
                      </Box>
                    </Grid.Col>
                    <Grid.Col span={12}>
                      <Box>
                        <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Adverse Party(ies) Counsel</Text>
                        {appointmentEditMode ? (
                          <TextInput
                            size="sm"
                            placeholder="Atty. Name"
                            value={appointmentForm.adversePartyCounsel}
                            onChange={(e) => setAppointmentForm({ ...appointmentForm, adversePartyCounsel: e.target.value })}
                            styles={{ input: { backgroundColor: 'white' } }}
                          />
                        ) : (
                          <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.adversePartyCounsel || 'N/A'}</Text>
                        )}
                      </Box>
                    </Grid.Col>
                    <Grid.Col span={12}>
                      <Box>
                        <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Adverse Party(ies) Counsel Address</Text>
                        {appointmentEditMode ? (
                          <TextInput
                            size="sm"
                            placeholder="Law Office Address"
                            value={appointmentForm.adversePartyCounselAddress}
                            onChange={(e) => setAppointmentForm({ ...appointmentForm, adversePartyCounselAddress: e.target.value })}
                            styles={{ input: { backgroundColor: 'white' } }}
                          />
                        ) : (
                          <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.adversePartyCounselAddress || 'N/A'}</Text>
                        )}
                      </Box>
                    </Grid.Col>
                    <Grid.Col span={12}>
                      <Box>
                        <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Adverse Party(ies) Counsel Phone Number</Text>
                        {appointmentEditMode ? (
                          <TextInput
                            size="sm"
                            placeholder="(02) 3333-4444"
                            value={appointmentForm.adversePartyCounselPhone}
                            onChange={(e) => setAppointmentForm({ ...appointmentForm, adversePartyCounselPhone: e.target.value })}
                            styles={{ input: { backgroundColor: 'white' } }}
                          />
                        ) : (
                          <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.adversePartyCounselPhone || 'N/A'}</Text>
                        )}
                      </Box>
                    </Grid.Col>
                  </Grid>
                </Paper>
              </Paper>
            </Stack>
          </Box>
          ) : (
            <Text c="dimmed" ta="center" py="xl">
              No appointment details available
            </Text>
          )}
        </Modal>
      </Container>
    </Box>
  );
}