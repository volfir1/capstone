import React, { useState } from 'react';
import { 
  Tabs, 
  Card, 
  Text, 
  Badge, 
  Group, 
  Button, 
  SimpleGrid, 
  Container, 
  Title,
  Paper,
  Box,
  Stack,
  Avatar,
  Menu,
  ActionIcon,
  Select,
  TextInput,
  Modal,
  Textarea,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { 
  IconCalendarEvent,
  IconMessage2, 
  IconFileDescription, 
  IconClock, 
  IconCheck, 
  IconMapPin,
  IconScale,
  IconUser,
  IconAlertCircle,
  IconCheckbox,
  IconPhone,
  IconMail,
  IconDots,
  IconEdit,
  IconX,
  IconSearch,
  IconFilter,
  IconGavel,
} from '@tabler/icons-react';
import { 
  PRIMARY_GOLD, 
  PRIMARY_BROWN, 
  MUTED_OLIVE, 
  THEMED_LIGHT_BG, 
  CHARCOAL, 
  ACCENT_TAN 
} from '@/utils/constants';

export default function StaffAppointmentManager() {
  const [userRole] = useState('attorney'); // Can be 'attorney', 'intern', 'secretary'
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [rescheduleModal, setRescheduleModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [newDate, setNewDate] = useState(null);
  const [rescheduleReason, setRescheduleReason] = useState('');

  const handleOpenReschedule = (appointment) => {
    setSelectedAppointment(appointment);
    setRescheduleModal(true);
    setNewDate(null);
    setRescheduleReason('');
  };

  const handleReschedule = () => {
    // Handle reschedule logic here
    console.log('Rescheduling:', {
      appointment: selectedAppointment,
      newDate,
      reason: rescheduleReason
    });
    setRescheduleModal(false);
  };

  // Sample data for pending appointments (now auto-scheduled)
  const pendingAppointments = [
    {
      id: 1,
      clientName: "Juan Dela Cruz",
      type: "Initial Interview",
      submittedDate: "Nov 10, 2025",
      scheduledDate: "Nov 18, 2025",
      status: "Auto-Scheduled",
      contactNumber: "+63 912 345 6789",
      email: "juan.delacruz@email.com",
      assignedTo: "Atty. Maria Cruz",
      location: "SOLA Office",
      purpose: "Client information gathering and case assessment",
      priority: "High"
    },
    {
      id: 2,
      clientName: "Maria Santos",
      type: "Follow-up Interview",
      submittedDate: "Nov 14, 2025",
      scheduledDate: "Nov 22, 2025",
      status: "Auto-Scheduled",
      contactNumber: "+63 917 654 3210",
      email: "maria.santos@email.com",
      assignedTo: "Atty. Rodriguez",
      location: "SOLA Office",
      purpose: "Additional document review and clarification",
      priority: "Medium"
    },
  ];

  // Sample data for scheduled appointments
  const scheduledAppointments = [
    {
      id: 3,
      clientName: "Pedro Reyes",
      type: "Case Evaluation",
      submittedDate: "Nov 08, 2025",
      scheduledDate: "Nov 20, 2025",
      status: "Scheduled",
      contactNumber: "+63 915 789 4561",
      email: "pedro.reyes@email.com",
      assignedTo: "Atty. Maria Cruz",
      location: "SOLA Office",
      purpose: "Evaluation of employment dispute case"
    },
    {
      id: 4,
      clientName: "Ana Garcia",
      type: "Initial Consultation",
      submittedDate: "Nov 05, 2025",
      scheduledDate: "Nov 18, 2025",
      status: "Scheduled",
      contactNumber: "+63 923 456 7890",
      email: "ana.garcia@email.com",
      assignedTo: "Atty. Rodriguez",
      location: "SOLA Office",
      purpose: "Land dispute consultation"
    },
  ];

  // Sample data for advice requests
  const adviceRequests = [
    {
      id: 1,
      clientName: "Carlos Martinez",
      topic: "Labor Law Question",
      submittedDate: "Nov 12, 2025",
      status: "Pending Attorney Review",
      description: "Inquiry about unfair termination and separation pay",
      draftedBy: "Intern Marco Santos",
      priority: "High"
    },
    {
      id: 2,
      clientName: "Rosa Lim",
      topic: "Small Claims Advice",
      submittedDate: "Nov 09, 2025",
      status: "Draft Ready",
      description: "Collection of unpaid loan amount",
      draftedBy: "Intern Lisa Chen",
      reviewedBy: "Atty. Cruz",
      scheduledDate: "Nov 22, 2025"
    },
  ];

  // Sample data for documents
  const documentRequests = [
    {
      id: 1,
      clientName: "Miguel Torres",
      docType: "Affidavit of Loss",
      status: "In Progress",
      dateRequested: "Nov 10, 2025",
      assignedTo: "Intern Marco Santos",
      estimatedCompletion: "Nov 17, 2025"
    },
    {
      id: 2,
      clientName: "Sofia Ramos",
      docType: "Special Power of Attorney",
      status: "Ready for Pickup",
      dateRequested: "Oct 28, 2025",
      completedDate: "Nov 08, 2025",
      pickupSchedule: {
        date: "Nov 15, 2025"
      }
    },
  ];

  // Sample data for case representation
  const caseRepresentation = [
    {
      id: 1,
      clientName: "Roberto Santos",
      caseTitle: "People of the PH vs. Santos",
      caseNumber: "CR-2025-001",
      caseType: "Criminal Case",
      stage: "Pre-Trial",
      nextHearingDate: "Nov 15, 2025",
      location: "Parañaque RTC Branch 10",
      assignedAttorney: "Atty. Rodriguez",
      status: "Active"
    },
    {
      id: 2,
      clientName: "Elena Cruz",
      caseTitle: "Civil Case: Land Title Dispute",
      caseNumber: "CV-2024-882",
      caseType: "Civil Case",
      stage: "Presentation of Evidence",
      nextHearingDate: "Dec 02, 2025",
      location: "Muntinlupa RTC",
      assignedAttorney: "Atty. Santos",
      status: "Active"
    },
    {
      id: 3,
      clientName: "Miguel Reyes",
      caseTitle: "Child Custody Hearing",
      caseNumber: "SP-2025-112",
      caseType: "Family Case",
      stage: "Mediation",
      nextHearingDate: "Nov 20, 2025",
      location: "Family Court Branch 2",
      assignedAttorney: "Atty. Mendoza",
      status: "Active"
    },
  ];

  const PendingAppointmentCard = ({ item }) => (
    <Card shadow="xs" padding="lg" radius="lg" style={{ border: `2px solid ${PRIMARY_GOLD}` }}>
      <Group justify="space-between" mb="md">
        <Group gap="sm">
          <Avatar size={48} radius="md" color={PRIMARY_BROWN}>
            <IconUser size={24} />
          </Avatar>
          <Box>
            <Text fw={700} size="md" c={CHARCOAL}>{item.clientName}</Text>
            <Text size="xs" c={MUTED_OLIVE}>{item.type}</Text>
          </Box>
        </Group>
        <Menu shadow="md" width={200}>
          <Menu.Target>
            <ActionIcon variant="subtle" color="gray">
              <IconDots size={18} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item 
              leftSection={<IconEdit size={16} />}
              onClick={() => handleOpenReschedule(item)}
            >
              Reschedule
            </Menu.Item>
            <Menu.Item leftSection={<IconPhone size={16} />}>
              Call Client
            </Menu.Item>
            <Menu.Item leftSection={<IconMail size={16} />}>
              Send Email
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item leftSection={<IconX size={16} />} color="red">
              Cancel Appointment
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>

      <Paper p="lg" radius="md" mb="md" style={{ backgroundColor: `${PRIMARY_GOLD}10`, border: `1px solid ${PRIMARY_GOLD}` }}>
        <Group gap="xs" mb="md">
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
            <IconCheckbox size={16} color="white" />
          </Box>
          <Text size="sm" fw={700} c={PRIMARY_BROWN}>Auto-Scheduled</Text>
        </Group>
        
        <Stack gap="sm">
          <Group gap="xs">
            <IconCalendarEvent size={14} color={PRIMARY_BROWN} />
            <Text size="sm" fw={600} c={CHARCOAL}>
              {item.scheduledDate}
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

      <Button 
        fullWidth 
        size="md" 
        variant="light" 
        leftSection={<IconEdit size={18} />}
        onClick={() => handleOpenReschedule(item)}
        style={{ backgroundColor: THEMED_LIGHT_BG, color: PRIMARY_BROWN }}
      >
        Reschedule Appointment
      </Button>
    </Card>
  );

  const ScheduledAppointmentCard = ({ item }) => (
    <Card shadow="xs" padding="lg" radius="lg" style={{ border: `2px solid ${PRIMARY_GOLD}` }}>
      <Group justify="space-between" mb="md">
        <Group gap="sm">
          <Avatar size={48} radius="md" color={PRIMARY_BROWN}>
            <IconUser size={24} />
          </Avatar>
          <Box>
            <Text fw={700} size="md" c={CHARCOAL}>{item.clientName}</Text>
            <Text size="xs" c={MUTED_OLIVE}>{item.type}</Text>
          </Box>
        </Group>
        <Menu shadow="md" width={200}>
          <Menu.Target>
            <ActionIcon variant="subtle" color="gray">
              <IconDots size={18} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item 
              leftSection={<IconEdit size={16} />}
              onClick={() => handleOpenReschedule(item)}
            >
              Reschedule
            </Menu.Item>
            <Menu.Item leftSection={<IconCheck size={16} />}>
              Mark Completed
            </Menu.Item>
            <Menu.Item leftSection={<IconPhone size={16} />}>
              Call Client
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item leftSection={<IconX size={16} />} color="red">
              Cancel Appointment
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>

      <Paper p="lg" radius="md" mb="md" style={{ backgroundColor: `${PRIMARY_GOLD}10`, border: `1px solid ${PRIMARY_GOLD}` }}>
        <Group gap="xs" mb="md">
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
            <IconCheckbox size={16} color="white" />
          </Box>
          <Text size="sm" fw={700} c={PRIMARY_BROWN}>Scheduled</Text>
        </Group>
        
        <Stack gap="sm">
          <Group gap="xs">
            <IconCalendarEvent size={14} color={PRIMARY_BROWN} />
            <Text size="sm" fw={600} c={CHARCOAL}>
              {item.scheduledDate}
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

      <Button fullWidth size="md" variant="light" style={{ backgroundColor: THEMED_LIGHT_BG, color: PRIMARY_BROWN }}>
        View Details
      </Button>
    </Card>
  );

  const AdviceRequestCard = ({ item }) => (
    <Card shadow="xs" padding="lg" radius="lg" style={{ border: '1px solid #F0F0F0' }}>
      <Group justify="space-between" mb="md">
        <Group gap="sm">
          <Avatar size={48} radius="md" color={MUTED_OLIVE}>
            <IconMessage2 size={24} />
          </Avatar>
          <Box>
            <Text fw={700} size="md" c={CHARCOAL}>{item.clientName}</Text>
            <Text size="xs" c={MUTED_OLIVE}>{item.topic}</Text>
          </Box>
        </Group>
        <Badge size="lg" color={item.status === 'Draft Ready' ? PRIMARY_BROWN : 'gray'}>
          {item.status}
        </Badge>
      </Group>

      <Paper p="md" radius="md" mb="md" style={{ backgroundColor: THEMED_LIGHT_BG }}>
        <Text size="xs" c={MUTED_OLIVE} mb={4}>Description</Text>
        <Text size="sm" c={CHARCOAL}>{item.description}</Text>
      </Paper>

      {item.draftedBy && (
        <Paper p="sm" radius="md" mb="md" style={{ backgroundColor: `${MUTED_OLIVE}10`, border: `1px solid ${MUTED_OLIVE}` }}>
          <Text size="xs" c={MUTED_OLIVE} mb={2}>Drafted by</Text>
          <Text size="sm" fw={600} c={CHARCOAL}>{item.draftedBy}</Text>
        </Paper>
      )}

      {item.scheduledDate && (
        <Paper p="sm" radius="md" mb="md" style={{ backgroundColor: `${PRIMARY_GOLD}10`, border: `1px solid ${PRIMARY_GOLD}` }}>
          <Text size="xs" c={MUTED_OLIVE} mb={2}>Appointment Scheduled</Text>
          <Text size="sm" fw={600} c={CHARCOAL}>
            {item.scheduledDate}
          </Text>
        </Paper>
      )}

      <Group gap="xs">
        {userRole === 'attorney' && item.status === 'Pending Attorney Review' && (
          <>
            <Button flex={1} size="md" style={{ backgroundColor: PRIMARY_BROWN }}>
              Review Draft
            </Button>
            <Button flex={1} size="md" variant="light" style={{ backgroundColor: THEMED_LIGHT_BG, color: PRIMARY_BROWN }}>
              Schedule
            </Button>
          </>
        )}
        {userRole === 'intern' && (
          <Button fullWidth size="md" style={{ backgroundColor: MUTED_OLIVE }}>
            Edit Draft
          </Button>
        )}
        {item.status === 'Draft Ready' && userRole === 'secretary' && (
          <Button fullWidth size="md" style={{ backgroundColor: PRIMARY_BROWN }}>
            Schedule Client
          </Button>
        )}
      </Group>
    </Card>
  );

  const DocumentRequestCard = ({ item }) => (
    <Card shadow="xs" padding="lg" radius="lg" style={{ border: '1px solid #F0F0F0' }}>
      <Group justify="space-between" mb="md">
        <Group gap="sm">
          <Avatar size={48} radius="md" color={PRIMARY_GOLD}>
            <IconFileDescription size={24} />
          </Avatar>
          <Box>
            <Text fw={700} size="md" c={CHARCOAL}>{item.clientName}</Text>
            <Text size="xs" c={MUTED_OLIVE}>{item.docType}</Text>
          </Box>
        </Group>
        <Badge size="lg" color={item.status === 'Ready for Pickup' ? 'green' : 'yellow'}>
          {item.status}
        </Badge>
      </Group>

      <Stack gap="xs" mb="md">
        <Group gap="xs">
          <IconCalendarEvent size={14} color={MUTED_OLIVE} />
          <Text size="xs" c={MUTED_OLIVE}>Requested: {item.dateRequested}</Text>
        </Group>
        {item.assignedTo && (
          <Group gap="xs">
            <IconUser size={14} color={MUTED_OLIVE} />
            <Text size="xs" c={CHARCOAL}>{item.assignedTo}</Text>
          </Group>
        )}
      </Stack>

      {item.status === 'In Progress' && (
        <Paper p="md" radius="md" mb="md" style={{ backgroundColor: `${MUTED_OLIVE}10`, border: `1px solid ${MUTED_OLIVE}` }}>
          <Text size="xs" c={MUTED_OLIVE} mb={4}>Est. Completion</Text>
          <Text size="sm" fw={600} c={CHARCOAL}>{item.estimatedCompletion}</Text>
        </Paper>
      )}

      {item.status === 'Ready for Pickup' && item.pickupSchedule && (
        <Paper p="md" radius="md" mb="md" style={{ backgroundColor: `${PRIMARY_GOLD}10`, border: `1px solid ${PRIMARY_GOLD}` }}>
          <Text size="xs" c={MUTED_OLIVE} mb={4}>Pickup Scheduled</Text>
          <Text size="sm" fw={600} c={CHARCOAL}>
            {item.pickupSchedule.date}
          </Text>
        </Paper>
      )}

      <Button fullWidth size="md" style={{ backgroundColor: item.status === 'Ready for Pickup' ? MUTED_OLIVE : PRIMARY_BROWN }}>
        {item.status === 'Ready for Pickup' ? 'Mark as Collected' : 'Update Status'}
      </Button>
    </Card>
  );

  const CaseRepresentationCard = ({ item }) => (
    <Card shadow="xs" padding="lg" radius="lg" style={{ border: `2px solid ${PRIMARY_BROWN}`, position: 'relative' }}>
      <Group justify="space-between" mb="md">
        <Group gap="sm">
          <Avatar size={48} radius="md" color={PRIMARY_BROWN}>
            <IconGavel size={24} />
          </Avatar>
          <Box>
            <Text fw={700} size="md" c={CHARCOAL}>{item.clientName}</Text>
            <Text size="xs" c={MUTED_OLIVE}>{item.caseType}</Text>
          </Box>
        </Group>
        <Menu shadow="md" width={200}>
          <Menu.Target>
            <ActionIcon variant="subtle" color="gray">
              <IconDots size={18} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item leftSection={<IconEdit size={16} />}>
              Update Status
            </Menu.Item>
            <Menu.Item leftSection={<IconCalendarEvent size={16} />}>
              Reschedule Hearing
            </Menu.Item>
            <Menu.Item leftSection={<IconPhone size={16} />}>
              Call Client
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>

      <Paper p="md" radius="md" mb="md" style={{ backgroundColor: THEMED_LIGHT_BG, border: '1px solid #F0F0F0' }}>
        <Text size="xs" c={MUTED_OLIVE} mb={4}>Case Title</Text>
        <Text size="sm" fw={600} c={CHARCOAL} mb="xs">{item.caseTitle}</Text>
        <Badge size="sm" variant="light" color={PRIMARY_BROWN} style={{ fontFamily: 'monospace' }}>
          {item.caseNumber}
        </Badge>
      </Paper>

      <Paper p="md" radius="md" mb="md" style={{ backgroundColor: `${MUTED_OLIVE}10`, border: `1px solid ${MUTED_OLIVE}` }}>
        <Group gap="xs" mb="sm">
          <IconGavel size={16} color={MUTED_OLIVE} />
          <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600}>Current Stage</Text>
        </Group>
        <Text fw={600} c={PRIMARY_BROWN} size="sm">{item.stage}</Text>
      </Paper>

      <Stack gap="sm" mb="md">
        <Group gap="xs">
          <IconCalendarEvent size={14} color={CHARCOAL} />
          <Box>
            <Text size="xs" c={MUTED_OLIVE}>Next Hearing</Text>
            <Text size="sm" fw={600} c={CHARCOAL}>{item.nextHearingDate}</Text>
          </Box>
        </Group>
        <Group gap="xs">
          <IconMapPin size={14} color={CHARCOAL} />
          <Text size="sm" c={CHARCOAL}>{item.location}</Text>
        </Group>
        <Group gap="xs">
          <IconUser size={14} color={CHARCOAL} />
          <Box>
            <Text size="xs" c={MUTED_OLIVE}>Handling Attorney</Text>
            <Text size="sm" fw={600} c={CHARCOAL}>{item.assignedAttorney}</Text>
          </Box>
        </Group>
      </Stack>

      <Button fullWidth size="md" style={{ backgroundColor: MUTED_OLIVE }}>
        View Case Details
      </Button>
    </Card>
  );

  return (
    <Box bg={THEMED_LIGHT_BG} mih="100vh" py="xl">
      <Container size="xl">
        {/* Header */}
        <Paper shadow="xs" p="xl" mb="xl" radius="lg" style={{ background: PRIMARY_BROWN, border: 'none' }}>
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
              <IconScale size={24} color={PRIMARY_BROWN} stroke={2.5} />
            </Box>
            <Box>
              <Title order={2} c="white" mb={4}>
                Staff Portal - {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
              </Title>
              <Text c="rgba(255, 255, 255, 0.9)" size="sm" fw={500}>
                Manage client appointments and requests
              </Text>
            </Box>
          </Group>
        </Paper>

        {/* Filters */}
        <Paper shadow="xs" p="lg" mb="xl" radius="lg" bg="white">
          <Group>
            <TextInput
              placeholder="Search clients..."
              leftSection={<IconSearch size={16} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1 }}
            />
            <Select
              placeholder="Filter by status"
              leftSection={<IconFilter size={16} />}
              data={['All', 'Pending', 'Scheduled', 'Completed']}
              value={filterStatus}
              onChange={setFilterStatus}
              w={200}
            />
          </Group>
        </Paper>

        <Tabs 
          defaultValue="pending" 
          variant="pills"
          styles={{
            tab: {
              padding: '12px 24px',
              fontWeight: 600,
              '&[data-active]': {
                background: PRIMARY_BROWN,
                color: 'white',
              },
            },
          }}
        >
          <Tabs.List mb="xl">
            <Tabs.Tab value="pending" leftSection={<IconClock size={20} />}>
              Auto-Scheduled
            </Tabs.Tab>
            <Tabs.Tab value="scheduled" leftSection={<IconCalendarEvent size={20} />}>
              Confirmed
            </Tabs.Tab>
            <Tabs.Tab value="advice" leftSection={<IconMessage2 size={20} />}>
              Legal Advice
            </Tabs.Tab>
            <Tabs.Tab value="representation" leftSection={<IconScale size={20} />}>
              Court Cases
            </Tabs.Tab>
            <Tabs.Tab value="documents" leftSection={<IconFileDescription size={20} />}>
              Documents
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="pending">
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
              {pendingAppointments.map((item) => (
                <PendingAppointmentCard key={item.id} item={item} />
              ))}
            </SimpleGrid>
          </Tabs.Panel>

          <Tabs.Panel value="scheduled">
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
              {scheduledAppointments.map((item) => (
                <ScheduledAppointmentCard key={item.id} item={item} />
              ))}
            </SimpleGrid>
          </Tabs.Panel>

          <Tabs.Panel value="advice">
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
              {adviceRequests.map((item) => (
                <AdviceRequestCard key={item.id} item={item} />
              ))}
            </SimpleGrid>
          </Tabs.Panel>

          <Tabs.Panel value="representation">
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
              {caseRepresentation.map((item) => (
                <CaseRepresentationCard key={item.id} item={item} />
              ))}
            </SimpleGrid>
          </Tabs.Panel>

          <Tabs.Panel value="documents">
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
              {documentRequests.map((item) => (
                <DocumentRequestCard key={item.id} item={item} />
              ))}
            </SimpleGrid>
          </Tabs.Panel>
        </Tabs>

        {/* Reschedule Modal */}
        <Modal
          opened={rescheduleModal}
          onClose={() => setRescheduleModal(false)}
          title={
            <Title order={3} c={CHARCOAL}>
              Reschedule Appointment
            </Title>
          }
          size="lg"
          styles={{
            header: {
              borderBottom: '1px solid #F0F0F0',
              paddingBottom: '16px',
            },
            body: {
              padding: '24px',
            },
          }}
        >
          {selectedAppointment && (
            <Stack gap="lg">
              {/* Client Info */}
              <Paper p="md" radius="md" style={{ backgroundColor: THEMED_LIGHT_BG, border: '1px solid #F0F0F0' }}>
                <Group gap="sm" mb="xs">
                  <Avatar size={40} radius="md" color={PRIMARY_BROWN}>
                    <IconUser size={20} />
                  </Avatar>
                  <Box>
                    <Text fw={600} c={CHARCOAL}>{selectedAppointment.clientName}</Text>
                    <Text size="xs" c={MUTED_OLIVE}>{selectedAppointment.type}</Text>
                  </Box>
                </Group>
              </Paper>

              {/* Current Schedule */}
              <Box>
                <Text size="xs" c={MUTED_OLIVE} tt="uppercase" fw={600} mb={8}>
                  Current Schedule
                </Text>
                <Paper p="md" radius="md" style={{ backgroundColor: `${ACCENT_TAN}10`, border: `1px solid ${ACCENT_TAN}` }}>
                  <Group gap="xs">
                    <IconCalendarEvent size={16} color={ACCENT_TAN} />
                    <Text size="sm" fw={600} c={CHARCOAL}>
                      {selectedAppointment.scheduledDate}
                    </Text>
                  </Group>
                </Paper>
              </Box>

              {/* New Date Picker */}
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
                  styles={{
                    input: {
                      borderColor: '#E0E0E0',
                      '&:focus': {
                        borderColor: PRIMARY_BROWN,
                      },
                    },
                  }}
                />
                <Text size="xs" c={MUTED_OLIVE} mt={4}>
                  Select a new date for the appointment
                </Text>
              </Box>

              {/* Reason for Reschedule */}
              <Box>
                <Group gap={8} mb={8}>
                  <Text size="sm" fw={600} c={CHARCOAL}>Reason for Rescheduling</Text>
                  <Text size="sm" c="red">*</Text>
                </Group>
                <Textarea
                  placeholder="Explain why the appointment needs to be rescheduled..."
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  minRows={3}
                  size="md"
                  styles={{
                    input: {
                      borderColor: '#E0E0E0',
                      '&:focus': {
                        borderColor: PRIMARY_BROWN,
                      },
                    },
                  }}
                />
                <Text size="xs" c={MUTED_OLIVE} mt={4}>
                  This will be sent to the client via email
                </Text>
              </Box>

              {/* Action Buttons */}
              <Group justify="flex-end" gap="md" mt="md">
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => setRescheduleModal(false)}
                  styles={{
                    root: {
                      borderColor: '#E0E0E0',
                      color: MUTED_OLIVE,
                    },
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="md"
                  onClick={handleReschedule}
                  disabled={!newDate || !rescheduleReason}
                  leftSection={<IconCheck size={18} />}
                  style={{
                    backgroundColor: PRIMARY_BROWN,
                  }}
                >
                  Confirm Reschedule
                </Button>
              </Group>
            </Stack>
          )}
        </Modal>
      </Container>
    </Box>
  );
}