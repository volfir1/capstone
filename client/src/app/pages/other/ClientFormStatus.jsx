import React, { useState, useEffect } from 'react';
import { 
  Tabs, Card, Text, Badge, Group, Button, SimpleGrid, Container, Title,
  Paper, Box, Stack, Avatar, Menu, ActionIcon, Select, TextInput, Modal, Loader, Center,
  Grid, Divider,
} from '@mantine/core';
import ClientFormStatusCalendar from '@components/calendar/ClientFormCalendar';
import { DatePickerInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';
import { 
  IconCalendarEvent, IconMessage2, IconFileDescription, IconClock, IconCheck, 
  IconMapPin, IconScale, IconUser, IconCheckbox, IconPhone, IconMail, IconDots,
  IconEdit, IconX, IconSearch, IconFilter, IconGavel, IconFileText, IconEye,
} from '@tabler/icons-react';

const PRIMARY_GOLD = '#D4A574';
const PRIMARY_BROWN = '#6B4423';
const MUTED_OLIVE = '#8B8B5C';
const THEMED_LIGHT_BG = '#F5F3F0';
const CHARCOAL = '#333333';
const ACCENT_TAN = '#C9A876';

export default function StaffAppointmentManager() {
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

  // Fetch all data function
  const loadAllData = async () => {
    setLoading(true);
    try {
      const { default: apiClient } = await import('@config/api/apiClient');
      
      // Fetch pending appointments (auto-scheduled)
      try {
        const pendingResp = await apiClient.get('/clientsinfo');
        const docs = pendingResp?.data || [];
        const mapped = (Array.isArray(docs) ? docs : []).map((d, idx) => ({
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

  // Function to fetch and display appointment details
  const openAppointmentModal = async (appointmentId) => {
    setAppointmentModalOpened(true);
    setLoadingAppointment(true);
    
    try {
      const { default: apiClient } = await import('@config/api/apiClient');
      const response = await apiClient.get(`/clientsinfo/${appointmentId}`);
      console.log('Appointment details:', response.data);
      setAppointmentDetails(response.data);
    } catch (error) {
      console.error('Error fetching appointment details:', error);
    } finally {
      setLoadingAppointment(false);
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
              // Update status to confirmed and navigate
              (async () => {
                try {
                  const { default: apiClient } = await import('@config/api/apiClient');
                  await apiClient.put(`/clientsinfo/${item.id}`, { status: 'confirmed' });
                  notifications.show({
                    title: 'Status Updated',
                    message: 'Appointment status set to Confirmed',
                    color: 'green',
                    icon: <IconCheck size={18} />,
                  });
                  // Reload data to reflect status change
                  await loadAllData();
                  // Navigate to recommendation page
                  navigate(`/admin/recommendation/${item.id}`, { state: { caseId: item.id } });
                } catch (error) {
                  console.error('Failed to update status:', error);
                  notifications.show({
                    title: 'Error',
                    message: 'Failed to update status',
                    color: 'red',
                  });
                }
              })();
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
            <Tabs.Tab value="scheduled" leftSection={<IconCalendarEvent size={20} />}>
              Confirmed ({pendingAppointments.filter(a => a.status === 'confirmed').length})
            </Tabs.Tab>
            <Tabs.Tab value="advice" leftSection={<IconMessage2 size={20} />}>
              Legal Advice ({pendingAppointments.filter(a => a.status === 'legal-advice').length})
            </Tabs.Tab>
            <Tabs.Tab value="representation" leftSection={<IconScale size={20} />}>
              Court Cases ({pendingAppointments.filter(a => a.status === 'court-case').length})
            </Tabs.Tab>
            <Tabs.Tab value="rejected" leftSection={<IconX size={20} />}>
              Rejected ({pendingAppointments.filter(a => a.status === 'rejected').length})
            </Tabs.Tab>
            <Tabs.Tab value="documents" leftSection={<IconFileDescription size={20} />}>Documents ({documentRequests.length})</Tabs.Tab>
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

          <Tabs.Panel value="scheduled">
            {pendingAppointments.filter(a => a.status === 'confirmed').length > 0 ? (
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
                {pendingAppointments.filter(a => a.status === 'confirmed').map((item) => (<PendingAppointmentCard key={item.id} item={item} />))}
              </SimpleGrid>
            ) : (
              <Center mih={300}><Text c={MUTED_OLIVE}>No confirmed appointments</Text></Center>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="advice">
            {pendingAppointments.filter(a => a.status === 'legal-advice').length > 0 ? (
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
                {pendingAppointments.filter(a => a.status === 'legal-advice').map((item) => (<PendingAppointmentCard key={item.id} item={item} />))}
              </SimpleGrid>
            ) : (
              <Center mih={300}><Text c={MUTED_OLIVE}>No legal advice cases</Text></Center>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="representation">
            {pendingAppointments.filter(a => a.status === 'court-case').length > 0 ? (
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
                {pendingAppointments.filter(a => a.status === 'court-case').map((item) => (<CaseRepresentationCard key={item.id} item={item} />))}
              </SimpleGrid>
            ) : (
              <Center mih={300}><Text c={MUTED_OLIVE}>No active court cases</Text></Center>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="rejected">
            {pendingAppointments.filter(a => a.status === 'rejected').length > 0 ? (
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
                {pendingAppointments.filter(a => a.status === 'rejected').map((item) => (<PendingAppointmentCard key={item.id} item={item} />))}
              </SimpleGrid>
            ) : (
              <Center mih={300}><Text c={MUTED_OLIVE}>No rejected cases</Text></Center>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="documents">
            {documentRequests.length > 0 ? (
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
                {documentRequests.map((item) => (<DocumentRequestCard key={item.id} item={item} />))}
              </SimpleGrid>
            ) : (
              <Center mih={300}><Text c={MUTED_OLIVE}>No document requests</Text></Center>
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
                    key={item.id || idx}
                    p="lg"
                    radius="md"
                    style={{
                      backgroundColor: THEMED_LIGHT_BG,
                      border: `2px solid ${PRIMARY_GOLD}`,
                    }}
                  >
                    <Group justify="space-between" mb="md">
                      <Group gap="sm">
                        <Avatar size={48} radius="md" color={PRIMARY_BROWN}>
                          <IconUser size={24} />
                        </Avatar>
                        <Box>
                          <Text fw={700} size="md" c={CHARCOAL}>
                            {/* Show event title for custom events, client name for appointments */}
                            {events.find(e => e.id === item.id) ? item.purpose || item.clientName : item.clientName}
                          </Text>
                          <Badge size="sm" style={{ backgroundColor: PRIMARY_BROWN, marginTop: '4px' }}>
                            {item.type}
                          </Badge>
                        </Box>
                      </Group>
                      {/* Show edit and delete buttons only for custom events, not appointments from clientsinfo */}
                      {events.find(e => e.id === item.id) && (
                        <Group gap="xs">
                          <ActionIcon
                            variant="light"
                            color={PRIMARY_BROWN}
                            size="lg"
                            onClick={() => handleEditEvent(item)}
                          >
                            <IconEdit size={18} />
                          </ActionIcon>
                          <ActionIcon
                            variant="light"
                            color="red"
                            size="lg"
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
                      {item.assignedTo && (
                        <Group gap="xs">
                          <IconUser size={16} color={PRIMARY_GOLD} />
                          <Text size="sm" c={CHARCOAL}>
                            {item.assignedTo}
                          </Text>
                        </Group>
                      )}
                    </Stack>

                    {item.contactNumber && (
                      <Group gap="md" mt="md" pt="md" style={{ borderTop: '1px solid #E0E0E0' }}>
                        {item.contactNumber && (
                          <Group gap="xs">
                            <IconPhone size={14} color={MUTED_OLIVE} />
                            <Text size="xs" c={CHARCOAL}>
                              {item.contactNumber}
                            </Text>
                          </Group>
                        )}
                        {item.email && (
                          <Group gap="xs">
                            <IconMail size={14} color={MUTED_OLIVE} />
                            <Text size="xs" c={CHARCOAL}>
                              {item.email}
                            </Text>
                          </Group>
                        )}
                      </Group>
                    )}
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
                  <Grid.Col span={6}>
                    <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={4}>Email</Text>
                    <Text size="sm" c={CHARCOAL} fw={500}>{appointmentDetails.email || 'N/A'}</Text>
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
      </Container>
    </Box>
  );
}