import React, { useState, useEffect, useMemo } from 'react';
import { 
  Tabs, Card, Text, Badge, Group, Button, SimpleGrid, Container, Title,
  Paper, Box, Stack, Avatar, Menu, ActionIcon, Select, TextInput, Textarea, Modal, Loader, Center,
  Grid, Divider, ScrollArea, Tooltip, Pagination,
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
  IconPlus, IconChevronRight, IconAddressBook, IconInfoCircle, IconCurrencyPeso, IconBriefcase,
  IconHome, IconUsers, IconTrash, IconArrowRight, IconRotateClockwise
} from '@tabler/icons-react';
import { 
  GENDER_OPTIONS, 
  CIVIL_STATUS_OPTIONS, 
  DEFAULT_CITIZENSHIP,
  PRIMARY_GOLD,
  PRIMARY_BROWN,
  MUTED_OLIVE,
  THEMED_LIGHT_BG,
  CHARCOAL,
  ACCENT_TAN,
  BG
} from '@utils/constants';
import { generateGoogleCalendarUrl } from '@utils/googleCalendar';

export default function StaffAppointmentManager() {
  const { userData, currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [calendarFilter, setCalendarFilter] = useState('All');
  const [selectedFilterDate, setSelectedFilterDate] = useState(null);
  const [rescheduleModal, setRescheduleModal] = useState(false);
  const [editEventModal, setEditEventModal] = useState(false);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(false);
  
  // Pagination State
  const [pendingPage, setPendingPage] = useState(1);
  const [interviewPage, setInterviewPage] = useState(1);
  const itemsPerPage = 10;

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
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
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

  // Filtered lists logic
  const filteredPending = useMemo(() => {
    return pendingAppointments
      .filter(a => a.status === 'auto-scheduled' && !a.calendarRecorded)
      .filter(a => !selectedFilterDate || (a.rawAppointedDate && new Date(a.rawAppointedDate).toDateString() === selectedFilterDate.toDateString()))
      .filter(a => !searchQuery || a.clientName.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [pendingAppointments, selectedFilterDate, searchQuery]);

  const filteredInterview = useMemo(() => {
    return pendingAppointments
      .filter(a => a.calendarRecorded)
      .filter(a => !selectedFilterDate || (a.rawAppointedDate && new Date(a.rawAppointedDate).toDateString() === selectedFilterDate.toDateString()))
      .filter(a => !searchQuery || a.clientName.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [pendingAppointments, selectedFilterDate, searchQuery]);

  const allAppointmentsForCalendar = useMemo(() => {
    const list = [
      ...pendingAppointments.map(apt => ({
        ...apt,
        uniqueId: `apt-${apt.id}`,
        date: apt.rawAppointedDate ? new Date(apt.rawAppointedDate) : null,
        isEvent: false
      })),
      ...events.map(evt => ({
        ...evt,
        uniqueId: `evt-${evt.id}`,
        date: evt.rawAppointedDate ? new Date(evt.rawAppointedDate) : null,
        isEvent: true
      }))
    ];
    
    if (calendarFilter === 'All') return list;
    return list.filter(item => item.type === calendarFilter);
  }, [pendingAppointments, events, calendarFilter]);

  const loadAllData = async (opts = {}) => {
    const silent = opts.silent === true;
    if (!silent) setLoading(true);
    try {
      const { default: apiClient } = await import('@config/api/apiClient');
      
      const pendingResp = await apiClient.get('/clientsinfo');
      const docs = pendingResp?.data || [];
      const mapped = (Array.isArray(docs) ? docs : [])
        .map((d, idx) => ({
          id: d._id || idx,
          clientName: d.fullName || d.personal?.fullName || `${d.personal?.firstName || ''} ${d.personal?.lastName || ''}`.trim() || '',
          type: 'Initial Interview',
          submittedDate: d.createdAt ? new Date(d.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
          scheduledDate: d.appointedDate ? new Date(d.appointedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD',
          rawAppointedDate: d.appointedDate || null,
          appointmentTime: d.appointmentTime ? (() => {
            const [hours, minutes] = d.appointmentTime.split(':');
            const h = parseInt(hours);
            const ampm = h >= 12 ? 'PM' : 'AM';
            const displayH = h % 12 || 12;
            return `${displayH}:${minutes} ${ampm}`;
          })() : '',
          status: d.status || 'auto-scheduled',
          calendarRecorded: Boolean(d.calendarRecorded),
          contactNumber: d.personal?.contactNumber || d.contactNumber || '',
          email: d.personal?.email || d.email || '',
          assignedTo: d.assignedTo || '',
          location: d.caseDetails?.location || d.location || 'SOLA Office',
          purpose: d.caseDetails?.purpose || d.caseDescription || `Client interview`,
          priority: d.priority || 'Medium',
          fullData: d
        }))
        .sort((a, b) => {
          if (!a.rawAppointedDate) return 1;
          if (!b.rawAppointedDate) return -1;
          return new Date(a.rawAppointedDate) - new Date(b.rawAppointedDate);
        });
      setPendingAppointments(mapped);

      const eventsResp = await apiClient.get('/events');
      const eventsData = eventsResp?.data || [];
      const mappedEvents = (Array.isArray(eventsData) ? eventsData : []).map((e, idx) => ({
        id: e._id || idx,
        clientName: e.clientName || 'Event',
        type: e.eventType || 'other',
        rawAppointedDate: e.eventDate,
        scheduledDate: e.eventDate ? new Date(e.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD',
        location: e.location || 'TBD',
        priority: e.priority || 'Medium',
        status: e.status || 'scheduled',
        description: e.description || '',
        assignedTo: e.assignedTo || '',
        purpose: e.title || '',
      }));
      setEvents(mappedEvents);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
    const interval = setInterval(() => loadAllData({ silent: true }), 10000);
    return () => clearInterval(interval);
  }, []);

  const handleDateClick = (date) => {
    setSelectedFilterDate(date);
    setPendingPage(1);
    setInterviewPage(1);
  };

  const handleResetDateFilter = () => {
    setSelectedFilterDate(null);
    setPendingPage(1);
    setInterviewPage(1);
  };

  const openAppointmentModal = async (appointmentId) => {
    setAppointmentModalOpened(true);
    setLoadingAppointment(true);
    setAppointmentEditMode(false);
    setAppointmentSaving(false);
    
    try {
      const { default: apiClient } = await import('@config/api/apiClient');
      const response = await apiClient.get(`/clientsinfo/${appointmentId}`);
      setAppointmentDetails(response.data);
      setAppointmentForm(syncAppointmentFormFromDetails(response.data));
    } catch (error) {
      console.error('Error fetching appointment details:', error);
    } finally {
      setLoadingAppointment(false);
    }
  };

  const syncAppointmentFormFromDetails = (details) => {
    const hasRelatorData = details?.relatorName || details?.relationshipToClient;
    const toInputDate = (value) => {
      if (!value) return '';
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) return '';
      const year = parsed.getFullYear();
      const month = String(parsed.getMonth() + 1).padStart(2, '0');
      const day = String(parsed.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

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
    setNewTime(appointment?.appointmentTime || '');
    setRescheduleModal(true);
  };

  const handleUpdateAppointment = async () => {
    if (!newDate || !selectedAppointment?.id) {
      notifications.show({ title: 'Error', message: 'Please select a valid date and time.', color: 'red' });
      return;
    }
    setIsUpdating(true);
    const iso = newDate.toISOString();
    const payload = { appointedDate: iso, appointmentTime: newTime || '' };
    try {
      const { default: apiClient } = await import('@config/api/apiClient');
      await apiClient.put(`/clientsinfo/${selectedAppointment.id}`, payload);
      notifications.show({ title: 'Success', message: `Appointment updated successfully`, color: 'green', icon: <IconCheck size={18} /> });
      setRescheduleModal(false);
      await loadAllData();
    } catch (error) {
      notifications.show({ title: 'Error', message: 'Failed to update appointment.', color: 'red' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRecordToCalendars = async (appointment) => {
    if (!appointment?.id) return;
    setIsUpdating(true);
    try {
      const { default: apiClient } = await import('@config/api/apiClient');
      const title = appointment.clientName ? `${appointment.clientName} - Interview` : 'Client Interview';
      const description = appointment.purpose || `Case ID: ${appointment.id}`;
      
      const googleEvent = {
        summary: title,
        description,
        start: { dateTime: appointment.rawAppointedDate, timeZone: 'UTC' },
        end: { dateTime: new Date(new Date(appointment.rawAppointedDate).getTime() + 3600000).toISOString(), timeZone: 'UTC' },
      };

      await apiClient.post('/google/events/atomic', {
        firebaseUid: currentUser.uid,
        event: googleEvent,
        meta: {
          appointmentId: appointment.id,
          title,
          description,
          eventDate: appointment.rawAppointedDate,
          eventType: 'appointment',
          location: appointment.location,
          clientName: appointment.clientName,
          status: 'scheduled',
        }
      });

      notifications.show({ title: 'Success', message: 'Synced to calendar successfully.', color: 'green' });
      await loadAllData();
    } catch (err) {
      notifications.show({ title: 'Error', message: 'Failed to sync to calendar.', color: 'red' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateEvent = async () => {
    if (!eventEditForm.title || !eventEditForm.eventDate || !selectedEvent) {
      notifications.show({ title: 'Error', message: 'Title and date are required', color: 'red' });
      return;
    }
    setIsUpdatingEvent(true);
    try {
      const { default: apiClient } = await import('@config/api/apiClient');
      await apiClient.put(`/events/${selectedEvent.id}`, eventEditForm);
      notifications.show({ title: 'Success', message: 'Event updated successfully', color: 'green', icon: <IconCheck size={18} /> });
      setEditEventModal(false);
      await loadAllData();
    } catch (error) {
      notifications.show({ title: 'Error', message: 'Failed to update event', color: 'red' });
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
      notifications.show({ title: 'Success', message: 'Event deleted successfully', color: 'green', icon: <IconCheck size={18} /> });
      setDeleteConfirmModal(false);
      await loadAllData();
    } catch (error) {
      notifications.show({ title: 'Error', message: 'Failed to delete event', color: 'red' });
    } finally {
      setIsDeletingEvent(false);
    }
  };

  const handleSaveAppointmentDetails = async () => {
    if (!appointmentDetails?._id && !appointmentDetails?.id) return;
    const payload = {
      status: appointmentForm.status || undefined,
      appointedDate: appointmentForm.appointedDate || undefined,
      appointmentTime: appointmentForm.appointmentTime || '',
      fullName: appointmentForm.fullName || undefined,
      age: appointmentForm.age ? Number(appointmentForm.age) : undefined,
      birthday: appointmentForm.birthday || undefined,
      sex: appointmentForm.sex || undefined,
      civilStatus: appointmentForm.civilStatus || undefined,
      contactNumber: appointmentForm.contactNumber || undefined,
      email: appointmentForm.email || undefined,
      presentAddress: appointmentForm.presentAddress || undefined,
      permanentAddress: appointmentForm.permanentAddress || undefined,
      citizenship: appointmentForm.citizenship || undefined,
      caseNumber: appointmentForm.caseNumber || undefined,
      caseDescription: appointmentForm.caseDescription || undefined,
      caseNature: appointmentForm.caseNature || undefined,
    };
    setAppointmentSaving(true);
    try {
      const { default: apiClient } = await import('@config/api/apiClient');
      await apiClient.put(`/clientsinfo/${appointmentDetails._id || appointmentDetails.id}`, payload);
      notifications.show({ title: 'Updated', message: 'Appointment details saved.', color: 'green' });
      setAppointmentEditMode(false);
      await loadAllData();
    } catch (err) {
      console.error('Error updating appointment details:', err);
      notifications.show({ title: 'Error', message: 'Failed to save appointment details.', color: 'red' });
    } finally {
      setAppointmentSaving(false);
    }
  };

  const SideAppointmentCard = ({ item }) => (
    <Card shadow="xs" padding="md" radius="lg" withBorder style={{ borderLeft: `5px solid ${item.calendarRecorded ? 'green' : PRIMARY_GOLD}`, transition: 'all 0.2s ease', '&:hover': { transform: 'translateX(4px)', backgroundColor: '#F9FAFB' } }}>
      <Stack gap="xs">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Group gap="xs">
            <Avatar size={32} radius="md" color={PRIMARY_BROWN} variant="light">
              {item.clientName[0]}
            </Avatar>
            <Box style={{ maxWidth: 120 }}>
              <Text fw={800} size="sm" c={CHARCOAL} truncate>{item.clientName}</Text>
              <Text size="xs" c={MUTED_OLIVE} fw={600}>{item.type}</Text>
            </Box>
          </Group>
          <Menu shadow="md" position="bottom-end" radius="md">
            <Menu.Target>
              <ActionIcon variant="subtle" color="gray" size="sm"><IconDots size={16} /></ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item leftSection={<IconEdit size={14} />} onClick={() => handleOpenEditAppointment(item)}>Edit Schedule</Menu.Item>
              <Menu.Item leftSection={<IconEye size={14} />} onClick={() => openAppointmentModal(item.id)}>View Details</Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>

        <Group gap="md">
          <Group gap={4}>
            <IconClock size={14} color={PRIMARY_BROWN} />
            <Text size="xs" fw={700} c={CHARCOAL}>{item.appointmentTime || 'TBD'}</Text>
          </Group>
          <Group gap={4}>
            <IconCalendarEvent size={14} color={MUTED_OLIVE} />
            <Text size="xs" fw={700} c={MUTED_OLIVE}>{item.scheduledDate}</Text>
          </Group>
        </Group>

        <Group grow gap="xs" mt={4}>
          {!item.calendarRecorded ? (
            <Button size="compact-xs" radius="md" style={{ backgroundColor: PRIMARY_BROWN }} onClick={() => handleRecordToCalendars(item)} loading={isUpdating}>Approve</Button>
          ) : (
            <Button size="compact-xs" variant="outline" radius="md" style={{ color: PRIMARY_BROWN, borderColor: PRIMARY_BROWN }} onClick={() => navigate(`/admin/recommendation/${item.id}`)}>Interview</Button>
          )}
          <Button size="compact-xs" variant="light" radius="md" color="gray" onClick={() => openAppointmentModal(item.id)}>Details</Button>
        </Group>
      </Stack>
    </Card>
  );

  if (loading) return <Center mih="100vh"><Loader color={PRIMARY_BROWN} size="xl" type="bars" /></Center>;

  return (
    <Box bg={BG} mih="100vh">
      <Container size="xl" py="xl">
        {/* Modern Header - Integrated Custom Event Button */}
        <Group justify="space-between" mb="xl" px="xs" align="center">
          <Group gap="xl" align="center">
            <Group gap="md">
              <Box style={{ width: 44, height: 44, borderRadius: '12px', background: `linear-gradient(45deg, ${PRIMARY_BROWN}, ${PRIMARY_GOLD})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(107,68,35,0.15)' }}>
                <IconScale size={24} color="white" stroke={2.5} />
              </Box>
              <Stack gap={0}>
                <Title order={2} fw={800} c={CHARCOAL}>Staff Appointment Manager</Title>
                <Text size="xs" c={MUTED_OLIVE} fw={600}>San Sebastian College - Recoletos Manila Legal Aid</Text>
              </Stack>
            </Group>

            {/* Custom Event Button moved to Header */}
            <Button 
              variant="light" 
              size="md" 
              radius="md" 
              color={PRIMARY_BROWN} 
              leftSection={<IconPlus size={18} />} 
              onClick={() => { 
                setEventEditForm({ title: '', description: '', eventDate: new Date(), eventType: 'appointment', location: '', clientName: '', assignedTo: '', priority: 'Medium' }); 
                setEditEventModal(true); 
              }}
            >
              Add Custom Event
            </Button>
          </Group>

          <Group gap="xs">
            <Paper shadow="xs" p="xs" radius="lg" withBorder bg="white">
              <Group gap="xl" px="sm">
                <Stack gap={0} ta="center">
                  <Text size="xs" c={MUTED_OLIVE} fw={700}>PENDING</Text>
                  <Text fw={800} size="lg" c="orange">{pendingAppointments.filter(a => a.status === 'auto-scheduled' && !a.calendarRecorded).length}</Text>
                </Stack>
                <Divider orientation="vertical" />
                <Stack gap={0} ta="center">
                  <Text size="xs" c={MUTED_OLIVE} fw={700}>FOR INTERVIEW</Text>
                  <Text fw={800} size="lg" c="green">{pendingAppointments.filter(a => a.calendarRecorded).length}</Text>
                </Stack>
              </Group>
            </Paper>
          </Group>
        </Group>

        {/* Main Content: Calendar & Appointment Records Side Panel */}
        <Grid gutter="xl" align="stretch">
          <Grid.Col span={{ base: 12, lg: 8 }}>
            <Paper shadow="xl" p="lg" radius="xl" withBorder style={{ border: '2px solid #E5E7EB', backgroundColor: 'white', height: '100%' }}>
              <ClientFormStatusCalendar 
                appointments={allAppointmentsForCalendar}
                onEventCreated={loadAllData}
                onDateClick={handleDateClick}
                filterValue={calendarFilter}
                onFilterChange={setCalendarFilter}
              />
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, lg: 4 }}>
            <Paper shadow="xl" p="xl" radius="xl" withBorder h="100%" bg="white" style={{ display: 'flex', flexDirection: 'column' }}>
              <Stack gap="md" style={{ flex: 1 }}>
                <Group justify="space-between" align="center" mb="xs">
                  <Group gap="sm">
                    <Box style={{ width: 32, height: 32, borderRadius: '8px', background: `${PRIMARY_BROWN}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <IconAddressBook size={18} color={PRIMARY_BROWN} />
                    </Box>
                    <Title order={4} c={CHARCOAL} fw={800}>Appointment Records</Title>
                  </Group>
                  {selectedFilterDate && (
                    <Tooltip label="Reset date filter">
                      <ActionIcon variant="light" color="red" radius="md" onClick={handleResetDateFilter}>
                        <IconRotateClockwise size={18} />
                      </ActionIcon>
                    </Tooltip>
                  )}
                </Group>

                <Stack gap={8} mb="md">
                  <TextInput 
                    placeholder="Search by client name..." 
                    leftSection={<IconSearch size={16} />} 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                    size="sm" 
                    radius="md" 
                    styles={{ input: { borderColor: '#E5E7EB', '&:focus': { borderColor: PRIMARY_BROWN } } }} 
                  />
                  {selectedFilterDate && (
                    <Badge variant="light" color={PRIMARY_BROWN} radius="md" size="sm" fullWidth>
                      Date: {selectedFilterDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Badge>
                  )}
                </Stack>

                <Tabs value={activeTab} onChange={(val) => { setActiveTab(val); setPendingPage(1); setInterviewPage(1); }} variant="pills" radius="md" styles={{ tab: { fontWeight: 700, fontSize: '11px', padding: '6px 12px', '&[data-active]': { background: PRIMARY_BROWN } } }}>
                  <Tabs.List mb="md" grow>
                    <Tabs.Tab value="pending" leftSection={<IconClock size={14} />}>Pending</Tabs.Tab>
                    <Tabs.Tab value="forInterview" leftSection={<IconFileText size={14} />}>Interview</Tabs.Tab>
                  </Tabs.List>

                  <Tabs.Panel value="pending">
                    <Stack gap="md">
                      <ScrollArea style={{ height: 450 }} offsetScrollbars scrollbarSize={6} styles={{ thumb: { backgroundColor: PRIMARY_BROWN } }}>
                        <Stack gap="sm" pr="sm">
                          {filteredPending
                            .slice((pendingPage - 1) * itemsPerPage, pendingPage * itemsPerPage)
                            .map((item) => (
                              <SideAppointmentCard key={item.id} item={item} />
                            ))}
                          {filteredPending.length === 0 && (
                            <Center h={200}>
                              <Stack align="center" gap="xs">
                                <IconInfoCircle size={32} color="#D1D5DB" />
                                <Text c="dimmed" size="xs" fw={600}>No matches found.</Text>
                              </Stack>
                            </Center>
                          )}
                        </Stack>
                      </ScrollArea>
                      
                      <Center>
                        <Pagination total={Math.ceil(filteredPending.length / itemsPerPage) || 1} value={pendingPage} onChange={setPendingPage} color={PRIMARY_BROWN} size="xs" radius="md" withEdges />
                      </Center>
                    </Stack>
                  </Tabs.Panel>
                  
                  <Tabs.Panel value="forInterview">
                    <Stack gap="md">
                      <ScrollArea style={{ height: 450 }} offsetScrollbars scrollbarSize={6} styles={{ thumb: { backgroundColor: PRIMARY_BROWN } }}>
                        <Stack gap="sm" pr="sm">
                          {filteredInterview
                            .slice((interviewPage - 1) * itemsPerPage, interviewPage * itemsPerPage)
                            .map((item) => (
                              <SideAppointmentCard key={item.id} item={item} />
                            ))}
                          {filteredInterview.length === 0 && (
                            <Center h={200}>
                              <Stack align="center" gap="xs">
                                <IconInfoCircle size={32} color="#D1D5DB" />
                                <Text c="dimmed" size="xs" fw={600}>No matches found.</Text>
                              </Stack>
                            </Center>
                          )}
                        </Stack>
                      </ScrollArea>
                      
                      <Center>
                        <Pagination total={Math.ceil(filteredInterview.length / itemsPerPage) || 1} value={interviewPage} onChange={setInterviewPage} color={PRIMARY_BROWN} size="xs" radius="md" withEdges />
                      </Center>
                    </Stack>
                  </Tabs.Panel>
                </Tabs>
              </Stack>
            </Paper>
          </Grid.Col>
        </Grid>
      </Container>

      {/* Modals */}
      <Modal opened={rescheduleModal} onClose={() => setRescheduleModal(false)} title={<Text fw={800} size="lg">Reschedule Appointment</Text>} size="md" radius="xl">
        <Stack gap="md">
          {selectedAppointment && (
            <Paper p="md" radius="lg" withBorder bg={THEMED_LIGHT_BG + '30'}>
              <Group gap="sm">
                <Avatar size={40} color={PRIMARY_BROWN}>{selectedAppointment.clientName[0]}</Avatar>
                <Box><Text fw={700} size="sm">{selectedAppointment.clientName}</Text><Text size="xs" c="dimmed">Current: {selectedAppointment.scheduledDate}</Text></Box>
              </Group>
            </Paper>
          )}
          <DatePickerInput label="New Date" placeholder="Select date" value={newDate} onChange={setNewDate} radius="md" size="md" />
          <Select label="New Time" placeholder="Select time" data={['09:00 AM', '10:00 AM', '11:00 AM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM']} value={newTime} onChange={setNewTime} radius="md" size="md" />
          <Group justify="flex-end" mt="md"><Button variant="subtle" color="gray" onClick={() => setRescheduleModal(false)}>Cancel</Button><Button color={PRIMARY_BROWN} radius="md" onClick={handleUpdateAppointment} loading={isUpdating}>Save Schedule</Button></Group>
        </Stack>
      </Modal>

      <Modal opened={editEventModal} onClose={() => setEditEventModal(false)} title={<Text fw={800} size="lg">{selectedEvent ? 'Edit Event' : 'Add New Event'}</Text>} size="lg" radius="xl">
        <Stack gap="md">
          <TextInput label="Title" placeholder="Event title" value={eventEditForm.title} onChange={(e) => setEditEventModal({ ...eventEditForm, title: e.target.value })} radius="md" />
          <Textarea label="Description" placeholder="Notes..." value={eventEditForm.description} onChange={(e) => setEditEventModal({ ...eventEditForm, description: e.target.value })} radius="md" />
          <Grid><Grid.Col span={6}><DatePickerInput label="Date" placeholder="Select date" value={eventEditForm.eventDate} onChange={(d) => setEditEventModal({ ...eventEditForm, eventDate: d })} radius="md" /></Grid.Col><Grid.Col span={6}><Select label="Type" data={['appointment', 'hearing', 'consultation', 'deadline', 'other']} value={eventEditForm.eventType} onChange={(v) => setEditEventModal({ ...eventEditForm, eventType: v })} radius="md" /></Grid.Col></Grid>
          <TextInput label="Location" leftSection={<IconMapPin size={16} />} value={eventEditForm.location} onChange={(e) => setEditEventModal({ ...eventEditForm, location: e.target.value })} radius="md" />
          <Group justify="flex-end" mt="lg"><Button variant="subtle" color="gray" onClick={() => setEditEventModal(false)}>Cancel</Button><Button color={PRIMARY_BROWN} radius="md" onClick={handleUpdateEvent} loading={isUpdatingEvent}>{selectedEvent ? 'Update Event' : 'Create Event'}</Button></Group>
        </Stack>
      </Modal>

      <Modal opened={deleteConfirmModal} onClose={() => setDeleteConfirmModal(false)} title="Confirm Delete" centered radius="xl">
        <Stack gap="md" align="center" ta="center">
          <Box p="lg" bg="red.0" style={{ borderRadius: '50%' }}><IconTrash size={40} color="red" /></Box>
          <Box><Text fw={800} size="lg">Are you absolutely sure?</Text><Text size="sm" c="dimmed">This will permanently delete this event from the calendar.</Text></Box>
          <Group grow w="100%"><Button variant="outline" color="gray" radius="md" onClick={() => setDeleteConfirmModal(false)}>Cancel</Button><Button color="red" radius="md" onClick={handleDeleteEvent} loading={isDeletingEvent}>Delete Forever</Button></Group>
        </Stack>
      </Modal>

      <Modal opened={appointmentModalOpened} onClose={() => { setAppointmentModalOpened(false); setAppointmentEditMode(false); }} size="70%" radius="xl" padding={0} withCloseButton={false}>
        {loadingAppointment ? (
          <Center h={400}><Loader color={PRIMARY_BROWN} /></Center>
        ) : appointmentDetails ? (
          <Box>
            <Paper p="xl" bg={PRIMARY_BROWN} radius="0" style={{ borderTopLeftRadius: '28px', borderTopRightRadius: '28px' }}>
              <Group justify="space-between" align="center">
                <Group gap="md"><ActionIcon size="lg" radius="md" color="white" variant="light" onClick={() => setAppointmentModalOpened(false)}><IconX size={20} /></ActionIcon><Box><Text c="white" fw={800} size="xl">Client Profile</Text><Text c="white" size="xs" style={{ opacity: 0.8 }}>ID: {appointmentDetails._id}</Text></Box></Group>
                <Group>{!appointmentEditMode ? ( <Button variant="white" color={PRIMARY_BROWN} radius="md" leftSection={<IconEdit size={16} />} onClick={() => setAppointmentEditMode(true)}>Edit Profile</Button> ) : ( <Group gap="xs"><Button variant="subtle" color="white" onClick={() => setAppointmentEditMode(false)}>Cancel</Button><Button color="white" style={{ color: PRIMARY_BROWN }} radius="md" onClick={handleSaveAppointmentDetails} loading={appointmentSaving}>Save</Button></Group> )}</Group>
              </Group>
            </Paper>
            <ScrollArea h="75vh" p="xl" bg="#F9FAFB">
              <Stack gap="xl">
                <Paper p="xl" radius="xl" withBorder shadow="sm"><Group gap="md" mb="xl"><IconUser size={24} color={PRIMARY_BROWN} /><Title order={4} fw={800}>Personal Details</Title><Divider style={{ flex: 1 }} /></Group><Grid gutter="xl"><Grid.Col span={8}><TextInput label="Full Name" value={appointmentForm.fullName} readOnly={!appointmentEditMode} onChange={(e) => setAppointmentForm({...appointmentForm, fullName: e.target.value})} radius="md" /></Grid.Col><Grid.Col span={4}><TextInput label="Age" value={appointmentForm.age} readOnly={!appointmentEditMode} onChange={(e) => setAppointmentForm({...appointmentForm, age: e.target.value})} radius="md" /></Grid.Col><Grid.Col span={4}><DateInput label="Birthday" value={appointmentForm.birthday ? new Date(appointmentForm.birthday) : null} readOnly={!appointmentEditMode} radius="md" /></Grid.Col><Grid.Col span={4}><Select label="Sex" data={GENDER_OPTIONS} value={appointmentForm.sex} disabled={!appointmentEditMode} radius="md" /></Grid.Col><Grid.Col span={4}><Select label="Civil Status" data={CIVIL_STATUS_OPTIONS} value={appointmentForm.civilStatus} disabled={!appointmentEditMode} radius="md" /></Grid.Col></Grid></Paper>
                <Paper p="xl" radius="xl" withBorder shadow="sm"><Group gap="md" mb="xl"><IconPhone size={24} color={PRIMARY_BROWN} /><Title order={4} fw={800}>Contact & Residence</Title><Divider style={{ flex: 1 }} /></Group><Grid gutter="xl"><Grid.Col span={6}><TextInput label="Email" value={appointmentForm.email} readOnly={!appointmentEditMode} radius="md" leftSection={<IconMail size={16} />} /></Grid.Col><Grid.Col span={6}><TextInput label="Contact" value={appointmentForm.contactNumber} readOnly={!appointmentEditMode} radius="md" leftSection={<IconPhone size={16} />} /></Grid.Col><Grid.Col span={12}><TextInput label="Address" value={appointmentForm.presentAddress} readOnly={!appointmentEditMode} radius="md" leftSection={<IconHome size={16} />} /></Grid.Col></Grid></Paper>
                <Paper p="xl" radius="xl" withBorder shadow="sm"><Group gap="md" mb="xl"><IconGavel size={24} color={PRIMARY_BROWN} /><Title order={4} fw={800}>Case Info</Title><Divider style={{ flex: 1 }} /></Group><Stack gap="lg"><TextInput label="Nature" value={appointmentForm.caseNature} readOnly={!appointmentEditMode} radius="md" /><Textarea label="Description" value={appointmentForm.caseDescription} readOnly={!appointmentEditMode} minRows={4} radius="md" /></Stack></Paper>
              </Stack>
            </ScrollArea>
            <Paper p="lg" bg="white" radius="0" style={{ borderBottomLeftRadius: '28px', borderBottomRightRadius: '28px', borderTop: '1px solid #E5E7EB' }}><Group justify="flex-end"><Button variant="light" color="gray" radius="md" onClick={() => setAppointmentModalOpened(false)}>Close</Button><Button color={PRIMARY_BROWN} radius="md" rightSection={<IconArrowRight size={16} />} onClick={() => navigate(`/admin/recommendation/${appointmentDetails._id}`)}>Recommendation</Button></Group></Paper>
          </Box>
        ) : null}
      </Modal>
    </Box>
  );
}
