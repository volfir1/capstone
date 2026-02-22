import React, { useState } from 'react';
import { 
  Paper, Box, Group, Text, Button, Badge, Stack, UnstyledButton, 
  SimpleGrid, Title, Modal, TextInput, Textarea, Select, Tooltip,
  ActionIcon, Divider, ScrollArea
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { 
  IconChevronLeft, IconChevronRight, IconCalendarEvent, IconClock, 
  IconPlus, IconCheck, IconMapPin, IconGavel, IconMessage2, 
  IconAlertCircle, IconDots, IconCalendar, IconArrowRight, IconUser
} from '@tabler/icons-react';
import { useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import apiClient from '@config/api/apiClient';

const PRIMARY_GOLD = '#D4A574';
const PRIMARY_BROWN = '#6B4423';
const MUTED_OLIVE = '#8B8B5C';
const THEMED_LIGHT_BG = '#F5F3F0';
const CHARCOAL = '#333333';

// Color coding for different event types
const EVENT_TYPE_COLORS = {
  'Initial Interview': { bg: '#3B82F6', text: 'white', icon: <IconUser size={10} /> },
  'appointment': { bg: '#3B82F6', text: 'white', icon: <IconCalendarEvent size={10} /> },
  'hearing': { bg: '#EF4444', text: 'white', icon: <IconGavel size={10} /> },
  'consultation': { bg: '#8B5CF6', text: 'white', icon: <IconMessage2 size={10} /> },
  'deadline': { bg: '#F59E0B', text: 'white', icon: <IconAlertCircle size={10} /> },
  'legal-advice': { bg: '#10B981', text: 'white', icon: <IconCheck size={10} /> },
  'court-case': { bg: '#EF4444', text: 'white', icon: <IconGavel size={10} /> },
  'other': { bg: PRIMARY_BROWN, text: 'white', icon: <IconDots size={10} /> },
};

const getEventColor = (type) => EVENT_TYPE_COLORS[type] || EVENT_TYPE_COLORS['other'];

export default function ClientFormStatusCalendar({ appointments = [], onEventCreated, onDateClick }) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month');
  const [addEventModal, setAddEventModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    eventDate: null,
    eventType: 'appointment',
    location: '',
    clientName: '',
    assignedTo: '',
    priority: 'Medium',
  });

  // Handle event creation
  const handleCreateEvent = async () => {
    if (!eventForm.title || !eventForm.eventDate) {
      notifications.show({
        title: 'Error',
        message: 'Title and date are required',
        color: 'red',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post('/events', eventForm);
      notifications.show({
        title: 'Success',
        message: 'Event created successfully',
        color: 'green',
        icon: <IconCheck size={18} />,
      });
      setAddEventModal(false);
      setEventForm({
        title: '',
        description: '',
        eventDate: null,
        eventType: 'appointment',
        location: '',
        clientName: '',
        assignedTo: '',
        priority: 'Medium',
      });
      if (onEventCreated) onEventCreated();
    } catch (error) {
      console.error('Error creating event:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to create event',
        color: 'red',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAppointmentsForDate = (date) => {
    if (!date) return [];
    return appointments.filter(apt => apt.date && apt.date.toDateString() === date.toDateString());
  };

  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') newDate.setDate(newDate.getDate() - 1);
    else if (viewMode === 'week') newDate.setDate(newDate.getDate() - 7);
    else newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') newDate.setDate(newDate.getDate() + 1);
    else if (viewMode === 'week') newDate.setDate(newDate.getDate() + 7);
    else newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const goToToday = () => setCurrentDate(new Date());

  const getCalendarTitle = () => {
    if (viewMode === 'day') return currentDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    if (viewMode === 'week') {
      const start = getWeekStart(currentDate);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
    return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  };

  const isToday = (date) => date.toDateString() === new Date().toDateString();
  const isCurrentMonth = (date) => date.getMonth() === currentDate.getMonth();

  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const calendarDays = [];
    for (let i = 0; i < startingDayOfWeek; i++) calendarDays.push(null);
    for (let day = 1; day <= daysInMonth; day++) calendarDays.push(new Date(year, month, day));

    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <Box>
        <SimpleGrid cols={7} spacing={isMobile ? 2 : 'xs'} mb="xs">
          {weekdays.map((day) => (
            <Box key={day} py={8} ta="center">
              <Text size="xs" fw={700} c={MUTED_OLIVE} tt="uppercase" lts={1}>
                {isMobile ? day[0] : day}
              </Text>
            </Box>
          ))}
        </SimpleGrid>

        <SimpleGrid cols={7} spacing={isMobile ? 2 : 'xs'}>
          {calendarDays.map((date, idx) => {
            if (!date) return <Box key={`empty-${idx}`} style={{ height: isMobile ? 60 : 110 }} />;

            const dayApts = getAppointmentsForDate(date);
            const isTodayDate = isToday(date);
            const inMonth = isCurrentMonth(date);
            const hasEvents = dayApts.length > 0;

            return (
              <UnstyledButton key={idx} onClick={() => onDateClick && onDateClick(date)}>
                <Paper
                  p={isMobile ? 4 : 8}
                  radius="md"
                  style={{
                    backgroundColor: isTodayDate ? `${PRIMARY_GOLD}08` : 'white',
                    border: `1px solid ${isTodayDate ? PRIMARY_GOLD : '#eee'}`,
                    height: isMobile ? 70 : 120,
                    opacity: inMonth ? 1 : 0.3,
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  className="calendar-cell"
                >
                  <Stack gap={2} h="100%">
                    <Group justify="space-between" align="center">
                      <Box
                        style={{
                          width: isTodayDate ? 24 : 'auto',
                          height: isTodayDate ? 24 : 'auto',
                          borderRadius: '50%',
                          backgroundColor: isTodayDate ? PRIMARY_BROWN : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text size={isMobile ? "xs" : "sm"} fw={isTodayDate ? 700 : 500} c={isTodayDate ? 'white' : CHARCOAL}>
                          {date.getDate()}
                        </Text>
                      </Box>
                      {hasEvents && isMobile && (
                        <Box w={6} h={6} style={{ borderRadius: '50%', backgroundColor: PRIMARY_GOLD }} />
                      )}
                    </Group>

                    {!isMobile && hasEvents && (
                      <Stack gap={2} mt={2}>
                        {dayApts.slice(0, 3).map((apt, i) => {
                          const theme = getEventColor(apt.type);
                          return (
                            <Box
                              key={i}
                              p={2}
                              px={6}
                              style={{
                                backgroundColor: `${theme.bg}15`,
                                borderLeft: `3px solid ${theme.bg}`,
                                borderRadius: '0 4px 4px 0',
                              }}
                            >
                              <Text size={10} fw={600} truncate c={CHARCOAL}>
                                {apt.purpose || apt.clientName}
                              </Text>
                            </Box>
                          );
                        })}
                        {dayApts.length > 3 && (
                          <Text size={10} c={MUTED_OLIVE} fw={700} pl={4}>
                            + {dayApts.length - 3} more
                          </Text>
                        )}
                      </Stack>
                    )}
                  </Stack>
                </Paper>
              </UnstyledButton>
            );
          })}
        </SimpleGrid>
      </Box>
    );
  };

  return (
    <Box>
      <Paper shadow="sm" p={isMobile ? 'md' : 'xl'} radius="lg" style={{ border: '1px solid #eee' }}>
        <Stack gap="lg">
          {/* Header */}
          <Group justify="space-between" align="flex-start">
            <Stack gap={2}>
              <Title order={isMobile ? 4 : 3} c={CHARCOAL}>{getCalendarTitle()}</Title>
              <Text size="xs" c={MUTED_OLIVE} fw={500}>
                {appointments.length} Total Schedules
              </Text>
            </Stack>

            <Group gap="xs">
              {!isMobile && (
                <Group gap={4} p={4} bg="#f5f5f5" style={{ borderRadius: 8 }}>
                  {['day', 'week', 'month'].map(mode => (
                    <Button
                      key={mode}
                      size="xs"
                      variant={viewMode === mode ? 'filled' : 'subtle'}
                      onClick={() => setViewMode(mode)}
                      color={PRIMARY_BROWN}
                      radius="md"
                      tt="capitalize"
                    >
                      {mode}
                    </Button>
                  ))}
                </Group>
              )}
              <Button
                size="sm"
                radius="md"
                leftSection={<IconPlus size={16} />}
                onClick={() => setAddEventModal(true)}
                style={{ backgroundColor: PRIMARY_BROWN }}
              >
                {!isMobile && "Add Event"}
              </Button>
            </Group>
          </Group>

          <Divider color="#f1f1f1" />

          {/* Navigation */}
          <Group justify="space-between">
            <Group gap="xs">
              <ActionIcon variant="light" color="gray" size="lg" radius="md" onClick={goToPrevious}>
                <IconChevronLeft size={20} />
              </ActionIcon>
              <Button variant="subtle" color="gray" size="sm" onClick={goToToday}>Today</Button>
              <ActionIcon variant="light" color="gray" size="lg" radius="md" onClick={goToNext}>
                <IconChevronRight size={20} />
              </ActionIcon>
            </Group>

            {!isMobile && (
              <Group gap="md">
                {Object.entries(EVENT_TYPE_COLORS).slice(0, 5).map(([type, theme]) => (
                  <Group key={type} gap={6}>
                    <Box w={8} h={8} style={{ borderRadius: '50%', backgroundColor: theme.bg }} />
                    <Text size="xs" c={MUTED_OLIVE} tt="capitalize">{type.replace('-', ' ')}</Text>
                  </Group>
                ))}
              </Group>
            )}
          </Group>

          {/* Body */}
          <Box mih={300}>
            {viewMode === 'month' && renderMonthView()}
            {viewMode !== 'month' && (
              <Center py={100}>
                <Stack align="center" gap="xs">
                  <IconCalendar size={48} color="#eee" />
                  <Text c="dimmed" size="sm">{viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} view optimized for future updates.</Text>
                  <Button variant="outline" size="xs" color={PRIMARY_BROWN} onClick={() => setViewMode('month')}>Return to Month</Button>
                </Stack>
              </Center>
            )}
          </Box>
        </Stack>
      </Paper>

      {/* Add Event Modal */}
      <Modal
        opened={addEventModal}
        onClose={() => setAddEventModal(false)}
        title={
          <Group gap="xs">
            <IconPlus size={20} color={PRIMARY_BROWN} />
            <Text fw={700} size="lg">Schedule New Event</Text>
          </Group>
        }
        size="lg"
        radius="lg"
        centered
      >
        <Stack gap="md">
          <TextInput
            label="Event Title"
            placeholder="e.g. Case Hearing #123"
            required
            value={eventForm.title}
            onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
          />
          
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <DatePickerInput
              label="Date"
              placeholder="Select date"
              required
              value={eventForm.eventDate}
              onChange={(date) => setEventForm({ ...eventForm, eventDate: date })}
              leftSection={<IconCalendar size={16} />}
            />
            <Select
              label="Type"
              data={[
                { value: 'appointment', label: 'Interview' },
                { value: 'hearing', label: 'Court Hearing' },
                { value: 'consultation', label: 'Consultation' },
                { value: 'deadline', label: 'Deadline' },
                { value: 'other', label: 'Other' },
              ]}
              value={eventForm.eventType}
              onChange={(val) => setEventForm({ ...eventForm, eventType: val })}
            />
          </SimpleGrid>

          <TextInput
            label="Location"
            placeholder="e.g. Court Room 5"
            leftSection={<IconMapPin size={16} />}
            value={eventForm.location}
            onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
          />

          <Textarea
            label="Notes"
            placeholder="Additional details..."
            minRows={3}
            value={eventForm.description}
            onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
          />

          <Button
            fullWidth
            size="md"
            mt="md"
            loading={isSubmitting}
            onClick={handleCreateEvent}
            style={{ backgroundColor: PRIMARY_BROWN }}
          >
            Create Event
          </Button>
        </Stack>
      </Modal>
    </Box>
  );
}
