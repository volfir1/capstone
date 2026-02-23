import React, { useState, useEffect, useMemo } from 'react';
import {
  Tabs, Card, Text, Badge, Group, Button, SimpleGrid, Container, Title,
  Paper, Box, Stack, Avatar, Menu, ActionIcon, Select, TextInput, Textarea, Modal, Loader, Center,
  Grid, Divider, ScrollArea, Tooltip, Pagination,
} from '@mantine/core';
import ClientFormStatusCalendar from '@components/calendar/ClientFormCalendar';
import { DatePickerInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';
import ClientFormStatusSkeleton from '@/components/skeleton/ClientFormStatusSkeleton';
import { useAuth } from '@/context/authContext';
import {
  IconCalendarEvent, IconClock, IconCheck,
  IconMapPin, IconDots, IconScale,
  IconEdit, IconX, IconSearch, IconEye, IconCalendar,
  IconPlus, IconChevronRight, IconAddressBook, IconInfoCircle, IconFileText,
  IconTrash, IconArrowRight, IconRotateClockwise
} from '@tabler/icons-react';
import { IconRefresh } from '@tabler/icons-react';
import {
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

  // Filtered lists logic
  const filteredPending = useMemo(() => {
    return pendingAppointments
      .filter(a => a.status === 'auto-scheduled' && !a.calendarRecorded)
      .filter(a => !selectedFilterDate || (a.rawAppointedDate && new Date(a.rawAppointedDate).toDateString() === selectedFilterDate.toDateString()))
      .filter(a => !searchQuery || a.clientName.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [pendingAppointments, selectedFilterDate, searchQuery]);

  const filteredInterview = useMemo(() => {
    return pendingAppointments
      .filter(a => a.calendarRecorded && a.status === 'auto-scheduled')
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

  const openAppointmentModal = (appointmentId) => {
    navigate(`/admin/clientinfo/${appointmentId}`);
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

  const SideAppointmentCard = ({ item }) => (
    <Card shadow="xs" padding="md" radius="lg" withBorder style={{ borderLeft: `5px solid ${item.calendarRecorded ? 'green' : PRIMARY_GOLD}`, transition: 'all 0.2s ease', '&:hover': { transform: 'translateX(4px)', backgroundColor: '#F9FAFB' } }}>
      <Stack gap="xs">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Group gap="xs">
            <Box style={{ maxWidth: 160 }}>
              <Text fw={600} size="sm" c={CHARCOAL} truncate>{item.clientName}</Text>
              <Text size="xs" c={MUTED_OLIVE} fw={500}>{item.type}</Text>
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
            <Text size="xs" fw={600} c={CHARCOAL}>{item.appointmentTime || 'TBD'}</Text>
          </Group>
          <Group gap={4}>
            <IconCalendarEvent size={14} color={MUTED_OLIVE} />
            <Text size="xs" fw={600} c={MUTED_OLIVE}>{item.scheduledDate}</Text>
          </Group>
        </Group>

        <Group grow gap="xs" mt={4}>
          {!item.calendarRecorded ? (
            <Button size="compact-xs" radius="md" fw={600} style={{ backgroundColor: PRIMARY_BROWN }} onClick={() => handleRecordToCalendars(item)} loading={isUpdating}>Approve</Button>
          ) : (
            !['director', 'supervising_lawyer'].includes(userData?.role) && (
              <Button size="compact-xs" variant="outline" radius="md" fw={600} style={{ color: PRIMARY_BROWN, borderColor: PRIMARY_BROWN }} onClick={() => navigate(`/admin/recommendation/${item.id}`)}>Interview</Button>
            )
          )}
          <Button size="compact-xs" variant="light" radius="md" fw={600} color="gray" onClick={() => openAppointmentModal(item.id)}>Details</Button>
        </Group>
      </Stack>
    </Card>
  );

  if (loading) return <ClientFormStatusSkeleton />;

  return (
    <Box bg={BG} mih="100vh">
      <Container size="xl" py="xl">
        {/* Modern Header - Integrated Custom Event Button */}
        <Group justify="space-between" mb="xl" px="xs" align="center">
          <Group gap="xl" align="center">
            <Group gap="md">
              <Box style={{ width: 44, height: 44, borderRadius: '12px', background: `linear-gradient(45deg, ${PRIMARY_BROWN}, ${PRIMARY_GOLD})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(107,68,35,0.15)' }}>
                <IconScale size={24} color="white" stroke={2} />
              </Box>
              <Stack gap={0}>
                                <Title order={2} fw={700} c={CHARCOAL}>Staff Appointment Manager</Title>
                                <Text size="xs" c={MUTED_OLIVE} fw={500}>San Sebastian College - Recoletos Manila Legal Aid</Text>
                              </Stack>
                            </Group>
                          </Group>
                
                          <Group gap="xs" align="center">            <Paper shadow="xs" p="xs" radius="lg" withBorder bg="white">
              <Group gap="xl" px="sm">
                <Stack gap={0} ta="center">
                  <Text size="xs" c={MUTED_OLIVE} fw={600}>PENDING</Text>
                  <Text fw={700} size="lg" c="orange">{pendingAppointments.filter(a => a.status === 'auto-scheduled' && !a.calendarRecorded).length}</Text>
                </Stack>
                <Divider orientation="vertical" />
                <Stack gap={0} ta="center">
                  <Text size="xs" c={MUTED_OLIVE} fw={600}>FOR INTERVIEW</Text>
                  <Text fw={700} size="lg" c="green">{pendingAppointments.filter(a => a.calendarRecorded && a.status === 'auto-scheduled').length}</Text>
                </Stack>
              </Group>
            </Paper>
            <Tooltip label="Refresh data">
              <ActionIcon variant="light" onClick={() => loadAllData()} radius="md">
                <IconRefresh size={18} />
              </ActionIcon>
            </Tooltip>
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
                              onAddEvent={() => { 
                                setEventEditForm({ title: '', description: '', eventDate: new Date(), eventType: 'appointment', location: '', clientName: '', assignedTo: '', priority: 'Medium' }); 
                                setEditEventModal(true); 
                              }}
                            />            </Paper>
          </Grid.Col>

                    <Grid.Col span={{ base: 12, lg: 4 }}>
                      <Paper shadow="xl" p="lg" radius="xl" withBorder h="100%" bg="white" style={{ display: 'flex', flexDirection: 'column' }}>
                        <Stack gap="md" style={{ flex: 1 }}>
                          <Group justify="space-between" align="center" mb="xs">
                            <Group gap="sm">
                              <Box style={{ width: 32, height: 32, borderRadius: '8px', background: `${PRIMARY_BROWN}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <IconAddressBook size={18} color={PRIMARY_BROWN} />
                              </Box>
                              <Title order={4} c={CHARCOAL} fw={700}>Appointment Records</Title>
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
          
                          <Tabs value={activeTab} onChange={(val) => { setActiveTab(val); setPendingPage(1); setInterviewPage(1); }} variant="pills" radius="md" styles={{ tab: { fontWeight: 600, fontSize: '11px', padding: '6px 12px', '&[data-active]': { background: PRIMARY_BROWN } } }}>
                            <Tabs.List mb="md" grow>
                              <Tabs.Tab value="pending" leftSection={<IconClock size={14} />}>Pending</Tabs.Tab>
                              <Tabs.Tab value="forInterview" leftSection={<IconFileText size={14} />}>Interview</Tabs.Tab>
                            </Tabs.List>
          
                            <Tabs.Panel value="pending">
                              <Stack gap="md">
                                <ScrollArea style={{ height: 380 }} offsetScrollbars scrollbarSize={6} styles={{ thumb: { backgroundColor: PRIMARY_BROWN } }}>
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
                                          <Text c="dimmed" size="xs" fw={500}>No matches found.</Text>
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
                      <ScrollArea style={{ height: 380 }} offsetScrollbars scrollbarSize={6} styles={{ thumb: { backgroundColor: PRIMARY_BROWN } }}>
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
                                <Text c="dimmed" size="xs" fw={500}>No matches found.</Text>
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
      <Modal opened={rescheduleModal} onClose={() => setRescheduleModal(false)} title={<Text fw={700} size="lg">Reschedule Appointment</Text>} size="md" radius="xl">
        <Stack gap="md">
          {selectedAppointment && (
            <Paper p="md" radius="lg" withBorder bg={THEMED_LIGHT_BG + '30'}>
              <Group gap="sm">
                <Avatar size={40} color={PRIMARY_BROWN}>{selectedAppointment.clientName[0]}</Avatar>
                <Box><Text fw={600} size="sm">{selectedAppointment.clientName}</Text><Text size="xs" c="dimmed">Current: {selectedAppointment.scheduledDate}</Text></Box>
              </Group>
            </Paper>
          )}
          <DatePickerInput label="New Date" placeholder="Select date" value={newDate} onChange={setNewDate} radius="md" size="md" />
          <Select label="New Time" placeholder="Select time" data={['09:00 AM', '10:00 AM', '11:00 AM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM']} value={newTime} onChange={setNewTime} radius="md" size="md" />
          <Group justify="flex-end" mt="md"><Button variant="subtle" color="gray" fw={600} onClick={() => setRescheduleModal(false)}>Cancel</Button><Button color={PRIMARY_BROWN} radius="md" fw={600} onClick={handleUpdateAppointment} loading={isUpdating}>Save Schedule</Button></Group>
        </Stack>
      </Modal>

      <Modal opened={editEventModal} onClose={() => setEditEventModal(false)} title={<Text fw={700} size="lg">{selectedEvent ? 'Edit Event' : 'Add New Event'}</Text>} size="lg" radius="xl">
        <Stack gap="md">
          <TextInput label="Title" placeholder="Event title" value={eventEditForm.title} onChange={(e) => setEditEventModal({ ...eventEditForm, title: e.target.value })} radius="md" />
          <Textarea label="Description" placeholder="Notes..." value={eventEditForm.description} onChange={(e) => setEditEventModal({ ...eventEditForm, description: e.target.value })} radius="md" />
          <Grid><Grid.Col span={6}><DatePickerInput label="Date" placeholder="Select date" value={eventEditForm.eventDate} onChange={(d) => setEditEventModal({ ...eventEditForm, eventDate: d })} radius="md" /></Grid.Col><Grid.Col span={6}><Select label="Type" data={['appointment', 'hearing', 'consultation', 'deadline', 'other']} value={eventEditForm.eventType} onChange={(v) => setEditEventModal({ ...eventEditForm, eventType: v })} radius="md" /></Grid.Col></Grid>
          <TextInput label="Location" leftSection={<IconMapPin size={16} />} value={eventEditForm.location} onChange={(e) => setEditEventModal({ ...eventEditForm, location: e.target.value })} radius="md" />
          <Group justify="flex-end" mt="lg"><Button variant="subtle" color="gray" fw={600} onClick={() => setEditEventModal(false)}>Cancel</Button><Button color={PRIMARY_BROWN} radius="md" fw={600} onClick={handleUpdateEvent} loading={isUpdatingEvent}>{selectedEvent ? 'Update Event' : 'Create Event'}</Button></Group>
        </Stack>
      </Modal>

      <Modal opened={deleteConfirmModal} onClose={() => setDeleteConfirmModal(false)} title="Confirm Delete" centered radius="xl">
        <Stack gap="md" align="center" ta="center">
          <Box p="lg" bg="red.0" style={{ borderRadius: '50%' }}><IconTrash size={40} color="red" /></Box>
          <Box><Text fw={700} size="lg">Are you absolutely sure?</Text><Text size="sm" c="dimmed">This will permanently delete this event from the calendar.</Text></Box>
          <Group grow w="100%"><Button variant="outline" color="gray" radius="md" fw={600} onClick={() => setDeleteConfirmModal(false)}>Cancel</Button><Button color="red" radius="md" fw={600} onClick={handleDeleteEvent} loading={isDeletingEvent}>Delete Forever</Button></Group>
        </Stack>
      </Modal>
    </Box>
  );
}
