import React, { useEffect, useState } from 'react';
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
} from '@tabler/icons-react';

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
  const [forAppointmentData, setForAppointmentData] = useState([])
  const [loadingAppointments, setLoadingAppointments] = useState(false)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoadingAppointments(true)
      try {
        const { default: apiClient } = await import('@config/api/apiClient')
        const resp = await apiClient.get('/clientsinfo')
        const docs = resp?.data || []
        const mapped = (Array.isArray(docs) ? docs : []).map((d, idx) => {
          const appointed = d.appointedDate || d.appointmentDate || d.caseDetails?.appointedDate
          const dateOnly = appointed ? new Date(appointed).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'TBD'
          return {
            id: d._id || idx,
            type: 'Initial Interview',
            submittedDate: d.createdAt ? new Date(d.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '',
            status: appointed ? 'Scheduled' : 'Pending',
            appointmentDate: dateOnly,
            appointmentTime: '',
            location: d.caseDetails?.location || 'SOLA (Sebastian Office Legal Aid)',
            purpose: d.caseDetails?.purpose || `Appointment for ${d.fullName || ''}`,
            clientName: d.fullName || (d.personal && (d.personal.fullName || `${d.personal.firstName || ''} ${d.personal.lastName || ''}`.trim())) || '',
          }
        })
        if (mounted) setForAppointmentData(mapped)
      } catch (err) {
        console.error('Failed to load clientsinfo for appointments', err)
      } finally {
        if (mounted) setLoadingAppointments(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const legalAdviceData = [
    {
      id: 1,
      topic: "Land Dispute Inquiry",
      date: "Oct 24, 2025",
      status: "Scheduled",
      description: "Face-to-face consultation regarding neighbor encroaching on property line.",
      internDraft: false,
      appointment: {
        date: "Nov 12, 2025",
        time: "2:00 PM",
        handler: "Atty. Maria Cruz",
        role: "Senior Attorney",
        location: "SOLA (Sebastian Office Legal Aid)"
      }
    },
    {
      id: 2,
      topic: "Labor Law Question",
      date: "Oct 10, 2025",
      status: "Completed",
      description: "Unfair termination validation inquiry.",
      internDraft: false,
      completedDate: "Oct 28, 2025"
    },
    {
      id: 3,
      topic: "Small Claims",
      date: "Nov 01, 2025",
      status: "Pending Review",
      description: "Collection of unpaid loans amounting to 50k.",
      internDraft: true
    }
  ];

  const representationData = [
    {
      id: 1,
      caseTitle: "People of the PH vs. Santos",
      caseNumber: "CR-2025-001",
      stage: "Pre-Trial",
      nextDate: "Nov 15, 2025",
      location: "Parañaque RTC Branch 10",
      attorney: "Atty. Rodriguez"
    },
    {
      id: 2,
      caseTitle: "Civil Case: Land Title",
      caseNumber: "CV-2024-882",
      stage: "Presentation of Evidence",
      nextDate: "Dec 02, 2025",
      location: "Muntinlupa RTC",
      attorney: "Atty. Santos"
    },
    {
      id: 3,
      caseTitle: "Custody Hearing",
      caseNumber: "SP-2025-112",
      stage: "Mediation",
      nextDate: "Nov 20, 2025",
      location: "Family Court Branch 2",
      attorney: "Atty. Mendoza"
    }
  ];

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
          <Button 
            variant="light" 
            fullWidth
            size="md"
            leftSection={<IconEye size={18} />}
            style={{ 
              backgroundColor: THEMED_LIGHT_BG,
              color: PRIMARY_BROWN,
              fontWeight: 600,
            }}
          >
            View Legal Opinion
          </Button>
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
      
      <Button 
        variant="filled" 
        fullWidth
        size="md"
        rightSection={<IconArrowRight size={18} />}
        style={{ 
          background: `linear-gradient(135deg, ${MUTED_OLIVE} 0%, #6B8E4E 100%)`,
          fontWeight: 600,
        }}
      >
        View Case Folder
      </Button>
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
              '&[data-active]': {
                background: `linear-gradient(135deg, ${PRIMARY_BROWN} 0%, #8B5A2B 100%)`,
                color: 'white',
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
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="xl">
              {forAppointmentData.map((item) => (
                <ForAppointmentCard key={item.id} item={item} />
              ))}
            </SimpleGrid>
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
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="xl">
              {legalAdviceData.map((item) => (
                <AdviceCard key={item.id} item={item} />
              ))}
            </SimpleGrid>
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
            
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="xl">
              {representationData.map((item) => (
                <RepresentationCard key={item.id} item={item} />
              ))}
            </SimpleGrid>
          </Tabs.Panel>

          {/* --- TAB 4: DOCUMENTS --- */}
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
  );
}