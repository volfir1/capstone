import React, { useState, useEffect } from 'react';
import { 
  Tabs, Card, Text, Badge, Group, Button, SimpleGrid, Container, Title,
  Paper, Box, Stack, Avatar, Menu, ActionIcon, Select, TextInput, Modal, Loader, Center,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { 
  IconCalendarEvent, IconMessage2, IconFileDescription, IconClock, IconCheck, 
  IconMapPin, IconScale, IconUser, IconCheckbox, IconPhone, IconMail, IconDots,
  IconEdit, IconX, IconSearch, IconFilter, IconGavel,
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
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [newDate, setNewDate] = useState(null);
  const [pendingAppointments, setPendingAppointments] = useState([]);
  const [scheduledAppointments, setScheduledAppointments] = useState([]);
  const [adviceRequests, setAdviceRequests] = useState([]);
  const [documentRequests, setDocumentRequests] = useState([]);
  const [caseRepresentation, setCaseRepresentation] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch all data on mount
  useEffect(() => {
    let mounted = true;
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
            status: 'Auto-Scheduled',
            assignedTo: d.assignedTo || 'Atty. Maria Cruz',
            location: d.caseDetails?.location || 'SOLA Office',
            purpose: d.caseDetails?.purpose || `Client information gathering for ${d.fullName}`,
            priority: d.priority || 'High',
          }));
          if (mounted) setPendingAppointments(mapped);
        } catch (err) {
          console.error('Failed to load pending appointments:', err);
        }

        // Fetch scheduled appointments
        try {
          const scheduledResp = await apiClient.get('/appointments/scheduled');
          const scheduled = scheduledResp?.data || [];
          if (mounted) setScheduledAppointments(Array.isArray(scheduled) ? scheduled : []);
        } catch (err) {
          console.error('Failed to load scheduled appointments:', err);
          if (mounted) setScheduledAppointments([]);
        }

        // Fetch advice requests
        try {
          const adviceResp = await apiClient.get('/advice-requests');
          const advice = adviceResp?.data || [];
          if (mounted) setAdviceRequests(Array.isArray(advice) ? advice : []);
        } catch (err) {
          console.error('Failed to load advice requests:', err);
          if (mounted) setAdviceRequests([]);
        }

        // Fetch document requests
        try {
          const docsResp = await apiClient.get('/document-requests');
          const docs = docsResp?.data || [];
          if (mounted) setDocumentRequests(Array.isArray(docs) ? docs : []);
        } catch (err) {
          console.error('Failed to load document requests:', err);
          if (mounted) setDocumentRequests([]);
        }

        // Fetch case representation
        try {
          const caseResp = await apiClient.get('/case-representation');
          const cases = caseResp?.data || [];
          if (mounted) setCaseRepresentation(Array.isArray(cases) ? cases : []);
        } catch (err) {
          console.error('Failed to load case representation:', err);
          if (mounted) setCaseRepresentation([]);
        }
      } catch (err) {
        console.error('Failed to initialize apiClient:', err);
        notifications.show({
          title: 'Error',
          message: 'Failed to load data from server.',
          color: 'red',
        });
      } finally {
        if (mounted) setLoading(false);
      }
    };
    
    loadAllData();
    return () => { mounted = false };
  }, []);

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
    setRescheduleModal(true);
  };

  const handleUpdateAppointment = async () => {
    if (!newDate || !selectedAppointment?.id) {
      notifications.show({
        title: 'Error',
        message: 'Please select a valid date.',
        color: 'red',
      });
      return;
    }

    setIsUpdating(true);
    const dateObj = newDate instanceof Date ? newDate : new Date(newDate);
    const iso = dateObj.toISOString();
    const payload = { appointedDate: iso };
    console.log('Updating appointment:', selectedAppointment.id, 'with payload:', payload);

    try {
      const { default: apiClient } = await import('@config/api/apiClient');
      
      // Try the primary endpoint
      const response = await apiClient.put(`/clientsinfo/${selectedAppointment.id}`, payload);
      console.log('Update response:', response);
      
      if (response?.data) {
        updateLocalAppointment(iso);
        return;
      }
    } catch (error) {
      console.error('Error with /clientsinfo endpoint:', error);
      
      try {
        const { default: apiClient } = await import('@config/api/apiClient');
        const response = await apiClient.put(`/api/clientsinfo/${selectedAppointment.id}`, payload);
        console.log('Update response:', response);
        
        if (response?.data) {
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
          ? { ...apt, scheduledDate: formattedDate, rawAppointedDate: iso }
          : apt
      )
    );

    setRescheduleModal(false);
    setNewDate(null);
    setSelectedAppointment(null);

    notifications.show({
      title: 'Success',
      message: `Appointment updated to ${formattedDate}`,
      color: 'green',
      icon: <IconCheck size={18} />,
      autoClose: 5000,
    });
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
            <Text size="sm" fw={600} c={CHARCOAL}>{item.scheduledDate}</Text>
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

      <Button fullWidth size="md" variant="light" leftSection={<IconEdit size={18} />} onClick={() => handleOpenEditAppointment(item)} style={{ backgroundColor: THEMED_LIGHT_BG, color: PRIMARY_BROWN }}>
        Edit Appointment
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
            <Text size="xs" c={MUTED_OLIVE}>{item.caseType}</Text>
          </Box>
        </Group>
      </Group>
      <Paper p="md" radius="md" mb="md" style={{ backgroundColor: THEMED_LIGHT_BG }}>
        <Text size="xs" c={MUTED_OLIVE} mb={4}>Case Title</Text>
        <Text size="sm" fw={600} c={CHARCOAL}>{item.caseTitle}</Text>
        <Badge size="sm" variant="light" color={PRIMARY_BROWN} style={{ fontFamily: 'monospace', marginTop: '8px' }}>
          {item.caseNumber}
        </Badge>
      </Paper>
      <Stack gap="sm" mb="md">
        <Group gap="xs">
          <IconCalendarEvent size={14} color={CHARCOAL} />
          <Text size="sm" c={CHARCOAL}>{item.nextHearingDate}</Text>
        </Group>
        <Group gap="xs">
          <IconMapPin size={14} color={CHARCOAL} />
          <Text size="sm" c={CHARCOAL}>{item.location}</Text>
        </Group>
      </Stack>
      <Button fullWidth size="md" style={{ backgroundColor: MUTED_OLIVE }}>View Case Details</Button>
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

        <Paper shadow="xs" p="lg" mb="xl" radius="lg" bg="white">
          <Group>
            <TextInput placeholder="Search clients..." leftSection={<IconSearch size={16} />} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ flex: 1 }} />
            <Select placeholder="Filter by status" leftSection={<IconFilter size={16} />} data={['All', 'Pending', 'Scheduled', 'Completed']} value={filterStatus} onChange={setFilterStatus} w={200} />
          </Group>
        </Paper>

        <Tabs defaultValue="pending" variant="pills" styles={{ tab: { padding: '12px 24px', fontWeight: 600, '&[data-active]': { background: PRIMARY_BROWN, color: 'white' } } }}>
          <Tabs.List mb="xl">
            <Tabs.Tab value="pending" leftSection={<IconClock size={20} />}>Auto-Scheduled ({pendingAppointments.length})</Tabs.Tab>
            <Tabs.Tab value="scheduled" leftSection={<IconCalendarEvent size={20} />}>Confirmed ({scheduledAppointments.length})</Tabs.Tab>
            <Tabs.Tab value="advice" leftSection={<IconMessage2 size={20} />}>Legal Advice ({adviceRequests.length})</Tabs.Tab>
            <Tabs.Tab value="representation" leftSection={<IconScale size={20} />}>Court Cases ({caseRepresentation.length})</Tabs.Tab>
            <Tabs.Tab value="documents" leftSection={<IconFileDescription size={20} />}>Documents ({documentRequests.length})</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="pending">
            {pendingAppointments.length > 0 ? (
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
                {pendingAppointments.map((item) => (<PendingAppointmentCard key={item.id} item={item} />))}
              </SimpleGrid>
            ) : (
              <Center mih={300}><Text c={MUTED_OLIVE}>No auto-scheduled appointments</Text></Center>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="scheduled">
            {scheduledAppointments.length > 0 ? (
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
                {scheduledAppointments.map((item) => (<ScheduledAppointmentCard key={item.id} item={item} />))}
              </SimpleGrid>
            ) : (
              <Center mih={300}><Text c={MUTED_OLIVE}>No confirmed appointments</Text></Center>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="advice">
            {adviceRequests.length > 0 ? (
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
                {adviceRequests.map((item) => (<AdviceRequestCard key={item.id} item={item} />))}
              </SimpleGrid>
            ) : (
              <Center mih={300}><Text c={MUTED_OLIVE}>No advice requests</Text></Center>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="representation">
            {caseRepresentation.length > 0 ? (
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
                {caseRepresentation.map((item) => (<CaseRepresentationCard key={item.id} item={item} />))}
              </SimpleGrid>
            ) : (
              <Center mih={300}><Text c={MUTED_OLIVE}>No active cases</Text></Center>
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

        <Modal opened={rescheduleModal} onClose={() => setRescheduleModal(false)} title={<Title order={3} c={CHARCOAL}>Edit Appointment</Title>} size="lg" styles={{ header: { borderBottom: '1px solid #F0F0F0', paddingBottom: '16px' }, body: { padding: '24px' } }}>
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
                  <Group gap="xs">
                    <IconCalendarEvent size={16} color={ACCENT_TAN} />
                    <Text size="sm" fw={600} c={CHARCOAL}>{selectedAppointment.scheduledDate}</Text>
                  </Group>
                </Paper>
              </Box>

              <Box>
                <Group gap={8} mb={8}>
                  <Text size="sm" fw={600} c={CHARCOAL}>New Date</Text>
                  <Text size="sm" c="red">*</Text>
                </Group>
                <DatePickerInput placeholder="Select new date" value={newDate} onChange={setNewDate} size="md" minDate={new Date()} styles={{ input: { borderColor: '#E0E0E0', '&:focus': { borderColor: PRIMARY_BROWN } } }} />
                <Text size="xs" c={MUTED_OLIVE} mt={4}>Select a new date for the appointment</Text>
              </Box>

              <Group justify="flex-end" gap="md" mt="md">
                <Button variant="outline" size="md" onClick={() => setRescheduleModal(false)} styles={{ root: { borderColor: '#E0E0E0', color: MUTED_OLIVE } }}>Cancel</Button>
                <Button size="md" onClick={handleUpdateAppointment} disabled={!newDate || isUpdating} loading={isUpdating} leftSection={<IconCheck size={18} />} style={{ backgroundColor: PRIMARY_BROWN }}>
                  {isUpdating ? 'Saving...' : 'Save'}
                </Button>
              </Group>
            </Stack>
          )}
        </Modal>
      </Container>
    </Box>
  );
}